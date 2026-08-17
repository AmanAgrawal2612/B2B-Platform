import { createSlice } from '@reduxjs/toolkit';

// Retrieve initial state from localStorage if available
let storedUser = localStorage.getItem('user');
let storedToken = localStorage.getItem('token');

// Check if token is expired
if (storedToken) {
  try {
    const payload = JSON.parse(atob(storedToken.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      storedToken = null;
      storedUser = null;
    }
  } catch (e) {
    storedToken = null;
    storedUser = null;
  }
}

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { loginSuccess, logout, setLoading } = authSlice.actions;

export default authSlice.reducer;
