import type {
  AttendanceStatus,
  CellStatus,
  DayOfWeek,
  MeetingStatus,
  MembershipStatus,
  ReportStatus,
  UserStatus
} from "./enums";

export type EntityId = string;

export interface MutableEntity {
  id: EntityId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Church extends MutableEntity {
  name: string;
  slug: string;
}

export interface User extends MutableEntity {
  churchId: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
}

export interface Role extends MutableEntity {
  churchId: EntityId;
  name: string;
}

export interface UserRole extends MutableEntity {
  churchId: EntityId;
  userId: EntityId;
  roleId: EntityId;
}

export interface SupervisorAssignment extends MutableEntity {
  churchId: EntityId;
  supervisorId: EntityId;
  leaderId: EntityId;
}

export interface Cell extends MutableEntity {
  churchId: EntityId;
  code: string;
  name: string;
  status: CellStatus;
  leaderId: EntityId | null;
  traineeLeaderId: EntityId | null;
  meetingDay: DayOfWeek;
  meetingTime: Date;
  address: string;
}

export interface Person extends MutableEntity {
  churchId: EntityId;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  gender: string | null;
  observations: string | null;
}

export interface CellMembership extends MutableEntity {
  churchId: EntityId;
  personId: EntityId;
  cellId: EntityId;
  status: MembershipStatus;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface Meeting extends MutableEntity {
  churchId: EntityId;
  cellId: EntityId;
  meetingDate: Date;
  status: MeetingStatus;
}

export interface MeetingAttendance extends MutableEntity {
  churchId: EntityId;
  meetingId: EntityId;
  personId: EntityId;
  attendanceStatus: AttendanceStatus;
}

export interface MeetingReport extends MutableEntity {
  churchId: EntityId;
  meetingId: EntityId;
  observations: string | null;
  submittedBy: EntityId | null;
  submittedAt: Date | null;
  status: ReportStatus;
}

export interface AuditLog {
  id: EntityId;
  churchId: EntityId;
  userId: EntityId | null;
  entity: string;
  entityId: EntityId;
  action: string;
  before: unknown | null;
  after: unknown | null;
  createdAt: Date;
}
