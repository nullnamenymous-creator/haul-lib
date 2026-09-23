'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 overflow-x-auto no-scrollbar',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200 select-none cursor-pointer',
              isActive
                ? 'bg-emerald-islamic text-white shadow-sm font-semibold'
                : 'text-stone-600 hover:text-emerald-950 hover:bg-white/70'
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  'shrink-0',
                  isActive ? 'text-amber-300' : 'text-stone-400'
                )}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-mono font-medium',
                  isActive
                    ? 'bg-emerald-900/60 text-amber-200 border border-emerald-700/50'
                    : 'bg-stone-200 text-stone-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
