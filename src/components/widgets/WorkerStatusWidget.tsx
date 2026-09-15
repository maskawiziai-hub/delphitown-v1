// ============================================================================
// WorkerStatusWidget Component - Displays worker health and status
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Worker, WorkerHealthStatus } from '../../types';
import * as workerService from '../../services/workerService';
import { useSubscribeToWorkerChanges } from '../../services/useRealtimeSubscription';

interface WorkerStatusWidgetProps {
  workerId?: string; // If provided, shows single worker; if not, shows all
}

interface WorkerWithStats extends Worker {
  stats?: {
    active_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    success_rate: number;
    avg_task_duration: number;
  };
  health?: WorkerHealthStatus;
}

export const WorkerStatusWidget: React.FC<WorkerStatusWidgetProps> = ({ workerId }) => {
  const [workers, setWorkers] = useState<WorkerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let workerList: Worker[];

      if (workerId) {
        const worker = await workerService.getWorkerById(workerId);
        workerList = worker ? [worker] : [];
      } else {
        workerList = await workerService.getAllWorkers();
      }

      const withStats = await Promise.all(
        workerList.map(async (worker): Promise<WorkerWithStats> => {
          const stats = await workerService.getWorkerStats(worker.id);
          const health = await workerService.getWorkerHealthStatus(worker.id);

          return {
            ...worker,
            stats: stats || undefined,
            health: health?.status,
          };
        })
      );

      setWorkers(withStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workers';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    void loadWorkerData();
  }, [loadWorkerData]);

  // Hooks must be called unconditionally at the top level of the component.
  // This was previously called inside a useEffect and guarded by
  // `if (!workerId) return;`, which (a) violated the Rules of Hooks and
  // (b) meant the list view - the main use of this widget - never subscribed
  // to anything, so realtime updates silently never arrived.
  const handleWorkerChange = useCallback(() => {
    void loadWorkerData();
  }, [loadWorkerData]);

  const subscription = useSubscribeToWorkerChanges(handleWorkerChange);

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

  // Vocabulary matches the citizens.status CHECK constraint in the database.
  // The previous version tested for 'active'/'inactive', which are not valid
  // values anywhere in the schema, so every worker rendered the same fallback.
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
      <div className="worker-status-widget loading">
        <h3>Worker Status</h3>
        <p>Loading workers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="worker-status-widget error">
        <h3>Worker Status</h3>
        <p>⚠️ {error}</p>
        <button onClick={() => void loadWorkerData()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="worker-status-widget">
      <div className="widget-header">
        <h3>Worker Status</h3>
        <button onClick={() => void loadWorkerData()} className="refresh-button">
          ↻
        </button>
      </div>

      {workers.length === 0 ? (
        <p className="empty-state">No workers found</p>
      ) : (
        <div className="workers-list">
          {workers.map(worker => (
            <div key={worker.id} className="worker-card">
              <div className="worker-header">
                <strong>{worker.name}</strong>
                <span className="status-badge">{getStatusBadge(worker.status)}</span>
                <span className="status-text">{worker.status}</span>
              </div>

              <div className="worker-info">
                <small>
                  <div>Type: {worker.worker_type}</div>
                  <div>Version: v{worker.version}</div>
                  <div>Max concurrent: {worker.max_concurrent_tasks}</div>
                </small>
              </div>

              {worker.stats && (
                <div className="worker-stats">
                  <div className="stat">
                    <span className="stat-label">Active:</span>
                    <span className="stat-value">{worker.stats.active_tasks}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value">{worker.stats.completed_tasks}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-value">{worker.stats.failed_tasks}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Success Rate:</span>
                    <span className="stat-value">{worker.stats.success_rate}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Avg Duration:</span>
                    <span className="stat-value">{worker.stats.avg_task_duration}s</span>
                  </div>
                </div>
              )}

              {worker.health && (
                <div className={`health-badge ${getHealthColor(worker.health)}`}>
                  {worker.health}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerStatusWidget;
