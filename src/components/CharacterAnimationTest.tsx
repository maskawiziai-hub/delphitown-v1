/**
 * CharacterAnimationTest.tsx
 * Test component to verify character animation loop functions correctly
 * Displays a character with interactive controls to test different animation states
 */

import React, { useState } from 'react';
import CharacterSheet from './CharacterSheet';
import Citizen from './Citizen';
import { AnimationState, Direction } from '../utils/AnimationPlayer';
import '../styles/CharacterAnimationTest.css';

type TestMode = 'character-sheet' | 'citizen';

/**
 * CharacterAnimationTest component - verify animation system works
 */
const CharacterAnimationTest: React.FC = () => {
  const [testMode, setTestMode] = useState<TestMode>('character-sheet');
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [direction, setDirection] = useState<Direction>('down');
  const [displaySize, setDisplaySize] = useState(32);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [colorPreset, setColorPreset] = useState('default');
  const [paused, setPaused] = useState(false);

  const animationStates: AnimationState[] = [
    'idle',
    'walk',
    'run',
    'fish',
    'dig',
    'chop',
    'pick',
    'plant',
    'sleep',
    'sit',
    'hurt',
  ];

  const directions: Direction[] = [
    'up',
    'up-right',
    'right',
    'down-right',
    'down',
    'down-left',
    'left',
    'up-left',
  ];

  const colorPresets = [
    'default',
    'fairSkin',
    'darkSkin',
    'rusticFarmer',
    'forest',
  ];

  return (
    <div className="animation-test-container">
      <h1 className="test-title">Character Animation Test</h1>

      <div className="test-content">
        {/* Controls Panel */}
        <div className="test-controls">
          <h2 className="controls-title">Test Controls</h2>

          {/* Mode Selection */}
          <div className="control-group">
            <label className="control-label">Test Mode:</label>
            <div className="control-buttons">
              <button
                className={`mode-button ${testMode === 'character-sheet' ? 'active' : ''}`}
                onClick={() => setTestMode('character-sheet')}
              >
                CharacterSheet
              </button>
              <button
                className={`mode-button ${testMode === 'citizen' ? 'active' : ''}`}
                onClick={() => setTestMode('citizen')}
              >
                Citizen
              </button>
            </div>
          </div>

          {/* Animation State Selection */}
          <div className="control-group">
            <label className="control-label">Animation State:</label>
            <div className="state-buttons">
              {animationStates.map((state) => (
                <button
                  key={state}
                  className={`state-button ${animationState === state ? 'active' : ''}`}
                  onClick={() => setAnimationState(state)}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Direction Selection */}
          <div className="control-group">
            <label className="control-label">Direction:</label>
            <div className="direction-pad">
              {directions.map((dir) => (
                <button
                  key={dir}
                  className={`direction-button ${direction === dir ? 'active' : ''}`}
                  data-direction={dir}
                  onClick={() => setDirection(dir)}
                  title={dir}
                >
                  {dir.substring(0, 1).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Color Preset Selection */}
          <div className="control-group">
            <label className="control-label">Color Preset:</label>
            <select
              value={colorPreset}
              onChange={(e) => setColorPreset(e.target.value)}
              className="control-select"
            >
              {colorPresets.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          {/* Size Control */}
          <div className="control-group">
            <label className="control-label">
              Display Size: <span className="control-value">{displaySize}px</span>
            </label>
            <input
              type="range"
              min="16"
              max="128"
              step="8"
              value={displaySize}
              onChange={(e) => setDisplaySize(parseInt(e.target.value))}
              className="control-slider"
            />
          </div>

          {/* Animation Speed Control */}
          <div className="control-group">
            <label className="control-label">
              Animation Speed: <span className="control-value">{animationSpeed.toFixed(2)}x</span>
            </label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="control-slider"
            />
          </div>

          {/* Pause/Play Control */}
          <div className="control-group">
            <button
              className={`control-button play-button ${paused ? 'paused' : 'playing'}`}
              onClick={() => setPaused(!paused)}
            >
              {paused ? '▶ Play' : '⏸ Pause'}
            </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="test-display">
          <h2 className="display-title">Preview (32×32 target size)</h2>

          <div className="character-display">
            {testMode === 'character-sheet' ? (
              <CharacterSheet
                name="Test Character"
                animationState={animationState}
                direction={direction}
                colorPreset={colorPreset}
                displaySize={displaySize}
                animationSpeed={animationSpeed}
                paused={paused}
              />
            ) : (
              <Citizen
                id="test-citizen-1"
                name="Test Citizen"
                role="Tester"
                animationState={animationState}
                direction={direction}
                colorPreset={colorPreset}
                displaySize={displaySize}
                animationSpeed={animationSpeed}
                paused={paused}
                currentTask={`Testing: ${animationState}`}
              />
            )}
          </div>

          <div className="test-info">
            <p>
              <strong>Current State:</strong> {animationState} ({direction})
            </p>
            <p>
              <strong>Display Size:</strong> {displaySize}×{displaySize}px (Scale:{' '}
              {(displaySize / 64).toFixed(2)})
            </p>
            <p>
              <strong>Animation Speed:</strong> {animationSpeed.toFixed(2)}x ({paused ? 'paused' : 'playing'})
            </p>
            <p>
              <strong>Color Preset:</strong> {colorPreset}
            </p>
          </div>
        </div>
      </div>

      <div className="test-notes">
        <h3>Test Checklist</h3>
        <ul>
          <li>✓ Character renders at 32×32 pixels clearly</li>
          <li>✓ Pixel rendering is crisp (no blurring)</li>
          <li>✓ Animation plays smoothly without stuttering</li>
          <li>✓ Direction changes update sprite correctly</li>
          <li>✓ Animation speed multiplier adjusts playback</li>
          <li>✓ Pause/play controls work correctly</li>
          <li>✓ Color presets apply without visual artifacts</li>
          <li>✓ Different animation states transition smoothly</li>
          <li>✓ Display size can scale from 16px to 128px</li>
          <li>✓ CharacterSheet and Citizen components both work</li>
        </ul>
      </div>
    </div>
  );
};

export default CharacterAnimationTest;
