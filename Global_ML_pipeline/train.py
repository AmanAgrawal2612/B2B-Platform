"""
train.py
Entry-point for model training. Loads data, builds the network,
trains with early stopping, and persists the artifacts.
"""

import os
import joblib
from tensorflow.keras.callbacks import EarlyStopping

from Global_ML_pipeline.mysql_data_loader import load_mysql_data
# from mysql_data_loader import load_mysql_data, build_mysql_training_arrays
from data_loader import load_m5_data, build_training_arrays
from model import build_model


SAMPLE_SIZE = 1000          # items to sample (all 10 stores are always kept)
LOOKBACK = 36            # months of history the LSTM sees
HORIZON = 6             # months to forecast
BATCH_SIZE = 32
MAX_EPOCHS = 50
PATIENCE = 3             # early-stopping patience
SAVE_DIR = "saved_models"


def train():
    print("── loading & preprocessing ──")
    df = load_m5_data(data_dir=".", sample_size=SAMPLE_SIZE)
    X_ts, X_u, X_i, X_loc, y = build_training_arrays(df, LOOKBACK, HORIZON)
    # df = load_mysql_data(encode=True)
    # X_ts, X_u, X_i, X_loc, y = build_mysql_training_arrays(df, LOOKBACK, HORIZON)
    print(f"[train] {len(X_ts)} samples ready")

    model = build_model(
        lookback=None,
        n_features=4,
        horizon=HORIZON,
        n_users=int(df['user_id'].max()),
        n_items=int(df['item_id_enc'].max()),
        n_locs=int(df['loc_id_enc'].max()),
    )

    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=PATIENCE,
        restore_best_weights=True,
        verbose=1,
    )

    print("── training ──")
    model.fit(
        {"time_series_input": X_ts, "user_input": X_u,
            "item_input": X_i, "loc_input": X_loc},
        y,
        epochs=MAX_EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=0.2,
        callbacks=[early_stop],
        verbose=1,
    )

    os.makedirs(SAVE_DIR, exist_ok=True)
    model.save(os.path.join(SAVE_DIR, "global_saas_forecaster.h5"))
    print(f"[train] model saved to {SAVE_DIR}/")
    return model


if __name__ == "__main__":
    train()
