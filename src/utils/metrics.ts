/**
 * Metrics Collection System
 * Tracks performance, errors, and operational metrics
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'distribution';

export interface MetricValue {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface MetricsSnapshot {
  timestamp: number;
  metrics: MetricValue[];
}

export interface PercentileStats {
  p50: number; // median
  p75: number;
  p95: number;
  p99: number;
}

/**
 * Metrics collector and reporter
 */
export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private distributions: Map<string, number[]> = new Map();
  private reporters: MetricsReporter[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private flushIntervalMs: number = 60000) {}

  /**
   * Increment a counter
   */
  incrementCounter(name: string, amount: number = 1, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    this.counters.set(key, (this.counters.get(key) || 0) + amount);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value (for latencies, durations)
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)?.push(value);
  }

  /**
   * Record a distribution value
   */
  recordDistribution(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    if (!this.distributions.has(key)) {
      this.distributions.set(key, []);
    }
    this.distributions.get(key)?.push(value);
  }

  /**
   * Time an operation and record histogram
   */
  async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordHistogram(name, duration, tags);
    }
  }

  /**
   * Time a synchronous operation
   */
  timeSync<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordHistogram(name, duration, tags);
    }
  }

  /**
   * Create a metric snapshot
   */
  snapshot(): MetricsSnapshot {
    const metrics: MetricValue[] = [];

    // Add counters
    this.counters.forEach((value, key) => {
      const { name, tags } = this.parseMetricKey(key);
      metrics.push({
        name,
        type: 'counter',
        value,
        timestamp: Date.now(),
        tags,
      });
    });

    // Add gauges
    this.gauges.forEach((value, key) => {
      const { name, tags } = this.parseMetricKey(key);
      metrics.push({
        name,
        type: 'gauge',
        value,
        timestamp: Date.now(),
        tags,
      });
    });

    // Add histogram percentiles
    this.histograms.forEach((values, key) => {
      const { name, tags } = this.parseMetricKey(key);
      const stats = this.calculatePercentiles(values);

      metrics.push(
        {
          name: `${name}.p50`,
          type: 'histogram',
          value: stats.p50,
          timestamp: Date.now(),
          tags,
        },
        {
          name: `${name}.p95`,
          type: 'histogram',
          value: stats.p95,
          timestamp: Date.now(),
          tags,
        },
        {
          name: `${name}.p99`,
          type: 'histogram',
          value: stats.p99,
          timestamp: Date.now(),
          tags,
        }
      );
    });

    // Add distribution percentiles
    this.distributions.forEach((values, key) => {
      const { name, tags } = this.parseMetricKey(key);

      metrics.push({
        name: `${name}.avg`,
        type: 'distribution',
        value: values.reduce((a, b) => a + b, 0) / values.length,
        timestamp: Date.now(),
        tags,
      });
    });

    return {
      timestamp: Date.now(),
      metrics,
    };
  }

  /**
   * Add metrics reporter
   */
  addReporter(reporter: MetricsReporter): void {
    this.reporters.push(reporter);
  }

  /**
   * Start periodic flushing
   */
  startFlush(): void {
    this.flushInterval = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  /**
   * Stop periodic flushing
   */
  stopFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Flush metrics to reporters
   */
  async flush(): Promise<void> {
    const snapshot = this.snapshot();
    await Promise.all(this.reporters.map(async r => r.report(snapshot)));
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.distributions.clear();
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): number | undefined {
    return this.counters.get(name) || this.gauges.get(name);
  }

  /**
   * Get histogram stats
   */
  getHistogramStats(name: string): PercentileStats | undefined {
    const values = this.histograms.get(name);
    return values ? this.calculatePercentiles(values) : undefined;
  }

  /**
   * Internal: generate metric key with tags
   */
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }

  /**
   * Internal: parse metric key
   */
  private parseMetricKey(key: string): { name: string; tags?: Record<string, string> } {
    const match = key.match(/^(.+)\{(.+)\}$/);
    if (!match) {
      return { name: key };
    }

    const [, name, tagStr] = match;
    const tags = tagStr.split(',').reduce<Record<string, string>>((acc, pair) => {
      const [k, v] = pair.split('=');
      acc[k] = v;
      return acc;
    }, {});

    return { name, tags };
  }

  /**
   * Internal: calculate percentiles
   */
  private calculatePercentiles(values: number[]): PercentileStats {
    if (values.length === 0) {
      return { p50: 0, p75: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    return {
      p50: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /**
   * Internal: calculate specific percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Interface for metrics reporters
 */
export interface MetricsReporter {
  report(snapshot: MetricsSnapshot): void | Promise<void>;
}

/**
 * Console metrics reporter (development)
 */
export class ConsoleMetricsReporter implements MetricsReporter {
  report(snapshot: MetricsSnapshot): void {
    console.group(`📊 Metrics [${new Date(snapshot.timestamp).toISOString()}]`);
    snapshot.metrics.forEach(metric => {
      const value = metric.value.toFixed(2);
      const tagsStr = metric.tags ? ` (${JSON.stringify(metric.tags)})` : '';
      console.log(`  ${metric.name}: ${value}${tagsStr}`);
    });
    console.groupEnd();
  }
}

/**
 * Memory metrics reporter (for testing)
 */
export class MemoryMetricsReporter implements MetricsReporter {
  private snapshots: MetricsSnapshot[] = [];

  report(snapshot: MetricsSnapshot): void {
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }

  getSnapshots(): MetricsSnapshot[] {
    return [...this.snapshots];
  }

  getLastSnapshot(): MetricsSnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  clear(): void {
    this.snapshots = [];
  }
}

/**
 * Widget metrics tracker
 */
export class WidgetMetrics {
  constructor(private collector: MetricsCollector, private widgetName: string) {}

  /**
   * Record render time
   */
  recordRenderTime(duration: number): void {
    this.collector.recordHistogram('widget.render_time', duration, {
      widget: this.widgetName,
    });
  }

  /**
   * Record data fetch time
   */
  recordFetchTime(duration: number, success: boolean): void {
    this.collector.recordHistogram('widget.fetch_time', duration, {
      widget: this.widgetName,
      status: success ? 'success' : 'error',
    });
  }

  /**
   * Record update latency
   */
  recordUpdateLatency(duration: number): void {
    this.collector.recordHistogram('widget.update_latency', duration, {
      widget: this.widgetName,
    });
  }

  /**
   * Increment error count
   */
  recordError(errorType: string): void {
    this.collector.incrementCounter('widget.errors', 1, {
      widget: this.widgetName,
      type: errorType,
    });
  }

  /**
   * Record subscription status
   */
  recordSubscriptionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.collector.setGauge(
      'widget.subscription_status',
      status === 'connected' ? 1 : 0,
      {
        widget: this.widgetName,
      }
    );
  }
}

/**
 * Create global metrics collector
 */
export function createMetricsCollector(): MetricsCollector {
  const collector = new MetricsCollector(60000); // 1 minute flush interval

  // Add console reporter in development
  if (import.meta.env.DEV) {
    collector.addReporter(new ConsoleMetricsReporter());
  }

  return collector;
}

// Global metrics collector
export const globalMetrics = createMetricsCollector();
