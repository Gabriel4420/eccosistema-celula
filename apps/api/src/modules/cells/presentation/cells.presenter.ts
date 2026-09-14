import type { CellMember, CellMemberPage, CellPage, ManagedCell } from "../application/cells-management.types";
import type {
  CellsPageEnvelope,
  CellItemEnvelope,
  CellMemberItemEnvelope,
  CellMemberResponse,
  CellMembersPageEnvelope,
  CellResponse
} from "@mission-atos/contracts";
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
    memberCount: cell.memberCount,
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

export function presentCellMember(member: CellMember): CellMemberResponse {
  return {
    personId: member.personId,
    fullName: member.fullName,
    phone: member.phone,
    joinedAt: member.joinedAt.toISOString(),
    status: member.status,
    reason: member.reason
  };
}

export function presentCellMemberItem(member: CellMember): CellMemberItemEnvelope {
  return { data: presentCellMember(member), meta: {} };
}

export function presentCellMemberPage(
  page: CellMemberPage,
  pageNumber: number,
  pageSize: number
): CellMembersPageEnvelope {
  return {
    data: page.items.map(presentCellMember),
    meta: {
      page: pageNumber,
      pageSize,
      totalItems: page.totalItems,
      totalPages: Math.ceil(page.totalItems / pageSize)
    }
  };
}
