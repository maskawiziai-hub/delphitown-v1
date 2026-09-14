/**
 * game.ts
 * Core TypeScript interfaces and types for DelphiTown v1
 * Defines game state, entities, and system structures
 */

import { AnimationState, Direction } from '../utils/AnimationPlayer';

/**
 * 2D coordinate system for town grid
 */
export interface Coordinate {
  x: number;
  y: number;
}

/**
 * Game world dimensions
 */
export interface GameDimensions {
  width: number; // Grid width in tiles
  height: number; // Grid height in tiles
  tileSize: number; // Pixel size per tile
  gridSize: number; // Grid cell size in pixels
}

/**
 * Citizen/Worker entity in the town
 * Represents an individual AI worker with state, position, and task
 */
export interface Citizen {
  id: string;
  name: string;
  role: 'Farmer' | 'Builder' | 'Scout' | 'Worker';
  position: Coordinate;
  direction: Direction;
  animationState: AnimationState;
  colorPreset: string;
  currentTask: string | null;
  isAvailable: boolean;
  health: number; // 0-100
  stamina: number; // 0-100
  skills: Record<string, number>; // skill name -> proficiency (0-100)
  inventory: unknown[]; // Future: item system
  createdAt: number; // Timestamp
}

/**
 * Building/Structure in the town
 * Represents buildings, farms, structures, etc.
 */
export interface Building {
  id: string;
  name: string;
  type: 'house' | 'farm' | 'workshop' | 'storage' | 'market' | 'garden';
  position: Coordinate;
  width: number; // In tiles
  height: number; // In tiles
  level: number; // Upgrade level
  health: number; // 0-100
  production?: string | null; // What it produces (e.g., "wheat", "tools")
  productionRate?: number; // Per time unit
  workers: string[]; // Array of citizen IDs assigned
  capacity: number; // Max workers
  isActive: boolean;
}

/**
 * Tile on the town grid
 * Represents terrain, resources, or special tiles
 */
export interface Tile {
  x: number;
  y: number;
  terrainType: 'grass' | 'water' | 'sand' | 'stone' | 'forest';
  buildingId?: string; // If building is on this tile
  resourceType?: 'wheat' | 'wood' | 'ore' | 'water';
  resourceAmount?: number;
  isWalkable: boolean;
  isOccupied: boolean;
}

/**
 * Task/Job that citizens can be assigned to
 */
export interface Task {
  id: string;
  type: 'farm' | 'build' | 'scout' | 'gather' | 'repair' | 'rest';
  targetPosition: Coordinate;
  targetBuildingId?: string;
  assignedCitizens: string[]; // Citizen IDs
  priority: 'low' | 'normal' | 'high' | 'critical';
  progress: number; // 0-100
  isComplete: boolean;
  createdAt: number;
  dueAt?: number; // Optional deadline
}

/**
 * Game state snapshot
 * Top-level state for the entire game
 */
export interface GameState {
  // World
  dimensions: GameDimensions;
  tiles: Tile[][];
  time: number; // Game time (ticks)
  isPaused: boolean;

  // Entities
  citizens: Map<string, Citizen>;
  buildings: Map<string, Building>;
  tasks: Map<string, Task>;

  // Resources (global)
  resources: {
    wheat: number;
    wood: number;
    ore: number;
    gold: number;
  };

  // Game settings
  settings: GameSettings;

  // Stats
  stats: GameStats;
}

/**
 * Game configuration settings
 */
export interface GameSettings {
  // Visual
  animationSpeed: number; // Multiplier (0.5 = half, 2.0 = double)
  gridSize: number; // Pixel size per grid cell
  tileSize: number; // Pixel size per tile
  displayScale: number; // Global scale multiplier

  // Gameplay
  maxCitizens: number;
  maxBuildings: number;
  dayLengthSeconds: number; // Real seconds per game day
  simulationSpeed: number; // Ticks per second

  // Audio
  soundEnabled: boolean;
  masterVolume: number; // 0-100
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100

  // UI
  showGrid: boolean;
  showDebugInfo: boolean;
  autoSave: boolean;
  autoSaveIntervalSeconds: number;
}

/**
 * Game statistics and metrics
 */
export interface GameStats {
  totalCitizensCreated: number;
  totalBuildingsConstructed: number;
  totalTasksCompleted: number;
  playTimeSeconds: number;
  dayNumber: number;
  resourcesProduced: Record<string, number>;
  citizenHappiness: number; // 0-100
}

/**
 * Game update event
 * Fired during game update loop
 */
export interface GameUpdateEvent {
  deltaTime: number; // Time since last update (ms)
  currentTime: number; // Total game time (ms)
  tick: number; // Update tick counter
}

/**
 * Worker Panel state
 * Manages display of citizens and selection
 */
export interface WorkerPanelState {
  selectedCitizenId: string | null;
  filterByRole: 'all' | 'Farmer' | 'Builder' | 'Scout' | 'Worker';
  sortBy: 'name' | 'role' | 'task' | 'health' | 'stamina';
  visibleCitizens: string[]; // IDs of citizens shown
}

/**
 * Citizen state extended for UI
 * Adds derived/computed properties for rendering
 */
export interface CitizenUIState extends Citizen {
  distanceToTarget?: number;
  estimatedTimeToComplete?: number;
  isBusy: boolean;
}
