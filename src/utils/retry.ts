/**
 * Retry utility with exponential backoff
 * Handles transient failures and network timeouts
 */

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number; // milliseconds
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors, timeouts, and 5xx errors
    const retryableErrors = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'Network Error',
      'TimeoutError',
    ];
    return retryableErrors.some(msg => error.message.includes(msg)) ||
           error.message.includes('5') || // 5xx errors
           error.message.includes('timeout');
  },
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error | undefined;
  let delay = finalConfig.initialDelay;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (
        attempt < finalConfig.maxAttempts &&
        finalConfig.shouldRetry(lastError, attempt)
      ) {
        // Wait before retrying
        await sleep(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(
          delay * finalConfig.backoffMultiplier,
          finalConfig.maxDelay
        );
      } else if (attempt < finalConfig.maxAttempts) {
        // Non-retryable error, stop immediately
        break;
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: finalConfig.maxAttempts,
    totalDuration: Date.now() - startTime,
  };
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper - reject promise after specified duration
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Circuit breaker pattern - fail fast after repeated failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // milliseconds
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'OPEN') {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeout
      ) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service is unavailable');
      }
    }

    try {
      const result = await fn();
      // Success - reset state
      this.failureCount = 0;
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        throw new Error(
          `Circuit breaker opened after ${this.failureCount} failures`
        );
      }
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Manually reset the circuit
   */
  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

/**
 * Exponential backoff delay calculation
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number = 1000,
  multiplier: number = 2,
  maxDelay: number = 30000
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry hook configuration builder
 */
export function createRetryConfig(overrides: RetryConfig = {}): Required<RetryConfig> {
  return { ...DEFAULT_CONFIG, ...overrides };
}
