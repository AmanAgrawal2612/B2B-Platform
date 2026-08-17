import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../../store/notificationSlice';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const Toast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`flex items-start gap-3 p-4 mb-3 rounded-lg border shadow-sm transition-all animate-in slide-in-from-right-8 fade-in duration-300 ${bgColors[notification.type]}`}>
      <div className="shrink-0 mt-0.5">{icons[notification.type]}</div>
      <div className="flex-1 text-sm font-medium text-slate-800">
        {notification.message}
      </div>
      <button onClick={() => onClose(notification.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastProvider = () => {
  const notifications = useSelector(state => state.notification.notifications);
  const dispatch = useDispatch();

  const handleClose = (id) => {
    dispatch(removeNotification(id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col items-end w-full max-w-sm pointer-events-none">
      <div className="pointer-events-auto w-full">
        {notifications.map(notif => (
          <Toast key={notif.id} notification={notif} onClose={handleClose} />
        ))}
      </div>
    </div>
  );
};

export default ToastProvider;
