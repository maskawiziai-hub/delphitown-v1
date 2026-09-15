// ============================================================================
// Architecture constants - the config layer.
//
// RECONCILED 2026-09-15 during the Phase 0.1 port from the second codebase.
// The original declared its own TypeScript `enum WorkerType / TaskType /
// CitizenType` with a THIRD vocabulary (pricing_agent, PRICE_UPDATE,
// gta6_trader). That conflicted with src/types/index.ts and, more importantly,
// a TS enum is a closed set - it cannot express a custom citizen deployed with
// a role you invent at deploy time, which is the whole product.
//
// So: types come from ../types (open unions), and this file keeps what was
// actually valuable - the per-type metadata and the JSON Schemas that drive
// DynamicTaskForm. Adding a worker type means adding entries here and nowhere
// else. That is the ten-minute test.
// ============================================================================

import type { KnownWorkerType, KnownTaskType, BusinessStream, CostType } from '../types';

export interface TaskPayloadSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface WorkerTypeConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  businessStream: BusinessStream;
  defaultTimeoutMs: number;
  maxConcurrentTasks: number;
  defaultQuotaPerDay: number;
  estimatedCostPerTask: number;
  /** Cost categories this archetype typically incurs (see costs.cost_type). */
  typicalCostTypes: CostType[];
  capabilities: KnownTaskType[];
}

export interface TaskTypeConfig {
  name: string;
  description: string;
  estimatedDurationMs: number;
  payloadSchema: TaskPayloadSchema;
  resultSchema: TaskPayloadSchema;
  allowedWorkerTypes: KnownWorkerType[];
}

// ---------------------------------------------------------------------------
// Worker archetypes
// ---------------------------------------------------------------------------

export const WORKER_TYPE_CONFIG: Record<KnownWorkerType, WorkerTypeConfig> = {
  collectibles_hunter: {
    name: 'Collectibles Hunter',
    description: 'Monitors market prices and keeps listings competitive across Shopify and eBay',
    icon: '💰',
    color: '#4CAF50',
    businessStream: 'collectibles',
    defaultTimeoutMs: 30000,
    maxConcurrentTasks: 5,
    defaultQuotaPerDay: 100,
    estimatedCostPerTask: 0.05,
    typicalCostTypes: ['api', 'platform_fee', 'cogs', 'shipping'],
    capabilities: ['hunt_collectible'],
  },
  gta6_content_creator: {
    name: 'GTA6 Content Creator',
    description: 'Analyses footage, finds highlights and drafts scripts and thumbnails',
    icon: '🎬',
    color: '#2196F3',
    businessStream: 'gta6',
    defaultTimeoutMs: 60000,
    maxConcurrentTasks: 3,
    defaultQuotaPerDay: 50,
    estimatedCostPerTask: 0.1,
    typicalCostTypes: ['api', 'subscription'],
    capabilities: ['create_gta6_video'],
  },
  osrs_farmer: {
    name: 'OSRS Farmer',
    description: 'Researches trends, optimises routes and drafts guides for the OSRS channel',
    icon: '⚔️',
    color: '#FF9800',
    businessStream: 'osrs',
    defaultTimeoutMs: 45000,
    maxConcurrentTasks: 4,
    defaultQuotaPerDay: 75,
    estimatedCostPerTask: 0.08,
    typicalCostTypes: ['api', 'subscription'],
    capabilities: ['farm_osrs_items'],
  },
  dropshipping_scout: {
    name: 'Dropshipping Scout',
    description: 'Finds suppliers, compares landed cost and flags margin opportunities',
    icon: '📦',
    color: '#795548',
    businessStream: 'dropshipping',
    defaultTimeoutMs: 45000,
    maxConcurrentTasks: 4,
    defaultQuotaPerDay: 80,
    estimatedCostPerTask: 0.06,
    typicalCostTypes: ['api', 'cogs', 'shipping', 'platform_fee'],
    capabilities: ['source_dropship_products'],
  },
  lofi_producer: {
    name: 'Lofi Producer',
    description: 'Generates tracks, writes metadata and prepares distribution',
    icon: '🎵',
    color: '#9C27B0',
    businessStream: 'lofi',
    defaultTimeoutMs: 120000,
    maxConcurrentTasks: 2,
    defaultQuotaPerDay: 30,
    estimatedCostPerTask: 0.25,
    typicalCostTypes: ['api', 'subscription', 'platform_fee'],
    capabilities: ['produce_lofi_track'],
  },
  pixel_artist: {
    name: 'Pixel Artist',
    description: 'Creates sprites and tilesets, packages them and prepares marketplace listings',
    icon: '🎨',
    color: '#E91E63',
    businessStream: 'pixel-assets',
    defaultTimeoutMs: 90000,
    maxConcurrentTasks: 3,
    defaultQuotaPerDay: 40,
    estimatedCostPerTask: 0.15,
    typicalCostTypes: ['api', 'platform_fee'],
    capabilities: ['design_pixel_sprite'],
  },
  pod_designer: {
    name: 'Print-on-Demand Designer',
    description: 'Produces designs, creates listings and routes orders to the cheapest supplier',
    icon: '👕',
    color: '#00BCD4',
    businessStream: 'print-on-demand',
    defaultTimeoutMs: 60000,
    maxConcurrentTasks: 4,
    defaultQuotaPerDay: 60,
    estimatedCostPerTask: 0.12,
    typicalCostTypes: ['api', 'cogs', 'shipping', 'platform_fee'],
    capabilities: ['create_pod_design'],
  },
};

