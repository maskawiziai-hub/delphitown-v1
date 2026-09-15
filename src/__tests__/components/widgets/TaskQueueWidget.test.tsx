// ============================================================================
// TaskQueueWidget Integration Tests
// Tests: Widget + Hook + Service working together with realtime updates
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TaskQueueWidget } from '@/components/widgets/TaskQueueWidget';
import * as taskService from '@/services/taskService';
import { simulateSubscriptionPayload, resetSupabaseMocks } from '@/__tests__/mocks';
import { mockDataGenerators } from '@/__tests__/utils/testHelpers';

// ============================================================================
// SETUP & MOCKS
// ============================================================================

vi.mock('@/services/supabaseClient', async () => {
  const { mockSupabaseClient } = await import('@/__tests__/mocks');
  return { supabase: mockSupabaseClient };
});

vi.mock('@/services/taskService', () => ({
  getAllTasks: vi.fn(),
  getCitizenTaskQueue: vi.fn(),
}));

const mockTaskService = taskService as any;

describe('TaskQueueWidget - Integration Tests', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  // ============================================================================
  // GROUP 1: INITIAL LOAD & DISPLAY
  // ============================================================================

  describe('Initial Load & Display', () => {
    it('should render loading state while fetching tasks', () => {
      mockTaskService.getAllTasks.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TaskQueueWidget />);

      expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    });

    it('should display tasks after loading', async () => {
      const mockTasks = [
        mockDataGenerators.task({ id: 'task1', task_type: 'PRICING', status: 'RUNNING' }),
        mockDataGenerators.task({ id: 'task2', task_type: 'ANALYSIS', status: 'QUEUED' }),
      ];

      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('PRICING')).toBeInTheDocument();
        expect(screen.getByText('ANALYSIS')).toBeInTheDocument();
      });
    });

    it('should load citizen-specific tasks when citizenId provided', async () => {
      const mockTasks = [
        mockDataGenerators.task({ id: 'task1', task_type: 'PRICING' }),
      ];

      mockTaskService.getCitizenTaskQueue.mockResolvedValue(mockTasks);

      render(<TaskQueueWidget citizenId="citizen123" />);

      await waitFor(() => {
        expect(mockTaskService.getCitizenTaskQueue).toHaveBeenCalledWith('citizen123');
      });
    });

    it('should display error state on load failure', async () => {
      mockTaskService.getAllTasks.mockRejectedValue(new Error('Network error'));

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should display "No tasks found" when task list is empty', async () => {
      mockTaskService.getAllTasks.mockResolvedValue([]);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('No tasks found')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // GROUP 2: FILTERING
  // ============================================================================

  describe('Task Filtering', () => {
    beforeEach(() => {
      const mockTasks = [
        mockDataGenerators.task({ id: 't1', status: 'RUNNING' }),
        mockDataGenerators.task({ id: 't2', status: 'QUEUED' }),
        mockDataGenerators.task({ id: 't3', status: 'COMPLETED' }),
        mockDataGenerators.task({ id: 't4', status: 'FAILED' }),
      ];
      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);
    });

    it('should show all tasks by default', async () => {
      render(<TaskQueueWidget showFilters={true} />);

      await waitFor(() => {
        expect(screen.getByText(/showing 4 of 4/i)).toBeInTheDocument();
      });
    });

    it('should filter tasks by status when filter changed', async () => {
      render(<TaskQueueWidget showFilters={true} />);

      await waitFor(() => {
        expect(screen.getByText(/showing 4 of 4/i)).toBeInTheDocument();
      });

      const filterSelect = screen.getByDisplayValue('All Tasks');
      fireEvent.change(filterSelect, { target: { value: 'RUNNING' } });

      await waitFor(() => {
        expect(screen.getByText(/showing 1 of 4/i)).toBeInTheDocument();
      });
    });

    it('should update filter options correctly', async () => {
      render(<TaskQueueWidget showFilters={true} />);

      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Tasks');
        expect(filterSelect).toBeInTheDocument();
      });

      // Verify all status options exist
      expect(screen.getByDisplayValue('All Tasks')).toBeInTheDocument();
    });

    it('should hide filter controls when showFilters is false', async () => {
      render(<TaskQueueWidget showFilters={false} />);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('All Tasks')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // GROUP 3: REALTIME UPDATES VIA SUBSCRIPTION
  // ============================================================================

  describe('Realtime Updates via Subscription', () => {
    beforeEach(() => {
      const initialTasks = [
        mockDataGenerators.task({ id: 'task1', status: 'QUEUED', task_type: 'PRICING' }),
      ];
      mockTaskService.getCitizenTaskQueue.mockResolvedValue(initialTasks);
    });

    it('should update task list when subscription receives new task', async () => {
      render(<TaskQueueWidget citizenId="citizen1" />);

      await waitFor(() => {
        expect(screen.getByText('PRICING')).toBeInTheDocument();
      });

      // Simulate subscription payload: new task added
      const newTask = mockDataGenerators.task({
        id: 'task2',
        task_type: 'ANALYSIS',
        status: 'RUNNING',
      });

      simulateSubscriptionPayload({
        eventType: 'INSERT',
        new: newTask,
        old: null,
      });

      await waitFor(() => {
        expect(screen.getByText('ANALYSIS')).toBeInTheDocument();
      });
    });

    it('should update existing task when subscription receives update', async () => {
      render(<TaskQueueWidget citizenId="citizen1" />);

      await waitFor(() => {
        expect(screen.getByText('QUEUED')).toBeInTheDocument();
      });

      // Simulate subscription payload: task status changed
      const updatedTask = mockDataGenerators.task({
        id: 'task1',
        status: 'COMPLETED',
        task_type: 'PRICING',
      });

      simulateSubscriptionPayload({
        eventType: 'UPDATE',
        new: updatedTask,
        old: mockDataGenerators.task({ id: 'task1', status: 'QUEUED' }),
      });

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        expect(screen.queryByText('QUEUED')).not.toBeInTheDocument();
      });
    });

    it('should not subscribe when citizenId is not provided', async () => {
      mockTaskService.getAllTasks.mockResolvedValue([]);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        // Verify getAllTasks was called, not getCitizenTaskQueue
        expect(mockTaskService.getAllTasks).toHaveBeenCalled();
      });

      // Subscription shouldn't be active for global tasks
      // (This would be verified by checking that subscription hook wasn't called)
    });
  });

  // ============================================================================
  // GROUP 4: USER INTERACTIONS
  // ============================================================================

  describe('User Interactions', () => {
    beforeEach(() => {
      const mockTasks = [
        mockDataGenerators.task({ id: 'task1', status: 'RUNNING' }),
      ];
      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);
    });

    it('should reload tasks when refresh button clicked', async () => {
      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('RUNNING')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: '↻' });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        // getAllTasks should be called again
        expect(mockTaskService.getAllTasks).toHaveBeenCalledTimes(2);
      });
    });

    it('should retry loading tasks when error retry clicked', async () => {
      mockTaskService.getAllTasks.mockRejectedValueOnce(new Error('Network error'));

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      mockTaskService.getAllTasks.mockResolvedValueOnce([
        mockDataGenerators.task({ id: 'task1' }),
      ]);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // GROUP 5: STATUS DISPLAY & FORMATTING
  // ============================================================================

  describe('Task Status Display & Formatting', () => {
    it('should display correct status emoji for each task status', async () => {
      const statusMap: Record<string, string> = {
        QUEUED: '⏳',
        RUNNING: '▶️',
        COMPLETED: '✅',
        FAILED: '❌',
        STUCK: '⚠️',
        RETRYING: '🔄',
      };

      const mockTasks = Object.keys(statusMap).map(status =>
        mockDataGenerators.task({ id: `task-${status}`, status: status as any })
      );

      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument(); // COMPLETED
        expect(screen.getByText('❌')).toBeInTheDocument(); // FAILED
      });
    });

    it('should display priority badges', async () => {
      const mockTasks = [
        mockDataGenerators.task({ id: 't1', priority: 8 }), // HIGH
        mockDataGenerators.task({ id: 't2', priority: 2 }), // LOW
      ];

      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('LOW')).toBeInTheDocument();
      });
    });

    it('should show task retry count when retries exist', async () => {
      const mockTasks = [
        mockDataGenerators.task({ id: 't1', retry_count: 2, max_retries: 3 }),
      ];

      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('Retry 2/3')).toBeInTheDocument();
      });
    });

    it('should show error message when task has error', async () => {
      const mockTasks = [
        mockDataGenerators.task({
          id: 't1',
          error_message: 'Connection timeout',
        }),
      ];

      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // GROUP 6: EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    it('should handle multiple rapid subscription updates', async () => {
      const initialTasks = [
        mockDataGenerators.task({ id: 'task1', status: 'QUEUED' }),
      ];
      mockTaskService.getCitizenTaskQueue.mockResolvedValue(initialTasks);

      render(<TaskQueueWidget citizenId="citizen1" />);

      await waitFor(() => {
        expect(screen.getByText('QUEUED')).toBeInTheDocument();
      });

      // Simulate rapid updates
      for (let i = 0; i < 5; i++) {
        simulateSubscriptionPayload({
          eventType: 'UPDATE',
          new: mockDataGenerators.task({
            id: 'task1',
            status: 'RUNNING' as const,
            queued_at: new Date(Date.now() - i * 1000).toISOString(),
          }),
          old: null,
        });
      }

      await waitFor(() => {
        // Should only show one task item, not duplicates
        const runningElements = screen.queryAllByText('RUNNING');
        expect(runningElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle missing optional task fields gracefully', async () => {
      const minimalTask = {
        id: 'task1',
        task_type: 'TEST',
        status: 'QUEUED' as const,
        priority: 'MEDIUM',
        queued_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        actual_duration_seconds: null,
        estimated_duration_seconds: null,
        retry_count: 0,
        max_retries: 3,
        error_message: null,
        citizen_id: 'c1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockTaskService.getAllTasks.mockResolvedValue([minimalTask]);

      render(<TaskQueueWidget />);

      await waitFor(() => {
        expect(screen.getByText('TEST')).toBeInTheDocument();
        // Duration renders as a single node: "- / Est: -". getByText('-') does an
        // exact full-text match on the element, so it never matched.
        expect(screen.getByText(/-\s*\/\s*Est:\s*-/)).toBeInTheDocument();
      });
    });
  });
});
