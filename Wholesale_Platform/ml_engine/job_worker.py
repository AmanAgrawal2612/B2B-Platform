import os
import time
import json
import numpy as np
import pandas as pd
import mysql.connector
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

print("Booting up TensorFlow...")
print("Loading Global SaaS Forecaster Model into memory...")

MODEL_PATH = '../../Global_ML_pipeline/saved_models/global_saas_forecaster.h5'
if os.path.exists(MODEL_PATH):
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    
    # Load encoders
    store_enc = joblib.load('../../Global_ML_pipeline/saved_models/store_encoder.pkl')
    item_enc = joblib.load('../../Global_ML_pipeline/saved_models/item_encoder.pkl')
    loc_enc = joblib.load('../../Global_ML_pipeline/saved_models/loc_encoder.pkl')
    
    # Check if we are in Hybrid Mode (Phase 2) where IDs are prefixed with M_
    is_hybrid = any(str(c).startswith("M_") for c in store_enc.classes_)
    
    use_real_model = True
    print(f"Model fully loaded into memory! (Hybrid Mode: {is_hybrid})")
else:
    print(f"Warning: {MODEL_PATH} not found. Please train the new model first. Using fallback.")
    use_real_model = False
    is_hybrid = False

def connect_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Agraman@0_5",
        database="stationery"
    )

def fetch_shop_data(db, shop_id):
    query = """
        SELECT 
            s.state, s.district, s.city,
            o.createdAt, 
            oi.itemId, oi.quantity, oi.priceAtTimeOfOrder
        FROM Shops s
        JOIN Orders o ON s.id = o.shopId
        JOIN OrderItems oi ON o.id = oi.orderId
        WHERE s.id = %s AND o.status = 'Approved'
    """
    df = pd.read_sql(query, db, params=(shop_id,))
    return df

def fetch_competitor_prices(db, state, district, city, item_id, shop_id):
    query = """
        SELECT o.createdAt, oi.priceAtTimeOfOrder
        FROM Shops s
        JOIN Orders o ON s.id = o.shopId
        JOIN OrderItems oi ON o.id = oi.orderId
        WHERE s.state = %s AND s.district = %s AND s.city = %s 
          AND oi.itemId = %s AND s.id != %s AND o.status = 'Approved'
    """
    df = pd.read_sql(query, db, params=(state, district, city, item_id, shop_id))
    return df

def process_jobs():
    while True:
        try:
            db = connect_db()
            cursor = db.cursor(dictionary=True)

            cursor.execute("SELECT id, shopId FROM ForecastJobs WHERE status = 'Pending' LIMIT 1")
            job = cursor.fetchone()

            if job:
                job_id = job['id']
                shop_id = job['shopId']
                print(f"\\n[JOB QUEUE] Picked up Pending Job #{job_id} for Shop ID {shop_id}.")

                cursor.execute("UPDATE ForecastJobs SET status = 'Processing' WHERE id = %s", (job_id,))
                db.commit()

                df = fetch_shop_data(db, shop_id)
                if df.empty:
                    print("Shop has no approved orders. Failing job.")
                    cursor.execute("UPDATE ForecastJobs SET status = 'Failed', resultJson = %s WHERE id = %s", 
                                   (json.dumps({"error": "No order history"}), job_id))
                    db.commit()
                    continue
                
                # Format month
                df['month'] = pd.to_datetime(df['createdAt']).dt.month
                df['year'] = pd.to_datetime(df['createdAt']).dt.year
                
                # Aggregate to monthly
                monthly = df.groupby(['year', 'month', 'itemId']).agg(
                    sales=('quantity', 'sum'),
                    sell_price=('priceAtTimeOfOrder', 'mean')
                ).reset_index()

                # Get shop location
                state, district, city = df['state'].iloc[0], df['district'].iloc[0], df['city'].iloc[0]

                forecast_results = {}

                for iid in monthly['itemId'].unique():
                    chunk = monthly[monthly['itemId'] == iid].sort_values(['year', 'month'])
                    
                    if len(chunk) < 6:
                        print(f"Item {iid} has < 6 months of data. Skipping.")
                        continue
                    
                    # Fetch competitor prices
                    comp_df = fetch_competitor_prices(db, state, district, city, iid, shop_id)
                    if not comp_df.empty:
                        comp_df['month'] = pd.to_datetime(comp_df['createdAt']).dt.month
                        comp_df['year'] = pd.to_datetime(comp_df['createdAt']).dt.year
                        comp_monthly = comp_df.groupby(['year', 'month']).agg(
                            comp_price=('priceAtTimeOfOrder', 'mean')
                        ).reset_index()
                        chunk = chunk.merge(comp_monthly, on=['year', 'month'], how='left')
                        chunk['comp_price'].fillna(chunk['sell_price'], inplace=True)
                    else:
                        chunk['comp_price'] = chunk['sell_price']

                    raw = chunk[['sales', 'sell_price', 'month', 'comp_price']].values
                    
                    # Enforce 36 max
                    if len(raw) > 36:
                        raw = raw[-36:]

                    scaler = MinMaxScaler()
                    scaled = scaler.fit_transform(raw)

                    ts_in = scaled.reshape(1, len(scaled), 4)

                    if use_real_model:
                        # Prefix IDs if we are in Hybrid Phase 2
                        raw_s = f"M_{shop_id}" if is_hybrid else str(shop_id)
                        raw_i = f"M_{iid}" if is_hybrid else str(iid)
                        raw_l = f"M_{state}_{district}_{city}" if is_hybrid else f"{state}_{district}_{city}"
                        
                        try:
                            # We add + 1 because training added + 1 for OOV 0-padding
                            u_idx = store_enc.transform([raw_s])[0] + 1
                            i_idx = item_enc.transform([raw_i])[0] + 1
                            l_idx = loc_enc.transform([raw_l])[0] + 1
                        except ValueError:
                            print(f"[warning] Unseen ID for Shop {shop_id} / Item {iid}. Using OOV index 0.")
                            u_idx, i_idx, l_idx = 0, 0, 0

                        u_in = np.array([u_idx])
                        i_in = np.array([i_idx])
                        l_in = np.array([l_idx])

                        pred_scaled = model.predict(
                            {"time_series_input": ts_in, "user_input": u_in, "item_input": i_in, "loc_input": l_in},
                            verbose=0
                        )[0]
                    else:
                        base = scaled[-1, 0]
                        pred_scaled = np.array([base + np.random.normal(0, 0.05) for _ in range(6)])

                    dummy = np.zeros((6, 4))
                    dummy[:, 0] = pred_scaled
                    real_sales = scaler.inverse_transform(dummy)[:, 0]
                    real_sales = [max(0, int(v)) for v in real_sales]

                    item_name = f"Item_{iid}" 
                    forecast_results[item_name] = real_sales

                if not forecast_results:
                    cursor.execute("UPDATE ForecastJobs SET status = 'Failed', resultJson = %s WHERE id = %s", 
                                   (json.dumps({"error": "Not enough data (<6 months) for any items."}), job_id))
                else:
                    cursor.execute("UPDATE ForecastJobs SET status = 'Completed', resultJson = %s WHERE id = %s",
                                   (json.dumps(forecast_results), job_id))
                db.commit()
                print(f"[JOB QUEUE] Job #{job_id} Completed successfully! Results saved to DB.")

            cursor.close()
            db.close()

        except Exception as e:
            print(f"[ERROR] {e}")

        time.sleep(5)

if __name__ == "__main__":
    process_jobs()
