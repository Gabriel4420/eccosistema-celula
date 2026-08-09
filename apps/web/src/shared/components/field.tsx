"use client";
import { useId, useState } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { FieldError } from "./alert";

export type TextFieldMask = "phone" | "email";

const NON_DIGIT = /\D/g;
const WHITESPACE = /\s+/g;

export function maskEmail(value: string): string {
  return value.replace(WHITESPACE, "").toLowerCase();
}

export function maskPhoneBR(value: string): string {
  const digits = value.replace(NON_DIGIT, "");
  if (digits.length === 0) return "";
  const hasCountryCode =
    value.startsWith("+55") || (digits.startsWith("55") && digits.length > 11);
  const local = hasCountryCode ? digits.slice(2) : digits;
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  const isMobile = local.length >= 11;
  let output = "+55";
  if (ddd.length > 0) output += ` (${ddd}`;
  if (ddd.length === 2) output += ")";
  if (rest.length > 0) {
    output += " ";
    if (isMobile) {
      output += rest.slice(0, 5);
      if (rest.length > 5) output += `-${rest.slice(5, 9)}`;
    } else {
      output += rest.slice(0, 4);
      if (rest.length > 4) output += `-${rest.slice(4, 8)}`;
    }
  }
  return output;
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

interface FieldShellProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: ReactNode;
}

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: FieldShellProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="field">
      <label htmlFor={fieldId} className="field__label">
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
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
  readonly mask?: TextFieldMask;
}

export function TextField({
  label,
  error,
  hint,
  required,
  id,
  mask,
  type,
  value,
  defaultValue,
  onChange,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  const applyMask =
    mask === "phone"
      ? maskPhoneBR
      : mask === "email"
        ? maskEmail
        : (input: string) => input;
  const displayValue =
    mask !== undefined && value !== undefined
      ? applyMask(String(value))
      : value;
  const displayDefault =
    mask !== undefined && defaultValue !== undefined
      ? applyMask(String(defaultValue))
      : defaultValue;
  const inputType = isPassword && revealed ? "text" : type;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (mask !== undefined) {
      const next = applyMask(event.target.value);
      if (next !== event.target.value) {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(event.target, next);
      }
    }
    onChange?.(event);
  };

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
    >
      <div
        className={
          isPassword
            ? "field__control field__control--action"
            : "field__control"
        }
      >
        <input
          id={fieldId}
          className="input"
          type={inputType}
          value={displayValue}
          defaultValue={displayDefault}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            hint ? `${fieldId}-hint` : error ? `${fieldId}-error` : undefined
          }
          required={required}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="field__toggle"
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </FieldShell>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  id,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
    >
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
  readonly options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
  }>;
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
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
    >
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
