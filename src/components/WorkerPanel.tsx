/**
 * WorkerPanel.tsx
 * Displays active workers/citizens with management controls
 * Shows citizen list, selection, color customization, and task assignment
 */

import React, { useState, useCallback, useMemo } from 'react';
import Citizen, { CitizenProps } from './Citizen';
import { CHARACTER_COLOR_PRESETS } from '../utils/CharacterColorMapper';
import '../styles/WorkerPanel.css';

export interface WorkerPanelProps {
  /** Array of citizen data */
  citizens: Array<Omit<CitizenProps, 'onClick'>>;
  /** Callback when a citizen is selected */
  onSelectCitizen?: (citizenId: string) => void;
  /** Callback when color preset changes */
  onColorPresetChange?: (citizenId: string, preset: string) => void;
  /** Currently selected citizen ID */
  selectedCitizenId?: string;
  /** Show detailed view (vs. compact) */
  detailedView?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * WorkerPanel component - displays and manages active citizens
 * Provides citizen selection, color customization, and status tracking
 */
const WorkerPanel: React.FC<WorkerPanelProps> = ({
  citizens,
  onSelectCitizen,
  onColorPresetChange,
  selectedCitizenId,
  detailedView = false,
  className = '',
}) => {
  const [previewCitizenId, setPreviewCitizenId] = useState<string | null>(
    selectedCitizenId || (citizens.length > 0 ? citizens[0].id : null)
  );

  const previewCitizen = useMemo(
    () => citizens.find((c) => c.id === previewCitizenId),
    [citizens, previewCitizenId]
  );

  const handleCitizenClick = useCallback(
    (citizenId: string) => {
      setPreviewCitizenId(citizenId);
      if (onSelectCitizen) {
        onSelectCitizen(citizenId);
      }
    },
    [onSelectCitizen]
  );

  const handleColorPresetChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (previewCitizenId && onColorPresetChange) {
        onColorPresetChange(previewCitizenId, event.target.value);
      }
    },
    [previewCitizenId, onColorPresetChange]
  );

  const availableCitizens = useMemo(
    () => citizens.filter((c) => c.isAvailable !== false),
    [citizens]
  );

  const busyCitizens = useMemo(
    () => citizens.filter((c) => c.isAvailable === false),
    [citizens]
  );

  const presetOptions = useMemo(
    () => Object.entries(CHARACTER_COLOR_PRESETS).map(([key, preset]) => ({
      value: key,
      label: preset.name,
    })),
    []
  );

  const workerPanelClass = detailedView ? 'detailed' : 'compact';

  return (
    <div className={`worker-panel ${workerPanelClass} ${className}`}>
      <div className="worker-panel-header">
        <h3 className="worker-panel-title">
          Citizens ({citizens.length})
        </h3>
        <div className="worker-status">
          <span className="status-badge available-badge">
            Available: {availableCitizens.length}
          </span>
          <span className="status-badge busy-badge">
            Busy: {busyCitizens.length}
          </span>
        </div>
      </div>

      <div className="worker-panel-content">
        {/* Preview Section */}
        {previewCitizen && (
          <div className="worker-preview">
            <div className="preview-character">
              <Citizen
                {...previewCitizen}
                displaySize={detailedView ? 64 : 48}
                className="large"
              />
            </div>

            <div className="preview-controls">
              <div className="preview-info">
                <h4 className="preview-name">{previewCitizen.name}</h4>
                <p className="preview-role">{previewCitizen.role || 'Worker'}</p>
                {previewCitizen.currentTask && (
                  <p className="preview-task">
                    <span className="task-label">Task:</span>{' '}
                    {previewCitizen.currentTask}
                  </p>
                )}
              </div>

              <div className="color-preset-selector">
                <label htmlFor="color-preset" className="preset-label">
                  Appearance:
                </label>
                <select
                  id="color-preset"
                  className="preset-select"
                  value={previewCitizen.colorPreset || 'default'}
                  onChange={handleColorPresetChange}
                >
                  {presetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Citizens List Section */}
        <div className="workers-list">
          {availableCitizens.length > 0 && (
            <div className="workers-section">
              <h4 className="workers-section-title available">
                Available ({availableCitizens.length})
              </h4>
              <div className="citizens-grid">
                {availableCitizens.map((citizen) => (
                  <div
                    key={citizen.id}
                    className={`citizen-item ${
                      previewCitizenId === citizen.id ? 'selected' : ''
                    }`}
                    onClick={() => handleCitizenClick(citizen.id)}
                  >
                    <Citizen
                      {...citizen}
                      displaySize={32}
                      onClick={() => handleCitizenClick(citizen.id)}
                      className="small"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {busyCitizens.length > 0 && (
            <div className="workers-section">
              <h4 className="workers-section-title busy">
                Busy ({busyCitizens.length})
              </h4>
              <div className="citizens-grid">
                {busyCitizens.map((citizen) => (
                  <div
                    key={citizen.id}
                    className={`citizen-item ${
                      previewCitizenId === citizen.id ? 'selected' : ''
                    }`}
                    onClick={() => handleCitizenClick(citizen.id)}
                  >
                    <Citizen
                      {...citizen}
                      displaySize={32}
                      onClick={() => handleCitizenClick(citizen.id)}
                      className="small"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {citizens.length === 0 && (
            <div className="no-workers">
              <p>No workers available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerPanel;
