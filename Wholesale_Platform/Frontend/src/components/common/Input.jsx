import React from 'react';
import { Search } from 'lucide-react';

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false, 
  icon = null,
  className = '',
  step
}) => {
  
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input 
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          step={step}
          className={`w-full border border-slate-300 rounded-lg py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-white ${icon ? 'pl-10 pr-4' : 'px-3'}`}
        />
      </div>
    </div>
  );
};

export default Input;
