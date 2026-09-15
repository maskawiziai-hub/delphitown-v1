// ============================================================================
// TaskQueueWidget Component - Displays task queue and status
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, priorityLabel } from '../../types';
import * as taskService from '../../services/taskService';
import { useSubscribeToCitizenTaskQueue } from '../../services/useRealtimeSubscription';

interface TaskQueueWidgetProps {
  citizenId?: string;
  showFilters?: boolean;
}

export const TaskQueueWidget: React.FC<TaskQueueWidgetProps> = ({
  citizenId,
  showFilters = true,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define task update handler at component level to use in hook
  const handleTaskUpdate = useCallback(
    (payload: { eventType?: string; new?: Task | null; old?: Task | null }) => {
      const incoming = payload?.new;

      // DELETE events carry no `new` record, and a malformed payload should not
      // be merged into state. Either way there is nothing to apply.
      if (!incoming?.id) return;

      setTasks(prev => {
        const exists = prev.some(t => t.id === incoming.id);
        return exists
          ? prev.map(t => (t.id === incoming.id ? incoming : t))
          : [incoming, ...prev];
      });
    },
    []
  );

  const STATUS_COLORS: Record<TaskStatus, string> = {
    QUEUED: 'pending',
    RUNNING: 'active',
    COMPLETED: 'success',
    FAILED: 'danger',
    STUCK: 'warning',
    RETRYING: 'active',
    CANCELLED: 'muted',
    TIMEOUT: 'danger',
  };

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let taskList: Task[];

      if (citizenId) {
        taskList = await taskService.getCitizenTaskQueue(citizenId);
      } else {
        taskList = await taskService.getAllTasks();
      }

      setTasks(taskList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks based on status
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(t => t.status === statusFilter));
    }
  }, [tasks, statusFilter]);

  useEffect(() => {
    void loadTasks();
  }, [citizenId]);

  // Call hook at component level (unconditional) - hook handles undefined citizenId
  const unsubscribe = useSubscribeToCitizenTaskQueue(citizenId, handleTaskUpdate);

  // Cleanup subscription when it changes
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        void unsubscribe.unsubscribe();
      }
    };
  }, [unsubscribe]);

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString();
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getStatusEmoji = (status: TaskStatus): string => {
    const emojis: Record<TaskStatus, string> = {
      QUEUED: '⏳',
      RUNNING: '▶️',
      COMPLETED: '✅',
      FAILED: '❌',
      STUCK: '⚠️',
      RETRYING: '🔄',
      CANCELLED: '⊘',
      TIMEOUT: '⏱️',
    };
    return emojis[status] || '?';
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="task-queue-widget loading">
        <h3>Task Queue</h3>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="task-queue-widget error">
        <h3>Task Queue</h3>
        <p>⚠️ {error}</p>
        <button onClick={() => void loadTasks()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="task-queue-widget">
      <div className="widget-header">
        <h3>Task Queue</h3>
        <button onClick={() => void loadTasks()} className="refresh-button">
          ↻
        </button>
      </div>

      {showFilters && (
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="ALL">All Tasks</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="RETRYING">Retrying</option>
            <option value="STUCK">Stuck</option>
            <option value="TIMEOUT">Timeout</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <small>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </small>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <p className="empty-state">No tasks found</p>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-item status-${STATUS_COLORS[task.status]}`}
            >
              <div className="task-header">
                <span className="status-emoji">{getStatusEmoji(task.status)}</span>
                <strong>{task.task_type}</strong>
                <span
                  className={`priority-badge priority-${priorityLabel(
                    task.priority
                  ).toLowerCase()}`}
                >
                  {priorityLabel(task.priority)}
                </span>
                <span className="task-id">{task.id ? `${task.id.slice(0, 8)}...` : 'unknown'}</span>
              </div>

              <div className="task-details">
                <div className="detail">
                  <span className="label">Status:</span>
                  <span className="value">{task.status}</span>
                </div>
                <div className="detail">
                  <span className="label">Queued:</span>
                  <span className="value">{formatTime(task.queued_at)}</span>
                </div>
                {task.started_at && (
                  <div className="detail">
                    <span className="label">Started:</span>
                    <span className="value">{formatTime(task.started_at)}</span>
                  </div>
                )}
                {task.completed_at && (
                  <div className="detail">
                    <span className="label">Completed:</span>
                    <span className="value">{formatTime(task.completed_at)}</span>
                  </div>
                )}
                <div className="detail">
                  <span className="label">Duration:</span>
                  <span className="value">
                    {formatDuration(task.actual_duration_seconds)} / Est:{' '}
                    {formatDuration(task.estimated_duration_seconds)}
                  </span>
                </div>
              </div>

              {task.retry_count > 0 && (
                <div className="retry-info">
                  <small>
                    Retry {task.retry_count}/{task.max_retries}
                  </small>
                </div>
              )}

              {task.error_message && (
                <div className="error-info">
                  <small>Error: {task.error_message}</small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskQueueWidget;
