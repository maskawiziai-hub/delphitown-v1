/**
 * AnimationPlayer.ts
 * Manages character animation sequences, frame timing, and directional states
 * for Mana Seed Farmer sprite system (64x64 cells)
 */

export type Direction = 'up' | 'up-right' | 'right' | 'down-right' | 'down' | 'down-left' | 'left' | 'up-left';
export type AnimationState = 'idle' | 'walk' | 'run' | 'fish' | 'dig' | 'chop' | 'pick' | 'plant' | 'sleep' | 'sit' | 'hurt';

export interface AnimationFrame {
  cellX: number;        // Column in 64x64 grid
  cellY: number;        // Row in 64x64 grid
  duration: number;     // Milliseconds to display frame
}

export interface AnimationSequence {
  name: string;
  frames: AnimationFrame[];
  loop: boolean;
  speed: number;        // Multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double)
}

export interface CharacterAnimations {
  [state: string]: {
    [direction: string]: AnimationSequence;
  };
}

/**
 * AnimationPlayer handles frame-by-frame animation playback
 */
export class AnimationPlayer {
  private currentState: AnimationState = 'idle';
  private currentDirection: Direction = 'down';
  private currentFrameIndex: number = 0;
  private elapsedTime: number = 0;
  private isPlaying: boolean = true;
  private animations: CharacterAnimations;

  constructor(animations: CharacterAnimations) {
    this.animations = animations;
  }

  /**
   * Update animation based on elapsed time (call every frame/tick)
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  update(deltaTime: number): void {
    if (!this.isPlaying) return;

    const currentSequence = this.getCurrentSequence();
    if (!currentSequence || currentSequence.frames.length === 0) return;

    // Apply speed multiplier
    this.elapsedTime += deltaTime * currentSequence.speed;

    const currentFrame = currentSequence.frames[this.currentFrameIndex];
    if (!currentFrame) return;

    // Check if we should advance to next frame
    if (this.elapsedTime >= currentFrame.duration) {
      this.elapsedTime -= currentFrame.duration;
      this.currentFrameIndex++;

      // Handle loop
      if (this.currentFrameIndex >= currentSequence.frames.length) {
        if (currentSequence.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = currentSequence.frames.length - 1;
          this.isPlaying = false;
        }
      }
    }
  }

  /**
   * Get current frame data
   */
  getCurrentFrame(): AnimationFrame | null {
    const sequence = this.getCurrentSequence();
    if (!sequence) return null;
    return sequence.frames[this.currentFrameIndex] || null;
  }

  /**
   * Get current animation sequence
   */
  private getCurrentSequence(): AnimationSequence | null {
    const stateAnims = this.animations[this.currentState];
    if (!stateAnims) return null;
    return stateAnims[this.currentDirection] || null;
  }

  /**
   * Change animation state (idle, walk, run, etc.)
   */
  setState(state: AnimationState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.currentFrameIndex = 0;
      this.elapsedTime = 0;
      this.isPlaying = true;
    }
  }

  /**
   * Change character direction
   */
  setDirection(direction: Direction): void {
    if (this.currentDirection !== direction) {
      this.currentDirection = direction;
      this.currentFrameIndex = 0;
      this.elapsedTime = 0;
    }
  }

  /**
   * Pause/resume animation
   */
  setPaused(paused: boolean): void {
    this.isPlaying = !paused;
  }

  /**
   * Get current state and direction
   */
  getState(): { state: AnimationState; direction: Direction } {
    return {
      state: this.currentState,
      direction: this.currentDirection,
    };
  }

  /**
   * Get current frame index (for debugging)
   */
  getFrameIndex(): number {
    return this.currentFrameIndex;
  }

  /**
   * Reset animation to start
   */
  reset(): void {
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.isPlaying = true;
  }
}

/**
 * Pre-built animation sequences for Mana Seed Farmer sprites
 * Based on farmer base animation guide.png cell reference
 * Each direction has 8 frames (up, up-right, right, down-right, down, down-left, left, up-left)
 */
