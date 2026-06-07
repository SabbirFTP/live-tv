/**
 * Tab Component
 * Tab navigation with active state
 */

import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex gap-2 border-b border-indigo-50 flex-wrap ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-3 font-medium text-sm transition-all duration-200
            border-b-2 relative -mb-0.5
            ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-xs font-bold">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
