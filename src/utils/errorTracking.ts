/**
 * Error Tracking System
 * Collects, categorizes, and reports errors
 */

import { Logger } from './logger';

export type ErrorCategory =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'PARSE'
  | 'AUTH'
  | 'VALIDATION'
  | 'UNKNOWN';

export interface TrackedError {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  data?: Record<string, any>;
}

export interface ErrorStats {
  total: number;
  byCategory: Record<ErrorCategory, number>;
  mostRecent: TrackedError[];
  frequentErrors: Array<{
    message: string;
    count: number;
    lastSeen: number;
  }>;
}

/**
 * Error tracker
 */
export class ErrorTracker {
  private errors: TrackedError[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private errorReporters: ErrorReporter[] = [];
  private maxErrors = 500;
  private maxBreadcrumbs = 100;
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Capture an error
   */
  captureError(
    error: Error,
    category: ErrorCategory = 'UNKNOWN',
    context?: Record<string, any>
  ): TrackedError {
    const trackedError: TrackedError = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      breadcrumbs: [...this.breadcrumbs],
    };

    this.errors.push(trackedError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Report to reporters
    this.errorReporters.forEach(reporter => {
      try {
        void reporter.report(trackedError);
      } catch (reporterError) {
        console.error('Error reporter failed:', reporterError);
      }
    });

    // Log the error
    if (this.logger) {
      this.logger.error(
        `Captured ${category} error`,
        error,
        { ...context, errorId: trackedError.id },
        [category, 'error-tracking']
      );
    }

    return trackedError;
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(
    category: string,
    message: string,
    level: 'info' | 'warn' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Categorize error by message
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('xhr') ||
      message.includes('cors')
    ) {
      return 'NETWORK';
    }

    if (message.includes('timeout')) {
      return 'TIMEOUT';
    }

    if (message.includes('parse') || message.includes('json')) {
      return 'PARSE';
    }

    if (message.includes('401') || message.includes('403') || message.includes('auth')) {
      return 'AUTH';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION';
    }

    return 'UNKNOWN';
  }

  /**
   * Capture error with automatic categorization
   */
  captureErrorAuto(error: Error, context?: Record<string, any>): TrackedError {
    const category = this.categorizeError(error);
    return this.captureError(error, category, context);
  }

  /**
   * Add error reporter
   */
  addReporter(reporter: ErrorReporter): void {
    this.errorReporters.push(reporter);
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const byCategory: Record<ErrorCategory, number> = {
      NETWORK: 0,
      TIMEOUT: 0,
      PARSE: 0,
      AUTH: 0,
      VALIDATION: 0,
      UNKNOWN: 0,
    };

    const errorMap = new Map<string, { count: number; lastSeen: number }>();

    this.errors.forEach(error => {
      byCategory[error.category]++;

      if (errorMap.has(error.message)) {
        const entry = errorMap.get(error.message);
        if (entry) {
          entry.count++;
          entry.lastSeen = error.timestamp;
        }
      } else {
        errorMap.set(error.message, { count: 1, lastSeen: error.timestamp });
      }
    });

    const frequentErrors = Array.from(errorMap.entries())
      .map(([message, { count, lastSeen }]) => ({ message, count, lastSeen }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: this.errors.length,
      byCategory,
      mostRecent: this.errors.slice(-10).reverse(),
      frequentErrors,
    };
  }

  /**
   * Get all errors
   */
  getErrors(): TrackedError[] {
    return [...this.errors];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): TrackedError[] {
    return this.errors.filter(e => e.category === category);
  }

  /**
   * Get errors since timestamp
   */
  getErrorsSince(timestamp: number): TrackedError[] {
    return this.errors.filter(e => e.timestamp >= timestamp);
  }

  /**
   * Clear errors
   */
  clear(): void {
    this.errors = [];
    this.breadcrumbs = [];
  }

  /**
   * Clear old errors (older than specified ms)
   */
  clearOlderThan(ageMs: number): void {
    const cutoff = Date.now() - ageMs;
    this.errors = this.errors.filter(e => e.timestamp >= cutoff);
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Error reporter interface
 */
export interface ErrorReporter {
  report(error: TrackedError): void | Promise<void>;
}

/**
 * Console error reporter
 */
export class ConsoleErrorReporter implements ErrorReporter {
  report(error: TrackedError): void {
    console.error(`❌ [${error.category}] ${error.message}`, {
      id: error.id,
      timestamp: new Date(error.timestamp).toISOString(),
      stack: error.stack,
      context: error.context,
    });

    if (error.breadcrumbs && error.breadcrumbs.length > 0) {
      console.group('📍 Breadcrumbs');
      error.breadcrumbs.forEach(bc => {
        console.log(`  [${bc.category}] ${bc.message}`);
      });
      console.groupEnd();
    }
  }
}

/**
 * Memory error reporter (for testing)
 */
export class MemoryErrorReporter implements ErrorReporter {
  private errors: TrackedError[] = [];

  report(error: TrackedError): void {
    this.errors.push(error);
    if (this.errors.length > 1000) {
      this.errors.shift();
    }
  }

  getErrors(): TrackedError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }
}

/**
 * Global error tracker
 */
export const globalErrorTracker = new ErrorTracker();

// Add console reporter
globalErrorTracker.addReporter(new ConsoleErrorReporter());

// Add memory reporter for development
if (import.meta.env.DEV) {
  globalErrorTracker.addReporter(new MemoryErrorReporter());
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Handle uncaught errors
  window.addEventListener('error', event => {
    globalErrorTracker.captureErrorAuto(event.error || new Error(event.message), {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    globalErrorTracker.captureErrorAuto(error, {
      type: 'unhandled_rejection',
    });
  });
}
