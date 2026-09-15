import React, { useState, useEffect, useRef } from 'react';
import { globalLogger, MemoryBackend } from '@/utils/logger';
import { globalMetrics } from '@/utils/metrics';
import { globalErrorTracker } from '@/utils/errorTracking';
import { globalHealthMonitor } from '@/utils/subscriptionRecovery';

export interface MonitoringDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Real-time monitoring dashboard
 * Displays logs, metrics, errors, and subscription health
 */
export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'errors' | 'health'>('metrics');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const refresh = () => {
      updateDashboard();
    };

    refreshTimerRef.current = setInterval(refresh, refreshInterval);
    updateDashboard();

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  /**
   * Update all dashboard data
   */
  const updateDashboard = () => {
    // Update metrics
    const snapshot = globalMetrics.snapshot();
    setMetrics(snapshot.metrics.slice(-20)); // Last 20 metrics

    // Update logs
    const memoryBackend = (globalLogger as any).backends?.find(
      (b: any) => b instanceof MemoryBackend
    );
    if (memoryBackend) {
      const entries = memoryBackend.getEntries();
      setLogs(entries.slice(-50)); // Last 50 logs
    }

    // Update errors
    const errorStats = globalErrorTracker.getStats();
    setErrors(errorStats.mostRecent);

    // Update health
    const healthStats = globalHealthMonitor.getSystemHealth();
    setHealth(healthStats);
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Monitoring Dashboard</h2>
        <div style={styles.controls}>
          <button onClick={updateDashboard} style={styles.button}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('metrics')}
          style={{
            ...styles.tab,
            ...(activeTab === 'metrics' ? styles.tabActive : {}),
          }}
        >
          📈 Metrics
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            ...styles.tab,
            ...(activeTab === 'logs' ? styles.tabActive : {}),
          }}
        >
          📝 Logs
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          style={{
            ...styles.tab,
            ...(activeTab === 'errors' ? styles.tabActive : {}),
          }}
        >
          ❌ Errors
        </button>
        <button
          onClick={() => setActiveTab('health')}
          style={{
            ...styles.tab,
            ...(activeTab === 'health' ? styles.tabActive : {}),
          }}
        >
          💚 Health
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'metrics' && <MetricsView metrics={metrics} />}
        {activeTab === 'logs' && <LogsView logs={logs} />}
        {activeTab === 'errors' && <ErrorsView errors={errors} />}
        {activeTab === 'health' && <HealthView health={health} />}
      </div>
    </div>
  );
};

/**
 * Metrics view component
 */
