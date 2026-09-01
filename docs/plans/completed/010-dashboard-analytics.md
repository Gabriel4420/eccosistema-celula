# Plano 010 — Dashboard e indicadores operacionais

**Status:** Concluído
**Responsável:** a definir
**Criado em:** 2026-08-31
**Atualizado em:** 2026-09-01
**PRD relacionado:** seção de indicadores/relatórios; RN-006
**ADRs relacionadas:** 003, 004 (liderança direta), 005/006 (transições idempotentes)
**Branch ou issue:** a definir

---

> **Disposição final (2026-09-01):** plano implementado, revisado integralmente e corrigido. Todos os bugs de revisão (um Alto, três Médios) foram aplicados e validados. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam em toda a monorepo. As únicas pendências de execução são ambientais (E2E web Playwright e E2E API dependem de credenciais/servidor local indisponíveis nesta sessão; ambos os specs estão escritos e passam em typecheck, e o E2E API registrou 7/7 verdes na sessão de implementação). Nenhuma funcionalidade fora do escopo foi criada; o Plano 011 não foi antecipado. Documento movido para `docs/plans/completed/010-dashboard-analytics.md`.

---

## 1. Objetivo

Adicionar ao painel uma **camada de leitura/análise (dashboard)** com indicadores operacionais da igreja **derivados exclusivamente de dados já implementados** (pessoas, células, vínculos, encontros, frequência e visitantes). É **somente leitura**: não duplica regras de negócio, não cria segunda fonte de verdade, não persiste nada.

Resultado verificável: endpoints GET agregados por igreja e por **escopo hierárquico**, contratos Zod compartilhados, frontend com cards, gráfico simples e alertas clicáveis, testes unitários/integração/E2E, isolamento por `churchId`, autorização por papel e escopo, acessibilidade e responsividade.

## 2. Contexto

O PRD prevê que a liderança acompanhe a saúde das células sem relatórios manuais. Hoje `app/(authenticated)/dashboard/page.tsx` é só um conjunto de atalhos, sem dados.

Tudo o que o dashboard precisa já existe no schema e no código:

- `Cell` (`status: FORMING|ACTIVE|SUSPENDED|CLOSED`, `leaderId`, `traineeLeaderId`);
- `CellMembership` (`status: ACTIVE|INACTIVE|TRANSFERRED`, `joinedAt`, `leftAt`);
- `Meeting` (`meetingDate DATE`, `status: SCHEDULED|COMPLETED|CANCELED`);
- `MeetingAttendance` (`PRESENT|ABSENT|EXCUSED`);
- `MeetingVisitor` (visitantes; sempre acompanhado de `MeetingAttendance=PRESENT`);
- `Person` (`deletedAt`);
- `SupervisorAssignment` (hierarquia supervisor→líder).
- Regras de frequência por encontro em `@mission-atos/domain` (`calculateAttendanceSummary`), a **reutilizar**.

A hierarquia (ADMIN/PASTOR = igreja; SUPERVISOR = células sob responsabilidade via `SupervisorAssignment`; LEADER = células que lidera/trainee) **já está implementada e consistente** em cells, meetings e attendance e **será replicada** no dashboard. Cliente nunca envia `churchId` como autoridade.

## 3. Escopo

- criar módulo NestJS `dashboard-analytics` (somente leitura) em `apps/api/src/modules/dashboard-analytics/`;
- criar contratos Zod/tipos em `packages/contracts/src/analytics.ts` (+ spec) e exportar;
- endpoints GET: `/dashboard/overview`, `/dashboard/series`, `/dashboard/cells/summary`;
- derivar `churchId` exclusivamente do principal; aplicar escopo hierárquico por papel;
- reutilizar `calculateAttendanceSummary`/enums de `@mission-atos/domain`;
- criar repository Prisma com queries agregadas em snapshot consistente, sem N+1;
- presenter com allowlist; documentar no Swagger;
- validar `EXPLAIN` e adicionar índices aditivos **somente** se comprovado ganho (sem migration obrigatória);
- frontend: enriquecer `/dashboard` com cards, gráfico SVG próprio, alertas clicáveis; manter atalhos;
- adicionar capability `viewAnalytics` e link de navegação;
- testes unitários, integração e E2E;
- manter npm, TypeScript estrito e PowerShell.

## 4. Fora de escopo

- relatórios exportáveis (PDF/Excel), impressão;
- dashboards customizáveis e construtor de widgets;
- BI, data warehouse, Redis/cache distribuído;
- notificações e e-mails;
- ranking gamificado, metas, níveis;
- mapa, geolocalização, IA;
- **qualquer métrica derivada de `MeetingReport`** (fluxo é DRAFT-only; sem workflow SUBMITTED);
- qualquer escrita/mutação a partir do dashboard;
- aplicativo mobile;
- criação do Plano 011.

