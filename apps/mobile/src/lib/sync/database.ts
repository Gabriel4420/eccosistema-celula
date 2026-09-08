import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type {
  CellRow,
  MeetingRow,
  AttendanceEntryRow,
  DocumentRow,
  SyncOutboxRow
} from "./types";

let _db: SQLiteDatabase | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS cells (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  leaderId TEXT,
  meetingDay TEXT NOT NULL,
  meetingTime TEXT NOT NULL,
  address TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  cellId TEXT NOT NULL,
  meetingDate TEXT NOT NULL,
  status TEXT NOT NULL,
  cancellationReason TEXT,
  attendanceRevision INTEGER NOT NULL DEFAULT 0,
  reportStatus TEXT NOT NULL DEFAULT 'NOT_STARTED',
  observations TEXT,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_entries (
  meetingId TEXT NOT NULL,
  personId TEXT NOT NULL,
  fullName TEXT NOT NULL,
  status TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (meetingId, personId)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  mimeType TEXT,
  fileUri TEXT NOT NULL,
  size INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  syncStatus TEXT NOT NULL DEFAULT 'SYNCED'
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  operationId TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entityId TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  errorMessage TEXT,
  attemptCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

export function getDatabase(): SQLiteDatabase {
  if (_db) return _db;
  _db = openDatabaseSync("ecossistema-celulas");
  _db.execSync(SCHEMA_SQL);
  return _db;
}

// ── Cells ──

export function upsertCell(cell: CellRow): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO cells (id, code, name, status, leaderId, meetingDay, meetingTime, address, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    cell.id,
    cell.code,
    cell.name,
    cell.status,
    cell.leaderId,
    cell.meetingDay,
    cell.meetingTime,
    cell.address,
    cell.updatedAt
  );
}

export function getCells(): CellRow[] {
  const db = getDatabase();
  return db.getAllSync<CellRow>(
    "SELECT * FROM cells ORDER BY name ASC"
  );
}

export function getCellById(id: string): CellRow | null {
  const db = getDatabase();
  return db.getFirstSync<CellRow>(
    "SELECT * FROM cells WHERE id = ?",
    id
  );
}

// ── Meetings ──

export function upsertMeeting(meeting: MeetingRow): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO meetings (id, cellId, meetingDate, status, cancellationReason, attendanceRevision, reportStatus, observations, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    meeting.id,
    meeting.cellId,
    meeting.meetingDate,
    meeting.status,
    meeting.cancellationReason,
    meeting.attendanceRevision,
    meeting.reportStatus,
    meeting.observations,
    meeting.updatedAt
  );
}

export function getMeetingsByCellId(cellId: string): MeetingRow[] {
  const db = getDatabase();
  return db.getAllSync<MeetingRow>(
    "SELECT * FROM meetings WHERE cellId = ? ORDER BY meetingDate DESC",
    cellId
  );
}

export function getMeetingById(id: string): MeetingRow | null {
  const db = getDatabase();
  return db.getFirstSync<MeetingRow>(
    "SELECT * FROM meetings WHERE id = ?",
    id
  );
}

// ── Attendance ──

export function upsertAttendanceEntries(entries: AttendanceEntryRow[]): void {
  const db = getDatabase();
  for (const e of entries) {
    db.runSync(
      `INSERT OR REPLACE INTO attendance_entries (meetingId, personId, fullName, status, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      e.meetingId,
      e.personId,
      e.fullName,
      e.status,
      e.updatedAt
    );
  }
}

export function getAttendanceEntries(meetingId: string): AttendanceEntryRow[] {
  const db = getDatabase();
  return db.getAllSync<AttendanceEntryRow>(
    "SELECT * FROM attendance_entries WHERE meetingId = ? ORDER BY fullName ASC",
    meetingId
  );
}

// ── Documents ──

export function insertDocument(doc: DocumentRow): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO documents (id, name, kind, mimeType, fileUri, size, createdAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    doc.id,
    doc.name,
    doc.kind,
    doc.mimeType,
    doc.fileUri,
    doc.size,
    doc.createdAt,
    doc.syncStatus
  );
}

export function getDocuments(): DocumentRow[] {
  const db = getDatabase();
  return db.getAllSync<DocumentRow>(
    "SELECT * FROM documents ORDER BY createdAt DESC"
  );
}

export function getDocumentById(id: string): DocumentRow | null {
  const db = getDatabase();
  return db.getFirstSync<DocumentRow>(
    "SELECT * FROM documents WHERE id = ?",
    id
  );
}

export function deleteDocument(id: string): void {
  const db = getDatabase();
  db.runSync("DELETE FROM documents WHERE id = ?", id);
}

export function updateDocumentSyncStatus(
  id: string,
  status: string
): void {
  const db = getDatabase();
  db.runSync("UPDATE documents SET syncStatus = ? WHERE id = ?", status, id);
}

// ── Sync Outbox ──

export function enqueueOperation(row: SyncOutboxRow): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO sync_outbox (operationId, entity, entityId, operation, payload, status, errorMessage, attemptCount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.operationId,
    row.entity,
    row.entityId,
    row.operation,
    row.payload,
    row.status,
    row.errorMessage,
    row.attemptCount,
    row.createdAt,
    row.updatedAt
  );
}

export function getPendingOperations(): SyncOutboxRow[] {
  const db = getDatabase();
  return db.getAllSync<SyncOutboxRow>(
    `SELECT * FROM sync_outbox WHERE status = 'PENDING' ORDER BY createdAt ASC`
  );
}

export function markOperationSynced(operationId: string): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE sync_outbox SET status = 'SYNCED', updatedAt = ? WHERE operationId = ?`,
    new Date().toISOString(),
    operationId
  );
}

export function markOperationError(
  operationId: string,
  errorMessage: string
): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE sync_outbox SET status = 'ERROR', errorMessage = ?, attemptCount = attemptCount + 1, updatedAt = ? WHERE operationId = ?`,
    errorMessage,
    new Date().toISOString(),
    operationId
  );
}

export function getSyncCounts(): {
  pending: number;
  synced: number;
  errors: number;
} {
  const db = getDatabase();
  const pending = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'PENDING'"
  );
  const synced = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'SYNCED'"
  );
  const errors = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'ERROR'"
  );
  return {
    pending: pending?.count ?? 0,
    synced: synced?.count ?? 0,
    errors: errors?.count ?? 0
  };
}

export function clearSyncedOperations(): void {
  const db = getDatabase();
  db.runSync("DELETE FROM sync_outbox WHERE status = 'SYNCED'");
}