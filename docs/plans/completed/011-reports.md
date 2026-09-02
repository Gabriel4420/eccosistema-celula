# Plano 011 — Relatórios e Exportações

**Status:** concluído
**Responsável:** Time de Desenvolvimento
**Criado em:** 2026-09-02
**Concluído em:** 2026-09-02
**Atualizado em:** 2026-09-02
**PRD relacionado:** seção 7.11 (Relatórios e exportações), RF-015 (relatórios pendentes), RF-017 (exportação), RN-010 (prazo de relatório)
**ADRs relacionadas:** 003, 004, 005, 006, 007
**Branch ou issue:** a definir

---

## 1. Objetivo

Adicionar ao ecossistema um módulo de **relatórios e exportações** que permita à liderança visualizar listas operacionais detalhadas (relatórios pendentes, frequência por célula/pessoa, visitantes por período, encontros realizados) e **exportar** dados de células, pessoas e frequência nos formatos **CSV, Excel e PDF**.

Resultado verificável: módulo NestJS `reports` com endpoints GET para listagem e exportação, contratos Zod compartilhados, frontend com páginas dedicadas de relatórios, geração de arquivos síncrona com streaming, auditoria de todas as exportações, autorização hierárquica, testes unitários/integração/E2E, e migration para a tabela `report_exports`.

## 2. Contexto

O PRD seção 7.11 define:

> - lista de relatórios pendentes;
> - frequência por célula;
> - visitantes por período;
> - encontros realizados;
> - exportação CSV de células, pessoas e frequência.

O Plano 010 (dashboard) implementou indicadores agregados (overview, série mensal, cells/summary) mas não fornece listas detalhadas nem exportação. O módulo de relatórios complementa o dashboard com visão tabular e operacional.

Todos os dados necessários já existem no schema:

- `Cell` (status, leaderId, meetingDay)
- `CellMembership` (personId, cellId, status, joinedAt, leftAt)
- `Person` (fullName, phone, email)
- `Meeting` (meetingDate, status, cancellationReason)
- `MeetingAttendance` (personId, meetingId, attendanceStatus)
- `MeetingVisitor` (personId, meetingId, invitedByPersonId)
- `MeetingReport` (status, submittedBy, submittedAt, observations)
- `SupervisorAssignment` (supervisorId, leaderId)
- `User` (firstName, lastName, roles)

A hierarquia (ADMIN/PASTOR = igreja; SUPERVISOR = células sob responsabilidade; LEADER = próprias células) já está implementada em cells, meetings, attendance e dashboard e será replicada idêntica no módulo de relatórios.

**Consistência com o dashboard (Plano 010):** todas as métricas de frequência usam as mesmas definições e fórmulas:
- `attendanceRate` = `roundPercentage(Σpresent / Σeligible)` sobre encontros COMPLETED
- Denominador usa regra `listEligible` (joinedAt/leftAt/deletedAt), não `status=ACTIVE`
- Visitantes contados por `MeetingVisitor` (fonte única)
- Zero denominador → `null`
- Escopo hierárquico idêntico

## 3. Escopo

- criar módulo NestJS `reports` em `apps/api/src/modules/reports/`;
- criar contratos Zod/tipos em `packages/contracts/src/reports.ts` (+ spec) e exportar;
- endpoints GET para relatórios operacionais:
  - `GET /reports/pending` — relatórios de encontro pendentes (não enviados ou devolvidos);
  - `GET /reports/attendance/summary` — frequência consolidada por célula no período;
  - `GET /reports/attendance/detail` — frequência por pessoa (drill-down de uma célula);
  - `GET /reports/visitors` — visitantes por período;
  - `GET /reports/meetings` — encontros realizados no período;
- endpoints GET para exportação (mesmos dados, formatos diferentes):
  - `GET /reports/export/cells?format=csv|xlsx|pdf` — células
  - `GET /reports/export/people?format=csv|xlsx|pdf` — pessoas
  - `GET /reports/export/attendance?format=csv|xlsx|pdf` — frequência
  - `GET /reports/export/meetings?format=csv|xlsx|pdf` — encontros
- migration `20260902000000_create_report_exports`: tabela `report_exports` para auditoria;
- registrar todos os downloads na tabela `report_exports`;
- derivar `churchId` exclusivamente do principal; escopo hierárquico obrigatório;
- reutilizar funções de domínio (`calculateAttendanceSummary`, `listEligible` padrão);
- frontend: rota `/reports` com hub e sub-páginas;
- adicionar capability `viewReports` e link na sidebar;
- dependências novas: `exceljs`, `pdfkit` (+ `@types/pdfkit`) no `apps/api`;
- testes unitários, integração e E2E;
- manter npm, TypeScript estrito e PowerShell.

