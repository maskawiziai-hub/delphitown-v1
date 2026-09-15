import { vi } from 'vitest';

/**
 * Mock Supabase client and realtime channel
 */
let subscriptionCallbacks: Record<string, Function[]> = {};

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  })),
  channel: vi.fn((channelName: string) => ({
    on: vi.fn(function (this: any, _event: string, _options: any, callback: Function) {
      if (!subscriptionCallbacks[channelName]) {
        subscriptionCallbacks[channelName] = [];
      }
      subscriptionCallbacks[channelName].push(callback);
      return this;
    }),
    subscribe: vi.fn(function (this: any, callback?: Function) {
      if (callback) callback('SUBSCRIBED');
      return this;
    }),
    unsubscribe: vi.fn(),
  })),
  rpc: vi.fn(),
  removeChannel: vi.fn().mockReturnThis(),
};

/**
 * Simulate a realtime subscription payload
 * Used to test that widgets properly handle realtime updates
 */
export function simulateSubscriptionPayload(payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
}) {
  // Trigger all subscription callbacks with the payload
  Object.values(subscriptionCallbacks).forEach(callbacks => {
    callbacks.forEach(callback => {
      callback({
        ...payload,
        new: payload.new || null,
        old: payload.old || null,
      });
    });
  });
}

/**
 * Reset all subscription mocks
 */
export function resetSupabaseMocks() {
  subscriptionCallbacks = {};
  vi.clearAllMocks();
}
