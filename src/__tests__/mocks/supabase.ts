import { vi } from 'vitest';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Mock Realtime Channel for testing subscriptions
 * Implements the RealtimeChannel interface with vi.fn() for all methods
 */
export const mockRealtimeChannel = {
  on: vi.fn(function (this: any) { return this; }),
  subscribe: vi.fn(function (this: any) { return Promise.resolve('SUBSCRIBED'); }),
  unsubscribe: vi.fn(function (this: any) { return Promise.resolve(); })
} as unknown as RealtimeChannel;

/**
 * Mock Supabase Client for testing
 * Allows tests to verify hook behavior without connecting to real database
 */
export const mockSupabaseClient = {
  channel: vi.fn((name: string) => ({ ...mockRealtimeChannel, _channelName: name })),
  from: vi.fn((_table: string) => ({
    select: vi.fn(() => ({ data: [], error: null })),
    insert: vi.fn(() => ({ data: null, error: null }))
  }))
};

/**
 * Create a mock RealtimeChannel payload matching Supabase format
 */
export function createMockPayload(
  eventType: string,
  newData: any,
  oldData?: any
) {
  return {
    new: newData,
    old: oldData || null,
    eventType,
    schema: 'public',
    table: 'test_table'
  };
}

/**
 * Simulate a subscription payload (useful for testing callback behavior)
 */
export function simulateSubscriptionPayload(callback: any, eventType: string, data: any) {
  const payload = createMockPayload(eventType, data);
  callback(payload);
}

/**
 * Reset all mocks to clean state for next test
 */
export function resetSupabaseMocks() {
  vi.clearAllMocks();
}