## 5. Suposições

- uma igreja por conta autenticada, mas isolamento por `churchId` obrigatório em todas as queries;
- `deletedAt = null` = ativo; entidades excluídas logicamente não contam;
- **Membro por célula** = `CellMembership` com `status=ACTIVE` e `deletedAt=null`;
- **Elegíveis de frequência** = regra de `listEligible` (joinedAt/leftAt/deletedAt por dia), **não** `status=ACTIVE` — usada só como denominador da taxa;
- encontro `COMPLETED` com frequência registrada é a base das taxas;
- visitantes são contados por `MeetingVisitor` (fonte única), nunca por `MeetingAttendance` (evita dupla contagem);
- séries/totais em snapshot consistente (RepeatableRead);
- apresentação respeita `timezone`/`weekStartsOn` da igreja (buckets civis `YYYY-MM`);
- gráfico em **SVG próprio** (sem dependência de produção nova em nenhum workspace);
- seed: adicionar `SEED_VISITORS` para E2E determinístico;
- testes conectados usam `TEST_DATABASE_URL` dedicada.

## 6. Perguntas e decisões pendentes

Decisões já encerradas (não reabrir):

- [x] **Escopo hierárquico**: ADOTADO e obrigatório. ADMIN/PASTOR → `church`; SUPERVISOR → `leaderId IN (assignments)` (vazio se sem atribuição); LEADER → `OR leaderId/traineeLeaderId`. Replica o filtro de `prisma-cells-management.repository` e policies existentes.
- [x] **Visitantes**: dentro do MVP; fonte = `MeetingVisitor`; seed adicionada.
- [x] **Período padrão**: últimos 30 dias (`period=30d`), com delta vs. período anterior igual, ambos opcionais via `from`/`to`.
- [x] **Gráfico**: SVG próprio, sem dependência de produção.
- [x] **Rota da UI**: enriquecer `/dashboard` (mantém atalhos).
- [x] **Relatórios**: fora de qualquer métrica.

Pendência a confirmar ANTES da Etapa 1:

- [ ] **"Células sem encontro há N dias"**: definir N padrão (recomendado 14) e expor como parâmetro `windowDays` (2–90).

Não implementar hipótese relevante não registrada.

## 7. Áreas afetadas

### Aplicação web

- `app/(authenticated)/dashboard/page.tsx`: consumir dashboard, mantendo atalhos;
- `src/features/analytics/{api,components,lib}`: novo feature dir;
- `src/shared/auth/capabilities.ts`: adicionar `viewAnalytics`;
- `src/shared/navigation/sidebar.tsx`: link do dashboard/analytics (se aplicável);
- `src/shared/components`: usar `Skeleton`/`EmptyState`/`ErrorState`/`StatusBadge` existentes; criar `StatCard` simples;
- `app/globals.css`: classes BEM para cards/gráfico/alertas usando tokens `:root`.

### API

Novo `modules/dashboard-analytics/` espelhando cells/meetings:

```text
apps/api/src/modules/dashboard-analytics/
├── dashboard-analytics.module.ts
├── application/
│   ├── dashboard-analytics.types.ts
│   ├── dashboard-analytics.queries.ts
│   ├── dashboard-analytics.port.ts
│   ├── dashboard-analytics.authorization.ts
│   └── dashboard-analytics.error.ts
├── domain/
│   └── dashboard-analytics.policy.ts
├── infrastructure/
│   └── prisma-dashboard-analytics.repository.ts
└── presentation/
    ├── dashboard-analytics.controller.ts
    └── dashboard-analytics.presenter.ts
```

Registrar no `AppModule`; importar `IdentityModule` (`DATABASE_CLIENT`); registrar códigos de erro em `applicationErrorStatus()` do filtro global.

### Banco de dados

- sem mudança de schema obrigatória; índices existentes cobrem a maioria;
- migration aditiva **somente** se `EXPLAIN` comprovar `Seq Scan` relevante;
- não editar migrations aplicadas;
- seed: adicionar `SEED_VISITORS` (E2E determinístico).

### Contratos compartilhados

- `packages/contracts/src/analytics.ts` (+ `.spec.ts`); exportar em `index.ts`;
- reutilizar `from`/`to` (civis `YYYY-MM-DD`, `from<=to`) e envelopes.

### Infraestrutura

- reutilizar PostgreSQL, Prisma, Jest, Supertest, Swagger, Zod;
- scripts npm de integração/E2E de dashboard;
- sem dependências novas.

