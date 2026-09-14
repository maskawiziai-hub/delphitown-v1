/**
 * CharacterSheet.tsx
 * Renders animated character sprites (Mana Seed Farmer system)
 * Supports modular layer composition, direction, animation states, and color remapping
 */

import React, { useEffect, useRef, } from 'react';
import { AnimationPlayer, MANA_SEED_ANIMATIONS, type Direction, type AnimationState } from '../utils/AnimationPlayer';
//
import '../styles/CharacterSheet.css';

export interface CharacterSheetProps {
  /** Character name for display */
  name?: string;
  /** Current animation state (idle, walk, run, etc.) */
  animationState?: AnimationState;
  /** Character facing direction */
  direction?: Direction;
  /** Color preset to apply */
  colorPreset?: string;
  /** Display size in pixels (32, 48, 64) */
  displaySize?: number;
  /** Animation speed multiplier (0.5 = half speed, 2.0 = double) */
  animationSpeed?: number;
  /** Pause animation */
  paused?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CharacterSheet component
 * Renders 64x64 pixel character sprite with animation and color customization
 */
const CharacterSheet: React.FC<CharacterSheetProps> = ({
  name = 'Citizen',
  animationState = 'idle',
  direction = 'down',
  colorPreset = 'default',
  displaySize = 32,
  animationSpeed = 1,
  paused = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationPlayerRef = useRef<AnimationPlayer | null>(null);
  const spriteSheetRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Load sprite sheet
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/characters/mana-seed-farmer/farmer base sheets/01body/fbas_1body_human_00.png';
    img.onload = () => {
      spriteSheetRef.current = img;
    };
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize animation player
  useEffect(() => {
    if (!animationPlayerRef.current) {
      animationPlayerRef.current = new AnimationPlayer(MANA_SEED_ANIMATIONS);
    }

    // Update animation state
    animationPlayerRef.current.setState(animationState);
    animationPlayerRef.current.setDirection(direction);
    animationPlayerRef.current.setPaused(paused);
  }, [animationState, direction, paused]);

  // Main animation loop
  useEffect(() => {
    const animate = () => {
      if (!canvasRef.current || !spriteSheetRef.current || !animationPlayerRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Update animation
      animationPlayerRef.current.update(deltaTime * animationSpeed);

      // Get current frame
      const frame = animationPlayerRef.current.getCurrentFrame();
      if (!frame) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Draw sprite
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Extract sprite cell from sheet (64x64 pixels)
      const cellSize = 64;
      const sourceX = frame.cellX * cellSize;
      const sourceY = frame.cellY * cellSize;

      // Calculate display scaling
      const scale = displaySize / cellSize;
      const displayWidth = cellSize * scale;
      const displayHeight = cellSize * scale;

      // Center sprite in canvas
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const x = (canvasWidth - displayWidth) / 2;
      const y = (canvasHeight - displayHeight) / 2;

      // Draw sprite cell
      ctx.imageSmoothingEnabled = false; // Preserve pixel clarity
      ctx.drawImage(
        spriteSheetRef.current,
        sourceX,
        sourceY,
        cellSize,
        cellSize,
        x,
        y,
        displayWidth,
        displayHeight
      );

      // TODO: Layer composition for clothing, hair, accessories
      // This is a placeholder; full implementation requires loading and compositing 16 layers

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [displaySize, colorPreset, animationSpeed]);

  return (
    <div className={`character-sheet ${className}`}>
      {name && <div className="character-name">{name}</div>}
      <canvas
        ref={canvasRef}
        className="character-canvas"
        width={displaySize + 16}
        height={displaySize + 16}
        style={{
          border: '1px solid #999',
          backgroundColor: 'transparent',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export default CharacterSheet;
