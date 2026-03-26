import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', onClick, fullWidth = false, size = 'md', icon: Icon, disabled = false }: any) => {
  const baseStyle = "rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const sizes = {
    sm: "py-2 px-3 text-sm",
    md: "py-2.5 px-5 text-sm",
    lg: "py-3.5 px-8 text-base"
  };
  const variants = {
    primary: "bg-opex-dark text-white shadow-lg shadow-blue-900/10 hover:bg-slate-800",
    secondary: "bg-opex-teal text-white hover:bg-opacity-90",
    outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
    ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
    black: "bg-black text-white hover:bg-gray-800 shadow-md",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button 
      disabled={disabled}
      className={`${baseStyle} ${sizes[size as keyof typeof sizes]} ${variants[variant as keyof typeof variants]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
};

export const Card = ({ children, className = "", title, action, noPadding = false, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className} overflow-hidden flex flex-col h-full ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99]' : ''}`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center px-6 py-2.5 border-b border-gray-50">
        {title && <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest">{title}</h3>}
        {action}
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-4 md:p-5'} flex-1`}>
      {children}
    </div>
  </div>
);

export const Badge = ({ children, variant = 'neutral' }: any) => {
  const variants = {
    neutral: 'bg-gray-100 text-gray-600',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${variants[variant as keyof typeof variants]}`}>
      {children}
    </span>
  );
};

export const ToggleFilter = ({ options, active, onChange }: any) => (
  <div className="flex bg-gray-100 p-1 rounded-lg">
    {options.map((opt: string) => (
      <button
        key={opt}
        onClick={(e) => { e.stopPropagation(); onChange(opt); }}
        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
          active === opt 
            ? 'bg-white text-opex-dark shadow-sm' 
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);