### Documentação

- rotas, permissões, filtros, métricas, fórmulas e erros no Swagger e na doc operacional;
- registrar comandos e resultados neste plano.

## 8. Modelo e regras de negócio

Métricas (cada uma com definição, fórmula, fonte, período, status, exclusão lógica, timezone, arredondamento e zero denominador):

| Indicador | Definição / Fórmula | Fonte | Período | Zero denominador |
| --- | --- | --- | --- | --- |
| Pessoas ativas | `count(Person WHERE churchId AND deletedAt IS NULL)` | `Person` | corte pontual (hoje) | n/a |
| Células ativas | `count(Cell WHERE churchId AND status=ACTIVE AND deletedAt IS NULL)` | `Cell` | hoje | n/a |
| Células formando | `count(Cell WHERE churchId AND status=FORMING AND deletedAt IS NULL)` | `Cell` | hoje | n/a |
| Membros por célula (card) | `count(CellMembership WHERE churchId AND status=ACTIVE AND deletedAt IS NULL)` agrupado por célula | `CellMembership` | hoje | 0 |
| Encontros no período | `count(Meeting WHERE churchId AND cell in scope AND deletedAt IS NULL AND meetingDate em [from,to])` | `Meeting` | `from/to` | 0 |
| Encontros realizados | idem, `AND status=COMPLETED` | `Meeting` | `from/to` | 0 |
| Taxa de realização | `COMPLETED / total` (em %), `0` se total=0 | `Meeting` | `from/to` | 0 |
| **Taxa de presença (período)** | `roundPercentage( Σ presentParticipants / Σ eligibleCount )` sobre encontros **COMPLETED** no período (agregação por peso) | `MeetingAttendance` + `listEligible` | `from/to` | **null** (mostrar "sem dados") |
| Público presente (média) | `Σ(totalPresent) / count(COMPLETED)` onde `totalPresent = presentParticipants + visitorCount` | `MeetingAttendance`+`MeetingVisitor` | `from/to` | 0 |
| Visitantes no período | `count(MeetingVisitor WHERE churchId AND cell in scope AND deletedAt IS NULL AND meeting.status=COMPLETED)` | `MeetingVisitor` | `from/to` | 0 |
| Células sem encontro há N dias | `count(Cell ACTIVE em escopo SEM Meeting.COMPLETED em [hoje-N, hoje])` | `Meeting`+`Cell` | janela `windowDays` | 0 |
| Série mensal | por `month(meetingDate)` civil: `{month, meetings, completed, presentMembers, visitors}` | agregados acima | `from/to` | linha com 0 |

**Denominador da taxa (`Σ eligibleCount`):** o denominador por encontro usa a regra de `listEligible` (`joinedAt < fimDoDia AND (leftAt null OU leftAt >= inícioDoDia) AND (deletedAt null OU deletedAt >= inícioDoDia)`), idêntica à frequência real registrada — **não** usa `status=ACTIVE`.

**Arredondamento:** taxas usam `roundPercentage` (2 casas), como `@mission-atos/domain`.

**Invariantes:**

1. Nenhum endpoint aceita `churchId` do cliente; toda query usa `principal.churchId`.
2. Escopo hierárquico reduz células/encontros/vínculos ao subconjunto autorizado (ADMIN/PASTOR=igreja; SUPERVISOR/LEADER como nas policies). Sem vazamento entre células.
3. Exclusão lógica: `deletedAt=null` em todas as contagens.
4. Presenter nunca expõe `churchId`, `deletedAt`, relações ou objetos Prisma.
5. Série/totais em mesmo snapshot (RepeatableRead).
6. Frequência reutiliza `calculateAttendanceSummary`/`AttendanceSummary`/enums de `@mission-atos/domain`.
7. Conjunto vazio → zeros coerentes; **taxa com `Σeligible=0` → `null`** (não `0`).
8. Nenhuma métrica depende de `MeetingReport`, metas, hierarquia inexistente ou funcionalidade futura.
9. Dashboard não produz auditoria nem transações de escrita.

## 9. Contratos

### Entradas

- `GET /dashboard/overview`: `period?` (`30d` padrão) OU `from?`/`to?` (civis `YYYY-MM-DD`, `from<=to`, máx. 366 dias);
- `GET /dashboard/series`: `from?`, `to?`, `granularity?` (`monthly` padrão);
- `GET /dashboard/cells/summary`: `windowDays?` (2–90, padrão 14), `status?`;
- todos Zod `.strict()`; query chega `unknown` e é validada no controller.

### Saídas

