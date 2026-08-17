"""
predict.py
Loads a trained global model and generates a 6-month item-wise
sales forecast for a given store.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from dateutil.relativedelta import relativedelta

from data_loader import load_m5_data, FEATURE_COLS


SAVE_DIR = "saved_models"
LOOKBACK = 36
HORIZON  = 6


def forecast(store):
    """Generate a 6-month rolling forecast for every item in *store*."""

    print(f"-- inference for {store} --")

    # in production this would be a SQL query; here we just reload the CSVs
    df = load_m5_data(data_dir=".", sample_size=10)
    store_df = df[df['store_id'] == store].copy()
    if store_df.empty:
        print(f"no data for store {store}")
        return

    uid = store_df['user_id'].iloc[0]

    # figure out the 6 calendar months after the last data point
    last_yr  = store_df['year'].max()
    last_mo  = store_df.loc[store_df['year'] == last_yr, 'month'].max()
    origin   = pd.Timestamp(year=last_yr, month=last_mo, day=1)
    months   = [(origin + relativedelta(months=i)).strftime('%B %Y')
                for i in range(1, HORIZON + 1)]

    # load saved artifacts
    model_path = os.path.join(SAVE_DIR, "global_forecaster.h5")
    if os.path.exists(model_path):
        model = tf.keras.models.load_model(model_path, compile=False)
        use_real_model = True
    else:
        print("[predict] no saved model found — using mock predictions")
        use_real_model = False

    item_enc = joblib.load(os.path.join(SAVE_DIR, "item_encoder.pkl"))
    loc_enc = joblib.load(os.path.join(SAVE_DIR, "loc_encoder.pkl"))
    results  = {m: {} for m in months}

    loc_id = store_df['loc_id_enc'].iloc[0]

    for iid in store_df['item_id_enc'].unique():
        chunk = (
            store_df[store_df['item_id_enc'] == iid]
            .sort_values(['year', 'month'])
        )
        if len(chunk) < 6:
            continue

        raw = chunk[FEATURE_COLS].values
        scaler = MinMaxScaler()
        scaled = scaler.fit_transform(raw)

        if len(scaled) > LOOKBACK:
            scaled = scaled[-LOOKBACK:]

        ts_in = scaled.reshape(1, len(scaled), 4)
        u_in  = np.array([uid])
        i_in  = np.array([iid])
        l_in  = np.array([loc_id])

        if use_real_model:
            pred_scaled = model.predict(
                {"time_series_input": ts_in, "user_input": u_in, "item_input": i_in, "loc_input": l_in},
                verbose=0,
            )[0]
        else:
            base = scaled[-1, 0]
            pred_scaled = np.array([base + np.random.normal(0, 0.05) for _ in range(HORIZON)])

        # inverse-transform back to real sales units
        dummy = np.zeros((HORIZON, 4))
        dummy[:, 0] = pred_scaled
        real_sales = scaler.inverse_transform(dummy)[:, 0]
        real_sales = [max(0, int(v)) for v in real_sales]

        item_name = item_enc.inverse_transform([iid - 1])[0]   # undo +1 offset
        for idx, m in enumerate(months):
            results[m][item_name] = real_sales[idx]

    # pretty-print
    print(f"\n-- FORECAST: {store} --")
    for month, items in results.items():
        print(f"{month}:")
        for name, qty in items.items():
            print(f"  {name}: {qty} units")

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: store ID must be provided")
        sys.exit(1)
    
    store_val = sys.argv[1]
    res = forecast(store=store_val)
    print("===JSON_START===")
    print(json.dumps(res))
    print("===JSON_END===")
