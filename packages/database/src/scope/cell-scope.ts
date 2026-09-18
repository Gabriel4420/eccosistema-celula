import type { Prisma } from "../generated/prisma/client.js";

export type CellScope =
  | { kind: "church" }
  | { kind: "supervisor"; userId: string }
  | { kind: "leader"; userId: string };

export interface CellScopeDataSource {
  cell: {
    findMany(args: { where: Prisma.CellWhereInput; select: { id: true } }): Promise<Array<{ id: string }>>;
  };
  supervisorAssignment: {
    findMany(args: { where: Prisma.SupervisorAssignmentWhereInput; select: { leaderId: true } }): Promise<Array<{ leaderId: string }>>;
  };
}

export async function resolveCellScopeIds(
  dataSource: CellScopeDataSource,
  churchId: string,
  scope: CellScope
): Promise<string[]> {
  if (scope.kind === "church") {
    const rows = await dataSource.cell.findMany({ where: { churchId, deletedAt: null }, select: { id: true } });
    return rows.map((row) => row.id);
  }
  if (scope.kind === "supervisor") {
    const assignments = await dataSource.supervisorAssignment.findMany({
      where: { churchId, supervisorId: scope.userId, deletedAt: null },
      select: { leaderId: true }
    });
    const leaderIds = assignments.map((assignment) => assignment.leaderId);
    const assigned = leaderIds.length
      ? await dataSource.cell.findMany({ where: { churchId, deletedAt: null, leaderId: { in: leaderIds } }, select: { id: true } })
      : [];
    return mergeScopeIds(assigned, await additionalScopeCells(dataSource, churchId));
  }
  const assigned = await dataSource.cell.findMany({
    where: { churchId, deletedAt: null, OR: [{ leaderId: scope.userId }, { traineeLeaderId: scope.userId }] },
    select: { id: true }
  });
  return mergeScopeIds(assigned, await additionalScopeCells(dataSource, churchId));
}

async function additionalScopeCells(
  dataSource: CellScopeDataSource,
  churchId: string
): Promise<string[]> {
  const rows = await dataSource.cell.findMany({
    where: {
      churchId,
      deletedAt: null,
      OR: [
        {
          status: "FORMING",
          leaderId: null,
          traineeLeaderId: null
        },
        {
          status: { in: ["SUSPENDED", "CLOSED"] },
          meetings: {
            some: {
              deletedAt: null,
              attendances: { some: { deletedAt: null } }
            }
          }
        }
      ]
    },
    select: { id: true }
  });
  return rows.map((row) => row.id);
}

function mergeScopeIds(assigned: Array<{ id: string }>, additional: string[]): string[] {
  const ids = assigned.map((row) => row.id);
  for (const id of additional) if (!ids.includes(id)) ids.push(id);
  return ids;
}