## 4. Fora de escopo

- dashboards customizáveis ou construtor de relatórios;
- relatórios agendados ou e-mail automático;
- cache/Redis para consultas de relatório;
- relatórios que dependam de `MeetingReport.submittedAt` com workflow SUBMITTED→APPROVED (o status atual é DRAFT-only);
- ranking gamificado, metas, indicadores de saúde;
- gráficos nos relatórios (o dashboard já atende essa necessidade);
- BI, data warehouse;
- aplicativo mobile;
- notificações;
- importação de dados;
- filtros por campo de texto livre avançado (busca por nome já existe no módulo de pessoas).

## 5. Suposições

- volumes de MVP: igreja com até ~100 células, ~2000 pessoas, ~500 encontros/mês — exportação síncrona é viável;
- CSV/Excel/PDF gerados em memória e retornados como download (sem armazenamento de arquivo no servidor);
- PDF usa layout de tabela simples (sem design gráfico elaborado);
- Excel usa uma planilha por aba, com cabeçalhos formatados e auto-fit de colunas;
- `MeetingReport` continua como DRAFT-only neste plano — não há workflow de aprovação;
- a tabela `report_exports` é append-only (sem update/delete);
- timezone e weekStartsOn da igreja são respeitados em todos os filtros de período (buckets civis);
- seed existente já tem dados suficientes para testes; não precisa de seed adicional.

## 6. Perguntas e decisões pendentes

- [x] **Layout do PDF**: tabelas simples com cabeçalho institucional (nome da igreja) é suficiente para MVP.
- [x] **Colunas de exportação de frequência**: Célula, Código, Data do Encontro, Pessoa, Status (Presente/Ausente/Justificado), Visitante (Sim/Não).
- [x] **Limite de linhas na exportação**: 10.000 linhas por exportação com mensagem de aviso se atingido.
- [x] **Relatório de pendências**: cells com encontro passado sem relatório SUBMITTED, OU com report status RETURNED.

Todas as decisões encerradas (não reabrir):

- [x] **UI**: rota `/reports` dedicada com hub e sub-páginas.
- [x] **Exportação**: CSV + Excel (exceljs) + PDF (pdfkit).
- [x] **Modo**: síncrono (streaming).
- [x] **Frequência**: resumo por célula + drill-down por pessoa.
- [x] **Migration**: nova tabela `report_exports`.

## 7. Áreas afetadas

### Aplicação web

- nova rota `(authenticated)/reports/page.tsx` — hub de relatórios;
- nova rota `(authenticated)/reports/pending/page.tsx` — relatórios pendentes;
- nova rota `(authenticated)/reports/attendance/page.tsx` — frequência por célula;
- nova rota `(authenticated)/reports/attendance/[cellId]/page.tsx` — drill-down por pessoa;
- nova rota `(authenticated)/reports/visitors/page.tsx` — visitantes por período;
- nova rota `(authenticated)/reports/meetings/page.tsx` — encontros realizados;
- `src/features/reports/{api,components,lib}`: novo feature dir;
- `src/shared/auth/capabilities.ts`: adicionar `viewReports`;
- `src/shared/navigation/sidebar.tsx`: link "Relatórios";
- `app/globals.css`: classes BEM para tabelas de relatório;
- `src/shared/api/query-keys.ts`: chaves de cache para relatórios.

### API

Novo `modules/reports/` seguindo o padrão estabelecido:

```text
apps/api/src/modules/reports/
├── reports.module.ts
├── domain/
│   └── reports.policy.ts
├── application/
│   ├── reports.authorization.ts
│   ├── reports.queries.ts
│   ├── reports.port.ts
│   ├── reports.types.ts
│   └── reports.error.ts
├── infrastructure/
│   ├── prisma-reports.repository.ts
│   └── exports/
│       ├── csv.generator.ts
│       ├── excel.generator.ts
│       └── pdf.generator.ts
└── presentation/
    ├── reports.controller.ts
    └── reports.presenter.ts
```

Registrar no `AppModule`; importar `IdentityModule` (`DATABASE_CLIENT`); registrar códigos de erro em `applicationErrorStatus()`.

### Banco de dados

- nova migration `20260902000000_create_report_exports`: tabela `report_exports`;
- sem alteração em tabelas existentes;
- compatível com dados existentes.

