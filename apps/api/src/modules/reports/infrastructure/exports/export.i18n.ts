import type { ExportLocale } from "@mission-atos/contracts";
import type { ExportRow } from "../../application/reports.types";

export type ExportReportType = "cells" | "people" | "attendance" | "meetings";

export interface ExportColumn {
  readonly key: string;
  readonly caption: string;
  readonly render: (row: ExportRow) => string;
}

interface ValueDict {
  cellStatus: Record<string, string>;
  membershipStatus: Record<string, string>;
  meetingDay: Record<string, string>;
  meetingStatus: Record<string, string>;
  attendanceStatus: Record<string, string>;
  reportStatus: Record<string, string>;
}

interface ExportMessages {
  columns: Record<string, string>;
  value: ValueDict;
  title: Record<ExportReportType, string>;
  filename: Record<ExportReportType, string>;
  yes: string;
  no: string;
  generatedAt: string;
  recordTotal: (total: number) => string;
}

const PT: ExportMessages = {
  columns: {
    code: "Código",
    name: "Nome",
    status: "Status",
    leaderName: "Líder",
    supervisorName: "Supervisor",
    traineeLeaderName: "Líder em treinamento",
    meetingDay: "Dia da semana",
    meetingTime: "Horário",
    address: "Endereço",
    memberCount: "Qtd. de membros",
    createdAt: "Criado em",
    fullName: "Nome completo",
    phone: "Telefone",
    email: "E-mail",
    birthDate: "Nascimento",
    gender: "Gênero",
    membershipStatus: "Situação no grupo",
    cellName: "Célula",
    cellCode: "Código",
    meetingDate: "Data do encontro",
    personName: "Pessoa",
    attendanceStatus: "Frequência",
    isVisitor: "Visitante",
    cancellationReason: "Motivo de cancelamento",
    presentCount: "Presentes",
    absentCount: "Ausentes",
    visitorCount: "Visitantes",
    attendanceRate: "Frequência (%)",
    reportStatus: "Relatório"
  },
  value: {
    cellStatus: { FORMING: "Em formação", ACTIVE: "Ativa", SUSPENDED: "Suspensa", CLOSED: "Encerrada" },
    membershipStatus: { ACTIVE: "Ativo", INACTIVE: "Inativo", TRANSFERRED: "Transferido" },
    meetingDay: {
      MONDAY: "Segunda-feira",
      TUESDAY: "Terça-feira",
      WEDNESDAY: "Quarta-feira",
      THURSDAY: "Quinta-feira",
      FRIDAY: "Sexta-feira",
      SATURDAY: "Sábado",
      SUNDAY: "Domingo"
    },
    meetingStatus: { SCHEDULED: "Agendado", COMPLETED: "Realizado", CANCELED: "Cancelado" },
    attendanceStatus: { PRESENT: "Presente", ABSENT: "Ausente", EXCUSED: "Justificado" },
    reportStatus: { NOT_STARTED: "Não iniciado", DRAFT: "Rascunho", SUBMITTED: "Enviado", RETURNED: "Devolvido", CANCELED: "Cancelado" }
  },
  title: { cells: "Células", people: "Pessoas", attendance: "Frequência", meetings: "Encontros" },
  filename: { cells: "celulas", people: "pessoas", attendance: "frequencia", meetings: "encontros" },
  yes: "Sim",
  no: "Não",
  generatedAt: "Gerado em: ",
  recordTotal: (total) => `${total} registro(s)`
};

const EN: ExportMessages = {
  columns: {
    code: "Code",
    name: "Name",
    status: "Status",
    leaderName: "Leader",
    supervisorName: "Supervisor",
    traineeLeaderName: "Leader in training",
    meetingDay: "Day of the week",
    meetingTime: "Time",
    address: "Address",
    memberCount: "Members",
    createdAt: "Created",
    fullName: "Full name",
    phone: "Phone",
    email: "E-mail",
    birthDate: "Birth date",
    gender: "Gender",
    membershipStatus: "Group status",
    cellName: "Cell",
    cellCode: "Code",
    meetingDate: "Meeting date",
    personName: "Person",
    attendanceStatus: "Attendance",
    isVisitor: "Visitor",
    cancellationReason: "Cancellation reason",
    presentCount: "Present",
    absentCount: "Absent",
    visitorCount: "Visitors",
    attendanceRate: "Attendance rate (%)",
    reportStatus: "Report"
  },
  value: {
    cellStatus: { FORMING: "Forming", ACTIVE: "Active", SUSPENDED: "Suspended", CLOSED: "Closed" },
    membershipStatus: { ACTIVE: "Active", INACTIVE: "Inactive", TRANSFERRED: "Transferred" },
    meetingDay: {
      MONDAY: "Monday",
      TUESDAY: "Tuesday",
      WEDNESDAY: "Wednesday",
      THURSDAY: "Thursday",
      FRIDAY: "Friday",
      SATURDAY: "Saturday",
      SUNDAY: "Sunday"
    },
    meetingStatus: { SCHEDULED: "Scheduled", COMPLETED: "Completed", CANCELED: "Canceled" },
    attendanceStatus: { PRESENT: "Present", ABSENT: "Absent", EXCUSED: "Excused" },
    reportStatus: { NOT_STARTED: "Not started", DRAFT: "Draft", SUBMITTED: "Submitted", RETURNED: "Returned", CANCELED: "Canceled" }
  },
  title: { cells: "Cells", people: "People", attendance: "Attendance", meetings: "Meetings" },
  filename: { cells: "celulas", people: "pessoas", attendance: "frequencia", meetings: "encontros" },
  yes: "Yes",
  no: "No",
  generatedAt: "Generated on: ",
  recordTotal: (total) => `${total} record(s)`
};

