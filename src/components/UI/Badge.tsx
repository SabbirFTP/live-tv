/**
 * Badge Component
 * Displays status badges with counts
 * Used for channel status indicators
 */

import React from 'react';

interface BadgeProps {
  label: string;
  count: number;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  isActive?: boolean;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({ label, count, variant = 'primary', isActive = false, onClick }) => {
  // Variant color mappings
  const variantClasses = {
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-red-100 text-red-500',
    warning: 'bg-orange-100 text-orange-600',
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm
        ${variantClasses[variant]}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${isActive ? 'ring-2 ring-offset-2 ring-indigo-400' : ''}
      `}
    >
      <span>{label}</span>
      <span className="ml-1 font-bold">{count}</span>
    </div>
  );
};

export default Badge;
