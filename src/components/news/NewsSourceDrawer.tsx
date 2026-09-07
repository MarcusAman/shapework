/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { NewsSource } from '../../../server/services/news/newsTypes';

interface NewsSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: NewsSource[];
  onToggleSource: (sourceId: string) => Promise<void>;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
}

export const NewsSourceDrawer: React.FC<NewsSourceDrawerProps> = ({
  isOpen,
  onClose,
  sources,
  onToggleSource,
  onTriggerSync,
  isSyncing
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filteredSources = filterCategory === 'all' 
    ? sources 
    : sources.filter(s => s.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div 
        className="bg-white border-l border-stone-200 w-full max-w-md h-full shadow-2xl flex flex-col text-left select-text animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-[#F7F8F5]">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#00635C]" />
              <h3 className="font-serif font-bold text-base text-[#01362D]">
                Source Registry
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage authoritative real-estate news feeds & sync health.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Action Bar */}
        <div className="p-4 border-b border-stone-100 bg-white flex items-center justify-between gap-3">
          <span className="text-xs text-stone-600 font-medium">
            {sources.filter(s => s.isEnabled).length} of {sources.length} active feeds
          </span>

          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#01362D] hover:bg-[#004d47] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Feeds...' : 'Sync All Now'}</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2.5 border-b border-stone-100 flex gap-1.5 overflow-x-auto select-none bg-stone-50/50 text-[11px]">
          {['all', 'brokerage', 'local', 'housing'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-white text-stone-900 shadow-2xs font-bold border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Source Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSources.map((source) => (
            <div 
              key={source.id} 
              className={`p-4 rounded-2xl border transition-all ${
                source.isEnabled 
                  ? 'bg-white border-stone-200/80 shadow-2xs' 
                  : 'bg-stone-50/60 border-stone-200/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-stone-900">
                      {source.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-stone-100 text-stone-600">
                      {source.feedType}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 mt-1 leading-normal font-sans">
                    {source.description}
                  </p>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => onToggleSource(source.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    source.isEnabled ? 'bg-[#00635C]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      source.isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status and Health Info */}
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10.5px] font-mono text-stone-500">
                <div className="flex items-center gap-1.5">
                  {source.lastError ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Issue: {source.lastError.slice(0, 24)}...</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-stone-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {source.lastSyncedAt 
                      ? new Date(source.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsSourceDrawer;