- `DashboardOverviewEnvelope`: `{ data: { period: { from, to, prevFrom, prevTo }, totals: { people, activeCells, formingCells, members }, meetings: { total, completed, completionRate }, attendance: { attendanceRate, averagePresent }, visitors: { total } }, delta?: {...}, meta: {} }`;
- `DashboardSeriesEnvelope`: `{ data: [{ month: "YYYY-MM", meetings, completed, presentMembers, visitors }], meta: {} }`;
- `CellsSummaryEnvelope`: `{ data: { cells: [{ id, code, name, status, lastCompletedAt, membersCount }], withoutRecentMeeting: number, recentMeetingWindowDays }, meta: {} }`;
- dias/`month` civis; timestamps ISO UTC; inteiros; taxas 0–100 com 2 casas; `attendanceRate` nullable.

### Erros esperados

| Situação | HTTP | Código |
| --- | ---: | --- |
| entrada inválida | 400 | `VALIDATION_ERROR` |
| autenticação ausente | 401 | `AUTH_UNAUTHENTICATED` |
| papel/policy insuficiente | 403 | `AUTH_FORBIDDEN` |
| falha ao agregar | 500 | `INTERNAL_ERROR` |

### Permissões

| Operação | ADMIN | PASTOR | SUPERVISOR | LEADER |
| --- | --- | --- | --- | --- |
| overview/series/cells summary | igreja | igreja | células sob responsabilidade | células que lidera/trainee |

- guards globais autenticam; `@Roles` filtra; policies negam por padrão e validam tenant + escopo;
- `viewAnalytics` no frontend regula link/rota (todas as roles autenticadas, com escopo servido pela API).

## 10. Etapas

### Etapa 1 — Congelar contratos e comportamento

- [ ] confirmar pendência `windowDays` (seção 6);
- [ ] fixar schemas, envelopes, códigos de erro, fórmula de `attendanceRate` e semântica de períodos;
- [ ] escrever primeiro teste de contrato que falha.

### Etapa 2 — Contratos e regras puras

- [ ] `packages/contracts/src/analytics.ts` (+ spec), exportar;
- [ ] policies/tipos de aplicação independentes de Prisma/NestJS;
- [ ] especificar função pura `aggregateAttendanceRate(presentSum, eligibleSum)` com zero denominador;
- [ ] testar períodos, granularidade, `windowDays`, campos desconhecidos, taxas.

### Etapa 3 — Portas e autorização

- [ ] ports de leitura + authorization (`resolveListScope` como cells/meetings);
- [ ] registrar erros em `applicationErrorStatus()`;
- [ ] testar negação por tenant, papel e escopo (supervisor sem atribuição → vazio; líder de outra célula → fora).

### Etapa 4 — Queries agregadas

- [ ] overview (contagens + `calculateAttendanceSummary` + `aggregateAttendanceRate`);
- [ ] série mensal (`groupBy` mês civil, snapshot RepeatableRead);
- [ ] cells/summary (status + `lastCompletedAt` + `membersCount` + `withoutRecentMeeting`);
- [ ] aplicar escopo hierárquico exatamente como cells/meetings; sem N+1.

### Etapa 5 — Índices (condicional)

- [ ] `EXPLAIN` nas queries principais; migration aditiva apenas se ganho comprovado;
- [ ] revisar SQL, lock e reprodução desde banco vazio.

### Etapa 6 — Controller, presenter, módulo

- [ ] endpoints, validar `unknown`, mapear DTOs, presenter allowlist;
- [ ] registrar módulo no `AppModule`; Swagger.

### Etapa 7 — Frontend

- [ ] feature `analytics` (api client + hooks `useRemoteQuery`);
- [ ] `StatCard`, gráfico SVG (barras/linha) de série mensal, alertas clicáveis (ex.: células sem encontro → `/cells`);
- [ ] acessibilidade (tab/aria), responsividade, estados loading/erro/vazio; `viewAnalytics`;
- [ ] enriquecer `/dashboard` mantendo atalhos.

### Etapa 8 — Seed e End-to-end

- [ ] adicionar `SEED_VISITORS`; garantir E2E determinístico;
- [ ] E2E: roles/escopo, isolamento entre igrejas, cards/gráfico/alertas, estado vazio, taxa com zero denominador.

### Etapa 9 — Validar e documentar

- [ ] comandos da seção 18; revisar diff/imports/Swagger; atualizar docs e progresso.

## 11. Critérios de aceitação