const ES: ExportMessages = {
  columns: {
    code: "Código",
    name: "Nombre",
    status: "Estado",
    leaderName: "Líder",
    supervisorName: "Supervisor",
    traineeLeaderName: "Líder en formación",
    meetingDay: "Día de la semana",
    meetingTime: "Horario",
    address: "Dirección",
    memberCount: "Miembros",
    createdAt: "Creado en",
    fullName: "Nombre completo",
    phone: "Teléfono",
    email: "Correo electrónico",
    birthDate: "Fecha de nacimiento",
    gender: "Género",
    membershipStatus: "Estado en el grupo",
    cellName: "Célula",
    cellCode: "Código",
    meetingDate: "Fecha del encuentro",
    personName: "Persona",
    attendanceStatus: "Asistencia",
    isVisitor: "Visitante",
    cancellationReason: "Motivo de cancelación",
    presentCount: "Presentes",
    absentCount: "Ausentes",
    visitorCount: "Visitantes",
    attendanceRate: "Frecuencia (%)",
    reportStatus: "Informe"
  },
  value: {
    cellStatus: { FORMING: "En formación", ACTIVE: "Activa", SUSPENDED: "Suspendida", CLOSED: "Cerrada" },
    membershipStatus: { ACTIVE: "Activo", INACTIVE: "Inactivo", TRANSFERRED: "Trasladado" },
    meetingDay: {
      MONDAY: "Lunes",
      TUESDAY: "Martes",
      WEDNESDAY: "Miércoles",
      THURSDAY: "Jueves",
      FRIDAY: "Viernes",
      SATURDAY: "Sábado",
      SUNDAY: "Domingo"
    },
    meetingStatus: { SCHEDULED: "Programado", COMPLETED: "Realizado", CANCELED: "Cancelado" },
    attendanceStatus: { PRESENT: "Presente", ABSENT: "Ausente", EXCUSED: "Justificado" },
    reportStatus: { NOT_STARTED: "No iniciado", DRAFT: "Borrador", SUBMITTED: "Enviado", RETURNED: "Devuelto", CANCELED: "Cancelado" }
  },
  title: { cells: "Células", people: "Personas", attendance: "Asistencia", meetings: "Encuentros" },
  filename: { cells: "celulas", people: "pessoas", attendance: "frequencia", meetings: "encontros" },
  yes: "Sí",
  no: "No",
  generatedAt: "Generado el: ",
  recordTotal: (total) => `${total} registro(s)`
};

const MESSAGES: Record<ExportLocale, ExportMessages> = {
  "pt-BR": PT,
  en: EN,
  es: ES
};

function stringify(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function translate(value: unknown, map: Record<string, string>): string {
  if (value === null || value === undefined || value === "") return "";
  return map[String(value)] ?? String(value);
}

export function exportColumns(reportType: ExportReportType, locale: ExportLocale): ExportColumn[] {
  const messages = MESSAGES[locale];
  const values = messages.value;
  const make = (key: string): ExportColumn => ({
    key,
    caption: messages.columns[key] ?? key,
    render: (row) => stringify(row[key])
  });
  switch (reportType) {
    case "cells":
      return [
        make("code"),
        make("name"),
        { ...make("status"), render: (row) => translate(row.status, values.cellStatus) },
        make("leaderName"),
        make("supervisorName"),
        make("traineeLeaderName"),
        { ...make("meetingDay"), render: (row) => translate(row.meetingDay, values.meetingDay) },
        make("meetingTime"),
        make("address"),
        make("memberCount"),
        make("createdAt")
      ];
    case "people":
      return [
        make("fullName"),
        make("phone"),
        make("email"),
        make("birthDate"),
        make("gender"),
        { ...make("membershipStatus"), render: (row) => translate(row.membershipStatus, values.membershipStatus) },
        make("cellName"),
        make("createdAt")
      ];
    case "attendance":
      return [
        make("cellName"),
        make("cellCode"),
        make("meetingDate"),
        make("personName"),
        { ...make("attendanceStatus"), render: (row) => translate(row.attendanceStatus, values.attendanceStatus) },
        { ...make("isVisitor"), render: (row) => (row.isVisitor === true || row.isVisitor === "true" ? messages.yes : messages.no) }
      ];
    case "meetings":
      return [
        make("cellName"),
        make("cellCode"),
        make("meetingDate"),
        { ...make("status"), render: (row) => translate(row.status, values.meetingStatus) },
        make("cancellationReason"),
        make("presentCount"),
        make("absentCount"),
        make("visitorCount"),
        make("attendanceRate"),
        { ...make("reportStatus"), render: (row) => translate(row.reportStatus, values.reportStatus) }
      ];
  }
}

export function exportTitle(reportType: ExportReportType, locale: ExportLocale): string {
  return MESSAGES[locale].title[reportType];
}

export function exportFilenameBase(reportType: ExportReportType): string {
  return MESSAGES["pt-BR"].filename[reportType];
}

export function exportPdfMeta(locale: ExportLocale): { generatedAt: string; recordTotal: (total: number) => string } {
  const messages = MESSAGES[locale];
  return { generatedAt: messages.generatedAt, recordTotal: messages.recordTotal };
}