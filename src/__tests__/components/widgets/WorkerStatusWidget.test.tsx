// ============================================================================
// WorkerStatusWidget Integration Tests
// Tests: Widget + Hook + Service working together with realtime updates
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WorkerStatusWidget } from '@/components/widgets/WorkerStatusWidget';
import * as workerService from '@/services/workerService';
import { simulateSubscriptionPayload, resetSupabaseMocks } from '@/__tests__/mocks';
import { mockDataGenerators } from '@/__tests__/utils/testHelpers';

// This mock was missing entirely, so the real useSubscribeToWorkerChanges hook
// ran against the real Supabase client and simulateSubscriptionPayload could
// never reach it. That is why the realtime tests failed here but not elsewhere.
vi.mock('@/services/supabaseClient', async () => {
  const { mockSupabaseClient } = await import('@/__tests__/mocks');
  return { supabase: mockSupabaseClient };
});

vi.mock('@/services/workerService', () => ({
  getAllWorkers: vi.fn(),
  getWorkerById: vi.fn(),
  getWorkerStats: vi.fn(),
  getWorkerHealthStatus: vi.fn(),
}));

const mockWorkerService = workerService as any;

describe('WorkerStatusWidget - Integration Tests', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // The widget calls these for every worker it renders. Without defaults they
    // return undefined and the component throws mid-render.
    mockWorkerService.getWorkerStats.mockResolvedValue({
      active_tasks: 0, completed_tasks: 0, failed_tasks: 0,
      success_rate: 0, avg_task_duration: 0,
    });
    mockWorkerService.getWorkerHealthStatus.mockResolvedValue({ status: 'HEALTHY' });
  });

  describe('Initial Load & Display', () => {
    it('should render loading state while fetching workers', () => {
      mockWorkerService.getAllWorkers.mockImplementation(() => new Promise(() => {}));

      render(<WorkerStatusWidget />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display worker list after loading', async () => {
      const mockWorkers = [
        mockDataGenerators.worker({ id: 'w1', name: 'Astra', status: 'IDLE' }),
        mockDataGenerators.worker({ id: 'w2', name: 'Bron', status: 'ACTIVE' }),
      ];

      mockWorkerService.getAllWorkers.mockResolvedValue(mockWorkers);

      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('Astra')).toBeInTheDocument();
        expect(screen.getByText('Bron')).toBeInTheDocument();
      });
    });

    it('should display error state on load failure', async () => {
      mockWorkerService.getAllWorkers.mockRejectedValue(new Error('Failed to load'));

      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Realtime Worker Status Updates', () => {
    beforeEach(() => {
      const initialWorkers = [
        mockDataGenerators.worker({ id: 'w1', name: 'Astra', status: 'IDLE' }),
      ];
      mockWorkerService.getAllWorkers.mockResolvedValue(initialWorkers);
    });

    it('should update worker status when subscription receives change', async () => {
      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('IDLE')).toBeInTheDocument();
      });

      // Simulate worker status change via subscription
      const updatedWorker = mockDataGenerators.worker({
        id: 'w1',
        name: 'Astra',
        status: 'ACTIVE',
      });

      // The widget refetches on change, so the service must reflect the new state.
      mockWorkerService.getAllWorkers.mockResolvedValue([updatedWorker]);

      simulateSubscriptionPayload({
        eventType: 'UPDATE',
        new: updatedWorker,
        old: mockDataGenerators.worker({ id: 'w1', status: 'IDLE' }),
      });

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.queryByText('IDLE')).not.toBeInTheDocument();
      });
    });

    it('should add new worker when subscription receives INSERT', async () => {
      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('Astra')).toBeInTheDocument();
      });

      const newWorker = mockDataGenerators.worker({
        id: 'w2',
        name: 'Bron',
        status: 'IDLE',
      });

      // Same here: the refetch is the mechanism, so the service must now
      // return both workers.
      mockWorkerService.getAllWorkers.mockResolvedValue([
        mockDataGenerators.worker({ id: 'w1', name: 'Astra', status: 'IDLE' }),
        newWorker,
      ]);

      simulateSubscriptionPayload({
        eventType: 'INSERT',
        new: newWorker,
        old: null,
      });

      await waitFor(() => {
        expect(screen.getByText('Bron')).toBeInTheDocument();
      });
    });
  });

  describe('Health Metrics Display', () => {
    it('should display health status for each worker', async () => {
      const mockWorkers = [
        mockDataGenerators.worker({ id: 'w1', name: 'Worker1' }),
        mockDataGenerators.worker({ id: 'w2', name: 'Worker2' }),
      ];

      mockWorkerService.getAllWorkers.mockResolvedValue(mockWorkers);
      mockWorkerService.getWorkerHealthStatus.mockResolvedValue({ status: 'DEGRADED' });

      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getAllByText('DEGRADED').length).toBe(2);
      });
    });

    it('should show active task count for each worker', async () => {
      const mockWorkers = [mockDataGenerators.worker({ id: 'w1', name: 'Worker1' })];

      mockWorkerService.getAllWorkers.mockResolvedValue(mockWorkers);
      mockWorkerService.getWorkerStats.mockResolvedValue({
        active_tasks: 5, completed_tasks: 10, failed_tasks: 1,
        success_rate: 90, avg_task_duration: 120,
      });

      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Worker Status States', () => {
    it('should display different status indicators for each state', async () => {
      const mockWorkers = [
        mockDataGenerators.worker({ id: 'w1', status: 'IDLE' }),
        mockDataGenerators.worker({ id: 'w2', status: 'ACTIVE' }),
        mockDataGenerators.worker({ id: 'w3', status: 'RESTING' }),
        mockDataGenerators.worker({ id: 'w4', status: 'OFFLINE' }),
      ];

      mockWorkerService.getAllWorkers.mockResolvedValue(mockWorkers);

      render(<WorkerStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('IDLE')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('RESTING')).toBeInTheDocument();
        expect(screen.getByText('OFFLINE')).toBeInTheDocument();
      });
    });
  });
});
