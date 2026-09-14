/**
 * Settings.tsx
 * Game configuration panel for animation speed, grid size, tile size, and other parameters
 * Provides UI controls for tuning game behavior and visual parameters
 */

import React, { useState, useCallback } from 'react';
import '../styles/Settings.css';

export interface SettingsProps {
  /** Animation speed multiplier (0.5 = half, 2.0 = double) */
  animationSpeed?: number;
  /** Callback when animation speed changes */
  onAnimationSpeedChange?: (speed: number) => void;
  /** Grid size in pixels */
  gridSize?: number;
  /** Callback when grid size changes */
  onGridSizeChange?: (size: number) => void;
  /** Individual tile size in pixels */
  tileSize?: number;
  /** Callback when tile size changes */
  onTileSizeChange?: (size: number) => void;
  /** Maximum workers to display */
  maxWorkers?: number;
  /** Callback when max workers changes */
  onMaxWorkersChange?: (max: number) => void;
  /** Master volume (0-100) */
  masterVolume?: number;
  /** Callback when master volume changes */
  onMasterVolumeChange?: (volume: number) => void;
  /** Sound effects enabled */
  soundEnabled?: boolean;
  /** Callback when sound toggle changes */
  onSoundEnabledChange?: (enabled: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Settings component - game configuration and tuning
 * Provides controls for animation speed, grid/tile sizing, worker limits, and audio
 */
const Settings: React.FC<SettingsProps> = ({
  animationSpeed = 1,
  onAnimationSpeedChange,
  gridSize = 16,
  onGridSizeChange,
  tileSize = 32,
  onTileSizeChange,
  maxWorkers = 10,
  onMaxWorkersChange,
  masterVolume = 80,
  onMasterVolumeChange,
  soundEnabled = true,
  onSoundEnabledChange,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAnimationSpeedChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      if (onAnimationSpeedChange) {
        onAnimationSpeedChange(value);
      }
    },
    [onAnimationSpeedChange]
  );

  const handleGridSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (onGridSizeChange) {
        onGridSizeChange(value);
      }
    },
    [onGridSizeChange]
  );

  const handleTileSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (onTileSizeChange) {
        onTileSizeChange(value);
      }
    },
    [onTileSizeChange]
  );

  const handleMaxWorkersChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (onMaxWorkersChange) {
        onMaxWorkersChange(value);
      }
    },
    [onMaxWorkersChange]
  );

  const handleMasterVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (onMasterVolumeChange) {
        onMasterVolumeChange(value);
      }
    },
    [onMasterVolumeChange]
  );

  const handleSoundEnabledChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSoundEnabledChange) {
        onSoundEnabledChange(event.target.checked);
      }
    },
    [onSoundEnabledChange]
  );

  return (
    <div className={`settings-panel ${isCollapsed ? 'collapsed' : ''} ${className}`}>
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <button
          className="settings-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand Settings' : 'Collapse Settings'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="settings-content">
          {/* Animation Controls */}
          <div className="settings-group">
            <h3 className="settings-group-title">Animation</h3>

            <div className="settings-item">
              <label htmlFor="animation-speed">
                <span>Animation Speed</span>
                <span className="settings-value">{animationSpeed.toFixed(1)}x</span>
              </label>
              <input
                id="animation-speed"
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={animationSpeed}
                onChange={handleAnimationSpeedChange}
              />
              <div className="settings-hint">Adjust character animation playback speed</div>
            </div>
          </div>

          <div className="settings-divider"></div>

          {/* Grid & Display Controls */}
          <div className="settings-group">
            <h3 className="settings-group-title">Display</h3>

            <div className="settings-item">
              <label htmlFor="grid-size">
                <span>Grid Size</span>
                <span className="settings-value">{gridSize}px</span>
              </label>
              <input
                id="grid-size"
                type="range"
                min="8"
                max="32"
                step="4"
                value={gridSize}
                onChange={handleGridSizeChange}
              />
              <div className="settings-hint">Town grid cell size</div>
            </div>

            <div className="settings-item">
              <label htmlFor="tile-size">
                <span>Tile Size</span>
                <span className="settings-value">{tileSize}px</span>
              </label>
              <input
                id="tile-size"
                type="range"
                min="16"
                max="64"
                step="4"
                value={tileSize}
                onChange={handleTileSizeChange}
              />
              <div className="settings-hint">Individual tile display size</div>
            </div>
          </div>

          <div className="settings-divider"></div>

          {/* Worker Controls */}
          <div className="settings-group">
            <h3 className="settings-group-title">Workers</h3>

            <div className="settings-item">
              <label htmlFor="max-workers">
                <span>Max Workers Displayed</span>
                <span className="settings-value">{maxWorkers}</span>
              </label>
              <input
                id="max-workers"
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxWorkers}
                onChange={handleMaxWorkersChange}
              />
              <div className="settings-hint">Maximum workers shown in worker panel</div>
            </div>
          </div>

          <div className="settings-divider"></div>

          {/* Audio Controls */}
          <div className="settings-group">
            <h3 className="settings-group-title">Audio</h3>

            <div className="settings-item">
              <label htmlFor="sound-enabled" className="checkbox-label">
                <input
                  id="sound-enabled"
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={handleSoundEnabledChange}
                />
                <span>Enable Sound Effects</span>
              </label>
            </div>

            {soundEnabled && (
              <div className="settings-item">
                <label htmlFor="master-volume">
                  <span>Master Volume</span>
                  <span className="settings-value">{masterVolume}%</span>
                </label>
                <input
                  id="master-volume"
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={masterVolume}
                  onChange={handleMasterVolumeChange}
                />
                <div className="settings-hint">Overall game audio volume</div>
              </div>
            )}
          </div>

          <div className="settings-divider"></div>

          {/* Footer Info */}
          <div className="settings-footer">
            <p className="settings-info">DelphiTown v1 — Settings</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
