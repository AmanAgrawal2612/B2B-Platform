"""
model.py
Defines the global multi-input LSTM architecture with entity embeddings
for store (user) and item identification, compiled with a custom Tweedie loss.
"""

import tensorflow as tf
from tensorflow.keras import backend as K
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, LSTM, Dense, Dropout,
    Embedding, Flatten, Concatenate,
)


def tweedie_loss(p=1.5):
    """Tweedie deviance loss — well-suited for zero-inflated, right-skewed
    count data typical of wholesale/retail demand."""
    def _loss(y_true, y_pred):
        y_pred = tf.maximum(y_pred, K.epsilon())
        a = y_true * tf.pow(y_pred, 1 - p) / (1 - p)
        b = tf.pow(y_pred, 2 - p) / (2 - p)
        return tf.reduce_mean(-a + b)
    return _loss


def build_model(lookback=None, n_features=4, horizon=6,
                n_users=1000, n_items=5000, n_locs=1000):
    """Functional-API model: LSTM backbone + user/item/loc embedding branches."""

    # temporal branch
    ts_in = Input(shape=(lookback, n_features), name="time_series_input")
    x = LSTM(64, activation='relu', return_sequences=True)(ts_in)
    x = Dropout(0.2)(x)
    x = LSTM(32, activation='relu')(x)
    x = Dropout(0.2)(x)

    # user (store) embedding — +1 accounts for 1-based indexing
    u_in = Input(shape=(1,), name="user_input")
    u = Embedding(n_users + 1, 16, name="user_embedding")(u_in)
    u = Flatten()(u)

    # item embedding
    i_in = Input(shape=(1,), name="item_input")
    i = Embedding(n_items + 1, 16, name="item_embedding")(i_in)
    i = Flatten()(i)

    # location embedding
    l_in = Input(shape=(1,), name="loc_input")
    l = Embedding(n_locs + 1, 16, name="loc_embedding")(l_in)
    l = Flatten()(l)

    # merge & output
    merged = Concatenate()([x, u, i, l])
    out = Dense(32, activation='relu')(merged)
    out = Dense(horizon, name="forecast_output")(out)

    model = Model(inputs=[ts_in, u_in, i_in, l_in], outputs=out)
    model.compile(optimizer='adam', loss=tweedie_loss(p=1.5),
                  metrics=['mae', 'mse'])
    return model


if __name__ == "__main__":
    m = build_model(n_users=10, n_items=20)
    m.summary()
