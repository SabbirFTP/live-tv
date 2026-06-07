/**
 * Header Component
 * Main navigation and branding
 */

import React from 'react';
import { Button } from '../UI';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  isDarkMode = false,
  onToggleDarkMode,
  title = 'Live TV',
}) => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">📺</div>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDarkMode}
              className="text-white border-white/30 hover:bg-white/20"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
