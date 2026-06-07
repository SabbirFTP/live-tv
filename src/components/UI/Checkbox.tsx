/**
 * Checkbox Component
 * Custom styled checkbox for bulk operations
 */

import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-5 h-5 rounded border-2 border-indigo-300 
            checked:bg-indigo-600 checked:border-indigo-600
            cursor-pointer transition-all duration-200
          `}
          {...props}
        />
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
