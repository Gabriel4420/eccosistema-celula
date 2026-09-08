import type {
  CellsPageEnvelope,
  CellItemEnvelope,
  ListCellsQuery
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

export async function listCells(
  query: Partial<ListCellsQuery>
): Promise<CellsPageEnvelope> {
  const normalized: ListCellsQuery = {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    sortBy: query.sortBy ?? "name",
    sortOrder: query.sortOrder ?? "asc",
    search: query.search,
    status: query.status,
    leaderId: query.leaderId,
    meetingDay: query.meetingDay
  };

  return apiRequest<CellsPageEnvelope>(
    `${API_URL}/cells${buildQuery(normalized as unknown as Record<string, string>)}`
  );
}

export async function getCell(id: string): Promise<CellItemEnvelope> {
  return apiRequest<CellItemEnvelope>(`${API_URL}/cells/${id}`);
}