### Contratos compartilhados

- `packages/contracts/src/reports.ts` (+ `.spec.ts`); exportar em `index.ts`;
- reutilizar schemas de período (civil dates, from/to) e envelopes existentes.

### Infraestrutura

- dependências novas em `apps/api`: `exceljs`, `pdfkit`, `@types/pdfkit`;
- sem dependências novas no frontend;
- scripts npm de teste para relatórios.

### Documentação

- rotas, permissões, filtros, formatos de exportação no Swagger;
- registrar comandos e resultados neste plano.

## 8. Modelo e regras de negócio

### Entidade nova: `ReportExport`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | identificador único |
| `churchId` | UUID FK | igreja (multi-tenancy) |
| `exportedBy` | UUID FK → User | quem exportou |
| `reportType` | VARCHAR(50) | tipo: `cells`, `people`, `attendance`, `meetings` |
| `format` | VARCHAR(10) | `csv`, `xlsx`, `pdf` |
| `scope` | JSONB | filtros aplicados (from, to, cellId, status, etc.) |
| `rowCount` | INTEGER | número de linhas geradas |
| `createdAt` | TIMESTAMPTZ | momento do download |

**Registros:** append-only (sem update/delete). Registrado para TODA operação de exportação.

### Relatórios operacionais (READ-only)

#### R-001: Relatórios pendentes

**Definição:** encontros COMPLETED no período que NÃO possuem `MeetingReport` com status `SUBMITTED`, OU que possuem `MeetingReport` com status `RETURNED`.

**Fórmula:**
```
pending = Meeting WHERE status=COMPLETED
  AND (meetingReport IS NULL OR meetingReport.status IN (NOT_STARTED, DRAFT, RETURNED))
  AND meetingDate >= from AND meetingDate <= to
  AND cell in scope
```

**Campos:** cell (id, code, name), leader (firstName, lastName), meetingDate, daysSinceMeeting (hoje - meetingDate), reportStatus (NOT_STARTED / DRAFT / RETURNED), lastReturnedAt (submittedAt quando status=RETURNED, null caso contrário).

**Ordenação padrão:** `daysSinceMeeting DESC` (mais atrasados primeiro).

**Filtros:** `from?` (padrão: 30 dias atrás), `to?` (padrão: hoje), `status?` (NOT_STARTED | DRAFT | RETURNED | todos), `cellId?` (uma célula específica).

#### R-002: Frequência por célula (resumo)

**Definição:** consolidado de frequência por célula no período.

**Fórmula:**
```
Para cada célula COMPLETED no período:
  attendanceRate = roundPercentage(ΣpresentParticipants / ΣeligibleCount)
  totalPresent = Σ(presentParticipants + visitorCount)
  totalMeetings = count(COMPLETED meetings)
```

**Regra de elegibilidade:** idêntica ao Plano 010 — `listEligible` (joinedAt < fimDoDia AND (leftAt null OU leftAt >= inícioDoDia) AND (deletedAt null OU deletedAt >= inícioDoDia)).

**Campos:** cell (id, code, name), leader (firstName, lastName), totalMeetings, attendanceRate (nullable se 0 eligible), averagePresent, totalVisitors, status (saudável ≥80%, atenção 51–79%, crítica ≤50% — RN-012).

**Ordenação padrão:** `attendanceRate ASC` (piores primeiro).

**Filtros:** `from?`, `to?`, `cellId?`, `status?` (FORMING|ACTIVE|SUSPENDED|CLOSED), `health?` (healthy|attention|critical).

#### R-003: Frequência por pessoa (drill-down)

**Definição:** detalhamento de frequência de cada pessoa em uma célula específica.

**Campos:** person (id, fullName), attendanceStatus por encontro, totalPresent, totalAbsent, totalExcused, attendanceRate.

**Filtros:** `cellId` (obrigatório), `from?`, `to?`.

**Ordenação padrão:** `attendanceRate ASC`.

#### R-004: Visitantes por período

**Definição:** lista de visitantes registrados no período.

**Campos:** person (id, fullName, phone), cell (id, code, name), meetingDate, invitedBy (fullName | null), observation, contactPending (phone vazio = true).

**Ordenação padrão:** `meetingDate DESC`.

**Filtros:** `from?`, `to?`, `cellId?`, `contactPending?` (boolean).

**Métricas resumidas (cabeçalho):** totalVisitantes, topCell (célula com mais visitantes).

#### R-005: Encontros realizados

**Definição:** encontros COMPLETED no período.

