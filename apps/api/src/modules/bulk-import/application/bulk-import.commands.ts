import { PublicApplicationError, type AuthenticatedPrincipal } from "@mission-atos/domain";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  importCellItemSchema,
  importPersonItemSchema,
  importUserItemSchema
} from "@mission-atos/contracts";
import type { ImportCellItem, ImportPersonItem, ImportUserItem } from "@mission-atos/contracts";
import type { z } from "zod";
import { CellsManagementCommands } from "../../cells/application/cells-management.commands";
import { PeopleManagementCommands } from "../../people/application/people-management.commands";
import { UserManagementCommands } from "../../users/application/user-management.commands";
import type { UserManagementRepository } from "../../users/application/user-management.port";
import { USER_MANAGEMENT_REPOSITORY } from "../../users/application/user-management.port";
import { BULK_IMPORT_AUDIT, type BulkImportAudit } from "./bulk-import-audit.port";
import type { BulkImportResult, BulkRowOutcome } from "./bulk-import.types";

interface Parsed<T> {
  item?: T;
  errors?: string[];
}

@Injectable()
export class BulkImportCommands {
  private readonly logger = new Logger(BulkImportCommands.name);

  constructor(
    @Inject(PeopleManagementCommands) private readonly people: PeopleManagementCommands,
    @Inject(CellsManagementCommands) private readonly cells: CellsManagementCommands,
    @Inject(UserManagementCommands) private readonly users: UserManagementCommands,
    @Inject(USER_MANAGEMENT_REPOSITORY) private readonly userRepository: UserManagementRepository,
    @Inject(BULK_IMPORT_AUDIT) private readonly audit: BulkImportAudit
  ) {}

