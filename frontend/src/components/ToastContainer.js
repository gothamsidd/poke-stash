import React from 'react';
import Toast from './Toast';
import './Toast.css';

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration || 3000}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