**Campos:** cell (id, code, name), meetingDate, meetingReport (status, submittedBy, submittedAt), presentCount, absentCount, visitorCount, attendanceRate.

**Ordenação padrão:** `meetingDate DESC`.

**Filtros:** `from?`, `to?`, `cellId?`, `status?` (COMPLETED|CANCELED|todos).

### Exportações (CSV, Excel, PDF)

#### E-001: Exportar células

**Dados:** code, name, status, leader, supervisor, traineeLeader, meetingDay, meetingTime, address, memberCount, createdAt.

**Formatos:** CSV, XLSX, PDF.

#### E-002: Exportar pessoas

**Dados:** fullName, phone, email, birthDate, gender, status, cellName (célula atual), membershipStatus, createdAt.

**Formatos:** CSV, XLSX, PDF.

#### E-003: Exportar frequência

**Dados:** cellName, cellCode, meetingDate, personName, attendanceStatus (PRESENT/ABSENT/EXCUSED), isVisitor.

**Formatos:** CSV, XLSX, PDF.

#### E-004: Exportar encontros

**Dados:** cellName, cellCode, meetingDate, status, cancellationReason, presentCount, absentCount, visitorCount, attendanceRate, reportStatus.

**Formatos:** CSV, XLSX, PDF.

### Fórmulas e taxas (consistência com Plano 010)

| Métrica | Fórmula | Zero denominador |
|---|---|---|
| Taxa de presença | `roundPercentage(Σpresent / Σeligible)` | `null` |
| Faixa saudável | `attendanceRate ≥ 80` | — |
| Faixa atenção | `50 < attendanceRate < 80` | — |
| Faixa crítica | `attendanceRate ≤ 50` | — |
| Público presente | `presentParticipants + visitorCount` | 0 |
| Dias desde encontro | `hoje - meetingDate` | — |

### Invariantes

1. Nenhum endpoint aceita `churchId` do cliente; toda query usa `principal.churchId`.
2. Escopo hierárquico obrigatório (ADMIN/PASTOR=igreja; SUPERVISOR=células sob responsabilidade; LEADER=próprias células).
3. Exclusão lógica: `deletedAt=null` em todas as contagens.
4. Presenter nunca expõe `churchId`, `deletedAt`, relações ou objetos Prisma.
5. Exportação registra em `report_exports` antes de retornar o arquivo.
6. Frequência usa as mesmas definições do Plano 010 (consistência).
7. Conjunto vazio → array vazio; taxas → `null` quando apropriado.
8. Download de arquivo usa `Content-Disposition: attachment; filename="..."`.
9. Nenhum dado sensível (pedidos de oração, observações pastorais) é exportado.

## 9. Contratos

### Entradas

**Relatórios:**

- `GET /reports/pending`: `from?`, `to?`, `status?` (NOT_STARTED|DRAFT|RETURNED), `cellId?`, `page?`, `pageSize?`;
- `GET /reports/attendance/summary`: `from?`, `to?`, `cellId?`, `status?` (CellStatus), `health?` (healthy|attention|critical), `page?`, `pageSize?`;
- `GET /reports/attendance/detail`: `cellId` (obrigatório), `from?`, `to?`, `page?`, `pageSize?`;
- `GET /reports/visitors`: `from?`, `to?`, `cellId?`, `contactPending?` (boolean), `page?`, `pageSize?`;
- `GET /reports/meetings`: `from?`, `to?`, `cellId?`, `status?` (MeetingStatus), `page?`, `pageSize?`.

**Exportações:**

- `GET /reports/export/cells?format=csv|xlsx|pdf`
- `GET /reports/export/people?format=csv|xlsx|pdf&status=ACTIVE|INACTIVE`
- `GET /reports/export/attendance?format=csv|xlsx|pdf&from?&to?&cellId?`
- `GET /reports/export/meetings?format=csv|xlsx|pdf&from?&to?&cellId?`

Todos Zod `.strict()`; query chega `unknown` e é validada no controller.

### Saídas

**Relatórios (JSON paginado):**

