import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { FieldError } from "./alert";

interface FieldShellProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: ReactNode;
}

export function FieldShell({ label, htmlFor, hint, error, required, children }: FieldShellProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="field">
      <label htmlFor={fieldId} className="field__label">
        {label}
        {required ? <span className="field__required" aria-hidden="true"> *</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="field__description">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
}

export function TextField({ label, error, hint, required, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      <input
        id={fieldId}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={hint ? `${fieldId}-hint` : error ? `${fieldId}-error` : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
}

export function TextareaField({ label, error, hint, required, id, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      <textarea
        id={fieldId}
        className="textarea"
        aria-invalid={error ? true : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly placeholder?: string;
}

export function SelectField({
  label,
  error,
  hint,
  required,
  id,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      <select
        id={fieldId}
        className="select"
        aria-invalid={error ? true : undefined}
        required={required}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