export const MANA_SEED_ANIMATIONS: CharacterAnimations = {
  idle: {
    up: { name: 'idle-up', frames: [{ cellX: 0, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    'up-right': { name: 'idle-upright', frames: [{ cellX: 1, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    right: { name: 'idle-right', frames: [{ cellX: 2, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    'down-right': { name: 'idle-downright', frames: [{ cellX: 3, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    down: { name: 'idle-down', frames: [{ cellX: 4, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    'down-left': { name: 'idle-downleft', frames: [{ cellX: 5, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    left: { name: 'idle-left', frames: [{ cellX: 6, cellY: 0, duration: 500 }], loop: true, speed: 1 },
    'up-left': { name: 'idle-upleft', frames: [{ cellX: 7, cellY: 0, duration: 500 }], loop: true, speed: 1 },
  },

  walk: {
    up: {
      name: 'walk-up',
      frames: [
        { cellX: 0, cellY: 1, duration: 100 },
        { cellX: 1, cellY: 1, duration: 100 },
        { cellX: 2, cellY: 1, duration: 100 },
        { cellX: 3, cellY: 1, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    'up-right': {
      name: 'walk-upright',
      frames: [
        { cellX: 4, cellY: 1, duration: 100 },
        { cellX: 5, cellY: 1, duration: 100 },
        { cellX: 6, cellY: 1, duration: 100 },
        { cellX: 7, cellY: 1, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    right: {
      name: 'walk-right',
      frames: [
        { cellX: 8, cellY: 1, duration: 100 },
        { cellX: 9, cellY: 1, duration: 100 },
        { cellX: 10, cellY: 1, duration: 100 },
        { cellX: 11, cellY: 1, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    'down-right': {
      name: 'walk-downright',
      frames: [
        { cellX: 12, cellY: 1, duration: 100 },
        { cellX: 13, cellY: 1, duration: 100 },
        { cellX: 14, cellY: 1, duration: 100 },
        { cellX: 15, cellY: 1, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    down: {
      name: 'walk-down',
      frames: [
        { cellX: 0, cellY: 2, duration: 100 },
        { cellX: 1, cellY: 2, duration: 100 },
        { cellX: 2, cellY: 2, duration: 100 },
        { cellX: 3, cellY: 2, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    'down-left': {
      name: 'walk-downleft',
      frames: [
        { cellX: 4, cellY: 2, duration: 100 },
        { cellX: 5, cellY: 2, duration: 100 },
        { cellX: 6, cellY: 2, duration: 100 },
        { cellX: 7, cellY: 2, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    left: {
      name: 'walk-left',
      frames: [
        { cellX: 8, cellY: 2, duration: 100 },
        { cellX: 9, cellY: 2, duration: 100 },
        { cellX: 10, cellY: 2, duration: 100 },
        { cellX: 11, cellY: 2, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
    'up-left': {
      name: 'walk-upleft',
      frames: [
        { cellX: 12, cellY: 2, duration: 100 },
        { cellX: 13, cellY: 2, duration: 100 },
        { cellX: 14, cellY: 2, duration: 100 },
        { cellX: 15, cellY: 2, duration: 100 },
      ],
      loop: true,
      speed: 1,
    },
  },

  run: {
    up: {
      name: 'run-up',
      frames: [
        { cellX: 0, cellY: 3, duration: 80 },
        { cellX: 1, cellY: 3, duration: 80 },
        { cellX: 2, cellY: 3, duration: 80 },
        { cellX: 3, cellY: 3, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    'up-right': {
      name: 'run-upright',
      frames: [
        { cellX: 4, cellY: 3, duration: 80 },
        { cellX: 5, cellY: 3, duration: 80 },
        { cellX: 6, cellY: 3, duration: 80 },
        { cellX: 7, cellY: 3, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    right: {
      name: 'run-right',
      frames: [
        { cellX: 8, cellY: 3, duration: 80 },
        { cellX: 9, cellY: 3, duration: 80 },
        { cellX: 10, cellY: 3, duration: 80 },
        { cellX: 11, cellY: 3, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    'down-right': {
      name: 'run-downright',
      frames: [
        { cellX: 12, cellY: 3, duration: 80 },
        { cellX: 13, cellY: 3, duration: 80 },
        { cellX: 14, cellY: 3, duration: 80 },
        { cellX: 15, cellY: 3, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    down: {
      name: 'run-down',
      frames: [
        { cellX: 0, cellY: 4, duration: 80 },
        { cellX: 1, cellY: 4, duration: 80 },
        { cellX: 2, cellY: 4, duration: 80 },
        { cellX: 3, cellY: 4, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    'down-left': {
      name: 'run-downleft',
      frames: [
        { cellX: 4, cellY: 4, duration: 80 },
        { cellX: 5, cellY: 4, duration: 80 },
        { cellX: 6, cellY: 4, duration: 80 },
        { cellX: 7, cellY: 4, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    left: {
      name: 'run-left',
      frames: [
        { cellX: 8, cellY: 4, duration: 80 },
        { cellX: 9, cellY: 4, duration: 80 },
        { cellX: 10, cellY: 4, duration: 80 },
        { cellX: 11, cellY: 4, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
    'up-left': {
      name: 'run-upleft',
      frames: [
        { cellX: 12, cellY: 4, duration: 80 },
        { cellX: 13, cellY: 4, duration: 80 },
        { cellX: 14, cellY: 4, duration: 80 },
        { cellX: 15, cellY: 4, duration: 80 },
      ],
      loop: true,
      speed: 1,
    },
  },

  // Simplified non-directional animations
  sleep: {
    down: {
      name: 'sleep',
      frames: [{ cellX: 0, cellY: 12, duration: 500 }],
      loop: true,
      speed: 1,
    },
    up: { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    right: { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    left: { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'up-right': { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'down-right': { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'down-left': { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'up-left': { name: 'sleep', frames: [{ cellX: 0, cellY: 12, duration: 500 }], loop: true, speed: 1 },
  },

  sit: {
    down: {
      name: 'sit',
      frames: [{ cellX: 1, cellY: 12, duration: 500 }],
      loop: true,
      speed: 1,
    },
    up: { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    right: { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    left: { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'up-right': { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'down-right': { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'down-left': { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
    'up-left': { name: 'sit', frames: [{ cellX: 1, cellY: 12, duration: 500 }], loop: true, speed: 1 },
  },
};
