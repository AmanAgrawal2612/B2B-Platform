import React from 'react';
import { X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { closeModal } from '../../store/uiSlice';

const Modal = ({ title, children, onClose, isOpen, maxWidth = 'max-w-lg' }) => {
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    dispatch(closeModal());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl shadow-xl w-full overflow-hidden animate-in zoom-in-95 duration-200 ${maxWidth}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
