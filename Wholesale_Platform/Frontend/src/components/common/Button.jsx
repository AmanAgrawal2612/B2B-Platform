import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  className = '',
  disabled = false,
  fullWidth = false
}) => {
  
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:bg-emerald-300",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-sm disabled:bg-slate-400",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:text-slate-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50",
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
