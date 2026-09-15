/**
 * Structured Logging System
 * Provides unified logging with multiple backends and context tracking
 */

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number; // milliseconds
  tags?: string[];
}

export interface LogBackend {
  log(entry: LogEntry): void | Promise<void>;
  flush?(): Promise<void>;
}

/**
 * Console logging backend (browser)
 */
export class ConsoleBackend implements LogBackend {
  private levelColors: Record<LogLevel, string> = {
    TRACE: '#999999',
    DEBUG: '#0066cc',
    INFO: '#009900',
    WARN: '#ff6600',
    ERROR: '#ff0000',
    FATAL: '#990000',
  };

  log(entry: LogEntry): void {
    const style = `color: ${this.levelColors[entry.level]}; font-weight: bold;`;
    const prefix = `[${entry.timestamp}] [${entry.level}]`;

    if (entry.error) {
      console.error(`%c${prefix} ${entry.message}`, style, entry.error);
    } else {
      console.log(`%c${prefix} ${entry.message}`, style);
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('Context:', entry.context);
    }

    if (entry.duration) {
      console.log(`Duration: ${entry.duration}ms`);
    }
  }
}

/**
 * Memory backend for testing and analytics
 */
export class MemoryBackend implements LogBackend {
  private entries: LogEntry[] = [];
  private maxEntries = 1000;

  log(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(e => e.level === level);
  }

  getEntriesByTag(tag: string): LogEntry[] {
    return this.entries.filter(e => e.tags?.includes(tag));
  }

  clear(): void {
    this.entries = [];
  }

  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    avgDuration?: number;
  } {
    const byLevel: Record<LogLevel, number> = {
      TRACE: 0,
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    this.entries.forEach(entry => {
      byLevel[entry.level]++;
      if (entry.duration) {
        totalDuration += entry.duration;
        durationCount++;
      }
    });

    return {
      total: this.entries.length,
      byLevel,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : undefined,
    };
  }
}

/**
 * Main Logger class - unified interface for logging
 */
export class Logger {
  private backends: LogBackend[] = [];
  private minLevel: LogLevel = 'INFO';
  private context: LogContext = {};
  private enableTimestamps = true;

  private levelHierarchy: Record<LogLevel, number> = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
  };

  constructor(minLevel: LogLevel = 'INFO') {
    this.minLevel = minLevel;
  }

  /**
   * Add a logging backend
   */
  addBackend(backend: LogBackend): void {
    this.backends.push(backend);
  }

  /**
   * Set global context that's included in all logs
   */
  setContext(context: LogContext): void {
    this.context = context;
  }

  /**
   * Add to existing context
   */
  addContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get current context
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.minLevel);
    child.backends = [...this.backends];
    child.context = { ...this.context, ...context };
    child.enableTimestamps = this.enableTimestamps;
    return child;
  }

  /**
   * Log at specified level
   */
  private doLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number,
    tags?: string[]
  ): void {
    // Check if this level should be logged
    if (this.levelHierarchy[level] < this.levelHierarchy[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.enableTimestamps ? new Date().toISOString() : '',
      level,
      message,
      context: { ...this.context, ...context },
      ...(duration && { duration }),
      ...(tags && { tags }),
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    this.backends.forEach(backend => {
      try {
        void backend.log(entry);
      } catch (backendError) {
        // Prevent logging errors from breaking the app
        console.error('Logging backend error:', backendError);
      }
    });
  }

  /**
   * Trace level logging
   */
  trace(message: string, context?: LogContext, tags?: string[]): void {
    this.doLog('TRACE', message, context, undefined, undefined, tags);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext, tags?: string[]): void {
    this.doLog('DEBUG', message, context, undefined, undefined, tags);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext, tags?: string[]): void {
    this.doLog('INFO', message, context, undefined, undefined, tags);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext, tags?: string[]): void {
    this.doLog('WARN', message, context, undefined, undefined, tags);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext, tags?: string[]): void {
    this.doLog('ERROR', message, context, error, undefined, tags);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, error?: Error, context?: LogContext, tags?: string[]): void {
    this.doLog('FATAL', message, context, error, undefined, tags);
  }

  /**
   * Measure operation duration and log
   */
  async measure<T>(
    message: string,
    fn: () => Promise<T>,
    context?: LogContext,
    tags?: string[]
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.doLog('DEBUG', `${message} (completed)`, context, undefined, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.doLog(
        'ERROR',
        `${message} (failed)`,
        context,
        error instanceof Error ? error : new Error(String(error)),
        duration,
        tags
      );
      throw error;
    }
  }

  /**
   * Time a synchronous operation
   */
  measureSync<T>(
    message: string,
    fn: () => T,
    context?: LogContext,
    tags?: string[]
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.doLog('DEBUG', `${message} (completed)`, context, undefined, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.doLog(
        'ERROR',
        `${message} (failed)`,
        context,
        error instanceof Error ? error : new Error(String(error)),
        duration,
        tags
      );
      throw error;
    }
  }

  /**
   * Flush all backends
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.backends
        .map(b => b.flush?.())
        .filter((p): p is Promise<void> => p !== undefined)
    );
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Set whether to include timestamps
   */
  setTimestamps(enable: boolean): void {
    this.enableTimestamps = enable;
  }
}

/**
 * Create a global logger instance
 */
export function createLogger(name: string, minLevel: LogLevel = 'INFO'): Logger {
  const logger = new Logger(minLevel);
  logger.addBackend(new ConsoleBackend());

  if (import.meta.env.DEV) {
    logger.addBackend(new MemoryBackend());
  }

  logger.setContext({ module: name });
  return logger;
}

// Global logger instance
export const globalLogger = createLogger('DelphiTown', 'DEBUG');
