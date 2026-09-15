// ============================================================================
// RevenueAggregationWidget Component - Displays revenue stats and insights
// ============================================================================

import React, { useState, useEffect } from 'react';
import { RevenueAggregation, RevenueStats } from '../../types';
import * as revenueService from '../../services/revenueService';
import { useSubscribeToRevenueChanges } from '../../services/useRealtimeSubscription';

interface RevenueAggregationWidgetProps {
  citizenId?: string;
  viewType?: 'summary' | 'by-citizen' | 'by-task-type' | 'by-date';
}

export const RevenueAggregationWidget: React.FC<RevenueAggregationWidgetProps> = ({
  citizenId,
  viewType = 'summary',
}) => {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [aggregations, setAggregations] = useState<RevenueAggregation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState(viewType);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const summary = await revenueService.getRevenueSummary();
      setStats(summary);

      let aggs: RevenueAggregation[] = [];

      switch (activeView) {
        case 'by-citizen':
          aggs = await revenueService.getRevenueAggregationByCitizen();
          break;
        case 'by-task-type':
          aggs = await revenueService.getRevenueAggregationByTaskType();
          break;
        case 'by-date':
          aggs = await revenueService.getRevenueAggregationByDate();
          break;
        case 'summary':
        default:
          break;
      }

      setAggregations(aggs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load revenue data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeView, citizenId]);

  // Subscribe to revenue changes
  useSubscribeToRevenueChanges(() => {
    loadData();
  });

  const formatCurrency = (amount: number | null | undefined): string => {
    // A single missing/null figure must not take down the whole list render.
    const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    // Thousands separators - $1234567.89 is not readable at a glance.
    return `$${safe.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTopContributor = (): RevenueAggregation | null => {
    if (aggregations.length === 0) return null;
    return aggregations.reduce((max, current) =>
      current.total_amount > max.total_amount ? current : max
    );
  };

  if (isLoading && !stats) {
    return (
      <div className="revenue-aggregation-widget loading">
        <h3>Revenue Analytics</h3>
        <p>Loading revenue data...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="revenue-aggregation-widget error">
        <h3>Revenue Analytics</h3>
        <p>⚠️ {error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  const topContributor = getTopContributor();

  return (
    <div className="revenue-aggregation-widget">
      <div className="widget-header">
        <h3>Revenue Analytics</h3>
        <button onClick={loadData} className="refresh-button">
          ↻
        </button>
      </div>

      {stats && (
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{formatCurrency(stats.total_revenue)}</div>
            <small>{stats.total_transactions} transactions</small>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total Costs</div>
            <div className="stat-value cost">{formatCurrency(stats.total_costs)}</div>
            <small>API, COGS, fees</small>
          </div>

          <div className="stat-card">
            <div className="stat-label">Net Profit</div>
            <div
              className={`stat-value ${stats.net_revenue < 0 ? 'negative' : 'positive'}`}
            >
              {formatCurrency(stats.net_revenue)}
            </div>
            <small>{stats.profit_margin_pct.toFixed(1)}% margin</small>
          </div>

          <div className="stat-card">
            <div className="stat-label">Average Transaction</div>
            <div className="stat-value">{formatCurrency(stats.average_transaction)}</div>
            <small>Per task</small>
          </div>

          <div className="stat-card">
            <div className="stat-label">Average Daily</div>
            <div className="stat-value">{formatCurrency(stats.average_daily)}</div>
            <small>Daily average</small>
          </div>

          <div className="stat-card">
            <div className="stat-label">Active Citizens</div>
            <div className="stat-value">{stats.unique_citizens}</div>
            <small>Generating revenue</small>
          </div>
        </div>
      )}

      <div className="view-controls">
        <button
          className={activeView === 'summary' ? 'active' : ''}
          onClick={() => setActiveView('summary')}
        >
          Summary
        </button>
        <button
          className={activeView === 'by-citizen' ? 'active' : ''}
          onClick={() => setActiveView('by-citizen')}
        >
          By Citizen
        </button>
        <button
          className={activeView === 'by-task-type' ? 'active' : ''}
          onClick={() => setActiveView('by-task-type')}
        >
          By Task Type
        </button>
        <button
          className={activeView === 'by-date' ? 'active' : ''}
          onClick={() => setActiveView('by-date')}
        >
          By Date
        </button>
      </div>

      {activeView !== 'summary' && (
        <>
          {aggregations.length === 0 ? (
            <p className="empty-state">No data available</p>
          ) : (
            <div className="aggregations-list">
              {aggregations.slice(0, 10).map((agg, index) => (
                <div key={index} className="aggregation-item">
                  <div className="agg-name">
                    <span className="rank">#{index + 1}</span>
                    <strong>
                      {(agg as any).citizen_id ||
                        (agg as any).task_type ||
                        (agg as any).date ||
                        'Unknown'}
                    </strong>
                  </div>

                  <div className="agg-stats">
                    <div className="agg-stat">
                      <span className="label">Total:</span>
                      <span className="value">{formatCurrency(agg.total_amount)}</span>
                    </div>
                    <div className="agg-stat">
                      <span className="label">Transactions:</span>
                      <span className="value">{agg.transaction_count}</span>
                    </div>
                    <div className="agg-stat">
                      <span className="label">Average:</span>
                      <span className="value">{formatCurrency(agg.average_transaction)}</span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${
                          aggregations.length > 0
                            ? (agg.total_amount /
                                aggregations.reduce((sum, a) => sum + a.total_amount, 0)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {topContributor && (
            <div className="top-contributor">
              <small>
                🏆 Top:{' '}
                {(topContributor as any).citizen_id ||
                  (topContributor as any).task_type ||
                  'Unknown'}{' '}
                ({formatCurrency(topContributor.total_amount)})
              </small>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RevenueAggregationWidget;
