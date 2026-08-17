import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.callbacks import EarlyStopping

from data_loader import load_m5_data
from mysql_data_loader import load_mysql_data, build_mysql_training_arrays
from model import build_model

SAVE_DIR = "saved_models"
SAMPLE_SIZE = 1000  # Kaggle sample size
LOOKBACK = 36
HORIZON = 6
BATCH_SIZE = 32
MAX_EPOCHS = 50
PATIENCE = 3

def train_hybrid():
    print("── Loading Kaggle Data (Phase 1) ──")
    kaggle_df = load_m5_data(data_dir=".", sample_size=SAMPLE_SIZE, encode=False)
    
    # Prefix Kaggle IDs to prevent collisions
    kaggle_df['store_id'] = "K_" + kaggle_df['store_id'].astype(str)
    kaggle_df['item_id'] = "K_" + kaggle_df['item_id'].astype(str)
    kaggle_df['location_id'] = "K_" + kaggle_df['location_id'].astype(str)

    print("── Loading MySQL Data (Phase 2) ──")
    try:
        mysql_df = load_mysql_data(encode=False)
        # Prefix MySQL IDs to prevent collisions
        mysql_df['store_id'] = "M_" + mysql_df['store_id'].astype(str)
        mysql_df['item_id'] = "M_" + mysql_df['item_id'].astype(str)
        mysql_df['location_id'] = "M_" + mysql_df['location_id'].astype(str)
    except Exception as e:
        print(f"[hybrid] Warning: Could not load MySQL data ({e}). Training on Kaggle only.")
        mysql_df = pd.DataFrame()

    print("── Merging Datasets ──")
    if not mysql_df.empty:
        combined_df = pd.concat([kaggle_df, mysql_df], ignore_index=True)
    else:
        combined_df = kaggle_df

    print("── Fitting Unified Global Encoders ──")
    store_enc, item_enc, loc_enc = LabelEncoder(), LabelEncoder(), LabelEncoder()
    
    combined_df['user_id'] = store_enc.fit_transform(combined_df['store_id']) + 1
    combined_df['item_id_enc'] = item_enc.fit_transform(combined_df['item_id']) + 1
    combined_df['loc_id_enc'] = loc_enc.fit_transform(combined_df['location_id']) + 1

    os.makedirs(SAVE_DIR, exist_ok=True)
    joblib.dump(store_enc, os.path.join(SAVE_DIR, "store_encoder.pkl"))
    joblib.dump(item_enc, os.path.join(SAVE_DIR, "item_encoder.pkl"))
    joblib.dump(loc_enc, os.path.join(SAVE_DIR, "loc_encoder.pkl"))

    print("── Generating Dynamic Training Arrays ──")
    # We use the mysql version because it correctly scales per-window (no data leakage)
    X_ts, X_u, X_i, X_loc, y = build_mysql_training_arrays(combined_df, LOOKBACK, HORIZON)
    print(f"[hybrid] {len(X_ts)} dynamic sequences generated!")

    print("── Building Architecture ──")
    model = build_model(
        lookback=None, # Dynamic
        n_features=4,
        horizon=HORIZON,
        n_users=len(store_enc.classes_),
        n_items=len(item_enc.classes_),
        n_locs=len(loc_enc.classes_)
    )

    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=PATIENCE,
        restore_best_weights=True,
        verbose=1,
    )

    print("── Training Hybrid Model ──")
    model.fit(
        {"time_series_input": X_ts, "user_input": X_u, "item_input": X_i, "loc_input": X_loc},
        y,
        epochs=MAX_EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=0.2,
        callbacks=[early_stop],
        verbose=1,
    )

    model.save(os.path.join(SAVE_DIR, "global_saas_forecaster.h5"))
    print(f"[hybrid] Model successfully saved to {SAVE_DIR}/global_saas_forecaster.h5")

if __name__ == "__main__":
    train_hybrid()
