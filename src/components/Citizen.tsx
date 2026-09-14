/**
 * Citizen.tsx
 * Represents an AI worker/NPC in the town
 * Displays animated character sprite with name, role, and current task state
 */

import React, { useMemo } from 'react';
import CharacterSheet from './CharacterSheet';
import { AnimationState, Direction } from '../utils/AnimationPlayer';
import '../styles/Citizen.css';

export interface CitizenProps {
  /** Unique identifier for the citizen */
  id: string;
  /** Display name */
  name: string;
  /** Job/role (Farmer, Builder, Scout, etc.) */
  role?: string;
  /** Current animation state (idle, walk, run, fish, dig, chop, pick, plant, sleep, sit, hurt) */
  animationState?: AnimationState;
  /** Facing direction */
  direction?: Direction;
  /** Color preset (default, fairSkin, darkSkin, rusticFarmer, forest) */
  colorPreset?: string;
  /** Current task being performed */
  currentTask?: string;
  /** Whether the citizen is available for new tasks */
  isAvailable?: boolean;
  /** Display size in pixels (default 32) */
  displaySize?: number;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Paused state */
  paused?: boolean;
  /** Callback when citizen is clicked */
  onClick?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Citizen component - displays an animated worker/NPC
 * Integrates CharacterSheet for sprite rendering with task/status information
 */
const Citizen: React.FC<CitizenProps> = ({
  id,
  name,
  role = 'Worker',
  animationState = 'idle',
  direction = 'down',
  colorPreset = 'default',
  currentTask = '',
  isAvailable = true,
  displaySize = 32,
  animationSpeed = 1,
  paused = false,
  onClick,
  className = '',
}) => {
  // Determine animation state based on current task
  const effectiveAnimationState = useMemo(() => {
    // Map task names to animation states
    const taskAnimationMap: Record<string, AnimationState> = {
      fishing: 'fish',
      digging: 'dig',
      chopping: 'chop',
      picking: 'pick',
      planting: 'plant',
      sleeping: 'sleep',
      sitting: 'sit',
      hurt: 'hurt',
      walk: 'walk',
      run: 'run',
    };

    if (currentTask && taskAnimationMap[currentTask.toLowerCase()]) {
      return taskAnimationMap[currentTask.toLowerCase()];
    }

    return animationState;
  }, [currentTask, animationState]);

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const statusClass = isAvailable ? 'available' : 'busy';

  return (
    <div
      className={`citizen ${statusClass} ${className}`}
      data-citizen-id={id}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <CharacterSheet
        name={name}
        animationState={effectiveAnimationState}
        direction={direction}
        colorPreset={colorPreset}
        displaySize={displaySize}
        animationSpeed={animationSpeed}
        paused={paused}
        className="citizen-sprite"
      />

      <div className="citizen-info">
        <div className="citizen-role">{role}</div>
        {currentTask && <div className="citizen-task">{currentTask}</div>}
      </div>

      {!isAvailable && <div className="citizen-busy-indicator">⚙️</div>}
    </div>
  );
};

export default Citizen;
