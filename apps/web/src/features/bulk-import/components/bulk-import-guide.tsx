"use client";

import type { ImportDomain } from "@mission-atos/contracts";
import { Alert, Table } from "@/src/shared/components";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";

interface GuideField {
  readonly name: string;
  readonly requirement: TranslationKey;
  readonly guidance: TranslationKey;
}

interface GuideContent {
  readonly records: TranslationKey;
  readonly permission: TranslationKey;
  readonly columns: readonly GuideField[];
  readonly duplicateRule: TranslationKey;
  readonly jsonExample: string;
  readonly rolesNote?: TranslationKey;
  readonly dayNames?: ReadonlyArray<{ readonly code: string; readonly label: TranslationKey }>;
}

const PEOPLE_COLUMNS: readonly GuideField[] = [
  { name: "fullName", requirement: "bulk.guide.req.requiredF", guidance: "bulk.guide.col.people.fullName" },
  { name: "phone", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.people.phone" },
  { name: "email", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.people.email" },
  { name: "birthDate", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.people.birthDate" },
  { name: "gender", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.people.gender" },
  { name: "observations", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.people.observations" },
  { name: "cellCode", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.people.cellCode" }
];

const CELLS_COLUMNS: readonly GuideField[] = [
  { name: "code", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.cells.code" },
  { name: "name", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.cells.name" },
  { name: "status", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.cells.status" },
  { name: "leaderId", requirement: "bulk.guide.req.conditional", guidance: "bulk.guide.col.cells.leaderId" },
  { name: "supervisorId", requirement: "bulk.guide.req.conditional", guidance: "bulk.guide.col.cells.supervisorId" },
  { name: "traineeLeaderId", requirement: "bulk.guide.req.optional", guidance: "bulk.guide.col.cells.traineeLeaderId" },
  { name: "meetingDay", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.cells.meetingDay" },
  { name: "meetingTime", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.cells.meetingTime" },
  { name: "address", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.cells.address" }
];

const USERS_COLUMNS: readonly GuideField[] = [
  { name: "firstName", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.users.firstName" },
  { name: "lastName", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.users.lastName" },
  { name: "email", requirement: "bulk.guide.req.requiredM", guidance: "bulk.guide.col.users.email" },
  { name: "initialPassword", requirement: "bulk.guide.req.requiredF", guidance: "bulk.guide.col.users.initialPassword" },
  { name: "roles", requirement: "bulk.guide.req.requiredF", guidance: "bulk.guide.col.users.roles" }
];

const DAY_NAMES: ReadonlyArray<{ readonly code: string; readonly label: TranslationKey }> = [
  { code: "MONDAY", label: "bulk.guide.day.monday" },
  { code: "TUESDAY", label: "bulk.guide.day.tuesday" },
  { code: "WEDNESDAY", label: "bulk.guide.day.wednesday" },
  { code: "THURSDAY", label: "bulk.guide.day.thursday" },
  { code: "FRIDAY", label: "bulk.guide.day.friday" },
  { code: "SATURDAY", label: "bulk.guide.day.saturday" },
  { code: "SUNDAY", label: "bulk.guide.day.sunday" }
];

const GUIDE_CONTENT: Record<ImportDomain, GuideContent> = {
  people: {
    records: "bulk.guide.records.people",
    permission: "bulk.guide.permission.adminPastor",
    columns: PEOPLE_COLUMNS,
    duplicateRule: "bulk.guide.duplicate.people",
    jsonExample: `[
  {
    "fullName": "Maria da Silva",
    "phone": "+5511999999999",
    "email": "maria@example.com",
    "birthDate": "1990-05-20",
    "gender": "Feminino",
    "observations": "Importada do sistema anterior",
    "cellCode": "CEL-001"
  }
]`
  },
  cells: {
    records: "bulk.guide.records.cells",
    permission: "bulk.guide.permission.adminPastor",
    columns: CELLS_COLUMNS,
    duplicateRule: "bulk.guide.duplicate.cells",
    dayNames: DAY_NAMES,
    jsonExample: `[
  {
    "code": "CEL-001",
    "name": "Célula Central",
    "status": "FORMING",
    "meetingDay": "WEDNESDAY",
    "meetingTime": "19:30",
    "address": "Rua das Flores, 100"
  }
]`
  },
  users: {
    records: "bulk.guide.records.users",
    permission: "bulk.guide.permission.adminOnly",
    columns: USERS_COLUMNS,
    duplicateRule: "bulk.guide.duplicate.users",
    rolesNote: "bulk.guide.rolesNote",
    jsonExample: `[
  {
    "firstName": "Maria",
    "lastName": "Silva",
    "email": "maria@example.com",
    "initialPassword": "TrocarDepois#2026",
    "roles": ["LEADER"]
  }
]`
  }
};

export function BulkImportGuide({ domain }: { readonly domain: ImportDomain }) {
  const { t } = useI18n();
  const content = GUIDE_CONTENT[domain];
  const headingId = `${domain}-import-guide`;
  const records = t(content.records);
  const tableLabel = t("bulk.guide.columnsTableLabel", { records });

  return (
    <section aria-labelledby={headingId} className="fieldset guide">
      <div>
        <p className="guide__eyebrow">{t("bulk.guide.eyebrow")}</p>
        <h2 className="guide__title" id={headingId}>
          {t("bulk.guide.heading")}
        </h2>
        <p className="page-description">
          {t(content.permission)} {t("bulk.guide.intro")}
        </p>
      </div>

      <ol className="guide__steps">
        <li>{t("bulk.guide.stepDownload")}</li>
        <li>{t("bulk.guide.stepFill")}</li>
        <li>{t("bulk.guide.stepSend")}</li>
      </ol>

      <Alert variant="warning" title={t("bulk.guide.namesAlertTitle")}>
        {t("bulk.guide.namesAlertDesc")}
      </Alert>

      <div>
        <h3 className="guide__subtitle" id={`${headingId}-columns`}>
          {t("bulk.guide.columnsTitle")}
        </h3>
        <Table
          aria-label={tableLabel}
          aria-describedby={headingId}
          columns={[
            { key: "name", header: t("bulk.guide.column.name"), render: (field) => <code>{field.name}</code> },
            { key: "requirement", header: t("bulk.guide.column.requirement"), render: (field) => t(field.requirement) },
            {
              key: "guidance",
              header: t("bulk.guide.column.guidance"),
              render: (field) => t(field.guidance)
            }
          ]}
          rows={content.columns}
          rowKey={(field) => field.name}
        />
      </div>

      {content.dayNames ? (
        <div>
          <h3 className="guide__subtitle" id={`${headingId}-days`}>
            {t("bulk.guide.daysTitle")}
          </h3>
          <ul className="guide__list">
            {content.dayNames.map((day) => (
              <li key={day.code}>
                <code>{day.code}</code> — {t(day.label)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="guide__subtitle" id={`${headingId}-formats`}>
          {t("bulk.guide.formatsTitle")}
        </h3>
        <ul className="guide__list">
          <li>
            <strong>{t("bulk.guide.format.excel.label")}:</strong> {t("bulk.guide.format.excel.body")}
          </li>
          <li>
            <strong>{t("bulk.guide.format.csv.label")}:</strong> {t("bulk.guide.format.csv.body")}
          </li>
          <li>
            <strong>{t("bulk.guide.format.json.label")}:</strong> {t("bulk.guide.format.json.intro")}
            <code>items</code>
            {t("bulk.guide.format.json.keys")}
            <code>null</code>
            {t("bulk.guide.format.json.count")}
          </li>
        </ul>
        {content.rolesNote ? <p className="page-description">{t(content.rolesNote)}</p> : null}
        <figure className="guide__figure">
          <figcaption>{t("bulk.guide.jsonExample", { records })}</figcaption>
          <pre className="guide__code">
            <code>{content.jsonExample}</code>
          </pre>
        </figure>
      </div>

      <Alert variant="info" title={t("bulk.guide.afterTitle")}>
        {t("bulk.guide.afterDesc", { rule: t(content.duplicateRule) })}
      </Alert>
    </section>
  );
}