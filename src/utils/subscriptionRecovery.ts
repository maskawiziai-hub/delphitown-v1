/**
 * Subscription Recovery Mechanisms
 * Handles failed subscriptions and recovery strategies
 */

export interface SubscriptionState {
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'RECONNECTING';
  lastConnectedTime: number | null;
  errorCount: number;
  consecutiveErrors: number;
  lastError: Error | null;
  reconnectAttempts: number;
}

export interface SubscriptionRecoveryConfig {
  maxReconnectAttempts?: number;
  reconnectDelay?: number; // milliseconds
  reconnectBackoffMultiplier?: number;
  maxConsecutiveErrors?: number;
  fallbackToPolling?: boolean;
  pollingInterval?: number; // milliseconds
}

const DEFAULT_CONFIG: Required<SubscriptionRecoveryConfig> = {
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,
  reconnectBackoffMultiplier: 1.5,
  maxConsecutiveErrors: 3,
  fallbackToPolling: true,
  pollingInterval: 5000,
};

/**
 * Manages subscription health and recovery
 */
export class SubscriptionManager {
  private state: SubscriptionState;
  private config: Required<SubscriptionRecoveryConfig>;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private callbacks: {
    onStatusChange?: (status: SubscriptionState['status']) => void;
    onReconnect?: () => Promise<void>;
    onFallbackToPolling?: () => void;
  } = {};

  constructor(config: SubscriptionRecoveryConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      status: 'DISCONNECTED',
      lastConnectedTime: null,
      errorCount: 0,
      consecutiveErrors: 0,
      lastError: null,
      reconnectAttempts: 0,
    };
  }

  /**
   * Mark subscription as connected
   */
  markConnected(): void {
    if (this.state.status !== 'CONNECTED') {
      this.setState({
        status: 'CONNECTED',
        lastConnectedTime: Date.now(),
        consecutiveErrors: 0,
      });
      this.cleanup();
    }
  }

  /**
   * Mark subscription with error
   */
  markError(error: Error): void {
    this.setState({
      status: 'ERROR',
      lastError: error,
      errorCount: this.state.errorCount + 1,
      consecutiveErrors: this.state.consecutiveErrors + 1,
    });

    // Check if we've exceeded error threshold
    if (
      this.state.consecutiveErrors >= this.config.maxConsecutiveErrors &&
      !this.reconnectTimer
    ) {
      this.initiateRecovery();
    }
  }

  /**
   * Initiate recovery process
   */
  private initiateRecovery(): void {
    this.setState({
      status: 'RECONNECTING',
      reconnectAttempts: 0,
    });

    this.attemptReconnect();
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      // Max reconnect attempts reached - fall back to polling
      if (this.config.fallbackToPolling) {
        this.fallbackToPolling();
      }
      return;
    }

    const delay = this.calculateReconnectDelay();

    this.reconnectTimer = setTimeout(async () => {
      this.setState({
        reconnectAttempts: this.state.reconnectAttempts + 1,
      });

      try {
        if (this.callbacks.onReconnect) {
          await this.callbacks.onReconnect();
        }
        this.markConnected();
      } catch (error) {
        this.markError(error instanceof Error ? error : new Error(String(error)));
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Fall back to polling when subscription fails
   */
  private fallbackToPolling(): void {
    this.setState({
      status: 'DISCONNECTED',
    });

    if (this.callbacks.onFallbackToPolling) {
      this.callbacks.onFallbackToPolling();
    }

    // Start polling at regular intervals
    this.pollingTimer = setInterval(() => {
      if (this.callbacks.onReconnect) {
        this.callbacks.onReconnect().catch(error => {
          this.markError(error instanceof Error ? error : new Error(String(error)));
        });
      }
    }, this.config.pollingInterval);
  }

  /**
   * Calculate reconnect delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const attempt = this.state.reconnectAttempts;
    const delay =
      this.config.reconnectDelay *
      Math.pow(this.config.reconnectBackoffMultiplier, attempt);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Register callback for status changes
   */
  onStatusChange(callback: (status: SubscriptionState['status']) => void): void {
    this.callbacks.onStatusChange = callback;
  }

  /**
   * Register callback for reconnect attempts
   */
  onReconnect(callback: () => Promise<void>): void {
    this.callbacks.onReconnect = callback;
  }

  /**
   * Register callback for fallback to polling
   */
  onFallbackToPolling(callback: () => void): void {
    this.callbacks.onFallbackToPolling = callback;
  }

  /**
   * Get current subscription state
   */
  getState(): Readonly<SubscriptionState> {
    return { ...this.state };
  }

  /**
   * Check if subscription is healthy
   */
  isHealthy(): boolean {
    return (
      this.state.status === 'CONNECTED' &&
      this.state.consecutiveErrors === 0
    );
  }

  /**
   * Get health percentage (0-100)
   */
  getHealthPercentage(): number {
    const maxErrors = this.config.maxConsecutiveErrors;
    const healthPercent = Math.max(
      0,
      100 - (this.state.consecutiveErrors / maxErrors) * 100
    );
    return Math.round(healthPercent);
  }

  /**
   * Clean up timers
   */
  cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.cleanup();
    this.state = {
      status: 'DISCONNECTED',
      lastConnectedTime: null,
      errorCount: 0,
      consecutiveErrors: 0,
      lastError: null,
      reconnectAttempts: 0,
    };
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<SubscriptionState>): void {
    const prevStatus = this.state.status;
    this.state = { ...this.state, ...updates };

    if (prevStatus !== this.state.status && this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(this.state.status);
    }
  }
}

/**
 * Subscription health monitor
 */
export class SubscriptionHealthMonitor {
  private managers: Map<string, SubscriptionManager> = new Map();

  /**
   * Create or get subscription manager
   */
  getManager(subscriptionId: string): SubscriptionManager {
    let manager = this.managers.get(subscriptionId);
    if (!manager) {
      manager = new SubscriptionManager();
      this.managers.set(subscriptionId, manager);
    }
    return manager;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalSubscriptions: number;
    healthySubscriptions: number;
    healthPercentage: number;
  } {
    const subscriptions = Array.from(this.managers.values());
    const healthy = subscriptions.filter(m => m.isHealthy()).length;

    return {
      totalSubscriptions: subscriptions.length,
      healthySubscriptions: healthy,
      healthPercentage:
        subscriptions.length > 0
          ? Math.round((healthy / subscriptions.length) * 100)
          : 100,
    };
  }

  /**
   * Clean up all managers
   */
  cleanup(): void {
    this.managers.forEach(manager => manager.cleanup());
    this.managers.clear();
  }
}

// Global instance
export const globalHealthMonitor = new SubscriptionHealthMonitor();
