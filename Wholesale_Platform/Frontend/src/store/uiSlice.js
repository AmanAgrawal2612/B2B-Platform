import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: false,
  activeModal: null, // track if a specific global modal is open
  modalData: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload.modalName;
      state.modalData = action.payload.modalData || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    }
  }
});

export const { toggleSidebar, setSidebarOpen, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