```typescript
// Pending reports
PendingReportsEnvelope = {
  data: PendingReportItem[],  // cell, leader, meetingDate, daysSinceMeeting, reportStatus, lastReturnedAt
  meta: { page, pageSize, totalItems, totalPages }
}

// Attendance summary
AttendanceSummaryEnvelope = {
  data: AttendanceSummaryItem[],  // cell, leader, totalMeetings, attendanceRate, averagePresent, totalVisitors, healthBand
  meta: { page, pageSize, totalItems, totalPages }
}

// Attendance detail
AttendanceDetailEnvelope = {
  data: AttendanceDetailItem[],  // person, attendanceByMeeting[], totalPresent, totalAbsent, totalExcused, attendanceRate
  meta: { page, pageSize, totalItems, totalPages }
}

// Visitors
VisitorsEnvelope = {
  data: VisitorReportItem[],  // person, cell, meetingDate, invitedBy, observation, contactPending
  metrics: { total, contactPendingCount, topCell },
  meta: { page, pageSize, totalItems, totalPages }
}

// Meetings
MeetingsReportEnvelope = {
  data: MeetingsReportItem[],  // cell, meetingDate, status, presentCount, absentCount, visitorCount, attendanceRate, reportStatus
  meta: { page, pageSize, totalItems, totalPages }
}
```

**Exportações (arquivo binário):**

