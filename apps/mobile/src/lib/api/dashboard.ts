import type {
  OverviewEnvelope,
  SeriesEnvelope,
  CellsSummaryEnvelope
} from "@mission-atos/contracts";
import { API_URL } from "../config";
import { apiRequest } from "./client";

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
  return `?${qs}`;
}

export async function getOverview(
  params: { period?: string } = {}
): Promise<OverviewEnvelope> {
  return apiRequest<OverviewEnvelope>(
    `${API_URL}/dashboard/overview${buildQuery(params as unknown as Record<string, string>)}`
  );
}

export async function getSeries(
  params: { from?: string; to?: string } = {}
): Promise<SeriesEnvelope> {
  return apiRequest<SeriesEnvelope>(
    `${API_URL}/dashboard/series${buildQuery(params as unknown as Record<string, string>)}`
  );
}

export async function getCellsSummary(
  params: { windowDays?: number; status?: string } = {}
): Promise<CellsSummaryEnvelope> {
  return apiRequest<CellsSummaryEnvelope>(
    `${API_URL}/dashboard/cells/summary${buildQuery(params as unknown as Record<string, string>)}`
  );
}