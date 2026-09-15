/**
 * FormField Component
 *
 * Generic field renderer that displays different input types based on schema.
 * Supports: text, number, select, checkbox, array inputs
 *
 * Props:
 * - name: field name
 * - type: input type (text, number, select, checkbox, array)
 * - label: display label
 * - value: current field value
 * - onChange: value change handler
 * - error: error message to display
 * - required: is field required
 * - placeholder: input placeholder
 * - options: for select type, array of { label, value }
 * - min/max: for number type
 * - pattern: for text type regex validation
 */

import { FC, ChangeEvent } from "react";
import styles from "./FormField.module.css";

interface FormFieldProps {
  name: string;
  type: "text" | "number" | "select" | "checkbox" | "array";
  label: string;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  min?: number;
  max?: number;
  pattern?: string;
  description?: string;
}

export const FormField: FC<FormFieldProps> = ({
  name,
  type,
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  options,
  min,
  max,
  pattern,
  description,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value: newValue } = e.target;

    if (type === "number") {
      onChange(name, newValue ? parseFloat(newValue) : "");
    } else if (type === "checkbox") {
      onChange(name, (e.target as HTMLInputElement).checked);
    } else {
      onChange(name, newValue);
    }
  };

  const handleArrayChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Split comma-separated values into array
    const arrayValue = e.target.value.split(",").map((item) => item.trim());
    onChange(name, arrayValue);
  };

  const renderField = () => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            name={name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={(value as string) || ""}
            onChange={handleChange}
            placeholder={placeholder}
            pattern={pattern}
            required={required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            name={name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={(value as number) || ""}
            onChange={handleChange}
            min={min}
            max={max}
            required={required}
          />
        );

      case "select":
        return (
          <select
            name={name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={(value as string) || ""}
            onChange={handleChange}
            required={required}
          >
            <option value="">Select {label}...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            name={name}
            className={styles.checkbox}
            checked={(value as boolean) || false}
            onChange={handleChange}
          />
        );

      case "array":
        return (
          <input
            type="text"
            name={name}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
            onChange={handleArrayChange}
            placeholder={placeholder || "Comma-separated values"}
            required={required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.inputWrapper}>{renderField()}</div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