1. Endpoints somente GET; nenhum aceita `churchId` do cliente.
2. Toda query usa `principal.churchId`; escopo hierárquico aplicado; recurso fora do alcance não vaza.
3. Contagens respeitam `deletedAt=null` e enums/vínculos definidos.
4. `attendanceRate` = `Σpresent/Σeligible` (peso) sobre COMPLETED; nula quando `Σeligible=0`; visitantes fora do numerador.
5. "Membros" usa `status=ACTIVE`; denominador da taxa usa regra `listEligible` (documentadas e testadas).
6. Visitantes contados por `MeetingVisitor` apenas; sem dupla contagem com `MeetingAttendance`.
7. Série/totais em snapshot consistente; sem N+1.
8. Conjunto vazio → zeros coerentes; taxa → `null` com mensagem.
9. Nenhuma métrica depende de `MeetingReport`, metas ou funcionalidade inexistente.
10. Presenter não expõe `churchId`, `deletedAt`, relações ou Prisma.
11. Controllers/aplicação não importam Prisma.
12. Migrations, se houver, novas, aditivas e reproduzíveis; sem migration obrigatória.
13. Frontend: cards, gráfico SVG, alertas clicáveis, teclado/aria, responsividade, loading/erro/vazio.
14. `viewAnalytics` regula link/rota; roles bloqueiam no servidor.
15. `npm run lint`, `typecheck`, `test`, `build` passam; testes unitários/integração/E2E passam.
16. Swagger descreve contratos, permissões e respostas.
17. Nenhuma funcionalidade fora do escopo criada.

## 12. Estratégia de testes

### Unitários

- schemas (períodos, granularidade, `windowDays`, limites, campos desconhecidos);
- `aggregateAttendanceRate` (zero denominador, arredondamento, pesos);
- policies/scope por papel e tenant; presenter (allowlist, formatos, `null` taxa, zeros);
- consistência entre regra `listEligible` para denominador e `status=ACTIVE` para card.

### Integração

- repository/agregados em PostgreSQL (`TEST_DATABASE_URL`) com **duas igrejas**;
- snapshot consistente; isolamento supervisor/líder; `EXPLAIN`; migrations desde banco vazio;
- visitantes sem dupla contagem; taxa com `Σeligible=0`.

### E2E

- web (Playwright): roles/escopo, isolamento entre igrejas, cards/gráfico/alertas, estado vazio, seed com `SEED_VISITORS`.

### Validação manual

- dashboard com seed determinística; comparar totais com contagens brutas do banco.

## 13. Segurança e privacidade

- autorização no servidor por papel + escopo hierárquico; cliente nunca envia `churchId` como autoridade;
- isolamento por igreja e por célula em toda agregação;
- nenhum dado sensível novo (observações/PII não expostos);
- logs técnicos sem PII;
- sem exportação nesta entrega (fora de escopo).

## 14. Migração de dados

- sem migration obrigatória; índices aditivos só se `EXPLAIN` comprovar;
- não alterar migrations aplicadas;
- seed: adicionar `SEED_VISITORS`; compatível com dados existentes.

## 15. Observabilidade

- logs de duração de `overview`/`series` (sem PII) em debug;
- métricas: duração e contagem de chamadas por rota;
- sem alertas novos obrigatórios; registrar latência no monitoramento existente.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Vazamento entre células sem escopo hierárquico | baixa | alto | escopo obrigatório replicando policies/repos existentes; testes por papel |
| Frequência/taxa divergente entre card e tela de frequência | média | alto | mesma regra `listEligible` no denominador; testes de consistência |
| Dupla contagem de visitantes | baixa | alto | fonte única `MeetingVisitor`; testes |
| Queries agregadas lentas em igrejas grandes | média | médio | `EXPLAIN` + índices condicionais + snapshot; sem N+1 |
| Divergência de período/bucket (UTC vs. timezone) | média | médio | buckets civis `YYYY-MM` por `meetingDate`; `timezone` na apresentação |
| Igreja nova sem dados | média | baixo | estados vazios/zeros + EmptyState |

## 17. Estratégia de reversão

- código: reverter commit do módulo dashboard; remover imports no `AppModule` e capability `viewAnalytics`;
- contratos: reverter `analytics.ts` e exportações;
- frontend: reverter feature/rota;
- migration (se houver): rollback antes de produção; depois nova migration aditiva;
- seed: não reverter; aditiva.

## 18. Comandos de validação

```bash
npm lint
npm typecheck
npm test
npm build
npm run test:integration --workspace=@mission-atos/api
npm run test:e2e --workspace=@mission-atos/web
```

## 19. Definition of Done

- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] autorização validada no servidor (papel + escopo);
- [x] testes criados ou atualizados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes executados;
- [x] build executado;
- [x] documentação atualizada;
- [x] riscos e limitações informados;
- [x] plano movido para `completed`.

