/**
 * Task Validation Hook
 *
 * Uses Ajv library for JSON Schema validation.
 * Validates task payloads against their defined schemas.
 *
 * Usage:
 * const { isValid, errors, validate } = useTaskValidation(taskType);
 * const isOk = validate(formData);
 * if (!isOk) console.log(errors);
 */

import { useState } from "react";
import Ajv from "ajv";
import type { TaskType } from "../types";
import { getTaskTypeConfig } from "../constants/architecture";

// Initialize Ajv with strict mode
const ajv = new Ajv({
  strict: true,
  validateSchema: true,
});

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Hook for validating task payloads.
 */
export function useTaskValidation(taskType: TaskType | null) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(true);

  function validate(data: Record<string, unknown>): ValidationResult {
    if (!taskType) {
      setErrors({ form: "Task type not selected" });
      setIsValid(false);
      return { isValid: false, errors: { form: "Task type not selected" } };
    }

    try {
      const config = getTaskTypeConfig(taskType);
      if (!config) {
        setErrors({ form: `Unknown task type: ${taskType}` });
        setIsValid(false);
        return { isValid: false, errors: { form: `Unknown task type: ${taskType}` } };
      }

      // Compile the schema
      const validate = ajv.compile(config.payloadSchema as never);

      // Run validation
      const valid = validate(data);

      if (!valid && validate.errors) {
        // Convert Ajv errors to field-specific messages
        const fieldErrors: Record<string, string> = {};

        validate.errors.forEach((error) => {
          const fieldPath = error.instancePath || "";
          const fieldName = fieldPath.split("/").pop() || "form";
          if (fieldErrors[fieldName]) {
            fieldErrors[fieldName] += `; ${error.message ?? 'invalid value'}`;
          } else {
            fieldErrors[fieldName] = error.message ?? 'invalid value';
          }
        });

        setErrors(fieldErrors);
        setIsValid(false);
        return { isValid: false, errors: fieldErrors };
      }

      // Validation passed
      setErrors({});
      setIsValid(true);
      return { isValid: true, errors: {} };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Validation error";
      const formError = { form: errorMessage };
      setErrors(formError);
      setIsValid(false);
      return { isValid: false, errors: formError };
    }
  }

  function clearErrors() {
    setErrors({});
    setIsValid(true);
  }

  return { isValid, errors, validate, clearErrors };
}

/**
 * Alternative: Synchronous validation without hook.
 * Useful for one-off validations.
 */
export function validateTaskPayload(taskType: TaskType, data: Record<string, unknown>): ValidationResult {
  try {
    const config = getTaskTypeConfig(taskType);
    // A custom task type deployed outside the pre-built set has no schema to
    // validate against - say so rather than throwing.
    if (!config) {
      return { isValid: false, errors: { form: `Unknown task type: ${taskType}` } };
    }
    const validate = ajv.compile(config.payloadSchema as never);
    const valid = validate(data);

    if (!valid && validate.errors) {
      const fieldErrors: Record<string, string> = {};
      validate.errors.forEach((error) => {
        const fieldName = error.instancePath?.split("/").pop() || "form";
        fieldErrors[fieldName] = error.message ?? 'invalid value';
      });
      return { isValid: false, errors: fieldErrors };
    }

    return { isValid: true, errors: {} };
  } catch (error) {
    return {
      isValid: false,
      errors: { form: error instanceof Error ? error.message : "Validation error" },
    };
  }
}
