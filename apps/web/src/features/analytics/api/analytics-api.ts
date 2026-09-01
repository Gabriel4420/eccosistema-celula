import {
  cellsSummaryEnvelopeSchema,
  overviewEnvelopeSchema,
  seriesEnvelopeSchema
} from "@mission-atos/contracts";
import type {
  CellsSummaryResponse,
  OverviewResponse,
  SeriesPoint
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export interface OverviewParams {
  readonly period?: "30d";
  readonly from?: string;
  readonly to?: string;
}

export async function getOverview(api: ApiClient, params: OverviewParams): Promise<OverviewResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/dashboard/overview",
    query: periodQuery(params),
    bearer: true,
    allowRetry: true,
    schema: overviewEnvelopeSchema
  });
  return envelope.data;
}

export async function getMonthlySeries(api: ApiClient, params: OverviewParams): Promise<readonly SeriesPoint[]> {
  const query: Record<string, string> = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  const envelope = await api.request({
    method: "GET",
    path: "/dashboard/series",
    query,
    bearer: true,
    allowRetry: true,
    schema: seriesEnvelopeSchema
  });
  return envelope.data;
}

export async function getCellsSummary(api: ApiClient, windowDays: number): Promise<CellsSummaryResponse> {
  const envelope = await api.request({
    method: "GET",
    path: "/dashboard/cells/summary",
    query: { windowDays: String(windowDays) },
    bearer: true,
    allowRetry: true,
    schema: cellsSummaryEnvelopeSchema
  });
  return envelope.data;
}

function periodQuery(params: OverviewParams): Record<string, string> {
  if (params.period) return { period: params.period };
  const query: Record<string, string> = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  return query;
}
