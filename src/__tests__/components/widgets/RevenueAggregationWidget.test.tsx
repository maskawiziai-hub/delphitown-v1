// ============================================================================
// RevenueAggregationWidget Integration Tests
// Widget + realtime hook + service, exercised against the REAL service contract.
//
// Rewritten 2026-09-15. The previous version asserted on total_expenses,
// net_revenue, profit margin, breakdown_by_source, expense_breakdown and time
// period filtering. None of those exist in getRevenueSummary() or in the
// component - they were invented by the test and could never have passed.
// See DELPHITOWN_ROADMAP_V2 for the expense/net-revenue capability gap.
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RevenueAggregationWidget } from '@/components/widgets/RevenueAggregationWidget';
import * as revenueService from '@/services/revenueService';
import { simulateSubscriptionPayload, resetSupabaseMocks } from '@/__tests__/mocks';
import { mockDataGenerators } from '@/__tests__/utils/testHelpers';

vi.mock('@/services/supabaseClient', async () => {
  const { mockSupabaseClient } = await import('@/__tests__/mocks');
  return { supabase: mockSupabaseClient };
});

// Every function the component calls must be mocked, or it is undefined at
// call time and the component throws mid-render.
vi.mock('@/services/revenueService', () => ({
  getRevenueSummary: vi.fn(),
  getRevenueAggregationByCitizen: vi.fn(),
  getRevenueAggregationByTaskType: vi.fn(),
  getRevenueAggregationByDate: vi.fn(),
  getPnLByStream: vi.fn(),
}));

const mockRevenueService = revenueService as any;

describe('RevenueAggregationWidget', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockRevenueService.getRevenueAggregationByCitizen.mockResolvedValue([]);
    mockRevenueService.getRevenueAggregationByTaskType.mockResolvedValue([]);
    mockRevenueService.getRevenueAggregationByDate.mockResolvedValue([]);
    mockRevenueService.getPnLByStream.mockResolvedValue([]);
  });

  describe('Initial Load & Display', () => {
    it('should render loading state while fetching revenue data', () => {
      mockRevenueService.getRevenueSummary.mockImplementation(
        () => new Promise(() => {})
      );

      render(<RevenueAggregationWidget />);

      expect(screen.getByText(/loading revenue data/i)).toBeInTheDocument();
    });

    it('should display the summary figures after loading', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({
          total_revenue: 1500,
          total_transactions: 12,
          average_transaction: 125,
          average_daily: 250,
          unique_citizens: 3,
        })
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      });
      expect(screen.getByText('$125.00')).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('12 transactions')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display costs, net profit and margin', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({
          total_revenue: 1500,
          total_costs: 300,
          net_revenue: 1200,
          profit_margin_pct: 80,
          average_daily: 250,
        })
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('$250.00')).toBeInTheDocument();
      });
      expect(screen.getByText('$1,200.00')).toBeInTheDocument();
      expect(screen.getByText('80.0% margin')).toBeInTheDocument();
    });

    it('should show a negative net profit when costs exceed revenue', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({
          total_revenue: 100,
          total_costs: 250,
          net_revenue: -150,
          profit_margin_pct: -150,
        })
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('$-150.00')).toBeInTheDocument();
      });
    });

    it('should label each summary card', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary()
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });
      expect(screen.getByText('Total Costs')).toBeInTheDocument();
      expect(screen.getByText('Net Profit')).toBeInTheDocument();
      expect(screen.getByText('Average Transaction')).toBeInTheDocument();
      expect(screen.getByText('Average Daily')).toBeInTheDocument();
      expect(screen.getByText('Active Citizens')).toBeInTheDocument();
    });

    it('should display error state on load failure', async () => {
      mockRevenueService.getRevenueSummary.mockRejectedValue(
        new Error('Service unavailable')
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Realtime Updates', () => {
    it('should refresh totals when a revenue change arrives', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({ total_revenue: 1000 })
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      });

      // The widget refetches on a subscription event, so the service must
      // reflect the new state before the event is simulated.
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({ total_revenue: 2000 })
      );

      simulateSubscriptionPayload({
        eventType: 'INSERT',
        new: { id: 'r1', amount: 1000 },
        old: null,
      });

      await waitFor(() => {
        expect(screen.getByText('$2,000.00')).toBeInTheDocument();
      });
    });
  });

  describe('Aggregation Views', () => {
    it('should load by-citizen aggregations when that view is selected', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary()
      );
      mockRevenueService.getRevenueAggregationByCitizen.mockResolvedValue([
        { citizen_id: 'citizen-a', total_amount: 900, transaction_count: 4, average_transaction: 225 },
        { citizen_id: 'citizen-b', total_amount: 300, transaction_count: 2, average_transaction: 150 },
      ]);

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /by citizen/i }));

      await waitFor(() => {
        expect(mockRevenueService.getRevenueAggregationByCitizen).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.getByText('citizen-a')).toBeInTheDocument();
      });
    });

    it('should show an empty state when a view has no data', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary()
      );
      mockRevenueService.getRevenueAggregationByTaskType.mockResolvedValue([]);

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /by task type/i }));

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Per-business P&L', () => {
    it('should show revenue, costs, net and margin for each business stream', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary()
      );
      mockRevenueService.getPnLByStream.mockResolvedValue([
        {
          business_stream: 'collectibles',
          total_revenue: 800,
          total_costs: 280,
          net_revenue: 520,
          profit_margin_pct: 65,
          transaction_count: 2,
          citizen_count: 1,
        },
      ]);

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /by business/i }));

      await waitFor(() => {
        expect(screen.getByText('collectibles')).toBeInTheDocument();
      });
      expect(screen.getByText('$800.00')).toBeInTheDocument();
      expect(screen.getByText('-$280.00')).toBeInTheDocument();
      expect(screen.getByText('$520.00')).toBeInTheDocument();
      expect(screen.getByText('65.0%')).toBeInTheDocument();
    });

    it('should surface a stream that is losing money', async () => {
      // The whole point of tracking costs per stream: gross revenue would
      // show this venture "earning $120" while it is actually down $60.
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary()
      );
      mockRevenueService.getPnLByStream.mockResolvedValue([
        {
          business_stream: 'lofi',
          total_revenue: 120,
          total_costs: 180,
          net_revenue: -60,
          profit_margin_pct: -50,
          transaction_count: 1,
          citizen_count: 1,
        },
      ]);

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /by business/i }));

      await waitFor(() => {
        expect(screen.getByText('lofi')).toBeInTheDocument();
      });

      const net = screen.getByText('$-60.00');
      expect(net).toBeInTheDocument();
      expect(net.className).toContain('negative');
    });

    it('should show an empty state when no business data exists', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary()
      );
      mockRevenueService.getPnLByStream.mockResolvedValue([]);

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /by business/i }));

      await waitFor(() => {
        expect(screen.getByText(/no business data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero revenue gracefully', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({
          total_revenue: 0,
          total_transactions: 0,
          average_transaction: 0,
          average_daily: 0,
          unique_citizens: 0,
        })
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
      });
    });

    it('should format large numbers with thousands separators', async () => {
      mockRevenueService.getRevenueSummary.mockResolvedValue(
        mockDataGenerators.revenueSummary({ total_revenue: 1234567.89 })
      );

      render(<RevenueAggregationWidget />);

      await waitFor(() => {
        expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
      });
    });
  });
});
