import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketingGenerationJob, MarketingBuildEvent } from '../../server/media/generationJobStore';

export type GenerationJobResolution =
  | { state: "not_started"; campaignId: string }
  | { state: "active"; job: MarketingGenerationJob }
  | { state: "completed"; job: MarketingGenerationJob }
  | { state: "interrupted"; job: MarketingGenerationJob }
  | { state: "unavailable"; reason: string };

export interface UseMarketingBuildStreamReturn {
  job: MarketingGenerationJob | null;
  events: MarketingBuildEvent[];
  resolution: GenerationJobResolution;
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
  const [resolution, setResolution] = useState<GenerationJobResolution>({
    state: "not_started",
    campaignId: campaignId || ""
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastEventIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const is404Ref = useRef(false);

  // Poll fallback helper
  const pollJobStatus = useCallback(async () => {
    if (!campaignId || !jobId) {
      setResolution({ state: "not_started", campaignId: campaignId || "" });
      return;
    }
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/generation-jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.job) {
          setJob(data.job);
          if (data.job.status === "completed") {
            setResolution({ state: "completed", job: data.job });
          } else if (data.job.status === "failed" || data.job.status === "cancelled") {
            setResolution({ state: "interrupted", job: data.job });
          } else {
            setResolution({ state: "active", job: data.job });
          }

          if (data.events) {
            setEvents(data.events);
            if (data.events.length > 0) {
              lastEventIdRef.current = data.events[data.events.length - 1].id;
            }
          }
        }
      } else if (res.status === 404) {
        is404Ref.current = true;
        setJob(null);
        setResolution({ state: "not_started", campaignId });
      } else {
        setResolution({ state: "unavailable", reason: `HTTP ${res.status}` });
      }
    } catch (e: any) {
      console.warn('Poll fallback error:', e);
      setResolution({ state: "unavailable", reason: e.message || 'Network error' });
    }
  }, [campaignId, jobId]);

  useEffect(() => {
    is404Ref.current = false;
    if (!campaignId || !jobId) {
      setJob(null);
      setEvents([]);
      setIsConnected(false);
      setResolution({ state: "not_started", campaignId: campaignId || "" });
      return;
    }

    // Initial fetch
    pollJobStatus().then(() => {
      // If 404 or completed/not_started without running active state, do not establish SSE!
      if (is404Ref.current) {
        return;
      }

      // Setup SSE connection only for active jobs
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
      };
    });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
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
