"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { FieldShell, Skeleton } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";
import { useI18n } from "@/src/shared/i18n/language-provider";
import {
  listCellAssignmentOptions
} from "@/src/features/cells/api/cells-api";
import type {
  CellAssignmentKind,
  CellAssignmentOptionsParams
} from "@/src/features/cells/api/cells-api";

interface AssignmentSelectProps {
  readonly label: string;
  readonly kind: CellAssignmentKind;
  readonly value: string | null;
  readonly currentLabel?: string;
  readonly onChange: (id: string | null) => void;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

interface Option {
  readonly id: string;
  readonly name: string;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

export function AssignmentSelect({
  label,
  kind,
  value,
  currentLabel,
  onChange,
  hint,
  error,
  required,
  disabled
}: AssignmentSelectProps) {
  const { t } = useI18n();
  const { api } = useSession();
  const generatedId = useId();
  const fieldId = `assignment-${generatedId}`;
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<readonly Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestSeq = useRef(0);
  const debounceTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadOptions = (search: string) => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    setLoading(true);
    setFailed(false);
    const params: CellAssignmentOptionsParams = {
      kind,
      search: search.trim() || undefined,
      page: 1,
      pageSize: PAGE_SIZE
    };
    void listCellAssignmentOptions(api, params)
      .then((result) => {
        if (requestSeq.current !== seq) return;
        setOptions(result);
      })
      .catch(() => {
        if (requestSeq.current !== seq) return;
        setOptions([]);
        setFailed(true);
      })
      .finally(() => {
        if (requestSeq.current === seq) setLoading(false);
      });
  };

  const clearDebounce = () => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
  };

  const selectedName =
    options.find((option) => option.id === value)?.name ?? currentLabel ?? "";
  const inputValue = query.length > 0 ? query : selectedName;

  const selectOption = (option: Option) => {
    onChange(option.id);
    setQuery("");
    setActiveIndex(-1);
    setOpen(false);
    setOptions((current) =>
      current.some((item) => item.id === option.id) ? current : [option, ...current]
    );
  };

  const clearSelection = () => {
    onChange(null);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    if (options.length === 0 && query.trim() === "") {
      loadOptions("");
    }
  };

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setActiveIndex(-1);
    setOpen(true);
    clearDebounce();
    debounceTimer.current = window.setTimeout(() => {
      loadOptions(next);
    }, DEBOUNCE_MS);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        if (options.length === 0) loadOptions(query);
        return;
      }
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return;
      setActiveIndex((current) => Math.max(current - 1, -1));
      return;
    }
    if (event.key === "Enter") {
      const selected = options[activeIndex];
      if (selected) {
        event.preventDefault();
        selectOption(selected);
      }
      return;
    }
  };

  const optionId = (index: number) => `${fieldId}-option-${index}`;

  return (
    <div
      ref={containerRef}
      onMouseDown={(event) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }}
    >
      <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
        <div className="combobox">
          <div className="combobox__control">
            <input
              id={fieldId}
              className="input"
              role="combobox"
              aria-expanded={open}
              aria-controls={open ? `${fieldId}-list` : undefined}
              aria-autocomplete="list"
              aria-invalid={error ? true : undefined}
              autoComplete="off"
              value={inputValue}
              onChange={(event) => handleQueryChange(event.target.value)}
              onFocus={handleFocus}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              required={required}
            />
            {value ? (
              <button
                type="button"
                className="combobox__clear"
                aria-label={t("cells.assignment.clearLabel", { label: label.toLowerCase() })}
                onClick={clearSelection}
                tabIndex={-1}
              >
                ×
              </button>
            ) : null}
          </div>
          {open ? (
            <ul
              id={`${fieldId}-list`}
              className="combobox__list"
              role="listbox"
              aria-label={t("cells.assignment.optionsLabel", { label: label.toLowerCase() })}
            >
              {loading ? (
                <li className="combobox__empty">
                  <Skeleton width="100%" height="1.5rem" />
                </li>
              ) : failed ? (
                <li className="combobox__empty">{t("cells.assignment.loadError")}</li>
              ) : options.length === 0 ? (
                <li className="combobox__empty">{t("cells.assignment.noCandidates")}</li>
              ) : (
                options.map((option, index) => (
                  <li key={option.id} role="option" aria-selected={option.id === value}>
                    <button
                      type="button"
                      id={optionId(index)}
                      className={`combobox__option${index === activeIndex ? " combobox__option--active" : ""}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectOption(option);
                      }}
                    >
                      {option.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </FieldShell>
    </div>
  );
}