  async importPeople(
    principal: AuthenticatedPrincipal,
    rows: ReadonlyArray<Record<string, unknown>>,
    format: BulkImportResult["format"],
    fileName: string
  ): Promise<BulkImportResult> {
    const startedAt = Date.now();
    const importId = randomUUID();
    const resultsPerRow: BulkRowOutcome[] = [];
    let created = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const row = index + 1;
      const parsed = parseRow<ImportPersonItem>(importPersonItemSchema, rows[index]);
      if (!parsed.item) {
        resultsPerRow.push({ row, status: "error", message: "Invalid person row", errors: parsed.errors });
        continue;
      }
      const item = parsed.item;
      try {
        await this.people.create(principal, toPersonInput(item), item.cellCode);
        created += 1;
        resultsPerRow.push({ row, status: "created" });
      } catch (error) {
        resultsPerRow.push({ row, status: "error", ...this.rowError(error) });
      }
    }
    return this.finish(principal, {
      domain: "people", fileName, format, processed: rows.length, created,
      failed: rows.length - created, resultsPerRow
    }, startedAt, importId);
  }

  async importCells(
    principal: AuthenticatedPrincipal,
    rows: ReadonlyArray<Record<string, unknown>>,
    format: BulkImportResult["format"],
    fileName: string
  ): Promise<BulkImportResult> {
    const startedAt = Date.now();
    const importId = randomUUID();
    const resultsPerRow: BulkRowOutcome[] = [];
    let created = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const row = index + 1;
      const parsed = parseRow<ImportCellItem>(importCellItemSchema, rows[index]);
      if (!parsed.item) {
        resultsPerRow.push({ row, status: "error", message: "Invalid cell row", errors: parsed.errors });
        continue;
      }
      const item = parsed.item;
      try {
        const key = this.cellIdempotencyKey(importId, principal.churchId, row, item);
        await this.cells.create(principal, key, {
          code: item.code,
          name: item.name,
          status: item.status,
          leaderId: item.leaderId ?? null,
          supervisorId: item.supervisorId ?? null,
          traineeLeaderId: item.traineeLeaderId ?? null,
          meetingDay: item.meetingDay,
          meetingTime: item.meetingTime,
          address: item.address
        });
        created += 1;
        resultsPerRow.push({ row, status: "created" });
      } catch (error) {
        resultsPerRow.push({ row, status: "error", ...this.rowError(error) });
      }
    }
    return this.finish(principal, {
      domain: "cells", fileName, format, processed: rows.length, created,
      failed: rows.length - created, resultsPerRow
    }, startedAt, importId);
  }

  async importUsers(
    principal: AuthenticatedPrincipal,
    rows: ReadonlyArray<Record<string, unknown>>,
    format: BulkImportResult["format"],
    fileName: string
  ): Promise<BulkImportResult> {
    const startedAt = Date.now();
    const importId = randomUUID();
    const parsedItems: Array<Parsed<ImportUserItem>> = rows.map((row) =>
      parseRow<ImportUserItem>(importUserItemSchema, normalizeUserRow(row))
    );
    const roleIdsByLine = await this.resolveRoleIds(principal, parsedItems);
    const resultsPerRow: BulkRowOutcome[] = [];
    let created = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const row = index + 1;
      const parsed = parsedItems[index];
      if (!parsed?.item) {
        resultsPerRow.push({ row, status: "error", message: "Invalid user row", errors: parsed?.errors });
        continue;
      }
      const item = parsed.item;
      try {
        const roleIds = roleIdsByLine[index];
        if (!roleIds) throw new BulkRoleResolveError();
        await this.users.create(principal, {
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          initialPassword: item.initialPassword,
          roleIds
        });
        created += 1;
        resultsPerRow.push({ row, status: "created" });
      } catch (error) {
        resultsPerRow.push({ row, status: "error", ...this.rowError(error) });
      }
    }
    return this.finish(principal, {
      domain: "users", fileName, format, processed: rows.length, created,
      failed: rows.length - created, resultsPerRow
    }, startedAt, importId);
  }

  private async finish(
    principal: AuthenticatedPrincipal,
    result: BulkImportResult,
    startedAt: number,
    importId: string
  ): Promise<BulkImportResult> {
    await this.audit.record({
      churchId: principal.churchId,
      userId: principal.userId,
      importId,
      domain: result.domain,
      format: result.format,
      processed: result.processed,
      created: result.created,
      failed: result.failed
    });
    this.logger.log(JSON.stringify({
      operation: "bulk-import",
      domain: result.domain,
      format: result.format,
      churchId: principal.churchId,
      userId: principal.userId,
      processed: result.processed,
      created: result.created,
      failed: result.failed,
      durationMs: Date.now() - startedAt
    }));
    return result;
  }

  private rowError(error: unknown): { code?: string; message: string } {
    if (error instanceof BulkRoleResolveError || error instanceof PublicApplicationError) {
      return { code: error.code, message: error.message };
    }
    this.logger.error(JSON.stringify({
      operation: "bulk-import.row",
      errorName: error instanceof Error ? error.name : "UnknownError"
    }));
    return { code: "BULK_ROW_FAILED", message: "The row could not be imported" };
  }

  private async resolveRoleIds(
    principal: AuthenticatedPrincipal,
    items: ReadonlyArray<Parsed<ImportUserItem>>
  ): Promise<(string[] | null)[]> {
    const roles = await this.userRepository.managedRoles(principal.churchId);
    const byName = new Map<string, string>();
    for (const role of roles) byName.set(role.name, role.id);
    return items.map((entry) => {
      if (!entry.item) return null;
      const ids = entry.item.roles.map((name) => byName.get(name)).filter((id): id is string => Boolean(id));
      return ids.length === entry.item.roles.length ? ids : null;
    });
  }

  private cellIdempotencyKey(importId: string, churchId: string, row: number, item: ImportCellItem): string {
    const payload = `${importId}|${churchId}|${row}|${JSON.stringify(item)}`;
    const hash = createHash("sha256").update(payload).digest("hex");
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-a${hash.slice(15, 18)}-${hash.slice(18, 30)}`;
  }
}

function normalizeUserRow(row: Record<string, unknown>): Record<string, unknown> {
  if (typeof row.roles !== "string") return row;
  return {
    ...row,
    roles: row.roles
      .split(/[|,;]/)
      .map((role) => role.trim().toUpperCase())
      .filter(Boolean)
  };
}

function parseRow<T>(schema: z.ZodType<T>, raw: Record<string, unknown> | undefined): Parsed<T> {
  if (!raw) return { errors: ["Missing row data"] };
  const result = schema.safeParse(raw);
  if (result.success) return { item: result.data };
  return { errors: result.error.issues.map((issue) => issue.message) };
}

function toPersonInput(item: ImportPersonItem) {
  return {
    fullName: item.fullName,
    phone: item.phone ?? null,
    email: item.email ?? null,
    birthDate: item.birthDate ?? null,
    gender: item.gender ?? null,
    observations: item.observations ?? null
  };
}

class BulkRoleResolveError extends Error {
  readonly code = "BULK_ROLE_NOT_FOUND";

  constructor() {
    super("One or more roles do not exist in this church");
    this.name = "BulkRoleResolveError";
  }
}
