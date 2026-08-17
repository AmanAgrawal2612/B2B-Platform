import os
import joblib
import pandas as pd
import numpy as np
import mysql.connector
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import MinMaxScaler

FEATURE_COLS = ['sales', 'sell_price', 'month', 'competitor_price']
SAVE_DIR = "saved_models"

def connect_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Agraman@0_5",
        database="stationery"
    )

def load_mysql_data(encode=True):
    """Fetches all approved orders from the SaaS database and processes them for ML training."""
    db = connect_db()
    query = """
        SELECT 
            s.id as store_id,
            s.state, s.district, s.city,
            o.createdAt, 
            oi.itemId as item_id, 
            oi.quantity as sales, 
            oi.priceAtTimeOfOrder as sell_price
        FROM Shops s
        JOIN Orders o ON s.id = o.shopId
        JOIN OrderItems oi ON o.id = oi.orderId
        WHERE o.status = 'Approved'
    """
    
    print("[mysql_loader] fetching data from live database...")
    df = pd.read_sql(query, db)
    db.close()
    
    if df.empty:
        raise ValueError("Database has no approved orders to train on!")

    # Format time features
    df['month'] = pd.to_datetime(df['createdAt']).dt.month
    df['year'] = pd.to_datetime(df['createdAt']).dt.year
    df['location_id'] = df['state'] + "_" + df['district'] + "_" + df['city']

    # Aggregate to monthly granularity
    print("[mysql_loader] aggregating to monthly...")
    monthly = (
        df.groupby(['store_id', 'location_id', 'item_id', 'year', 'month'])
        .agg(sales=('sales', 'sum'), sell_price=('sell_price', 'mean'))
        .reset_index()
    )

    # Calculate Competitor Prices (vectorized for training)
    print("[mysql_loader] calculating competitor prices...")
    loc_item_monthly = monthly.groupby(['location_id', 'item_id', 'year', 'month']).agg(
        sum_price=('sell_price', 'sum'),
        count_stores=('store_id', 'nunique')
    ).reset_index()

    monthly = monthly.merge(loc_item_monthly, on=['location_id', 'item_id', 'year', 'month'], how='left')

    monthly['competitor_price'] = np.where(
        monthly['count_stores'] > 1,
        (monthly['sum_price'] - monthly['sell_price']) / (monthly['count_stores'] - 1),
        monthly['sell_price']
    )

    if not encode:
        return monthly

    # Encode IDs for embedding layers (1-indexed)
    store_enc, item_enc, loc_enc = LabelEncoder(), LabelEncoder(), LabelEncoder()
    monthly['user_id'] = store_enc.fit_transform(monthly['store_id']) + 1
    monthly['item_id_enc'] = item_enc.fit_transform(monthly['item_id']) + 1
    monthly['loc_id_enc'] = loc_enc.fit_transform(monthly['location_id']) + 1

    # Persist encoders
    os.makedirs(SAVE_DIR, exist_ok=True)
    joblib.dump(store_enc, os.path.join(SAVE_DIR, "store_encoder.pkl"))
    joblib.dump(item_enc, os.path.join(SAVE_DIR, "item_encoder.pkl"))
    joblib.dump(loc_enc, os.path.join(SAVE_DIR, "loc_encoder.pkl"))

    return monthly


def _build_sequences(series_df, lookback, horizon):
    raw = series_df[FEATURE_COLS].values
    target = series_df['sales'].values

    # In training, we use MinMaxScaler dynamically over the lookback window
    X, y = [], []
    for i in range(len(raw) - lookback - horizon + 1):
        window_raw = raw[i : i + lookback]
        
        # Scale the window on-the-fly (matching Inference behavior)
        scaler = MinMaxScaler()
        window_scaled = scaler.fit_transform(window_raw)
        
        X.append(window_scaled)
        y.append(target[i + lookback : i + lookback + horizon])

    return X, y


def build_mysql_training_arrays(df, lookback=36, horizon=6):
    ts_list, uid_list, iid_list, loc_list, y_list = [], [], [], [], []

    print("[mysql_loader] generating sliding-window sequences...")
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
            
            ts_list.extend(X)
            y_list.extend(y)
            uid_list.extend([uid] * len(X))
            iid_list.extend([iid] * len(X))
            loc_list.extend([loc_id] * len(X))

    if not ts_list:
        raise ValueError("Not enough historical data in DB to form any training sequences!")

    return (
        np.array(ts_list),
        np.array(uid_list),
        np.array(iid_list),
        np.array(loc_list),
        np.array(y_list),
    )

if __name__ == "__main__":
    df = load_mysql_data()
    print(df.head())
    X_ts, X_u, X_i, X_loc, y = build_mysql_training_arrays(df)
    print(f"X_ts {X_ts.shape}  X_u {X_u.shape}  X_i {X_i.shape}  X_loc {X_loc.shape}  y {y.shape}")
