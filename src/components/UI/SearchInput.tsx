/**
 * Search Input Component
 * Search box with clear button
 */

import React from 'react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder="Search channels..."
          className={`
            w-full px-4 py-2 pr-10 border border-indigo-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            text-slate-900 placeholder-slate-500
            ${className}
          `}
          {...props}
        />
        {value && onClear && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