// ---------------------------------------------------------------------------
// Task types and their JSON Schemas.
// DynamicTaskForm generates its inputs from payloadSchema, so adding a task
// type here is all that is needed for a form to exist for it.
// ---------------------------------------------------------------------------

export const TASK_TYPE_CONFIG: Record<KnownTaskType, TaskTypeConfig> = {
  hunt_collectible: {
    name: 'Hunt Collectible',
    description: 'Check market prices for an item and propose a listing price',
    estimatedDurationMs: 30000,
    payloadSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Internal product or SKU identifier' },
        marketplace: {
          type: 'string',
          enum: ['shopify', 'ebay'],
          description: 'Where the item is listed',
        },
        targetMargin: { type: 'number', minimum: 0, maximum: 100, description: 'Desired margin %' },
        competitorPriceThreshold: {
          type: 'number',
          minimum: 0,
          description: 'Highest competitor price worth matching',
        },
      },
      required: ['productId', 'marketplace'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        currentPrice: { type: 'number' },
        proposedPrice: { type: 'number' },
        competitorCount: { type: 'number' },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['collectibles_hunter'],
  },
  create_gta6_video: {
    name: 'Create GTA6 Video',
    description: 'Analyse footage and produce highlights, script or thumbnail options',
    estimatedDurationMs: 60000,
    payloadSchema: {
      type: 'object',
      properties: {
        sourceUrl: { type: 'string', description: 'Footage or video URL' },
        outputType: {
          type: 'string',
          enum: ['highlights', 'script', 'thumbnail'],
          description: 'What to produce',
        },
        targetLengthSeconds: { type: 'number', minimum: 15, maximum: 3600 },
      },
      required: ['sourceUrl', 'outputType'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        outputUrl: { type: 'string' },
        segmentCount: { type: 'number' },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['gta6_content_creator'],
  },
  farm_osrs_items: {
    name: 'Farm OSRS Items',
    description: 'Research a method or trend and produce a strategy or guide outline',
    estimatedDurationMs: 45000,
    payloadSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'What the run is optimising for' },
        accountType: {
          type: 'string',
          enum: ['main', 'ironman', 'ultimate_ironman', 'hardcore'],
        },
        hoursAvailable: { type: 'number', minimum: 1, maximum: 200 },
      },
      required: ['goal', 'accountType'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        strategy: { type: 'string' },
        estimatedGpPerHour: { type: 'number' },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['osrs_farmer'],
  },
  source_dropship_products: {
    name: 'Source Dropship Products',
    description: 'Find suppliers for a niche and compare landed cost and margin',
    estimatedDurationMs: 45000,
    payloadSchema: {
      type: 'object',
      properties: {
        niche: { type: 'string', description: 'Product category to search' },
        maxUnitCost: { type: 'number', minimum: 0 },
        minMarginPct: { type: 'number', minimum: 0, maximum: 100 },
        shipsTo: { type: 'string', description: 'Destination country code' },
      },
      required: ['niche'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        supplierCount: { type: 'number' },
        bestMarginPct: { type: 'number' },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['dropshipping_scout'],
  },
  produce_lofi_track: {
    name: 'Produce Lofi Track',
    description: 'Generate a track with metadata, ready for distribution',
    estimatedDurationMs: 120000,
    payloadSchema: {
      type: 'object',
      properties: {
        mood: { type: 'string', enum: ['chill', 'focus', 'sleep', 'study'] },
        durationSeconds: { type: 'number', minimum: 60, maximum: 28800 },
        tempoBpm: { type: 'number', minimum: 60, maximum: 120 },
        instrumentation: { type: 'array', items: { type: 'string' } },
      },
      required: ['mood', 'durationSeconds'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        trackUrl: { type: 'string' },
        durationSeconds: { type: 'number' },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['lofi_producer'],
  },
  design_pixel_sprite: {
    name: 'Design Pixel Sprite',
    description: 'Create pixel art assets to a given style and resolution',
    estimatedDurationMs: 90000,
    payloadSchema: {
      type: 'object',
      properties: {
        assetType: {
          type: 'string',
          enum: ['character', 'tileset', 'ui_pack', 'particle'],
        },
        resolution: { type: 'string', enum: ['16x16', '32x32', '64x64'] },
        style: { type: 'string', description: 'Art direction, e.g. SNES RPG' },
        quantity: { type: 'number', minimum: 1, maximum: 100 },
      },
      required: ['assetType', 'resolution'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        assetUrls: { type: 'array', items: { type: 'string' } },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['pixel_artist'],
  },
  create_pod_design: {
    name: 'Create POD Design',
    description: 'Produce a print-on-demand design and route it to the cheapest supplier',
    estimatedDurationMs: 60000,
    payloadSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: ['tshirt', 'hoodie', 'mug', 'poster'] },
        concept: { type: 'string', description: 'Design brief' },
        targetMarginPct: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: ['productType', 'concept'],
      additionalProperties: false,
    },
    resultSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        designUrl: { type: 'string' },
        supplier: { type: 'string' },
        unitCost: { type: 'number' },
      },
      required: ['success'],
      additionalProperties: false,
    },
    allowedWorkerTypes: ['pod_designer'],
  },
};

// ---------------------------------------------------------------------------
// Operational config
// ---------------------------------------------------------------------------

export const QUOTA_CONFIG = {
  tiers: {
    free: { multiplier: 1, maxConcurrent: 2 },
    premium: { multiplier: 5, maxConcurrent: 10 },
    enterprise: { multiplier: 100, maxConcurrent: 50 },
  },
  defaultHourly: 10,
  defaultDaily: 100,
} as const;

export const ERROR_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitter: true,
} as const;

/** All off for v1.0. Mirrored by the feature_flags table. */
export const FEATURE_FLAGS = {
  ENABLE_TREND_SCOUT: false,
  ENABLE_MUSIC_DISTRIBUTION: false,
  ENABLE_PIXEL_ASSET_MARKETPLACE: false,
  ENABLE_ADVANCED_ANALYTICS: false,
  ENABLE_WEBSOCKET_UPDATES: false,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getTaskTypesForWorker(workerType: string): KnownTaskType[] {
  const config = WORKER_TYPE_CONFIG[workerType as KnownWorkerType];
  return config ? [...config.capabilities] : [];
}

export function getWorkersForTaskType(taskType: string): KnownWorkerType[] {
  const config = TASK_TYPE_CONFIG[taskType as KnownTaskType];
  return config ? [...config.allowedWorkerTypes] : [];
}

export function getDefaultQuota(workerType: string): {
  perDay: number;
  concurrent: number;
} {
  const config = WORKER_TYPE_CONFIG[workerType as KnownWorkerType];
  return {
    perDay: config?.defaultQuotaPerDay ?? QUOTA_CONFIG.defaultDaily,
    concurrent: config?.maxConcurrentTasks ?? 1,
  };
}

/** Exponential backoff with optional jitter, capped at maxDelayMs. */
export function calculateBackoffDelay(attemptNumber: number): number {
  const { baseDelayMs, maxDelayMs, backoffMultiplier, jitter } = ERROR_RETRY_CONFIG;
  const raw = baseDelayMs * Math.pow(backoffMultiplier, attemptNumber);
  const capped = Math.min(raw, maxDelayMs);
  return jitter ? Math.round(capped * (0.5 + Math.random() * 0.5)) : capped;
}

/** Look up an archetype's display metadata. Returns undefined for a custom
 *  role deployed outside the pre-built set - callers must handle that. */
export function getWorkerTypeConfig(workerType: string): WorkerTypeConfig | undefined {
  return WORKER_TYPE_CONFIG[workerType as KnownWorkerType];
}

/** Look up a task type's config. Returns undefined for a custom task type
 *  deployed outside the pre-built set - callers must handle that. */
export function getTaskTypeConfig(taskType: string): TaskTypeConfig | undefined {
  return TASK_TYPE_CONFIG[taskType as KnownTaskType];
}
