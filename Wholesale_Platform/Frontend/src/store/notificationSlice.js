import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
};

let nextId = 0;

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.push({
        id: ++nextId,
        message: action.payload.message,
        type: action.payload.type || 'info', // 'success', 'error', 'info', 'warning'
        duration: action.payload.duration || 3000,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
