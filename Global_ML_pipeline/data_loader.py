"""
data_loader.py
Handles ingestion of raw CSV data (Kaggle M5 format), transforms daily
wide-format sales into monthly aggregated sequences suitable for LSTM training.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler, LabelEncoder


def load_m5_data(data_dir=".", sample_size=50, encode=True):
    """Read M5 CSVs, sample items for memory efficiency, and return
    a monthly-aggregated DataFrame with encoded IDs."""

    sales_df = pd.read_csv(os.path.join(
        data_dir, "sales_train_validation.csv"))
    calendar_df = pd.read_csv(
        os.path.join(data_dir, "calendar.csv"),
        usecols=['d', 'wm_yr_wk', 'month', 'year', 'date']
    )
    prices_df = pd.read_csv(os.path.join(data_dir, "sell_prices.csv"))

    # keep all stores, but limit item count to stay within RAM
    np.random.seed(42)
    items = np.random.choice(
        sales_df['item_id'].unique(), size=sample_size, replace=False)
    sales_df = sales_df[sales_df['item_id'].isin(items)]
    print(
        f"[loader] {sample_size} items x {sales_df['store_id'].nunique()} stores  ->  {len(sales_df)} rows")

    # wide → long
    id_cols = ['id', 'item_id', 'dept_id', 'cat_id', 'store_id', 'state_id']
    print("[loader] melting daily columns ...")
    long = sales_df.melt(id_vars=id_cols, var_name='d', value_name='sales')

    # attach calendar dates & weekly price data
    long = long.merge(calendar_df, on='d', how='left')
    long = long.merge(
        prices_df, on=['store_id', 'item_id', 'wm_yr_wk'], how='left')
    long['sell_price'].fillna(0, inplace=True)

    # collapse to monthly granularity
    print("[loader] aggregating to monthly ...")
    monthly = (
        long
        .groupby(['store_id', 'state_id', 'item_id', 'year', 'month'])
        .agg(sales=('sales', 'sum'), sell_price=('sell_price', 'mean'))
        .reset_index()
    )

    print("[loader] calculating competitor prices ...")
    state_item_monthly = monthly.groupby(['state_id', 'item_id', 'year', 'month']).agg(
        sum_price=('sell_price', 'sum'),
        count_stores=('store_id', 'nunique')
    ).reset_index()

    monthly = monthly.merge(state_item_monthly, on=[
                            'state_id', 'item_id', 'year', 'month'], how='left')

    monthly['competitor_price'] = np.where(
        monthly['count_stores'] > 1,
        (monthly['sum_price'] - monthly['sell_price']) /
        (monthly['count_stores'] - 1),
        monthly['sell_price']
    )

    monthly['location_id'] = monthly['state_id'] + \
        "_District_1_" + monthly['store_id']

    # infer stock level (real stock data would come from the SQL DB in production)
    monthly['stock_level'] = monthly['sales'].apply(
        lambda s: 0 if s == 0 else s + np.random.randint(5, 50)
    )

    if not encode:
        return monthly

    # encode categorical IDs for embedding layers (1-indexed)
    store_enc, item_enc, loc_enc = LabelEncoder(), LabelEncoder(), LabelEncoder()
    monthly['user_id'] = store_enc.fit_transform(monthly['store_id']) + 1
    monthly['item_id_enc'] = item_enc.fit_transform(monthly['item_id']) + 1
    monthly['loc_id_enc'] = loc_enc.fit_transform(monthly['location_id']) + 1

    # persist encoders so predict.py can decode them later
    model_dir = os.path.join(data_dir, "saved_models")
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(store_enc, os.path.join(model_dir, "store_encoder.pkl"))
    joblib.dump(item_enc, os.path.join(model_dir, "item_encoder.pkl"))
    joblib.dump(loc_enc, os.path.join(model_dir, "loc_encoder.pkl"))

    return monthly


# ──────────────────────────────────────────────
#  Sequence Generation (Sliding Window)
# ──────────────────────────────────────────────

FEATURE_COLS = ['sales', 'sell_price', 'month', 'competitor_price']


def _build_sequences(series_df, lookback, horizon):
    """Scale features and cut a single item-store series into
    (lookback, 4) input windows and (horizon,) target vectors."""

    raw = series_df[FEATURE_COLS].values
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(raw)
    target = scaled[:, 0]                       # sales channel only

    X, y = [], []
    for i in range(len(scaled) - lookback - horizon + 1):
        X.append(scaled[i: i + lookback])
        y.append(target[i + lookback: i + lookback + horizon])

    return np.array(X), np.array(y)


def build_training_arrays(df, lookback=36, horizon=6):
    """Loop over every (store, item) pair, create sliding-window samples,
    and collect them into the four input arrays the model expects."""

    ts_list, uid_list, iid_list, loc_list, y_list = [], [], [], [], []

    print("[loader] generating sliding-window sequences ...")
    for uid in df['user_id'].unique():
        store_items = df.loc[df['user_id'] == uid, 'item_id_enc'].unique()
        loc_id = df.loc[df['user_id'] == uid, 'loc_id_enc'].iloc[0]

        for iid in store_items:
            chunk = (
                df[(df['user_id'] == uid) & (df['item_id_enc'] == iid)]
                .sort_values(['year', 'month'])
            )
            if len(chunk) < lookback + horizon:
                continue

            X, y = _build_sequences(chunk, lookback, horizon)
            if len(X) == 0:
                continue

            ts_list.append(X)
            y_list.append(y)
            uid_list.extend([uid] * len(X))
            iid_list.extend([iid] * len(X))
            loc_list.extend([loc_id] * len(X))

    return (
        np.concatenate(ts_list),
        np.array(uid_list),
        np.array(iid_list),
        np.array(loc_list),
        np.concatenate(y_list),
    )


# quick smoke-test when run directly
if __name__ == "__main__":
    df = load_m5_data(sample_size=10)
    print(df.head())
    X_ts, X_u, X_i, X_loc, y = build_training_arrays(df)
    print(
        f"X_ts {X_ts.shape}  X_u {X_u.shape}  X_i {X_i.shape}  X_loc {X_loc.shape}  y {y.shape}")
