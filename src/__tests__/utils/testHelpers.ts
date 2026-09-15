import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function that can wrap components with providers if needed
 * Currently used for basic rendering, but ready to wrap with Context/Redux providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Wait for async operations with custom timeout
 */
export function waitForAsync(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock subscription callback tracker
 * Useful for testing that callbacks are called with correct data
 */
export function createCallbackTracker() {
  const calls: any[] = [];
  const callback = (payload: any) => {
    calls.push(payload);
  };

  return {
    callback,
    calls,
    getLastCall: () => calls[calls.length - 1],
    getCallCount: () => calls.length,
    clear: () => calls.splice(0, calls.length),
  };
}

/**
 * Mock data generators for testing
 * These match the actual data structures used in the application
 */
export const mockDataGenerators = {
  task: (overrides = {}) => ({
    id: 'task-' + Math.random().toString(36).substr(2, 9),
    task_type: 'PRICING',
    status: 'QUEUED' as const,
    // Integer 1-10 per the DB CHECK. priorityLabel() derives HIGH/MEDIUM/LOW.
    priority: 5,
    payload: {},
    worker_id: null,
    citizen_id: 'c1',
    queued_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    actual_duration_seconds: null,
    estimated_duration_seconds: 300,
    retry_count: 0,
    max_retries: 3,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  worker: (overrides = {}) => ({
    id: 'w-' + Math.random().toString(36).substr(2, 9),
    name: 'Worker',
    // Matches the citizens.status CHECK constraint. 'WORKING' and
    // health_percentage/assigned_tasks were invented by the test helper and
    // exist in neither the schema nor the component.
    status: 'IDLE' as const,
    worker_type: 'pricing_agent',
    version: '1.0.0',
    max_concurrent_tasks: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  // Matches the real getRevenueSummary() return shape. The old `revenue`
  // generator below invented total_expenses / net_revenue / breakdown_by_source,
  // none of which the service returns or the widget renders.
  revenueSummary: (overrides = {}) => ({
    total_revenue: 1500.0,
    total_costs: 300.0,
    net_revenue: 1200.0,
    profit_margin_pct: 80.0,
    total_transactions: 12,
    average_transaction: 125.0,
    average_daily: 250.0,
    unique_citizens: 3,
    active_days: 5,
    ...overrides,
  }),

  revenue: (overrides = {}) => ({
    total_revenue: 1000.0,
    total_expenses: 200.0,
    net_revenue: 800.0,
    period: 'month',
    breakdown_by_source: {
      collectibles_pricing: 600.0,
      gta6_analysis: 300.0,
      dropshipping: 100.0,
    },
    expense_breakdown: {
      api_costs: 100.0,
      storage: 60.0,
      compute: 40.0,
    },
    ...overrides,
  }),

  citizen: (overrides = {}) => ({
    id: 'citizen-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Citizen',
    status: 'active',
    location: { x: 0, y: 0 },
    ...overrides,
  }),

  rateLimit: (overrides = {}) => ({
    id: 'rate-' + Math.random().toString(36).substr(2, 9),
    citizen_id: 'citizen-123',
    hourly_remaining: 100,
    daily_remaining: 1000,
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};
