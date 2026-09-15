/**
 * Central export file for all test mocks
 * Makes it easy to import all mocks with: import * from '@/__tests__/mocks'
 */

export {
  mockRealtimeChannel,
  mockSupabaseClient,
  resetSupabaseMocks,
  createMockPayload,
  simulateSubscriptionPayload,
} from './supabase';
