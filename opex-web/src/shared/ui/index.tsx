import {
  type ButtonHTMLAttributes,
  type ComponentType,
  type MouseEventHandler,
  type PropsWithChildren,
  type ReactNode
} from 'react';

type IconComponent = ComponentType<{
  size?: number | string;
  className?: string;
}>;

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'black' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  size?: ButtonSize;
  icon?: IconComponent;
};

type CardProps = PropsWithChildren<{
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
  noPadding?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}>;

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = PropsWithChildren<{
  variant?: BadgeVariant;
}>;

type ToggleFilterProps = {
  options: string[];
  active: string;
  onChange: (value: string) => void;
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-2.5 px-5 text-sm',
  lg: 'py-3.5 px-8 text-base'
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-opex-dark text-white shadow-lg shadow-blue-900/10 hover:bg-slate-800',
  secondary: 'bg-opex-teal text-white hover:bg-opacity-90',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  ghost: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
  black: 'bg-black text-white hover:bg-gray-800 shadow-md',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100'
};

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700'
};

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  fullWidth = false,
  size = 'md',
  icon: Icon,
  disabled = false,
  type = 'button',
  ...buttonProps
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled}
    className={`rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
      BUTTON_SIZES[size]
    } ${BUTTON_VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${
      disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''
    } ${className}`}
    {...buttonProps}
  >
    {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
    {children}
  </button>
);

export const Card = ({
  children,
  className = '',
  title,
  action,
  noPadding = false,
  onClick
}: CardProps) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm ${className} overflow-hidden flex flex-col h-full transition-colors duration-200 ${
      onClick
        ? 'cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all active:scale-[0.99]'
        : ''
    }`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center px-6 py-2.5 border-b border-gray-50 dark:border-slate-700">
        {title && (
          <h3 className="font-black text-gray-900 dark:text-gray-100 text-[10px] uppercase tracking-widest">
            {title}
          </h3>
        )}
        {action}
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-4 md:p-5'} flex-1`}>{children}</div>
  </div>
);

export const Badge = ({ children, variant = 'neutral' }: BadgeProps) => (
  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${BADGE_VARIANTS[variant]}`}>
    {children}
  </span>
);

export const ToggleFilter = ({ options, active, onChange }: ToggleFilterProps) => (
  <div className="flex bg-gray-100 p-1 rounded-lg">
    {options.map((option) => (
      <button
        key={option}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onChange(option);
        }}
        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
          active === option ? 'bg-white text-opex-dark shadow-sm' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {option}
      </button>
    ))}
  </div>
);
