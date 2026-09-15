/**
 * TaskTypeSelector Component
 *
 * Dropdown to select task type, filtered by selected worker type.
 * Shows description, estimated duration, and other metadata.
 *
 * Props:
 * - selectedWorkerType: current selected worker type (filters available tasks)
 * - selectedTaskType: current selected task type
 * - onSelect: callback when task type is selected
 */

import { FC } from "react";
import type { WorkerType, TaskType } from "../types";
import { getTaskTypeConfig, getTaskTypesForWorker } from "../constants/architecture";
import styles from "./TaskTypeSelector.module.css";

interface TaskTypeSelectorProps {
  selectedWorkerType: WorkerType | null;
  selectedTaskType: TaskType | null;
  onSelect: (taskType: TaskType) => void;
}

export const TaskTypeSelector: FC<TaskTypeSelectorProps> = ({
  selectedWorkerType,
  selectedTaskType,
  onSelect,
}) => {
  // Get available task types for the selected worker
  const availableTaskTypes = selectedWorkerType ? getTaskTypesForWorker(selectedWorkerType) : [];

  const selectedConfig = selectedTaskType ? getTaskTypeConfig(selectedTaskType) : null;

  return (
    <div className={styles.container}>
      <label htmlFor="taskType" className={styles.label}>
        Task Type
        <span className={styles.required}>*</span>
      </label>

      <select
        id="taskType"
        className={styles.select}
        value={selectedTaskType || ""}
        onChange={(e) => onSelect(e.target.value)}
        disabled={!selectedWorkerType || availableTaskTypes.length === 0}
      >
        <option value="">Select a task type...</option>
        {availableTaskTypes.map((taskType) => {
          const config = getTaskTypeConfig(taskType);
          if (!config) return null;
          return (
            <option key={taskType} value={taskType}>
              {config.name}
            </option>
          );
        })}
      </select>

      {!selectedWorkerType && (
        <p className={styles.hint}>Select a worker type first</p>
      )}

      {selectedWorkerType && availableTaskTypes.length === 0 && (
        <p className={styles.hint}>This worker type has no available tasks</p>
      )}

      {selectedConfig && (
        <div className={styles.details}>
          <h4 className={styles.detailsTitle}>{selectedConfig.name}</h4>

          <p className={styles.description}>{selectedConfig.description}</p>

          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Estimated Duration:</span>
              <span className={styles.metadataValue}>
                {(selectedConfig.estimatedDurationMs / 1000).toFixed(0)}s
              </span>
            </div>

            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Allowed Workers:</span>
              <span className={styles.metadataValue}>
                {selectedConfig.allowedWorkerTypes.length} type{selectedConfig.allowedWorkerTypes.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Input Fields:</span>
              <span className={styles.metadataValue}>
                {Object.keys(selectedConfig.payloadSchema.properties).length}
              </span>
            </div>
          </div>

          <div className={styles.requiredFields}>
            <h5 className={styles.requiredLabel}>Required Fields:</h5>
            <ul className={styles.requiredList}>
              {(selectedConfig.payloadSchema.required ?? []).map((field: string) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
