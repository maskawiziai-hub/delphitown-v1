/**
 * DynamicTaskForm Component
 *
 * Complete task creation form that:
 * 1. Lets user select citizen
 * 2. Select worker type
 * 3. Select task type (filtered by worker)
 * 4. Auto-generates form fields from task schema
 * 5. Validates using Ajv
 * 6. Creates task in Supabase
 *
 * Props:
 * - citizens: list of available citizens
 * - onSuccess: callback when task is successfully created
 * - onError: callback when task creation fails
 */

import { FC, useState, useEffect } from "react";
import type { Citizen, WorkerType, TaskType, TaskForm } from "../types";
import { WORKER_TYPE_CONFIG, getTaskTypeConfig } from "../constants/architecture";
import * as taskService from "../services/taskService";
import { useTaskValidation } from "../hooks/useTaskValidation";
import { FormField } from "./FormField";
import { TaskTypeSelector } from "./TaskTypeSelector";
import styles from "./DynamicTaskForm.module.css";

interface DynamicTaskFormProps {
  citizens: Citizen[];
  onSuccess?: (taskId: string) => void;
  onError?: (error: string) => void;
}

export const DynamicTaskForm: FC<DynamicTaskFormProps> = ({ citizens, onSuccess, onError }) => {
  // Form state
  const [formState, setFormState] = useState<TaskForm>({
    citizenId: "",
    selectedTaskType: null,
    formData: {},
    errors: {},
    isLoading: false,
    isSuccess: false,
    errorMessage: null,
  });

  // Separate state for worker type selection
  const [selectedWorkerType, setSelectedWorkerType] = useState<WorkerType | null>(null);

  // Validation hook
  const { errors: validationErrors, validate, clearErrors } = useTaskValidation(formState.selectedTaskType);

  // Auto-generate form fields from selected task schema
  useEffect(() => {
    if (formState.selectedTaskType) {
      const config = getTaskTypeConfig(formState.selectedTaskType);
      if (!config) return;
      const newFormData: Record<string, unknown> = {};

      // Initialize all required fields in form data
      Object.entries(config.payloadSchema.properties).forEach(([key]) => {
        newFormData[key] = formState.formData[key] || "";
      });

      setFormState((prev) => ({
        ...prev,
        formData: newFormData,
        errors: {},
      }));

      clearErrors();
    }
  }, [formState.selectedTaskType]);

  const handleCitizenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState((prev) => ({ ...prev, citizenId: e.target.value }));
  };

  const handleWorkerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWorkerType = e.target.value;
    setSelectedWorkerType(newWorkerType);
    // Reset task type when worker type changes
    setFormState((prev) => ({
      ...prev,
      selectedTaskType: null,
      formData: {},
      errors: {},
    }));
  };

  const handleTaskTypeSelect = (taskType: TaskType) => {
    setFormState((prev) => ({
      ...prev,
      selectedTaskType: taskType,
    }));
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [fieldName]: value,
      },
      errors: {
        ...prev.errors,
        [fieldName]: "", // Clear error for this field when user changes it
      },
    }));
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.citizenId) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: "Please select a citizen",
      }));
      return;
    }

    if (!formState.selectedTaskType) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: "Please select a task type",
      }));
      return;
    }

    // Validate using Ajv
    const validationResult = validate(formState.formData);
    if (!validationResult.isValid) {
      setFormState((prev) => ({
        ...prev,
        errors: validationResult.errors,
        errorMessage: "Please fix the errors below",
      }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      // Create task via service
      const result = await taskService.createTask({
        citizen_id: formState.citizenId,
        task_type: formState.selectedTaskType,
        payload: formState.formData,
      });

      // Success!
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        formData: {},
        selectedTaskType: null,
        errors: {},
        errorMessage: null,
        citizenId: "",
      }));

      onSuccess?.(result.id);

      // Auto-reset success message after 3 seconds
      setTimeout(() => {
        setFormState((prev) => ({
          ...prev,
          isSuccess: false,
        }));
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create task";

      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: errorMsg,
      }));

      onError?.(errorMsg);
    }
  };

  // Get available task types for selected worker type
  const activeConfig = formState.selectedTaskType
    ? getTaskTypeConfig(formState.selectedTaskType)
    : undefined;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create New Task</h2>

      {formState.isSuccess && (
        <div className={styles.successMessage}>✓ Task created successfully!</div>
      )}

      {formState.errorMessage && (
        <div className={styles.errorMessage}>{formState.errorMessage}</div>
      )}

      <form onSubmit={e => void handleSubmit(e)} className={styles.form}>
        {/* Citizen Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="citizen" className={styles.label}>
            Citizen
            <span className={styles.required}>*</span>
          </label>
          <select
            id="citizen"
            className={styles.select}
            value={formState.citizenId}
            onChange={handleCitizenChange}
            required
            disabled={formState.isLoading}
          >
            <option value="">Select a citizen...</option>
            {citizens.map((citizen) => (
              <option key={citizen.id} value={citizen.id}>
                {citizen.name} ({citizen.citizen_type})
              </option>
            ))}
          </select>
        </div>

        {/* Worker Type Selection */}
        {formState.citizenId && (
          <div className={styles.formGroup}>
            <label htmlFor="workerType" className={styles.label}>
              Worker Type
              <span className={styles.required}>*</span>
            </label>
            <select
              id="workerType"
              className={styles.select}
              value={selectedWorkerType || ""}
              onChange={handleWorkerTypeChange}
              required
              disabled={formState.isLoading}
            >
              <option value="">Select a worker type...</option>
              {Object.entries(WORKER_TYPE_CONFIG).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.name} ({config.icon})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Task Type Selection */}
        {selectedWorkerType && (
          <TaskTypeSelector
            selectedWorkerType={selectedWorkerType}
            selectedTaskType={formState.selectedTaskType}
            onSelect={handleTaskTypeSelect}
          />
        )}

        {/* Dynamic Form Fields */}
        {formState.selectedTaskType && (
          <div className={styles.dynamicFields}>
            <h3 className={styles.fieldsTitle}>Task Details</h3>

            {Object.entries(activeConfig?.payloadSchema.properties ?? {}).map(
              ([fieldName, fieldSchema]) => {
                const isRequired = (
                  activeConfig?.payloadSchema.required ?? []
                ).includes(fieldName);

                // Determine field type from schema
                let fieldType: "text" | "number" | "select" | "checkbox" | "array" = "text";
                if ((fieldSchema as Record<string, unknown>).type === "number") {
                  fieldType = "number";
                } else if ((fieldSchema as Record<string, unknown>).enum) {
                  fieldType = "select";
                } else if ((fieldSchema as Record<string, unknown>).type === "boolean") {
                  fieldType = "checkbox";
                } else if ((fieldSchema as Record<string, unknown>).type === "array") {
                  fieldType = "array";
                }

                // Convert enum to options
                let options: Array<{ label: string; value: string }> = [];
                if ((fieldSchema as Record<string, unknown>).enum) {
                  options = ((fieldSchema as Record<string, unknown>).enum as string[]).map((e) => ({
                    label: e,
                    value: e,
                  }));
                }

                return (
                  <FormField
                    key={fieldName}
                    name={fieldName}
                    type={fieldType}
                    label={fieldName.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")}
                    value={formState.formData[fieldName]}
                    onChange={handleFieldChange}
                    error={formState.errors[fieldName] || validationErrors[fieldName]}
                    required={isRequired}
                    options={options}
                    description={(fieldSchema as Record<string, unknown>).description as string | undefined}
                    min={(fieldSchema as Record<string, unknown>).minimum as number | undefined}
                    max={(fieldSchema as Record<string, unknown>).maximum as number | undefined}
                  />
                );
              }
            )}
          </div>
        )}

        {/* Submit Button */}
        {formState.selectedTaskType && (
          <button type="submit" className={styles.submitButton} disabled={formState.isLoading}>
            {formState.isLoading ? "Creating Task..." : "Create Task"}
          </button>
        )}
      </form>
    </div>
  );
};