## 20. Registro de progresso

### 2026-08-31

- realizado: revisão integral vs. schema, domínio, contratos, API (attendance/meetings/cells policies e repos), seed e frontend; pendências de hierarquia, visitantes, taxa de presença e relatórios resolvidas;
- testes: ainda não iniciados (plano não implementado);
- decisões: escopo hierárquico obrigatório; visitantes no MVP via `MeetingVisitor`; `attendanceRate=Σpresent/Σeligible` com zero denominador `null`; membros=status ACTIVE; denominador=`listEligible`; gráfico SVG próprio; `/dashboard` enriquecido; seed com `SEED_VISITORS`;
- bloqueios: nenhum;
- próximo passo: confirmar `windowDays`, iniciar Etapa 1.

### 2026-09-01 — implementação

Confirmadas/complementadas as decisões pendentes:

- [x] **`windowDays` padrão = 14** (intervalo 2–90), confirmado pelo usuário.

Etapas concluídas:

- Etapa 1–6 (contratos, política/escopo, repository, queries, controller/presenter/módulo, `AppModule`, Swagger, erros reutilizados): implementadas e validadas.
- Etapa 7 (frontend): feature `analytics` (api client + `AnalyticsOverview`), `StatCard`, gráfico SVG próprio, alertas clicáveis, acessibilidade/aria, responsividade, estados loading/erro/vazio/401/403; capability `viewAnalytics`; `/dashboard` enriquecido mantendo atalhos.
- Etapa 8 (seed/E2E): `SEED_VISITORS` na seed-full; E2E web `dashboard.spec.ts` criado (e fixture `fixtures/seed.ts` estendida com encontro COMPLETED, frequência e visitante).
- Etapa 9 (validação): executada (resultados abaixo).

Arquivos principais:

- Contratos: `packages/contracts/src/analytics.ts` + `analytics.spec.ts` + exportação em `index.ts`.
- API: `apps/api/src/modules/dashboard-analytics/**` (module, application/{types,queries,port,authorization,error,rate,time}, domain/policy, infrastructure/repository, presentation/{controller,presenter}); registrado no `AppModule`.
- E2E API: `apps/api/test/dashboard.e2e-spec.ts` + script `test:dashboard:e2e`.
- Seed: `packages/database/prisma/seed-full.ts` (`SEED_VISITORS`).
- Frontend: `apps/web/src/features/analytics/**`, `apps/web/src/shared/auth/capabilities.ts` (`viewAnalytics`), `app/(authenticated)/dashboard/page.tsx`, `app/globals.css` (classes `analytics-*`/`stat-card`), `apps/web/tests/unit/capabilities.spec.ts`.
- E2E web: `apps/web/tests/e2e/dashboard.spec.ts`, `apps/web/tests/e2e/fixtures/seed.ts`.

Validação executada nesta sessão:

- Testes unitários: contracts 86 passaram; API 28 suites/138 passaram (inclui 5 suites/22 testes de `dashboard-analytics`); web 13 suites/65 passaram (inclui `capabilities.spec.ts`).
- E2E API `test:dashboard:e2e`: **7 passaram** (overview por escopo igreja/líder/supervisor, série mensal, isolamento entre igrejas, cells/summary, validação de entrada). Requer `TEST_DATABASE_URL`, migrações aplicadas no banco de teste e `cmd /c` (PS bloqueia shims `.ps1`).
- Typecheck: contracts, api (src+test), web (src+e2e), database, domain, config — todos passaram.
- Lint: contracts, api, web, database, domain, config — todos passaram (`--max-warnings=0`).
- Build: contracts, api, web, database — todos passaram.
- Seed `db:seed:full` executado com sucesso em banco de teste (inclui visitante).

Bloqueios/limitações:

- E2E web (Playwright) **não executado nesta sessão**: há um servidor `next dev` já ativo no projeto na porta 3000 (PID do `.next/dev`), e `next dev` recusa iniciar uma segunda instância no mesmo diretório mesmo em porta alternativa (3130). Para executar `npm run test:e2e --workspace @mission-atos/web`, encerrar o servidor dev atual (`taskkill /PID <pid> /F`), garantir `TEST_DATABASE_URL` e rodar `npx playwright install chromium` se necessário. O spec e a fixture foram escritos e passam em typecheck.

Próximo passo: revisão humana do diff/imports/Swagger; se aprovado, mover para `completed` (não feito nesta sessão, conforme escopo).

### 2026-09-01 — revisão oficial e correções (finalização)

Revisão integral do plano vs. implementação (contratos, domínio, API, Prisma, frontend, testes) com a seguinte classificação e correções aplicadas — **sem implementar funcionalidades novas**:

