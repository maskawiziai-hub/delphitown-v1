// ============================================================================
// TaskForm Component - Queue new tasks with rate limit checking
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Task, TaskType, Citizen, Worker, QueueTaskInput, PRIORITY } from '../../types';
import * as taskService from '../../services/taskService';
import * as citizenService from '../../services/citizenService';
import * as workerService from '../../services/workerService';
import * as rateLimitService from '../../services/rateLimitService';

interface TaskFormProps {
  onTaskCreated?: (task: Task) => void;
  onError?: (error: string) => void;
  defaultCitizenId?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onTaskCreated,
  onError,
  defaultCitizenId,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<QueueTaskInput>>({
    citizen_id: defaultCitizenId || '',
    worker_id: '',
    task_type: 'hunt_collectible',
    priority: PRIORITY.MEDIUM,
  });

  // Data state
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [taskTypes] = useState<TaskType[]>([
    'hunt_collectible',
    'create_gta6_video',
    'farm_osrs_items',
    'source_dropship_products',
    'produce_lofi_track',
    'design_pixel_sprite',
    'create_pod_design',
  ]);

  // Rate limit state
  const [remainingQuota, setRemainingQuota] = useState<{
    hourly: number;
    daily: number;
    resets_at: string;
  } | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  // Load citizens on mount
  useEffect(() => {
    const loadCitizens = async () => {
      try {
        const activeCitizens = await citizenService.getAllCitizens('ACTIVE');
        setCitizens(activeCitizens);
      } catch (err) {
        console.error('Failed to load citizens:', err);
      }
    };

    void loadCitizens();
  }, []);

  // Load workers when citizen changes
  useEffect(() => {
    const loadWorkers = async () => {
      if (!formData.citizen_id) {
        setWorkers([]);
        setRemainingQuota(null);
        return;
      }

      try {
        const citizen = await citizenService.getCitizenById(formData.citizen_id);
        if (citizen) {
          const workerList = await workerService.getAllWorkers(citizen.worker_type);
          setWorkers(workerList.filter(w => w.status !== 'OFFLINE'));
        }
      } catch (err) {
        console.error('Failed to load workers:', err);
      }
    };

    void loadWorkers();
  }, [formData.citizen_id]);

  // Check rate limit when citizen or task type changes
  useEffect(() => {
    const checkQuota = async () => {
      if (!formData.citizen_id || !formData.task_type) {
        setRemainingQuota(null);
        return;
      }

      setIsCheckingQuota(true);
      try {
        const result = await rateLimitService.checkRateLimit({
          citizen_id: formData.citizen_id,
          task_type: formData.task_type,
          quantity: 1,
        });

        setRemainingQuota({
          hourly: result.hourly_remaining,
          daily: result.daily_remaining,
          resets_at: result.resets_at,
        });

        if (!result.allowed) {
          setError(`Quota exceeded. Resets at ${new Date(result.resets_at).toLocaleTimeString()}`);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to check quota:', err);
      } finally {
        setIsCheckingQuota(false);
      }
    };

    const timeoutId = setTimeout(checkQuota, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.citizen_id, formData.task_type]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.citizen_id) {
      setError('Please select a citizen');
      return false;
    }

    if (!formData.worker_id) {
      setError('Please select a worker');
      return false;
    }

    if (!formData.task_type) {
      setError('Please select a task type');
      return false;
    }

    if (remainingQuota && remainingQuota.hourly <= 0) {
      setError('Hourly quota exceeded');
      return false;
    }

    if (remainingQuota && remainingQuota.daily <= 0) {
      setError('Daily quota exceeded');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Type guard for citizen_id
    if (!formData.citizen_id) {
      setError('Please select a citizen');
      setIsLoading(false);
      return;
    }

    try {
      const newTask = await taskService.queueTask({
        citizen_id: formData.citizen_id,
        worker_id: formData.worker_id || '',
        task_type: formData.task_type as TaskType,
        priority: (formData.priority as any) || 'NORMAL',
      });

      // Record quota usage
      // Signature is (citizenId, quantity) - one run consumes one unit.
      await rateLimitService.recordQuotaUsage(formData.citizen_id, 1);

      setSuccess(`✓ Task queued: ${newTask.task_type}`);

      // Reset form
      setFormData({
        citizen_id: defaultCitizenId || '',
        worker_id: '',
        task_type: 'hunt_collectible',
        priority: PRIORITY.MEDIUM,
      });

      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to queue task';
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={e => void handleSubmit(e)} className="task-form">
      <fieldset disabled={isLoading}>
        <div className="form-group">
          <label htmlFor="citizen_id">Select Citizen</label>
          <select
            id="citizen_id"
            name="citizen_id"
            value={formData.citizen_id || ''}
            onChange={handleInputChange}
            required
          >
            <option value="">Choose a citizen...</option>
            {citizens.map(citizen => (
              <option key={citizen.id} value={citizen.id}>
                {citizen.name} ({citizen.citizen_type}) - ${citizen.revenue_lifetime}
              </option>
            ))}
          </select>
          <small>Select which citizen performs this task</small>
        </div>

        {workers.length > 0 && (
          <div className="form-group">
            <label htmlFor="worker_id">Select Worker</label>
            <select
              id="worker_id"
              name="worker_id"
              value={formData.worker_id || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose a worker...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} - v{worker.version} ({worker.status})
                </option>
              ))}
            </select>
            <small>Select the worker to execute this task</small>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="task_type">Task Type</label>
          <select
            id="task_type"
            name="task_type"
            value={formData.task_type}
            onChange={handleInputChange}
            required
          >
            {taskTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority || 'NORMAL'}
            onChange={handleInputChange}
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {isCheckingQuota && <small>Checking quota...</small>}
        {remainingQuota && (
          <div className="quota-info">
            <small>
              📊 Quota remaining: <strong>{remainingQuota.hourly}h</strong> / <strong>{remainingQuota.daily}d</strong>
              <br />
              Resets: {new Date(remainingQuota.resets_at).toLocaleTimeString()}
            </small>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          type="submit"
          disabled={isLoading || !formData.citizen_id || !formData.worker_id || isCheckingQuota}
          className="submit-button"
        >
          {isLoading ? 'Queueing task...' : 'Queue Task'}
        </button>
      </fieldset>
    </form>
  );
};

export default TaskForm;
