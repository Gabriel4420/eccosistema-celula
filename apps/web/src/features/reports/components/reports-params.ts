"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

export interface PeriodValue {
  readonly from: string;
  readonly to: string;
}

export interface ReportParams {
  readonly page: number;
  readonly from: string;
  readonly to: string;
}

export function getPeriodOptions(t: (key: TranslationKey, params?: TranslationParams) => string): Array<{ readonly value: string; readonly label: string }> {
  return [
    { value: "", label: t("reports.period.default") },
    { value: `${d(daysAgo(30))}..${d(today())}`, label: t("reports.period.last30") },
    { value: `${d(daysAgo(60))}..${d(today())}`, label: t("reports.period.last60") },
    { value: `${d(monthStart())}..${d(today())}`, label: t("reports.period.thisMonth") },
  ];
}

export function readPage(searchParams: URLSearchParams): number {
  const requested = Number(searchParams.get("page") ?? "1");
  return Number.isInteger(requested) && requested > 0 ? requested : 1;
}

export function periodValue(params: ReportParams): string {
  return params.from && params.to ? `${params.from}..${params.to}` : "";
}

export function splitPeriod(value: string): PeriodValue {
  const [from, to] = value.split("..");
  return { from: from ?? "", to: to ?? "" };
}

export function useReportNavigation(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  return {
    router,
    searchParams,
    navigate: (next: Record<string, string | number | undefined>) => {
      const params = Object.fromEntries(searchParams.entries());
      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "") delete params[key];
        else params[key] = String(value);
      }
      const query = new URLSearchParams(params).toString();
      router.push(query ? `${basePath}?${query}` : basePath);
    },
  };
}

function today(): Date {
  return new Date();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function d(date: Date): string {
  return date.toISOString().slice(0, 10);
}