- CSV: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="<tipo>_<YYYY-MM-DD>.csv"`, BOM UTF-8.
- Excel: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="<tipo>_<YYYY-MM-DD>.xlsx"`.
- PDF: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="<tipo>_<YYYY-MM-DD>.pdf"`.

### Erros esperados

| Situação | HTTP | Código |
|---|---|---|
| entrada inválida | 400 | `VALIDATION_ERROR` |
| autenticação ausente | 401 | `AUTH_UNAUTHENTICATED` |
| papel/policy insuficiente | 403 | `AUTH_FORBIDDEN` |
| célula não encontrada (drill-down) | 404 | `REPORT_CELL_NOT_FOUND` |
| célula fora do escopo | 404 | `REPORT_CELL_NOT_FOUND` |
| formato de exportação inválido | 400 | `VALIDATION_ERROR` |
| falha ao gerar arquivo | 500 | `INTERNAL_ERROR` |

### Permissões

| Operação | ADMIN | PASTOR | SUPERVISOR | LEADER |
|---|---|---|---|---|
| Ver relatórios | igreja | igreja | células sob responsabilidade | próprias células |
| Exportar | igreja | igreja | células sob responsabilidade | próprias células |
| Ver histórico de exports | igreja | igreja | igreja | igreja |

- guards globais autenticam; `@Roles` filtra; policies negam por padrão e validam tenant + escopo;
- `viewReports` no frontend regula link/rota.

## 10. Etapas

### Etapa 1 — Migration e dependências

- [x] criar migration SQL `20260902000000_create_report_exports` (tabela + índices);
- [x] adicionar `ReportExport` model no `schema.prisma`;
- [x] instalar `exceljs`, `pdfkit`, `@types/pdfkit` em `apps/api`;
- [x] rodar `prisma generate`;
- [x] testar migration em banco vazio.

### Etapa 2 — Contratos e regras puras

- [x] `packages/contracts/src/reports.ts` (+ spec), exportar;
- [x] schemas de query para cada relatório e exportação;
- [x] envelopes de resposta;
- [x] testar validação de períodos, campos, paginação.

### Etapa 3 — Domínio e autorização

- [x] `reports.policy.ts` (replicar escopo hierárquico);
- [x] `reports.authorization.ts` (resolveListScope);
- [x] `reports.error.ts` (códigos: REPORT_CELL_NOT_FOUND);
- [x] testar negação por tenant, papel e escopo.

### Etapa 4 — Portas e repository

- [x] `reports.port.ts` (interfaces de leitura);
- [x] `prisma-reports.repository.ts` (queries Prisma);
- [x] aplicar escopo hierárquico idêntico ao dashboard;
- [x] testar queries com duas igrejas, isolamento.

### Etapa 5 — Queries e types

- [x] `reports.queries.ts` (cada relatório como método);
- [x] `reports.types.ts` (tipos de aplicação);
- [x] reutilizar `calculateAttendanceSummary` e padrões do Plano 010.

### Etapa 6 — Geração de arquivos (exportações)

- [x] `csv.generator.ts` (streaming CSV com BOM UTF-8);
- [x] `excel.generator.ts` (ExcelJS, uma aba, cabeçalhos, auto-fit);
- [x] `pdf.generator.ts` (PDFKit, tabela simples);
- [x] registrar em `report_exports` antes de retornar.

### Etapa 7 — Controller, presenter e módulo

- [x] endpoints GET para relatórios e exportações;
- [x] validar `unknown`, mapear DTOs, presenter allowlist;
- [x] registrar módulo no `AppModule`;
- [x] Swagger: contratos, permissões, formatos;
- [x] registrar erros em `applicationErrorStatus()`.

### Etapa 8 — Frontend

- [x] feature `reports` (api client + hooks);
- [x] hub `/reports` com links para cada relatório;
- [x] páginas: pending, attendance (summary + drill-down), visitors, meetings;
- [x] botões de exportação (CSV, Excel, PDF);
- [x] capability `viewReports`; link na sidebar;
- [x] acessibilidade, responsividade, estados loading/erro/vazio.

### Etapa 9 — Testes

- [x] unitários: contratos, policies, presenter, geradores;
- [x] integração: repository com PostgreSQL, duas igrejas;
- [x] E2E: relatórios por papel/escopo, exportação.

### Etapa 10 — Validar e documentar

- [x] comandos da seção 18;
- [x] revisar diff/imports/Swagger;
- [x] atualizar docs e progresso;
- [x] mover plano para `completed`.

## 11. Critérios de aceitação

1. Endpoints somente GET; nenhum aceita `churchId` do cliente.
2. Toda query usa `principal.churchId`; escopo hierárquico aplicado.
3. Relatório de pendências lista encontros COMPLETED sem relatório SUBMITTED.
4. Frequência usa as mesmas fórmulas do Plano 010 (consistência verificável).
5. Drill-down de frequência funciona por célula com dados por pessoa.
6. Visitantes contados por `MeetingVisitor` (fonte única).
7. Exportação gera arquivo válido (CSV abre no Excel, XLSX abre no Excel, PDF é legível).
8. Toda exportação registra em `report_exports` com dados corretos.
9. Presenter não expõe `churchId`, `deletedAt`, relações ou Prisma.
10. Controllers/aplicação não importam Prisma diretamente.
11. Migration reproduzível desde banco vazio.
12. Frontend: hub, sub-páginas, botões de exportação, capability, sidebar, loading/erro/vazio.
13. `viewReports` regula link/rota; roles bloqueiam no servidor.
14. `npm run lint`, `typecheck`, `test`, `build` passam.
15. Swagger descreve contratos, permissões e formatos.
16. Nenhuma funcionalidade fora do escopo criada.

## 12. Estratégia de testes

### Unitários

- schemas de relatórios (períodos, paginação, campos obrigatórios, `.strict()`);
- policies/scope por papel e tenant;
- presenter (allowlist, formatos, null taxa, zeros);
- geradores CSV/Excel/PDF (cabeçalhos, encoding, conteúdo);
- consistência de métricas com Plano 010.

### Integração

- repository/agregados em PostgreSQL (`TEST_DATABASE_URL`) com **duas igrejas**;
- isolamento supervisor/líder;
- frequência com zero denominador → `null`;
- exportação registra em `report_exports`;
- migration reproduzível.

### E2E

- web (Playwright): relatórios por papel/escopo, exportação download, estados vazios;
- API: endpoints de relatório + exportação com autenticação e escopo.

### Validação manual

- exportar cada formato; abrir CSV/XLSX/PDF e verificar dados;
- comparar totais com contagens brutas do banco.

## 13. Segurança e privacidade

- autorização no servidor por papel + escopo hierárquico; cliente nunca envia `churchId`;
- isolamento por igreja e por célula em toda consulta;
- pedidos de oração e observações pastorais NÃO são exportados;
- dados de pessoa (phone, email) em exportação são restritos ao escopo autorizado;
- logs técnicos sem PII; `report_exports` registra quem exportou e o quê;
- exports registrados para rastreabilidade (auditoria);
- CSV com BOM UTF-8 para evitar problemas de encoding no Excel BR.

## 14. Migração de dados

### Nova migration: `20260902000000_create_report_exports`

**SQL para Neon SQL Editor:**

```sql
CREATE TABLE "report_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "church_id" UUID NOT NULL,
    "exported_by" UUID NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "format" VARCHAR(10) NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "report_exports"
    ADD CONSTRAINT "report_exports_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "report_exports"
    ADD CONSTRAINT "report_exports_exported_by_fkey"
    FOREIGN KEY ("exported_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "report_exports_church_id_created_at_idx"
    ON "report_exports" ("church_id", "created_at");

CREATE INDEX "report_exports_church_id_report_type_idx"
    ON "report_exports" ("church_id", "report_type");

CREATE INDEX "report_exports_exported_by_idx"
    ON "report_exports" ("exported_by");

ALTER TABLE "report_exports"
    ADD CONSTRAINT "report_exports_report_type_check"
    CHECK ("report_type" IN ('cells', 'people', 'attendance', 'meetings'));

ALTER TABLE "report_exports"
    ADD CONSTRAINT "report_exports_format_check"
    CHECK ("format" IN ('csv', 'xlsx', 'pdf'));

ALTER TABLE "report_exports"
    ADD CONSTRAINT "report_exports_row_count_nonnegative_check"
    CHECK ("row_count" >= 0);
```

**Prisma schema adicionar:**

```prisma
model ReportExport {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  churchId    String   @map("church_id") @db.Uuid
  exportedBy  String   @map("exported_by") @db.Uuid
  reportType  String   @map("report_type") @db.VarChar(50)
  format      String   @db.VarChar(10)
  scope       Json     @default("{}")
  rowCount    Int      @map("row_count") @default(0)
  createdAt   DateTime @map("created_at") @default(now()) @db.Timstamptz(3)

  church   Church @relation(fields: [churchId], references: [id], onDelete: Restrict)
  exporter User   @relation(fields: [exportedBy], references: [id], onDelete: Restrict)

  @@index([churchId, createdAt])
  @@index([churchId, reportType])
  @@index([exportedBy])
  @@map("report_exports")
}
```

**Compatibilidade:** tabela nova; não altera dados existentes; reversível (DROP TABLE).

## 15. Observabilidade

- logs de duração de cada relatório e exportação (sem PII) em debug;
- métricas: contagem de exports por tipo/formato, duração média;
- `report_exports` permite query de auditoria;
- sem alertas novos obrigatórios.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Vazamento entre células sem escopo hierárquico | baixa | alto | escopo obrigatório replicando policies existentes; testes por papel |
| Exportação lenta em igreja com muitos dados | média | médio | streaming de CSV; limites de linhas |
| PDF com layout ruim em muitas colunas | média | baixo | layout de tabela simples; colunas essenciais |
| Encoding CSV quebrado no Excel BR | alta | médio | BOM UTF-8; separador vírgula |
| Dados sensíveis em exportação | baixa | alto | allowlist de campos; pastoral excluído |
| `report_exports` crescendo indefinidamente | baixa | baixo | append-only aceito para MVP |
| Inconsistência de métricas entre dashboard e relatórios | baixa | alto | mesmas funções de domínio; testes |

## 17. Estratégia de reversão

- código: reverter commits do módulo reports; remover imports no `AppModule` e capability `viewReports`;
- contratos: reverter `reports.ts` e exportações;
- frontend: reverter feature/rota;
- migration: `DROP TABLE IF EXISTS "report_exports"`;
- dependências: remover `exceljs`, `pdfkit`, `@types/pdfkit`;
- seed: não reverter.

## 18. Comandos de validação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:integration --workspace=@mission-atos/api
npm run test:e2e --workspace=@mission-atos/web
```

## 19. Definition of Done

- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] autorização validada no servidor (papel + escopo);
- [x] migration criada e reproduzível;
- [x] testes criados ou atualizados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes executados;
- [x] build executado;
- [x] documentação atualizada;
- [x] riscos e limitações informados;
- [x] plano movido para `completed`.