const MetricsView: React.FC<{ metrics: any[] }> = ({ metrics }) => {
  return (
    <div style={styles.view}>
      <h3 style={styles.viewTitle}>Performance Metrics</h3>
      {metrics.length === 0 ? (
        <p style={styles.empty}>No metrics collected yet</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>Metric</th>
              <th style={styles.tableCell}>Value</th>
              <th style={styles.tableCell}>Type</th>
              <th style={styles.tableCell}>Time</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => (
              <tr key={idx} style={styles.tableRow}>
                <td style={styles.tableCell}>{metric.name}</td>
                <td style={{ ...styles.tableCell, ...styles.metricValue }}>
                  {metric.value.toFixed(2)}
                </td>
                <td style={styles.tableCell}>
                  <span style={getMetricTypeBadgeStyle(metric.type)}>{metric.type}</span>
                </td>
                <td style={styles.tableCell}>{new Date(metric.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/**
 * Logs view component
 */
const LogsView: React.FC<{ logs: any[] }> = ({ logs }) => {
  return (
    <div style={styles.view}>
      <h3 style={styles.viewTitle}>Application Logs</h3>
      {logs.length === 0 ? (
        <p style={styles.empty}>No logs collected yet</p>
      ) : (
        <div style={styles.logContainer}>
          {logs.map((log, idx) => (
            <div
              key={idx}
              style={{
                ...styles.logEntry,
                ...getLogLevelStyle(log.level),
              }}
            >
              <div style={styles.logTime}>{log.timestamp}</div>
              <div style={styles.logLevel}>[{log.level}]</div>
              <div style={styles.logMessage}>{log.message}</div>
              {log.error && <div style={styles.logError}> - {log.error.message}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Errors view component
 */
const ErrorsView: React.FC<{ errors: any[] }> = ({ errors }) => {
  return (
    <div style={styles.view}>
      <h3 style={styles.viewTitle}>Recent Errors</h3>
      {errors.length === 0 ? (
        <p style={styles.empty}>No errors recorded</p>
      ) : (
        <div style={styles.errorContainer}>
          {errors.map((error, idx) => (
            <div key={idx} style={styles.errorEntry}>
              <div style={styles.errorHeader}>
                <span style={getErrorCategoryBadgeStyle(error.category)}>
                  {error.category}
                </span>
                <span style={styles.errorId}>{error.id}</span>
                <span style={styles.errorTime}>{new Date(error.timestamp).toLocaleTimeString()}</span>
              </div>
              <div style={styles.errorMessage}>{error.message}</div>
              {error.context && (
                <div style={styles.errorContext}>
                  <code>{JSON.stringify(error.context, null, 2)}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Health view component
 */
const HealthView: React.FC<{ health: any }> = ({ health }) => {
  if (!health) {
    return (
      <div style={styles.view}>
        <p style={styles.empty}>No health data available</p>
      </div>
    );
  }

  const healthPercent = health.healthPercentage || 100;
  const healthStatus =
    healthPercent >= 80 ? '✅ Healthy' : healthPercent >= 50 ? '⚠️ Degraded' : '❌ Critical';

  return (
    <div style={styles.view}>
      <h3 style={styles.viewTitle}>System Health</h3>
      <div style={styles.healthCard}>
        <div style={styles.healthBar}>
          <div
            style={{
              ...styles.healthBarFill,
              width: `${healthPercent}%`,
              backgroundColor: getHealthColor(healthPercent),
            }}
          />
        </div>
        <div style={styles.healthText}>
          <p>Overall Health: {healthStatus}</p>
          <p>Score: {healthPercent}%</p>
          <p>Subscriptions: {health.totalSubscriptions}</p>
          <p>Healthy: {health.healthySubscriptions}</p>
        </div>
      </div>
    </div>
  );
};

// Helper functions

function getMetricTypeBadgeStyle(type: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white',
  };

  const colorMap: Record<string, string> = {
    counter: '#4299e1',
    gauge: '#48bb78',
    histogram: '#ed8936',
    distribution: '#9f7aea',
  };

  return {
    ...baseStyle,
    backgroundColor: colorMap[type] || '#718096',
  };
}

function getLogLevelStyle(level: string): React.CSSProperties {
  const colorMap: Record<string, string> = {
    TRACE: '#999999',
    DEBUG: '#0066cc',
    INFO: '#009900',
    WARN: '#ff6600',
    ERROR: '#ff0000',
    FATAL: '#990000',
  };

  return {
    borderLeftColor: colorMap[level] || '#999',
  };
}

function getErrorCategoryBadgeStyle(category: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
  };

  const colorMap: Record<string, string> = {
    NETWORK: '#e53e3e',
    TIMEOUT: '#dd6b20',
    PARSE: '#d69e2e',
    AUTH: '#744210',
    VALIDATION: '#c05621',
    UNKNOWN: '#718096',
  };

  return {
    ...baseStyle,
    backgroundColor: colorMap[category] || '#718096',
  };
}

function getHealthColor(percent: number): string {
  if (percent >= 80) return '#48bb78'; // Green
  if (percent >= 50) return '#ed8936'; // Orange
  return '#f56565'; // Red
}

const styles: Record<string, React.CSSProperties> = {
  dashboard: {
    padding: '20px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    maxHeight: '600px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a202c',
  },
  controls: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    padding: '6px 12px',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
    borderBottom: '2px solid #e2e8f0',
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#718096',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
  },
  tabActive: {
    color: '#2b6cb0',
    borderBottomColor: '#4299e1',
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
  view: {
    padding: '12px 0',
  },
  viewTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2d3748',
  },
  empty: {
    textAlign: 'center',
    padding: '20px',
    color: '#a0aec0',
    fontSize: '13px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  tableHeader: {
    backgroundColor: '#edf2f7',
    borderBottom: '1px solid #e2e8f0',
  },
  tableCell: {
    padding: '8px',
    textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
  },
  tableRow: {
    backgroundColor: 'white',
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#2b6cb0',
  },
  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '300px',
    overflow: 'auto',
  },
  logEntry: {
    display: 'flex',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '3px',
    borderLeft: '3px solid #gray',
    fontSize: '12px',
  },
  logTime: {
    color: '#a0aec0',
    fontWeight: 'bold',
    minWidth: '80px',
  },
  logLevel: {
    fontWeight: 'bold',
    minWidth: '65px',
  },
  logMessage: {
    flex: 1,
    color: '#2d3748',
  },
  logError: {
    color: '#e53e3e',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflow: 'auto',
  },
  errorEntry: {
    padding: '12px',
    backgroundColor: '#fff5f5',
    borderRadius: '4px',
    border: '1px solid #fc8181',
  },
  errorHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '12px',
  },
  errorId: {
    color: '#a0aec0',
    flex: 1,
  },
  errorTime: {
    color: '#a0aec0',
  },
  errorMessage: {
    color: '#c53030',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  errorContext: {
    backgroundColor: '#fed7d7',
    padding: '8px',
    borderRadius: '3px',
    fontSize: '11px',
    overflow: 'auto',
    maxHeight: '100px',
  },
  healthCard: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  healthBar: {
    width: '100%',
    height: '24px',
    backgroundColor: '#edf2f7',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  healthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  healthText: {
    fontSize: '13px',
    color: '#2d3748',
  },
};