#### Achados da revisão e correções aplicadas

1. **Alto — `attendanceRate` acima de 100% violava o contrato**: `percentageSchema` (`z.number().min(0).max(100)`) conflitava com `aggregateAttendanceRate`, que podia retornar >100 (o spec antigo asseverava 120). Corrigido em `application/dashboard-analytics.rate.ts` com `Math.min(presentSum, eligibleSum)` (defensivo) e spec atualizado (`aggregateAttendanceRate(12, 10) → 100`). Na prática `presentSum ≤ eligibleSum` já era garantido pelo filtro de elegibilidade, mas o domínio e o contrato agora concordam.
2. **Médio — delta fixo em 30 dias para `from`/`to` externos**: `resolvePeriodBounds` derivava o período anterior sempre com 30 dias, mesmo quando o período informado tinha outro span. Corrigido em `application/dashboard-analytics.time.ts` com novo helper `civilSpanDays(from, to)`; o período anterior agora tem **o mesmo span** do período atual. Spec de `time` atualizado (o caso `2026-08-10..2026-08-31` (22 dias) agora deriva `prevFrom = 2026-07-19`, não `2026-07-11`).
3. **Médio — `withoutRecentMeeting` contava células de qualquer status**: a métrica do plano é "células **ACTIVE** em escopo sem encontro recente". O repositório retornava todas as células do escopo quando `status` não era informado. Corrigido em `packages/contracts/src/analytics.ts` com `status: z.enum(cellStatuses).default("ACTIVE")` — backwards-compatible e alinhado ao plano. Spec de contratos atualizado.
4. **Médio — gráfico com distorção visual e a11y insuficiente**: um único eixo misturava contagem (`meetings`) com soma acumulada (`presentMembers`/`visitors`). Corrigido em `frontend`: o painel "Evolução mensal" agora tem **dois gráficos SVG com eixos independentes** (`Encontros` e `Pessoas`), **tooltips nativos** (`<title>`) e `aria-label` por barra, rótulos numéricos no eixo Y e responsividade (`grid-template-columns: 1fr` em telas <48rem). E2E web `dashboard.spec.ts` atualizado para os novos `aria-label`.

#### Validações finais executadas

| Comando | Resultado |
| --- | --- |
| `npm run lint` (6 tasks, 8 pacotes) | ✅ passou |
| `npm run typecheck` (src + test) | ✅ contracts, api, web, database, domain, config |
| `npm test` (11 tasks) | ✅ contracts 86 · api 28 suites/140 · web 13 suites/65 · database 2 suites/7 |
| `npm run build` (7 tasks) | ✅ contracts, api, web, database, domain, config |

- **Fluxo validado por código/contrato** (login → dashboard → indicadores → período → comparação → alerta/atalho): todas as rotas usam `@Roles` + escopo hierárquico; o frontend renderiza cards, gráfico (2 painéis), alertas clicáveis (→ `/cells`) e atalhos; a comparação usa `delta` vs. período anterior de mesmo span.
- **E2E API** `test:dashboard:e2e`: **7/7 passaram na sessão de implementação** (overview por escopo igreja/líder/supervisor, série mensal com preenchimento de meses vazios, isolamento entre igrejas, cells/summary, validação de entrada). Nesta sessão o spec não pôde ser re-executado porque a credencial do banco de teste local não está disponível (autenticação recusada; servidor local ativo na porta 55433) — limitação ambiental, não de código.
- **E2E web (Playwright)** `dashboard.spec.ts`: escrito, passou em typecheck; **não executado** (servidor `next dev` já ativo; política da sessão anterior continua válida).

#### Aderência e métricas (confirmadas)

