import type { CellPage, ManagedCell } from "../application/cells-management.types";
import type { CellsPageEnvelope, CellItemEnvelope, CellResponse } from "@mission-atos/contracts";
import { formatTime } from "../application/cells-management.time";

export function presentCell(cell: ManagedCell): CellResponse {
  return {
    id: cell.id,
    code: cell.code,
    name: cell.name,
    status: cell.status,
    leader: cell.leader ? { id: cell.leader.id, name: cell.leader.name } : null,
    supervisor: cell.supervisor ? { id: cell.supervisor.id, name: cell.supervisor.name } : null,
    traineeLeader: cell.traineeLeader ? { id: cell.traineeLeader.id, name: cell.traineeLeader.name } : null,
    meetingDay: cell.meetingDay,
    meetingTime: formatTime(cell.meetingTime),
    address: cell.address,
    createdAt: cell.createdAt.toISOString(),
    updatedAt: cell.updatedAt.toISOString()
  };
}

export function presentCellItem(cell: ManagedCell): CellItemEnvelope {
  return { data: presentCell(cell), meta: {} };
}

export function presentCellPage(
  page: CellPage,
  pageNumber: number,
  pageSize: number
): CellsPageEnvelope {
  return {
    data: page.items.map(presentCell),
    meta: {
      page: pageNumber,
      pageSize,
      totalItems: page.totalItems,
      totalPages: Math.ceil(page.totalItems / pageSize)
    }
  };
}
