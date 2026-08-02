import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketingGenerationJob, MarketingBuildEvent } from '../../server/media/generationJobStore';

export interface UseMarketingBuildStreamReturn {
  job: MarketingGenerationJob | null;
  events: MarketingBuildEvent[];
  isConnected: boolean;
  error: string | null;
  submitInput: (requirementId: string, input: string) => Promise<void>;
  cancelJob: () => Promise<void>;
}

export function useMarketingBuildStream(
  campaignId: string | null,
  jobId: string | null
): UseMarketingBuildStreamReturn {
  const [job, setJob] = useState<MarketingGenerationJob | null>(null);
  const [events, setEvents] = useState<MarketingBuildEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastEventIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Poll fallback helper
  const pollJobStatus = useCallback(async () => {
    if (!campaignId || !jobId) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/generation-jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.job) {
          setJob(data.job);
          if (data.events) {
            setEvents(data.events);
            if (data.events.length > 0) {
              lastEventIdRef.current = data.events[data.events.length - 1].id;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Poll fallback error:', e);
    }
  }, [campaignId, jobId]);

  useEffect(() => {
    if (!campaignId || !jobId) {
      setJob(null);
      setEvents([]);
      setIsConnected(false);
      return;
    }

    // Initial fetch
    pollJobStatus();

    // Setup SSE connection
    let url = `/api/marketing/campaigns/${campaignId}/generation-jobs/${jobId}/events`;
    if (lastEventIdRef.current) {
      url += `?lastEventId=${encodeURIComponent(lastEventIdRef.current)}`;
    }

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = (e) => {
      try {
        const evt: MarketingBuildEvent = JSON.parse(e.data);
        lastEventIdRef.current = evt.id;

        setEvents((prev) => {
          if (prev.some((p) => p.id === evt.id)) return prev;
          return [...prev, evt];
        });

        // Refresh job state on key events
        if (
          evt.type === 'asset_preview_ready' ||
          evt.type === 'input_required' ||
          evt.type === 'job_completed' ||
          evt.type === 'job_failed'
        ) {
          pollJobStatus();
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      // Trigger fallback polling interval if SSE disconnects
      const pollInterval = setInterval(() => {
        pollJobStatus();
      }, 3000);

      return () => clearInterval(pollInterval);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [campaignId, jobId, pollJobStatus]);

  const submitInput = useCallback(
    async (requirementId: string, input: string) => {
      if (!campaignId || !jobId) return;
      try {
        const res = await fetch(`/api/marketing/campaigns/${campaignId}/generation-jobs/${jobId}/input`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirementId, input }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.job) {
            setJob(data.job);
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to submit input');
      }
    },
    [campaignId, jobId]
  );

  const cancelJob = useCallback(async () => {
    if (!campaignId || !jobId) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/generation-jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.job) {
          setJob(data.job);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to cancel job');
    }
  }, [campaignId, jobId]);

  return {
    job,
    events,
    isConnected,
    error,
    submitInput,
    cancelJob,
  };
}