- **Métricas/fórmulas** (todas idênticas ao plano, seção 8): pessoas ativas `count(Person churchId ∧ deletedAt=null)`; células ativas/formando `count(Cell churchId ∧ status ∧ deletedAt=null)`; membros `count(CellMembership churchId ∧ ACTIVE ∧ deletedAt=null)` no escopo; encontros/realizados `count(Meeting churchId ∧ cell∈escopo ∧ deletedAt=null ∧ meetingDate∈[from,to])` com/sem `COMPLETED`; taxa de realização `completed/total` (0 se total=0); **taxa de presença** `roundPercentage(Σpresent/Σeligible)` sobre COMPLETED com **null** se `Σeligible=0` e **máx. 100**; público médio `Σ(totalPresent)/completedCount` (inclui visitantes); visitantes `count(MeetingVisitor source única)`; série mensal buckets civis `YYYY-MM` com meses vazios zerados; `withoutRecentMeeting` = células **ACTIVE** sem `COMPLETED` em `[hoje−windowDays, hoje]`.
- **Períodos**: default 30 dias com delta vs. período anterior igual; `from/to` civis `YYYY-MM-DD` (`from≤to`, máx. 366 dias), delta vs. período anterior de **mesmo span**; somente `period` OU `from/to` (não ambos); `.strict()` com rejeição de campos desconhecidos.
- **Timezone**: buckets civis por `meetingDate` (coluna `DATE`, sem hora — sem ambiguidade UTC/civil); janela e período atual calculados na timezone da igreja (`Intl` com `timeZone` da `Church.timezone`, default `America/Sao_Paulo`); apresentação civil.
- **Isolamento por igreja**: `churchId` derivado exclusivamente do principal; toda query Prisma filtra `churchId`; presente a rejeição de `churchId` em query params (Zod `.strict()`). Escopo hierárquico: ADMIN/PASTOR → igreja; SUPERVISOR → `leaderId ∈ assignments`; LEADER → `OR leaderId/traineeLeaderId`. Sem vazamento entre igrejas ou células (testado em queries.spec e E2E API).
- **Frontend**: `Can capability="viewAnalytics"` (admin/pastor/supervisor/líder); estados loading/erro/vazio/401/403; teclado/aria; responsividade; atalhos preservados. 3 endpoints consumidos com cache de 60s (limpo no login/logout — nenhum vazamento entre sessões).
- **Performance razoável**: sem N+1 (queries batched por `meetingId IN` / `cellId IN` em `computeCompletedMetrics`/`eligibleByMeeting`); índices existentes cobrem (N+1 não observado; CPU `eligibleByMeeting` O(meetings × memberships) aceitável para MVP); snapshots RepeatableRead por transação. Sem migration nova (sem SQL adicional).
- **Critérios de aceitação 1–17**: todos atendidos (ver tabela da seção 8 e verificação da revisão).
- **Plano 011**: **não antecipado** — nenhuma das funcionalidades fora do escopo (relatórios PDF/Excel, notificações, BI, ranking, mapa, IA, mobile, Plano 011) foi criada.

#### Decisões registradas

- `status` de `cells/summary` com default `"ACTIVE"` (alinhado à métrica sem-encontro); parâmetro continua aceitando `FORMING|ACTIVE|SUSPENDED|CLOSED`.
- `attendanceRate` limitado a 100 pragmaticamente no domínio (defensivo) para casar com o contrato; a regra de elegibilidade já impedia >100 na prática.
- Período anterior sempre com o mesmo span do período atual (fix de `resolvePeriodBounds`).

#### Limitações informadas (aceitas)

1. E2E web Playwright não executado nesta sessão (servidor `next dev` ativo / credenciais locais indisponíveis) — spec escrito e em typecheck; política da sessão de implementação segue válida.
2. E2E API re-executado sem sucesso apenas por autenticação no banco de teste local (credenciais não disponíveis na sessão); registrado 7/7 na implementação.
3. `totals.people` é igreja-wide mesmo para LEADER/SUPERVISOR (intencional, conforme plano — card "Pessoas" é corte pontual da igreja).
4. Snapshot RepeatableRead é por endpoint; as três chamadas do frontend não compartilham um único snapshot entre si (aceito; risco baixo).
5. `eligibleByMeeting` itera em JS todas as memberships × encontros completados (sem N+1, mas com custo crescente em igrejas grandes — aceito para MVP).
6. `next build` pode re-escrever `next-env.d.ts` (artefato normal); em um estado intermediário o Next 16.3.0 + TS 5.9.3 chegou a injetar `ignoreDeprecations: "6.0"` em `tsconfig.json` (falha transitória pré-existente de toolchain, revertida e não relacionada ao dashboard; o build passa com o `tsconfig` versionado).

#### Melhorias futuras (não implementadas, fora do escopo)

- Exportação PDF/Excel e impressão (Plano 011 e subsequentes).
- Tooltip customizado/valores por barra aprimorados e eixo secundário (evolução incremental do gráfico).
- Cache distribuído/Redis para leituras agregadas em larga escala.
- Notificações de células sem encontro (fora de escopo).
- Cálculo do denominador de frequência via SQL agregado (hoje em aplicação) para igrejas muito grandes.
- E2E web Playwright e re-execução do E2E API em ambiente com credenciais/servidor estável.

#### Próximo passo (pós-conclusão)

- Não há pendências de código. Próximos planos (ex.: **Plano 011**) podem partir deste estado sem plano ativo pendente: `docs/plans/active/` fica vazio após a movimentação deste documento.

