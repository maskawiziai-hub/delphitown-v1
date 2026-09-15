import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface RealtimeSubscriptionResult {
  unsubscribe: () => Promise<void>;
}

/**
 * Generic hook for Supabase realtime subscriptions
 * Handles channel creation, subscription, and cleanup
 */
export const useRealtimeSubscription = <T extends Record<string, any>>(
  channelName: string,
  table: string,
  onPayload: (payload: { new: T; old: T; eventType: string }) => void
): RealtimeSubscriptionResult => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create and subscribe to channel
    const channel = supabase
      .channel(`${channelName}:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload: any) => {
          onPayload({
            new: payload.new as T,
            old: payload.old as T,
            eventType: payload.eventType as string
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channelName, table, onPayload]);

  return {
    unsubscribe: async () => {
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
      }
    }
  };
};

/**
 * Subscribe to citizen table changes
 */
export const useSubscribeToCitizenChanges = (
  onPayload: (payload: any) => void
) => {
  return useRealtimeSubscription('citizens', 'citizens', onPayload);
};

/**
 * Subscribe to task table changes
 */
export const useSubscribeToTaskChanges = (
  onPayload: (payload: any) => void
) => {
  return useRealtimeSubscription('tasks', 'tasks', onPayload);
};

/**
 * Subscribe to citizen task queue changes (filtered)
 */
export const useSubscribeToCitizenTaskQueue = (
  citizenId: string | undefined,
  onPayload: (payload: any) => void
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!citizenId) return;

    const channel = supabase
      .channel(`citizen_queue:${citizenId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `citizen_id=eq.${citizenId}`
        },
        (payload: any) => {
          onPayload(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [citizenId, onPayload]);

  return {
    unsubscribe: async () => {
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
      }
    }
  };
};

/**
 * Subscribe to revenue table changes
 */
export const useSubscribeToRevenueChanges = (
  onPayload: (payload: any) => void
) => {
  return useRealtimeSubscription('revenue', 'revenue', onPayload);
};

/**
 * Subscribe to rate limit table changes
 */
export const useSubscribeToRateLimitChanges = (
  citizenId: string | undefined,
  onPayload: (payload: any) => void
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!citizenId) return;

    const channel = supabase
      .channel(`rate_limits:${citizenId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rate_limits',
          filter: `citizen_id=eq.${citizenId}`
        },
        (payload: any) => {
          onPayload(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [citizenId, onPayload]);

  return {
    unsubscribe: async () => {
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
      }
    }
  };
};

/**
 * Subscribe to worker table changes
 */
export const useSubscribeToWorkerChanges = (
  onPayload: (payload: any) => void
) => {
  return useRealtimeSubscription('workers', 'workers', onPayload);
};

/**
 * Subscribe to asset table changes
 */
export const useSubscribeToAssetChanges = (
  onPayload: (payload: any) => void
) => {
  return useRealtimeSubscription('assets', 'assets_manifest', onPayload);
};
