/**
 * Modal Component
 * Reusable modal dialog for alerts, confirmations, and disclaimers
 */

import React from 'react';
import { Button } from '../UI';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  primaryAction,
  secondaryAction,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✓',
  };

  const titleColorMap = {
    info: 'text-blue-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
    success: 'text-emerald-600',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in">
          {/* Header */}
          <div className="flex items-start gap-3 p-6 border-b border-slate-200">
            <span className="text-2xl flex-shrink-0">{iconMap[type]}</span>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${titleColorMap[type]}`}>{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-0">
            <p className="text-slate-700 text-sm leading-relaxed mb-3">{message}</p>
            {children}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-slate-200">
            {secondaryAction && (
              <Button
                variant="ghost"
                onClick={secondaryAction.onClick}
                className="flex-1"
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant="primary"
                onClick={primaryAction.onClick}
                isLoading={primaryAction.isLoading}
                className="flex-1"
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
