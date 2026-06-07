/**
 * Button Component
 * Reusable button with multiple variants and sizes
 * Variants: primary, secondary, danger, ghost
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className = '', disabled, ...props }, ref) => {
    // Variant styles
    const variantClasses = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-900 border border-slate-300',
    };

    // Size styles
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-lg font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {isLoading ? <span className="inline-block animate-spin">⟳</span> : props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
