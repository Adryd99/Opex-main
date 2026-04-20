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

type ToggleFilterOption = string | { value: string; label: string };

type ToggleFilterProps = {
  options: ToggleFilterOption[];
  active: string;
  onChange: (value: string) => void;
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-2.5 px-5 text-sm',
  lg: 'py-3.5 px-8 text-base'
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-opex-dark text-white shadow-lg shadow-blue-900/10 hover:bg-slate-800 dark:bg-opex-teal dark:text-slate-950 dark:hover:bg-teal-300',
  secondary: 'bg-opex-teal text-white hover:bg-opacity-90 dark:text-slate-950',
  outline: 'border border-app-border text-app-secondary bg-app-surface hover:bg-app-muted hover:text-app-primary',
  ghost: 'text-app-secondary hover:text-app-primary hover:bg-app-muted',
  black: 'bg-app-primary text-app-inverse hover:opacity-90 shadow-md',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
};

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-app-muted text-app-secondary',
  success: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-200',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-sky-500/10 dark:text-sky-300'
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
    className={`bg-app-surface rounded-2xl border border-app-border shadow-sm ${className} overflow-hidden flex flex-col h-full transition-colors duration-200 ${
      onClick
        ? 'cursor-pointer hover:shadow-md hover:border-app-secondary/20 transition-all active:scale-[0.99]'
        : ''
    }`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center px-6 py-2.5 border-b border-app-border">
        {title && (
          <h3 className="font-black text-app-primary text-[10px] uppercase tracking-widest">
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
  <div className="flex bg-app-muted p-1 rounded-lg transition-colors duration-200">
    {options.map((option) => (
      <button
        key={typeof option === 'string' ? option : option.value}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onChange(typeof option === 'string' ? option : option.value);
        }}
        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
          active === (typeof option === 'string' ? option : option.value)
            ? 'bg-app-surface text-app-primary shadow-sm'
            : 'text-app-secondary hover:text-app-primary'
        }`}
      >
        {typeof option === 'string' ? option : option.label}
      </button>
    ))}
  </div>
);
