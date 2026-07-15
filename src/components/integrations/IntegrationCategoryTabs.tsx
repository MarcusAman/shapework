/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntegrationCategory } from '../../types/integrations';

interface IntegrationCategoryTabsProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  categories: Array<{ id: string; label: string; count: number }>;
}

export default function IntegrationCategoryTabs({
  activeCategory,
  onSelectCategory,
  categories
}: IntegrationCategoryTabsProps) {
  return (
    <div className="flex flex-wrap border-b border-border-soft gap-2 overflow-x-auto pb-1 select-none">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-[6px] transition-all flex items-center gap-1.5 focus:outline-none ${
            activeCategory === cat.id
              ? 'border-brand-900 text-brand-900 font-bold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>{cat.label}</span>
          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono ${
            activeCategory === cat.id ? 'bg-brand-900 text-white' : 'bg-secondary-surface text-text-tertiary border border-border-soft/60'
          }`}>
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  );
}
