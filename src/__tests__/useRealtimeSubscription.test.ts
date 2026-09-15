import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  mockSupabaseClient,
  resetSupabaseMocks,
} from './mocks';

// Mock the supabaseClient module BEFORE importing hooks
vi.mock('../services/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

import {
  useRealtimeSubscription,
  useSubscribeToCitizenChanges,
  useSubscribeToTaskChanges,
  useSubscribeToCitizenTaskQueue,
  useSubscribeToRevenueChanges,
  useSubscribeToRateLimitChanges,
  useSubscribeToAssetChanges,
} from '../services/useRealtimeSubscription';

describe('useRealtimeSubscription', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('Generic Hook', () => {
    it('should create a channel with the correct name and table', () => {
      const callback = vi.fn();
      renderHook(() => useRealtimeSubscription('test-channel', 'test_table', callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('test-channel:test_table');
    });

    it('should subscribe to the channel', async () => {
      const callback = vi.fn();
      renderHook(() => useRealtimeSubscription('test-channel', 'test_table', callback));

      await waitFor(() => {
        const channel = (mockSupabaseClient.channel as any).mock.results[0].value;
        expect(channel.subscribe).toHaveBeenCalled();
      });
    });

    it('should handle subscription callbacks', () => {
      const callback = vi.fn();
      renderHook(() => useRealtimeSubscription('test', 'test_table', callback));

      expect(callback).toBeDefined();
    });

    it('should unsubscribe on unmount', async () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() =>
        useRealtimeSubscription('test', 'test_table', callback)
      );

      unmount();

      await waitFor(() => {
        const channel = (mockSupabaseClient.channel as any).mock.results[0].value;
        expect(channel.unsubscribe).toHaveBeenCalled();
      });
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useRealtimeSubscription('test', 'test_table', callback)
      );

      expect(result.current).toHaveProperty('unsubscribe');
      expect(typeof result.current.unsubscribe).toBe('function');
    });
  });

  describe('Specialized Hooks', () => {
    it('should use useSubscribeToCitizenChanges with correct table', () => {
      const callback = vi.fn();
      renderHook(() => useSubscribeToCitizenChanges(callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('citizens:citizens');
    });

    it('should use useSubscribeToTaskChanges with correct table', () => {
      const callback = vi.fn();
      renderHook(() => useSubscribeToTaskChanges(callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('tasks:tasks');
    });

    it('should use useSubscribeToCitizenTaskQueue with citizen filter', () => {
      const callback = vi.fn();
      const citizenId = 'test-citizen-123';
      renderHook(() => useSubscribeToCitizenTaskQueue(citizenId, callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `citizen_queue:${citizenId}`
      );
    });

    it('should use useSubscribeToRevenueChanges with correct table', () => {
      const callback = vi.fn();
      renderHook(() => useSubscribeToRevenueChanges(callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('revenue:revenue');
    });

    it('should use useSubscribeToRateLimitChanges with citizen filter', () => {
      const callback = vi.fn();
      const citizenId = 'test-citizen-456';
      renderHook(() => useSubscribeToRateLimitChanges(citizenId, callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `rate_limits:${citizenId}`
      );
    });


    it('should use useSubscribeToAssetChanges with assets_manifest table', () => {
      const callback = vi.fn();
      renderHook(() => useSubscribeToAssetChanges(callback));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('assets:assets_manifest');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing citizenId in filtered subscriptions', () => {
      const callback = vi.fn();
      renderHook(() => useSubscribeToCitizenTaskQueue(undefined, callback));

      expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
    });

    it('should handle rate limit changes without citizenId', () => {
      const callback = vi.fn();
      renderHook(() => useSubscribeToRateLimitChanges(undefined, callback));

      expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
    });
  });
});
