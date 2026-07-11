import React, { useState } from 'react';
import { initialLiveEvents, LiveEvent } from '../../data/demoLiveEvents';
import LiveEventCard from './LiveEventCard';
import LiveEventDetailDrawer from './LiveEventDetailDrawer';
import { Search, Filter, AlertTriangle, Layers, Database } from 'lucide-react';
import EmptyState from '../system/EmptyState';
import { safeLower } from '../../utils/string';

interface LiveOperationsTimelineProps {
  onInspectRecord?: (type: string, id: string) => void;
  maxCount?: number;
}

export default function LiveOperationsTimeline({ onInspectRecord, maxCount }: LiveOperationsTimelineProps) {
  const [events, setEvents] = useState<LiveEvent[]>(initialLiveEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const query = safeLower(searchTerm);

  const filteredEvents = events.filter((evt) => {
    const matchesSearch = 
      safeLower(evt.trigger).includes(query) ||
      safeLower(evt.description).includes(query) ||
      safeLower(evt.agentName).includes(query) ||
      safeLower(evt.recordName).includes(query);

    const matchesSource = filterSource === 'all' || evt.source === filterSource;
    const matchesStatus = filterStatus === 'all' || evt.status === filterStatus;

    return matchesSearch && matchesSource && matchesStatus;
  });

  const displayedEvents = maxCount ? filteredEvents.slice(0, maxCount) : filteredEvents;

  const handleOpenDrawer = (event: LiveEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-4 font-sans text-left">
      
      {/* Filters bar */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search timeline events, agent runs, or records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-secondary-surface border border-border-subtle rounded-xl text-xs focus:outline-none focus:border-border-strong text-text-primary"
            />
          </div>

          {/* Source filters */}
          <div className="flex gap-2 shrink-0">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 bg-secondary-surface border border-border-subtle rounded-xl text-xs text-text-secondary focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="docusign">DocuSign</option>
              <option value="rechat">Rechat</option>
              <option value="webhook">Webhooks</option>
              <option value="system">System Sweeps</option>
            </select>

            {/* Status filters */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-secondary-surface border border-border-subtle rounded-xl text-xs text-text-secondary focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="needs_approval">Awaiting Approval</option>
              <option value="failed">Failed</option>
            </select>
          </div>

        </div>
      </div>

      {/* Events List feed */}
      {displayedEvents.length > 0 ? (
        <div className="space-y-3">
          {displayedEvents.map((evt) => (
            <LiveEventCard 
              key={evt.id} 
              event={evt} 
              onViewDetails={handleOpenDrawer} 
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No live events match filters" 
          description="Try broadening your source categories or resetting your search input query."
        />
      )}

      {/* Event Details Drawer */}
      <LiveEventDetailDrawer
        event={selectedEvent}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onNavigateToRecord={onInspectRecord}
      />

    </div>
  );
}
