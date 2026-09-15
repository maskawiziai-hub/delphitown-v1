// ============================================================================
// CitizenStatusWidget Integration Tests
// Tests: Widget + Hook + Service working together with realtime updates
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CitizenStatusWidget } from '@/components/widgets/CitizenStatusWidget';
import * as citizenService from '@/services/citizenService';
import { simulateSubscriptionPayload, resetSupabaseMocks } from '@/__tests__/mocks';
import { mockDataGenerators } from '@/__tests__/utils/testHelpers';

// This mock was missing entirely, so the real useSubscribeToCitizenChanges hook
// ran against the real Supabase client and simulateSubscriptionPayload could
// never reach it. That is why the realtime tests failed here but not elsewhere.
vi.mock('@/services/supabaseClient', async () => {
  const { mockSupabaseClient } = await import('@/__tests__/mocks');
  return { supabase: mockSupabaseClient };
});

vi.mock('@/services/citizenService', () => ({
  getAllCitizens: vi.fn(),
  getCitizenById: vi.fn(),
  getCitizenStats: vi.fn(),
  getCitizenHealthStatus: vi.fn(),
}));

const mockCitizenService = citizenService as any;

describe('CitizenStatusWidget - Integration Tests', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // The widget calls these for every worker it renders. Without defaults they
    // return undefined and the component throws mid-render.
    mockCitizenService.getCitizenStats.mockResolvedValue({
      active_tasks: 0, completed_tasks: 0, failed_tasks: 0,
      success_rate: 0, avg_task_duration: 0,
    });
    mockCitizenService.getCitizenHealthStatus.mockResolvedValue({ status: 'HEALTHY' });
  });

  describe('Initial Load & Display', () => {
    it('should render loading state while fetching workers', () => {
      mockCitizenService.getAllCitizens.mockImplementation(() => new Promise(() => {}));

      render(<CitizenStatusWidget />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display worker list after loading', async () => {
      const mockCitizens = [
        mockDataGenerators.citizen({ id: 'w1', name: 'Astra', status: 'IDLE' }),
        mockDataGenerators.citizen({ id: 'w2', name: 'Bron', status: 'ACTIVE' }),
      ];

      mockCitizenService.getAllCitizens.mockResolvedValue(mockCitizens);

      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('Astra')).toBeInTheDocument();
        expect(screen.getByText('Bron')).toBeInTheDocument();
      });
    });

    it('should display error state on load failure', async () => {
      mockCitizenService.getAllCitizens.mockRejectedValue(new Error('Failed to load'));

      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Realtime Citizen Status Updates', () => {
    beforeEach(() => {
      const initialCitizens = [
        mockDataGenerators.citizen({ id: 'w1', name: 'Astra', status: 'IDLE' }),
      ];
      mockCitizenService.getAllCitizens.mockResolvedValue(initialCitizens);
    });

    it('should update worker status when subscription receives change', async () => {
      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('IDLE')).toBeInTheDocument();
      });

      // Simulate worker status change via subscription
      const updatedCitizen = mockDataGenerators.citizen({
        id: 'w1',
        name: 'Astra',
        status: 'ACTIVE',
      });

      // The widget refetches on change, so the service must reflect the new state.
      mockCitizenService.getAllCitizens.mockResolvedValue([updatedCitizen]);

      simulateSubscriptionPayload({
        eventType: 'UPDATE',
        new: updatedCitizen,
        old: mockDataGenerators.citizen({ id: 'w1', status: 'IDLE' }),
      });

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.queryByText('IDLE')).not.toBeInTheDocument();
      });
    });

    it('should add new worker when subscription receives INSERT', async () => {
      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('Astra')).toBeInTheDocument();
      });

      const newCitizen = mockDataGenerators.citizen({
        id: 'w2',
        name: 'Bron',
        status: 'IDLE',
      });

      // Same here: the refetch is the mechanism, so the service must now
      // return both workers.
      mockCitizenService.getAllCitizens.mockResolvedValue([
        mockDataGenerators.citizen({ id: 'w1', name: 'Astra', status: 'IDLE' }),
        newCitizen,
      ]);

      simulateSubscriptionPayload({
        eventType: 'INSERT',
        new: newCitizen,
        old: null,
      });

      await waitFor(() => {
        expect(screen.getByText('Bron')).toBeInTheDocument();
      });
    });
  });

  describe('Health Metrics Display', () => {
    it('should display health status for each worker', async () => {
      const mockCitizens = [
        mockDataGenerators.citizen({ id: 'w1', name: 'Worker1' }),
        mockDataGenerators.citizen({ id: 'w2', name: 'Worker2' }),
      ];

      mockCitizenService.getAllCitizens.mockResolvedValue(mockCitizens);
      mockCitizenService.getCitizenHealthStatus.mockResolvedValue({ status: 'DEGRADED' });

      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getAllByText('DEGRADED').length).toBe(2);
      });
    });

    it('should show active task count for each worker', async () => {
      const mockCitizens = [mockDataGenerators.citizen({ id: 'w1', name: 'Worker1' })];

      mockCitizenService.getAllCitizens.mockResolvedValue(mockCitizens);
      mockCitizenService.getCitizenStats.mockResolvedValue({
        active_tasks: 5, completed_tasks: 10, failed_tasks: 1,
        success_rate: 90, avg_task_duration: 120,
      });

      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('Citizen Status States', () => {
    it('should display different status indicators for each state', async () => {
      const mockCitizens = [
        mockDataGenerators.citizen({ id: 'w1', status: 'IDLE' }),
        mockDataGenerators.citizen({ id: 'w2', status: 'ACTIVE' }),
        mockDataGenerators.citizen({ id: 'w3', status: 'RESTING' }),
        mockDataGenerators.citizen({ id: 'w4', status: 'OFFLINE' }),
      ];

      mockCitizenService.getAllCitizens.mockResolvedValue(mockCitizens);

      render(<CitizenStatusWidget />);

      await waitFor(() => {
        expect(screen.getByText('IDLE')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('RESTING')).toBeInTheDocument();
        expect(screen.getByText('OFFLINE')).toBeInTheDocument();
      });
    });
  });
});
