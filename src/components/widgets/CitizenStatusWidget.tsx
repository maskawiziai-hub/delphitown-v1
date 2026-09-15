// ============================================================================
// CitizenStatusWidget - health and run statistics for deployed citizens.
//
// Renamed from WorkerStatusWidget when `workers` was merged into `citizens`
// (migration 0012). A citizen IS the deployed worker; there is no separate
// worker entity to show.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Citizen, CitizenStats, WorkerHealthStatus } from '../../types';
import * as citizenService from '../../services/citizenService';
import { useSubscribeToCitizenChanges } from '../../services/useRealtimeSubscription';

interface CitizenStatusWidgetProps {
  /** Show one citizen; omit to show all. */
  citizenId?: string;
}

interface CitizenWithStats extends Citizen {
  stats?: CitizenStats;
  health?: WorkerHealthStatus;
}

export const CitizenStatusWidget: React.FC<CitizenStatusWidgetProps> = ({
  citizenId,
}) => {
  const [citizens, setCitizens] = useState<CitizenWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCitizenData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let list: Citizen[];

      if (citizenId) {
        const one = await citizenService.getCitizenById(citizenId);
        list = one ? [one] : [];
      } else {
        list = await citizenService.getAllCitizens();
      }

      const withStats = await Promise.all(
        list.map(async (citizen): Promise<CitizenWithStats> => {
          const stats = await citizenService.getCitizenStats(citizen.id);
          const health = await citizenService.getCitizenHealthStatus(citizen.id);

          return {
            ...citizen,
            stats: stats || undefined,
            health: health?.status,
          };
        })
      );

      setCitizens(withStats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load citizens';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [citizenId]);

  useEffect(() => {
    void loadCitizenData();
  }, [loadCitizenData]);

  // Hooks are called unconditionally at the top level. The previous version
  // called this inside a useEffect guarded by `if (!citizenId) return`, which
  // broke the Rules of Hooks AND meant the list view never subscribed at all.
  const handleCitizenChange = useCallback(() => {
    void loadCitizenData();
  }, [loadCitizenData]);

  const subscription = useSubscribeToCitizenChanges(handleCitizenChange);

  useEffect(() => {
    return () => {
      if (subscription) {
        void subscription.unsubscribe();
      }
    };
  }, [subscription]);

  const getHealthColor = (status?: WorkerHealthStatus): string => {
    switch (status) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'CRITICAL':
        return 'danger';
      case 'OFFLINE':
        return 'offline';
      default:
        return 'unknown';
    }
  };

  // Vocabulary matches the citizens.status CHECK constraint. The previous
  // version tested for 'active'/'inactive', which exist nowhere in the schema,
  // so every citizen rendered the same fallback badge.
  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return '🟢';
      case 'IDLE':
        return '⚪';
      case 'RESTING':
        return '🌙';
      case 'OFFLINE':
        return '🔴';
      case 'BANNED':
        return '⛔';
      default:
        return '❔';
    }
  };

  if (isLoading) {
    return (
      <div className="citizen-status-widget loading">
        <h3>Citizen Status</h3>
        <p>Loading citizens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="citizen-status-widget error">
        <h3>Citizen Status</h3>
        <p>⚠️ {error}</p>
        <button onClick={() => void loadCitizenData()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="citizen-status-widget">
      <div className="widget-header">
        <h3>Citizen Status</h3>
        <button onClick={() => void loadCitizenData()} className="refresh-button">
          ↻
        </button>
      </div>

      {citizens.length === 0 ? (
        <p className="empty-state">No citizens found</p>
      ) : (
        <div className="citizens-list">
          {citizens.map(citizen => (
            <div key={citizen.id} className="citizen-card">
              <div className="citizen-header">
                <strong>{citizen.name}</strong>
                <span className="status-badge">{getStatusBadge(citizen.status)}</span>
                <span className="status-text">{citizen.status}</span>
              </div>

              <div className="citizen-info">
                <small>
                  <div>Type: {citizen.worker_type}</div>
                  <div>Version: v{citizen.version}</div>
                  <div>Max concurrent: {citizen.max_concurrent_tasks}</div>
                </small>
              </div>

              {citizen.stats && (
                <div className="citizen-stats">
                  <div className="stat">
                    <span className="stat-label">Active:</span>
                    <span className="stat-value">{citizen.stats.active_tasks}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value">{citizen.stats.completed_tasks}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-value">{citizen.stats.failed_tasks}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Success Rate:</span>
                    <span className="stat-value">{citizen.stats.success_rate}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Avg Duration:</span>
                    <span className="stat-value">{citizen.stats.avg_task_duration}s</span>
                  </div>
                </div>
              )}

              <div className={`health-badge ${getHealthColor(citizen.health)}`}>
                {citizen.health ?? 'UNKNOWN'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenStatusWidget;
