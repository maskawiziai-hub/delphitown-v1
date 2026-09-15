// ============================================================================
// RateLimitDisplay Component - Shows quota status and usage
// ============================================================================

import React, { useState, useEffect } from 'react';
import { RateLimitCheckResult, TaskType } from '../../types';
import * as rateLimitService from '../../services/rateLimitService';
import { useSubscribeToRateLimitChanges } from '../../services/useRealtimeSubscription';

interface RateLimitDisplayProps {
  citizenId: string;
  taskType: TaskType;
  showRefresh?: boolean;
}

export const RateLimitDisplay: React.FC<RateLimitDisplayProps> = ({
  citizenId,
  taskType,
  showRefresh = true,
}) => {
  const [quotaInfo, setQuotaInfo] = useState<RateLimitCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchQuota = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await rateLimitService.checkRateLimit({
        citizen_id: citizenId,
        task_type: taskType,
      });

      setQuotaInfo(result);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quota';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    void fetchQuota();
  }, [citizenId, taskType]);

  // Subscribe to realtime changes
  useSubscribeToRateLimitChanges(citizenId, () => {
    // Re-fetch on realtime update
    void fetchQuota();
  });

  const getProgressPercentage = (remaining: number, used: number): number => {
    const total = remaining + used;
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  const getStatusColor = (allowed: boolean, percentage: number): string => {
    if (!allowed) return 'critical';
    if (percentage < 20) return 'danger';
    if (percentage < 50) return 'warning';
    return 'success';
  };

  if (isLoading && !quotaInfo) {
    return (
      <div className="rate-limit-display loading">
        <small>Loading quota...</small>
      </div>
    );
  }

  if (error && !quotaInfo) {
    return (
      <div className="rate-limit-display error">
        <small>⚠️ {error}</small>
      </div>
    );
  }

  if (!quotaInfo) {
    return null;
  }

  // Calculate percentages based on remaining vs used
  // Note: This assumes quotaInfo includes hourly_used and daily_used from the service
  // Fallback: if not available, show 0% when exceeded, 100% when available
  const hourlyPercentage = (quotaInfo as any).hourly_used !== undefined
    ? getProgressPercentage(quotaInfo.hourly_remaining, (quotaInfo as any).hourly_used)
    : quotaInfo.hourly_remaining > 0 ? 100 : 0;

  const dailyPercentage = (quotaInfo as any).daily_used !== undefined
    ? getProgressPercentage(quotaInfo.daily_remaining, (quotaInfo as any).daily_used)
    : quotaInfo.daily_remaining > 0 ? 100 : 0;

  const hourlyStatus = getStatusColor(quotaInfo.allowed, hourlyPercentage);
  const dailyStatus = getStatusColor(quotaInfo.allowed, dailyPercentage);

  const resetTime = new Date(quotaInfo.resets_at);
  const timeUntilReset = Math.max(0, resetTime.getTime() - Date.now());
  const minutesUntilReset = Math.ceil(timeUntilReset / 60000);

  return (
    <div className={`rate-limit-display ${quotaInfo.allowed ? 'allowed' : 'exceeded'}`}>
      <div className="quota-header">
        <strong>Rate Limit: {taskType}</strong>
        {showRefresh && (
          <button
            onClick={() => void fetchQuota()}
            disabled={isLoading}
            className="refresh-button"
            title="Refresh quota status"
          >
            {isLoading ? '⟳' : '↻'}
          </button>
        )}
      </div>

      <div className="quota-content">
        <div className="quota-row">
          <div className="quota-label">
            <span>Hourly</span>
            <span className={`quota-status ${hourlyStatus}`}>
              {quotaInfo.hourly_remaining} remaining
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${hourlyStatus}`}
              style={{ width: `${hourlyPercentage}%` }}
            />
          </div>
        </div>

        <div className="quota-row">
          <div className="quota-label">
            <span>Daily</span>
            <span className={`quota-status ${dailyStatus}`}>
              {quotaInfo.daily_remaining} remaining
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${dailyStatus}`}
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
        </div>

        <div className="quota-info">
          {quotaInfo.allowed ? (
            <small>✓ Quota available - Resets in {minutesUntilReset}m</small>
          ) : (
            <small>✗ Quota exceeded - {quotaInfo.reason}</small>
          )}
        </div>
      </div>

      {lastRefresh && (
        <div className="quota-footer">
          <small>Last refresh: {lastRefresh.toLocaleTimeString()}</small>
        </div>
      )}
    </div>
  );
};

export default RateLimitDisplay;