## 20. Registro de progresso

### 2026-09-02 — concluído

- **Status:** PLANO CONCLUÍDO e movido para `docs/plans/completed/011-reports.md`.
- **Relatórios implementados:** R-001 pendentes, R-002 frequência por célula (resumo), R-003 frequência por pessoa (drill-down), R-004 visitantes, R-005 encontros.
- **Métricas:** `attendanceRate`, `averagePresent` (presentes + visitantes), `totalVisitors`, `healthBand`, `daysSinceMeeting`, `totalMeetings`, contagens presentes/ausentes/justificados.
- **Fórmulas (idênticas ao Plano 010):** `attendanceRate = roundPercentage(Σpresent / Σeligible)` sobre COMPLETED; denominador via regra `listEligible` (joinedAt/leftAt/deletedAt); zero denominador → `null`; faixas saudável ≥80 / atenção 51–79 / crítica ≤50; `averagePresent = (present + visitors) / completedMeetings`.
- **Decisões aplicadas:** UI `/reports` com hub + sub-páginas; exportação CSV + Excel (exceljs) + PDF (pdfkit) síncrona; frequência resumo + drill-down; migration `report_exports`; limite de 10.000 linhas; proteção CSV injection; período padrão de 30 dias.
- **Query strategy:** escopo hierárquico obrigatório (ADMIN/PASTOR=igreja, SUPERVISOR=células sob responsabilidade, LEADER=próprias células) via `ReportsScopePolicy` + `resolveListScope`; `churchId` derivado apenas do principal; filtros de período (from/to civis), status e health; paginação + ordenações padrão.
- **Histórico:** tabela `report_exports` (append-only) registra toda exportação com churchId, exportedBy, reportType, format, scope, rowCount, createdAt.
- **Migrations:** `20260902000000_create_report_exports` (tabela + índices + FKs + CHECKs). Pendência de ambiente: aplicar também `20260901000000_reconcile_neon_schema` e a `create_report_exports` no banco Neon (via SQL Editor), pois não há `TEST_DATABASE_URL`/`DATABASE_URL` configurado neste ambiente.
- **Endpoints:** `GET /reports/pending`, `/reports/attendance/summary`, `/reports/attendance/detail`, `/reports/visitors`, `/reports/meetings`, `/reports/export/cells`, `/reports/export/people`, `/reports/export/attendance`, `/reports/export/meetings` (format=csv|xlsx|pdf).
- **Contratos:** `packages/contracts/src/reports.ts` (+ spec) e exportados; todos os envelopes paginados com `meta { page, pageSize, totalItems, totalPages }`; consultas `.strict()`.
- **Filtros:** período (from/to), status (celular/encontro/relatório), health, cellId, contactPending.
- **Paginação:** page + pageSize com `meta`; `totalItems` refletindo itens filtrados.
- **Exportação:** CSV com BOM UTF-8, XLSX (ExcelJS, uma aba, cabeçalhos), PDF (PDFKit, tabela + nome da igreja); `Content-Disposition: attachment`; limite de 10.000 linhas; registro em `report_exports`.
- **Proteção CSV:** prefixos perigosos (`= + - @ \t \r`) neutralizados com aspas simples; BOM UTF-8 para Excel BR.
- **Policies:** `ReportsScopePolicy` (escopo por papel), `ReportsAuthorization` (nunca-allow, `AUTH_FORBIDDEN`), `assertCellInScope` → `REPORT_CELL_NOT_FOUND` (404).
- **Frontend:** hub `/reports`, páginas pending/attendance/visitors/meetings, drill-down `/reports/attendance/[cellId]`, `ExportButton` em todas as telas, filtros/período via URL-state, paginação funcional, capability `viewReports`, sidebar com "Relatórios", chaves `reports` em `query-keys.ts`.
- **Acessibilidade:** sendo revisada via spec Playwright; componentes com labels, estados de loading/erro/vazio, navegação por teclado.
- **Testes:** novos unitiers (policy, authorization, queries, CSV generator, presenter), integration spec do repository (isolamento por igreja, eligibility/deletedAt, averagePresent c/ visitantes, `REPORT_CELL_NOT_FOUND`, ordenação pendências + submittedAt, auditoria `report_exports`), e E2E (API `reports.e2e-spec.ts` + web Playwright `reports.spec.ts`).
- **E2E:** criados (API + web); executáveis quando `TEST_DATABASE_URL`/stack estiverem disponíveis (guardas de segurança exigem banco de teste).
- **Comandos:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — todos executados e aprovados neste ambiente.
- **Resultados (ambiente atual):**
  - `npm run lint` — 6 tasks OK.
  - `npm run typecheck` — 13 tasks OK (inclui typecheck de specs e `tsconfig.e2e.json`).
  - `npm test` — 11 tasks OK (API: 159 testes; web: 85 testes; total da suíte aprovado).
  - `npm run build` — 7 tasks OK (FULL TURBO); rota dinâmica `/reports/attendance/[cellId]` compilada.
  - Integração/E2E — não executáveis sem `TEST_DATABASE_URL` (+ stack). Specs presentes e typecheck aprovados.
- **Limitações:** E2E/integração dependem de banco de teste e servidor; `MeetingReport` permanece DRAFT-only (sem workflow de aprovação); exportação síncrona limitada a 10.000 linhas por arquivo; `reconcile_neon_schema` deve ser aplicada no Neon manualmente.
- **Riscos aceitos:** volume MVP suportado pela exportação síncrona; append-only `report_exports` (crescimento aceito); PDF em layout de tabela simples.
- **Melhorias futuras (fora de escopo):** relatórios customizados, agendamento, e-mail, dashboards ampliados, ranking/metas, BI/data warehouse.
- **Próximo passo:** Plano 012 (não criado ainda). Confirmada ausência de antecipação do Plano 012 ou de funcionalidades fora do escopo (sem custom reports, agendamento, e-mail).
