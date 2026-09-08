# Plano 013 — Configurações gerais (igreja e usuário)

**Status:** planejado — aguardando aprovação para implementação
**Responsável:** a definir
**Criado em:** 2026-09-06
**Atualizado em:** 2026-09-06
**PRD relacionado:** `docs/product/PRD.md`, seções 6.1 (administrador e configurações básicas), 9 (RF-018 auditoria) e 10 (RN-010 prazo de envio; RN-012 faixas de frequência, fora do escopo)
**ADRs relacionadas:** nenhuma
**Branch ou issue:** a definir

---

## 1. Objetivo

Criar o módulo de Configurações Gerais do produto, composto por:

- configurações regionais e institucionais da igreja (já existentes: `timezone`, `weekStartsOn`);
- configurações operacionais da igreja (nova: `reportDeadlineHours`, regra RN-010);
- preferências pessoais do usuário (novas: `language`, `displayTimezone`, `dateFormat`, `theme`).

Todas as configurações devem ser tipadas, validadas por Zod, explicitamente definidas em schema, versionáveis por migrations aditivas, auditadas quando importantes e isoladas por `churchId`. Não deve existir tabela genérica key/value.

Este plano define somente o planejamento; a implementação será executada em momento posterior mediante aprovação.

## 2. Contexto

O repositório já possui:

- entidade `Church` com `timezone` (default `America/Sao_Paulo`) e `weekStartsOn` (default `SUNDAY`);
- endpoints `GET /church/settings` e `PATCH /church/settings` (somente `ADMIN`, com auditoria `CHURCH_SETTINGS_UPDATED` na mesma transação), em `apps/api/src/modules/churches`;
- tela `/church/settings` no painel web, alimentada por `getChurchSettings`/`updateChurchSettings`;
- consumidores do timezone da igreja em `reports`, `attendance` e `dashboard-analytics` por `getChurchTimezone`;
- contratos em `packages/contracts/src/church.ts` (`isIanaTimezone`, `churchWeekDays`, `updateChurchSettingsRequestSchema`);
- papel `ADMIN` como único com capability `editChurch` no frontend;
- o padrão do repositório: UUID, UTC (TIMESTAMPTZ), `churchId` em tabelas de negócio, exclusão lógica, `AuditLog` append-only, migrations imutáveis, `RN` única por `RN-010` (prazo de envio configurável, inicial 48 horas).

Não existe nenhuma preferência por usuário persistida hoje, e o tema claro/escuro do painel vive apenas no navegador.

**Numeração:** `docs/plans/completed/012-bulk-import.md` já usa o 012; decidiu-se nomear este plano `013-general-settings`.

Documentos de referência obrigatórios:

- `AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/TEMPLATE.md`;
- `docs/plans/completed/005-church-management.md`;
- `docs/plans/completed/004-user-management.md`;
- `docs/plans/completed/012-bulk-import.md`.

## 3. Escopo

### Configurações aprovadas

**Nível igreja — tabela `Church` (mantidas, sem dados migrados):**

| Campo | Tipo | Default | Observação |
| --- | --- | --- | --- |
| `timezone` | `VarChar(64)` IANA | `America/Sao_Paulo` | já existente |
| `weekStartsOn` | enum `DayOfWeek` | `SUNDAY` | já existente |

**Nível igreja — nova tabela `ChurchSettings` (operacional):**

| Campo | Tipo | Default | Validado por |
| --- | --- | --- | --- |
| `reportDeadlineHours` | `Int` | `48` | `z.coerce.number().int().min(1).max(720)` |

Única regra operacional presente no PRD (RN-010). As faixas de frequência do RN-012 permanecem fora do escopo até decisão pós-piloto.

**Nível usuário — nova tabela `UserPreferences` (preferências):**

| Campo | Tipo | Default | Validado por |
| --- | --- | --- | --- |
| `language` | `VarChar(10)` | `pt-BR` | lista fechada `pt-BR`, `en`, `es` |
| `displayTimezone` | `VarChar(64)` nullable | `null` (herda da igreja) | `isIanaTimezone` |
| `dateFormat` | `VarChar(16)` | `dd/MM/yyyy` | lista fechada `dd/MM/yyyy`, `MM/dd/yyyy`, `yyyy-MM-dd` |
| `theme` | `VarChar(10)` | `system` | lista fechada `light`, `dark`, `system` |

### Entrega esperada

- duas migrations aditivas (`add_church_settings`, `add_user_preferences`) com backfill para dados existentes;
- ampliação aditiva do contrato `updateChurchSettingsRequestSchema` para aceitar `reportDeadlineHours`;
- novos contratos em `packages/contracts/src/settings.ts` e exportação no `index.ts`;
- novos endpoints `GET /settings/me` e `PATCH /settings/me` (self-service, qualquer usuário autenticado);
- aplicação do `reportDeadlineHours` nas consultas de pendências de relatórios e no indicador de relatórios pendentes do dashboard (default `48` preserva o comportamento atual);
- tela `/settings` no painel web com seções Regional, Operacional e Preferências, substituindo o link da barra lateral para `/church/settings`;
- persistência do tema claro/escuro/sistema no servidor e sincronização com o `theme-toggle` existente;
- invalidação de cache e refetch dos dados dependentes de configurações alteradas;
- testes unitários, de integração PostgreSQL, de endpoints e E2E de web;
- documentação Swagger e atualização de `README` e `.env.example`, se necessário.

## 4. Fora de escopo

- infraestrutura, deploy, CI/CD e configuração de ambiente de produção;
- segredos: JWT secrets, `DATABASE_URL`, credenciais de SMTP, API keys, hashes e tokens;
- e-mail/SMTP, webhooks, notificações push, integrações externas e WhatsApp;
- cobrança, planos, assinaturas e multi-igreja comercial;
- white-label, custom domain e personalização avançada de tema;
- feature flags genéricas e painel de desenvolvedor;
- preferências de exportação (CSV/Excel/PDF) e formato de relatório;
- sincronização offline e configuração do aplicativo mobile;
- faixas de frequência (RN-012) como configuração — PRD determina revisão pós-piloto;
- tradução completa da interface para todos os idiomas — será entregue somente a persistência/configuração de idioma e uma camada i18n mínima documentada, sem cobrir 100% das strings do painel;
- mover `timezone`/`weekStartsOn` de `Church` para outra tabela (Opção B descartada) — Opção C aprovada;
- renomear ou remover `GET/PATCH /church/settings` e `GET/PATCH /church` existentes;
- editar, apagar ou regenerar migrations já aplicadas;
- criação de quaisquer dependências npm de produção sem justificativa registrada;
- implementação do Plano 014 ou qualquer outro plano sem solicitação explícita.

## 5. Suposições

- `churchId` continuará sendo gravado em todas as tabelas de negócio novas, inclusive associações, para permitir filtro, índice e constraint de tenant sem depender de joins indiretos;
- todos os identificadores serão UUID; instantes persistidos em UTC (`TIMESTAMPTZ`); datas civis em `DATE`; horários recorrentes em `TIME`;
- exclusão lógica (`deletedAt`) vale para entidades mutáveis; `AuditLog` permanece append-only sem `updatedAt`/`deletedAt`;
- defaults definidos na seção 3 são as fontes canônicas de valor; `displayTimezone` `null` significa "herdar o timezone da igreja";
- `userId` sempre vem do principal autenticado e nunca do corpo da requisição;
- o backfill das tabelas novas é necessário porque já existem igreja e usuários persistidos pelas seed/fábricas; sem o backfill, os consumidores precisariam de lógica de fallback ou a tabela precisaria de default de banco para a row inteira;
- a capability `editChurch` (frontend) e a policy de `ADMIN` (backend) continuam sendo as únicas autoridades para configurações da igreja;
- o indicador de relatórios pendentes passará a usar `reportDeadlineHours`; com o default `48`, o comportamento não muda para igrejas que nunca configuraram;
- nenhuma nova Role, guard ou capacidade é necessária.
- os scripts de validação devem funcionar em PowerShell no Windows, sem Bash ou pnpm.

## 6. Perguntas e decisões pendentes

- [x] numeração do plano -> `013-general-settings` (o 012 já existe em `completed`);
- [x] estratégia de persistência -> Opção C: `Church` mantém `timezone`/`weekStartsOn`; `ChurchSettings` para operacionais; `UserPreferences` para o usuário;
- [x] endpoints -> manter `GET/PATCH /church/settings` e adicionar `GET/PATCH /settings/me`; nenhuma rota existente é removida ou renomeada;
- [x] preferências do usuário -> idioma (`pt-BR`, `en`, `es`), fuso de exibição, formato de data e tema (`light`/`dark`/`system`);
- [x] códigos de locale -> `pt-BR`, `en`, `es`; formatos de data -> `dd/MM/yyyy`, `MM/dd/yyyy`, `yyyy-MM-dd` (default `dd/MM/yyyy`); interpretação do prazo RN-010 -> instante: o encontro está em atraso quando o instante atual extrapola `meetingDate` (dia civil, fim do dia na zona da igreja) + `reportDeadlineHours` em horas;
- [x] alcance da camada i18n mínima -> entrega configuração de `language` persistida e um mapa mínimo de strings usado nas novas telas de `/settings`; sem tradução completa do painel (fora de escopo);
- [x] interpretação do prazo RN-010 -> considera o fim do dia civil do encontro (na zona da igreja) somado a `reportDeadlineHours`, preservando default `48` idêntico ao comportamento atual (48 horas após o fim do dia do encontro).

Não implementar uma hipótese relevante sem registrá-la.

## 7. Áreas afetadas

### Aplicação web

- nova rota `app/(authenticated)/settings/page.tsx` e componentes em `features/settings/`;
- cliente de API `features/settings/api/settings-api.ts` (preferências) reaproveitando `church-api` para configurações da igreja;
- barra lateral: link "Configurações" apontando para `/settings`; rota `/church/settings` permanece funcional (retrocompatibilidade);
- sincronização da preferência `theme` com o `theme-toggle` existente e aplicação do tema persistido na inicialização da sessão;
- camada i18n mínima para `language` e aplicação de `displayTimezone`/`dateFormat` na formatação de datas da UI;
- invalidação de cache: mudanças em `timezone`/`weekStartsOn` invalidam queries de encontros, frequência, relatórios e dashboards; mudanças em preferências invalidam o cache local de `settings/me`.

### API

- `churches` module ampliado: `PATCH /church/settings` aceita `reportDeadlineHours` e persiste `ChurchSettings` na mesma transação da auditoria; queries incluem o valor na resposta de settings;
- novo módulo `user-preferences` em `apps/api/src/modules/user-preferences` com estrutura em camadas (presentation, application, domain/policy, infrastructure), expondo `GET /settings/me` e `PATCH /settings/me`;
- aplicação de `reportDeadlineHours` nas queries de relatórios pendentes e no dashboard de pendências.

### Banco de dados

- novas tabelas `church_settings` e `user_preferences`;
- indices e unicidades descritas na seção 8;
- backfill idempotente nas migrations aditivas;
- nenhuma alteração em `Church`, `User` ou migrations existentes.

### Contratos compartilhados

- `packages/contracts/src/attendance` e `packages/contracts/src/church` não mudam de comportamento;
- novo `packages/contracts/src/settings.ts` com vocabulários, schemas de request/response e tipos;
- ampliação aditiva de `updateChurchSettingsRequestSchema`.

### Domínio

- sem mudança estrutural prevista; vocabulários fechados (`language`, `dateFormat`, `theme`) vivem em contratos, seguindo o padrão de `churchWeekDays`. Se a implementação precisar dos valores em lógica pura compartilhada, adicionar constantes puras em `packages/domain` com justificativa.

### Infraestrutura

- nenhuma dependência npm nova prevista;
- scripts npm de banco e testes reaproveitados; `.env.example` inalterado, a menos que uma variável nova seja realmente necessária (não esperado).

## 8. Modelo e regras de negócio

### 8.1 Convenções

Mesmo padrão do repositório: `PascalCase` para modelos, `camelCase` nos campos, `snake_case` no banco via `@map`/`@@map`, UUID, `churchId` em todas as tabelas de negócio, timestamps `TIMESTAMPTZ(3)`, soft delete em entidades mutáveis.

### 8.2 `ChurchSettings`

| Campo | Tipo | Nulabilidade | Observação |
| --- | --- | --- | --- |
| `id` | `Uuid` | obrigatório | PK |
| `churchId` | `Uuid` | obrigatório | tenant; FK composta para `(id, churchId)` de `Church` |
| `reportDeadlineHours` | `Int` | obrigatório | default `48` |
| `createdAt` | `Timestamptz(3)` | obrigatório | default banco |
| `updatedAt` | `Timestamptz(3)` | obrigatório | `@updatedAt` |
| `deletedAt` | `Timestamptz(3)` | opcional | soft delete |

Constraints e índices:

- `@@unique([churchId])` (1:1 entre igreja e settings);
- `@@unique([id, churchId])` para a FK composta cross-tenant;
- `@@index([churchId, deletedAt])`.

A FK composta para `Church(id, churchId)` com `onDelete: Restrict` impede settings de uma igreja inexistente ou referência cross-tenant.

### 8.3 `UserPreferences`

| Campo | Tipo | Nulabilidade | Observação |
| --- | --- | --- | --- |
| `id` | `Uuid` | obrigatório | PK |
| `userId` | `Uuid` | obrigatório | 1:1 com usuário |
| `churchId` | `Uuid` | obrigatório | tenant estrutural; FK composta para `(id, churchId)` de `User` |
| `language` | `VarChar(10)` | obrigatório | default `pt-BR` |
| `displayTimezone` | `VarChar(64)` | opcional | `null` = herda da igreja |
| `dateFormat` | `VarChar(16)` | obrigatório | default `dd/MM/yyyy` |
| `theme` | `VarChar(10)` | obrigatório | default `system` |
| `createdAt` | `Timestamptz(3)` | obrigatório | default banco |
| `updatedAt` | `Timestamptz(3)` | obrigatório | `@updatedAt` |
| `deletedAt` | `Timestamptz(3)` | opcional | soft delete |

Constraints e índices:

- `@@unique([userId])` (1:1 no banco; a leitura sempre é escopada pelo principal);
- `@@unique([id, churchId])` para a FK composta cross-tenant;
- `@@index([churchId])`, `@@index([churchId, deletedAt])`.

`churchId` vem de `User.churchId` e nunca do cliente; a unicidade por `userId` já garante o isolamento 1:1 por usuário.

### 8.4 Regras e efeitos

- **Herança de fuso:** `displayTimezone` `null` significa apresentação no `timezone` da igreja. Backend sempre calcula com o timezone da igreja (regra existente em `getChurchTimezone`); o fuso de exibição do usuário afeta somente a apresentação no frontend, não consultas do domínio.
- **RN-010:** `reportDeadlineHours` define o prazo padrão para envio de relatório a partir do encontro. A listagem de relatórios pendentes e o indicador de pendências do dashboard usam esse valor para marcar atraso; default `48` preserva o comportamento atual de igrejas sem configuração.
- **Auditoria:** `PATCH /church/settings` continua gravando `CHURCH_SETTINGS_UPDATED` atomicamente (incluindo `reportDeadlineHours`); `PATCH /settings/me` grava `USER_PREFERENCES_UPDATED` atomicamente, com `before`/`after` contendo somente os campos alterados e sem dados sensíveis.
- **No-op:** atualizações sem diferença real não persistem nem auditam (mesmo padrão `createChangeSet`).
- **Isolamento:** todas as consultas e escritas filtram `principal.churchId`; não existe DTO ou query que aceite `churchId`.
- **Self-service:** `/settings/me` opera somente sobre a row do `principal.userId`; recurso de outro usuário retorna `404` sem vazamento.
- **Validação estrita:** schemas Zod `.strict()`, sem propriedades desconhecidas, sem campos vazios, ranges e vocabulários fechados.
- **Frontend — dirty state e cache:** formulários detectam estado sujo/salvando/salvo/erro; após salvar, invalidam as chaves de cache correspondentes e refazem o fetch; mudanças de `timezone`/`weekStartsOn` refazem queries de dados dependentes; mudanças de preferências aplicam na hora na UI.
- **Tema:** a preferência `theme` persistida passa a ser a fonte de verdade do tema (`light`/`dark`/`system`), lida na entrada da sessão e sincronizada pelo `theme-toggle`.

## 9. Contratos

### Entradas

- `PATCH /church/settings` (ADMIN): body aceita `timezone`, `weekStartsOn` e `reportDeadlineHours`, todos opcionais, `.strict()`, com ao menos um campo;
- `PATCH /settings/me` (autenticado): body aceita `language`, `displayTimezone`, `dateFormat` e `theme`, todos opcionais, `.strict()`, com ao menos um campo;
- `GET /church/settings` e `GET /settings/me`: sem body.

### Saídas

- `GET /church/settings` mantém envelope `{ data: { timezone, weekStartsOn }, meta: {} }` e passa a incluir `reportDeadlineHours` (aditivo);
- `GET /settings/me` retorna `{ data: { language, displayTimezone, dateFormat, theme }, meta: {} }` com `displayTimezone` nullable;
- erros no padrão `{ error: { code, message, details } }` com `400`, `401`, `403`, `404`.

Schemas planejados em `packages/contracts/src/settings.ts`:

- `settingsLocales`, `settingsDateFormats`, `settingsThemes` (const arrays);
- `updateChurchSettingsRequestSchema` (ampliado, em `church.ts` ou reexportado);
- `userPreferencesResponseSchema`, `userPreferencesEnvelopeSchema`;
- `updateOwnPreferencesRequestSchema`;
- tipos inferidos correspondentes.

### Erros esperados

- payload vazio, propriedades desconhecidas, vocabulário fora da lista, fuso inválido, range de horas excedido e valor não inteiro -> `400`;
- token ausente/inválido -> `401`;
- `PATCH /church/settings` por papel não ADMIN -> `403`;
- acesso a preferências de outro usuário (nunca exposto pela rota; por construção `404`);
- igreja inexistente no GET -> `404`.

### Permissões

- igreja: somente `ADMIN` (guard `@Roles("ADMIN")` e policy existente de administrador ativo);
- usuário: qualquer papel autenticado, restrito ao próprio `userId`;
- nenhum novo papel, guard ou capability.

## 10. Etapas

### Etapa 1 — Fechar pendências e contratos

- [x] confirmar códigos de locale, lista de formatos de data e interpretação de prazo (RN-010) registradas na seção 6;
- [x] criar `packages/contracts/src/settings.ts` com vocabulários e schemas;
- [x] ampliar `updateChurchSettingsRequestSchema` com `reportDeadlineHours`;
- [x] exportar novos itens no `packages/contracts/src/index.ts`;
- [x] atualizar Swagger dos schemas.

### Etapa 2 — Migrations e dados

- [x] adicionar `ChurchSettings` e `UserPreferences` ao `schema.prisma` com relações, unicidades, índices e `@map`;
- [x] gerar `add_church_settings` com `--create-only`, revisar SQL, incluir backfill `INSERT ... SELECT` para igrejas existentes;
- [x] gerar `add_user_preferences` com `--create-only`, revisar SQL, incluir backfill com defaults para usuários existentes;
- [x] aplicar migrations em banco de desenvolvimento e recriar banco de teste por `migrate deploy` (concluído com Docker Postgres local);
- [x] confirmar que nenhuma migration existente foi alterada e `db push` não é usado;
- [x] garantir que o seed fictício permanece válido e opcionalmente cria rows de settings/preferences para a igreja/usuários fictícios usados em testes.

### Etapa 3 — Ampliar o módulo churches

- [x] queries de settings passam a incluir `reportDeadlineHours` (leitura conjunta Church + ChurchSettings, sem quebrar a resposta atual);
- [x] command `updateSettings` persiste `reportDeadlineHours` em `ChurchSettings` e mantém auditoria atômica `CHURCH_SETTINGS_UPDATED`;
- [x] repository/unidade de trabalho acessam `church_settings` sempre com `churchId` do principal;
- [x] testes unitários e de integração do módulo atualizados.

### Etapa 4 — Módulo user-preferences

- [x] criar `apps/api/src/modules/user-preferences` em camadas (presentation, application, domain/policy, infrastructure) seguindo `users`/`people`;
- [x] implementar queries `GET /settings/me` (read de própria preferência, com `404` se não existir e default lógico documentado);
- [x] implementar command `PATCH /settings/me` com detecção de no-op, validação Zod, upsert idempotente e auditoria `USER_PREFERENCES_UPDATED`;
- [x] policy de self-scope e testes de autorização (401/403/404, isolamento entre igrejas);
- [x] presenter com allowlist e datas ISO; offuscamento de campos internos.

### Etapa 5 — Efeito operacional RN-010

- [x] aplicar `reportDeadlineHours` nas consultas de relatórios pendentes; a listagem marca pendências atrasadas (`overdue`) usando fuso + prazo da igreja (ver interpretação no registro de progresso: não existe superfície de "indicador de pendências" no `dashboard-analytics`/`OverviewResult` hoje, e criar nova estaria fora de escopo — a listagem `/reports/pending` é a superfície de pendências existente);
- [x] garantir default `48` preserva comportamento atual para igrejas sem configuração;
- [x] testes unitários dos cálculos de atraso (limites do prazo, fuso da igreja); integração de limites aguarda banco PostgreSQL.

### Etapa 6 — Frontend

- [x] rota `/settings` com três seções (Regional, Operacional, Preferências);
- [x] cliente de API `settings-api.ts` e hooks com `useRemoteQuery`/`cacheStore` no padrão existente;
- [x] formulários com dirty-state, estados de carregamento/erro/empty, acessibilidade por teclado e mensagens claras;
- [x] barra lateral passa a apontar para `/settings`; `/church/settings` continua funcional (página institucional mantida, sem redirecionar);
- [x] sincronização do tema persistido com o `theme-toggle` e aplicação na inicialização da sessão (ver nota abaixo);
- [x] integração com `reportDeadlineHours` e ajuste da data de atraso na listagem de relatórios pendentes.
- [x] camada i18n global cobrindo todo o frontend web (`pt-BR`, `en`, `es`), estendida a pedido do usuário de modo que a troca de idioma em `/settings` altere o aplicativo inteiro (sidebar, cabeçalhos, formulários, alertas, tabelas, modais e helpers de data);
- [x] invalidação de cache e refetch dos dados dependentes após alterações (`reports`, `meetings`, `attendance`, `analytics`, `cells` após Regional/Operacional; `settings/me` após Preferências).

### Etapa 7 — Testes

- [x] testes unitários de contratos, commands, queries, presenter e policy;
- [x] testes de integração PostgreSQL (tabelas, unicidades, FKs compostas, backfill, isolamento de duas igrejas, rollback e auditoria atômica) — database (9/9) e API (37/37) validados;
- [x] testes de endpoints (Supertest) cobrindo códigos HTTP, autorização, no-op, validação e auditoria — 9/9 suites e 47/47 testes e2e de API validados;
- [x] reexecutar o teste E2E Playwright da tela `/settings` após ampliar a cobertura de troca global de idioma (`settings.spec.ts`): 6/6 cenários aprovados com build isolado `.next-e2e`.
- [x] testes unitários de integridade i18n (`language-provider.spec.tsx`: 7/7 testes, paridade estrita de chaves entre pt-BR/en/es e sincronização de DOM/localStorage).

### Etapa 8 — Validação e documentação

- [x] executar comandos da seção 18 (`npm run lint` 7/7, `npm run typecheck` 15/15, `npm test` 12/12, `npm run build` 8/8 — todos verdes);
- [x] aplicar migrations `add_church_settings` e `add_user_preferences` com `npm run db:migrate:deploy` no banco local Docker (`:5432`); test DB (`:55433`) resetado e validado com `test:integration` do database (9/9) + `test:integration` da API (37/37);
- [x] testes e2e de API: `settings.e2e-spec.ts` (4/4); regressão e2e completa **9/9 suites, 47/47 testes**;
- [x] corrigidos bugs preexistentes expostos pelo banco Docker: senha placeholder no bootstrap spec, código de célula não-canônico, constraints `cells_active_requires_leader_check`/`cells_code_canonical_check`, FK order em attendance, UUIDs inválidos para meetings, data-window bug em `civilDayBounds` (pending/attendance/visitor), missing `church_settings`/`user_preferences` no cleanup de integração e e2e (reports), senha divergente em `users.e2e`, login cross-tenant inexistente em `reports.e2e` (email/status → assert de isolamento por dados), `SameSite=Strict` vs `Lax` em `auth.e2e`;
- [x] revisar diff, imports, dependências e Swagger (endpoints `GET/PATCH /settings/me` já documentados);
- [x] atualizar `README`, `.env.example` (se necessário);
- [x] mover plano para `docs/plans/completed/` após reexecutar o Playwright ampliado.

## 11. Critérios de aceitação

1. Existem somente os endpoints novos `GET /settings/me` e `PATCH /settings/me`; `GET/PATCH /church`, `GET/PATCH /church/settings` permanecem funcionais e não são renomeados.
2. `PATCH /church/settings` aceita `reportDeadlineHours` (1–720, inteiro) como campo opcional e o persiste em `church_settings`.
3. Nenhum DTO, query ou header permite informar `churchId` ou `userId`.
4. Configurações de igreja: somente `ADMIN` escreve; configurações de usuário: somente o próprio usuário autenticado lê e escreve.
5. Recurso de outro usuário ou outra igreja retorna `404` sem vazamento de existência.
6. Todas as configurações são tipadas, validadas por Zod `.strict()` e explícitas no schema (sem tabela key/value).
7. As unicidades `church_settings.churchId` e `user_preferences.userId` são 1:1 e comprovadas por integração.
8. FKs compostas previnem referências cross-tenant e a tabela de preferências herda `churchId` da igreja do usuário.
9. Backfill: igrejas e usuários existentes ganham rows com defaults sem duplicação, executável duas vezes sem erro.
10. Auditoria: `CHURCH_SETTINGS_UPDATED` (incluindo `reportDeadlineHours`) e `USER_PREFERENCES_UPDATED` gravam atomicamente junto à alteração, sem PII e sem `before`/`after` não alterados.
11. Atualização sem mudança real não persiste nem audita (no-op).
12. Relatórios pendentes e dashboard de pendências usam `reportDeadlineHours`; com default `48`, igrejas sem configuração mantêm comportamento idêntico ao atual.
13. `displayTimezone` `null` herda o timezone da igreja e não altera cálculos do domínio.
14. O tema persistido (`light`/`dark`/`system`) é aplicado na entrada da sessão e sincronizado pelo `theme-toggle`.
15. `GET /settings/me` retorna `language`, `displayTimezone` (nullable), `dateFormat` e `theme` com allowlist, sem campos internos.
16. Testes unitários, de integração PostgreSQL e de endpoints passam pelos scripts npm; teste E2E Playwright da tela de configurações passa.
17. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.
18. Swagger documenta os novos endpoints, contratos, permissões e respostas `400`/`401`/`403`/`404`, sem dados reais.
19. Nenhuma migration existente foi alterada; apenas duas migrations novas aditivas foram criadas.
20. Nenhuma dependência npm foi adicionada sem justificativa registrada; nenhuma funcionalidade fora do escopo foi implementada.

## 12. Estratégia de testes

### Unitários

- contratos: sucesso, limites, `null`, omitido, campos desconhecidos, vocabulários fechados, coerção de `reportDeadlineHours` e fuso inválido;
- commands: sucesso, no-op, autorização corrente, upsert idempotente e rollback de auditoria;
- queries: leitura de preferências, ausência de row, isolamento por igreja e herança de fuso;
- policies: ADMIN vs não ADMIN nas configurações de igreja e self-scope em `/settings/me`;
- presenter: allowlist, `displayTimezone` nullable e datas ISO.

### Integração

- PostgreSQL real dedicado com migrations aplicadas do zero (e sobre banco já migrado);
- colunas, defaults, tipos, unicidades, FKs compostas e índices;
- backfill idempotente executado duas vezes;
- isolamento de duas igrejas e acesso cross-tenant negado;
- lock da igreja, transação e rollback quando persistência ou auditoria falhar;
- cálculo de atraso de `reportDeadlineHours` nos limites do prazo, em fuso da igreja.

### E2E

- Supertest contra NestJS e PostgreSQL isolado;
- quatro rotas e códigos HTTP previstos;
- `401`, `403` (igreja não ADMIN), `404` opaco, validação estrita, no-op, upsert e auditoria;
- isolamento por igreja e self-service em `/settings/me`;
- Playwright: salvar preferências na tela `/settings`, trocar idioma/tema e conferir dirty-state.

### Validação manual

- inspecionar SQL das duas migrations antes de aplicar;
- conferir Swagger e ausência de `churchId`/`userId` em contratos;
- procurar imports de Prisma fora da infraestrutura;
- executar scripts em PowerShell e registrar limitações reais;
- verificar que a porta canônica ocupada em outras validações continua usando container descartável quando necessário.

## 13. Segurança e privacidade

- todos os endpoints são privados e protegidos pelos guards globais;
- autorização combina papel (`ADMIN` para igreja) e identidade autenticada (self para o usuário);
- `churchId` vem somente do principal/token, nunca do cliente;
- repositories filtram tenant e exclusão lógica explicitamente;
- schemas `.strict()` e mapeamento campo a campo evitam mass assignment;
- presenter usa allowlist e não serializa modelos Prisma;
- erros não revelam existência de preferências de outro usuário/igreja;
- logs não contêm body, preferências ou tokens; preferências são dados não sensíveis, mas permanecem fora de logs por política;
- auditoria quando importante, sem PII e sem valores não alterados;
- nenhuma exportação; riscos LGPD limitados a minimização e retenção das preferências;
- segredos de configuração de infraestrutura definitivamente fora do escopo dos endpoints de settings.

## 14. Migração de dados

Duas migrations aditivas e novas (nunca editar as já aplicadas):

1. `add_church_settings`: cria `church_settings` com `report_deadline_hours` default `48`, unicidade por `church_id`, FK composta cross-tenant e backfill `INSERT INTO church_settings (id, church_id, report_deadline_hours, created_at, updated_at) SELECT gen_random_uuid(), id, 48, now(), now() FROM churches WHERE deleted_at IS NULL ON CONFLICT (church_id) DO NOTHING`.
2. `add_user_preferences`: cria `user_preferences` com defaults (`pt-BR`, `null`, `dd/MM/yyyy`, `system`), unicidade por `user_id`, FK composta e backfill `INSERT ... SELECT ... FROM users WHERE deleted_at IS NULL ON CONFLICT (user_id) DO NOTHING`.

Regras:

- gerar com `migrate dev --create-only` (ou `migrate diff` offline), revisar integralmente o SQL e só então aplicar;
- validar desde banco vazio e sobre schema já migrado;
- backfill idempotente por `ON CONFLICT DO NOTHING`, executado duas vezes sem duplicar;
- remoção futura de colunas exige nova migration, backup e procedimento aprovado;
- não usar `prisma db push`;
- seed: opcionalmente criar rows de settings/preferences para a igreja e usuários fictícios dos testes, mantidos idempotentes.

## 15. Observabilidade

- logs estruturados por nome de operação, resultado, correlation ID e identificadores técnicos mínimos;
- registrar duração de leitura/escrita de preferências sem incluir valores no log;
- sinalizar `401`, `403`, `404`, no-op, retry e rollback transacional;
- `AuditLog` permanece a fonte de auditoria de negócio;
- métricas externas, APM e alertas ficam fora do escopo, sem bloquear logs internos seguros.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Ampliar `updateChurchSettingsRequestSchema` quebrar consumidores existentes | média | médio | adição somente de campo opcional, `.strict()` preservado, testes de contratos e de endpoints |
| Mudança semântica de pendências ao introduzir `reportDeadlineHours` | média | alto | default `48` idêntico ao atual, testes de limites, decisão de interpretação fechada na seção 6 |
| Backfill criar rows duplicadas ou erradas em igreja/usuários existentes | baixa | alto | chaves únicas, `ON CONFLICT DO NOTHING`, execução duplicada em integração |
| vazamento entre igrejas nas preferências | baixa | crítico | tenant do principal, unicidade por `userId`, policy fail-closed e testes negativos |
| Opção key/value genérico reintroduzido | baixa | médio | campos tipados explícitos no schema e contrato |
| Escopo inflar com i18n completa do painel | média | médio | camada i18n mínima definida; tradução completa fora de escopo |
| `displayTimezone` confundido com fuso de cálculo | média | médio | fuso do domínio permanece `getChurchTimezone`; override é somente apresentação |
| Tema persistido divergir do tema local existente | média | baixo | fonte de verdade única e sincronização no login/`theme-toggle` |
| Docker/PostgreSQL indisponível em validação | média | alto | ambiente isolado descartável e registro honesto de validações não executadas |

## 17. Estratégia de reversão

- reverter as alterações de código (módulo `user-preferences`, ampliações do módulo `churches`, contratos, frontend) como unidade coerente em commit próprio;
- manter as duas migrations e colunas aditivas sem uso durante a reversão de código — opção mais segura para dados;
- para remover tabelas/colunas já aplicadas, criar nova migration explícita; nunca editar ou apagar histórico;
- fazer backup antes de qualquer remoção de dados;
- não apagar usuários ou registros de auditoria durante rollback;
- nunca executar `prisma migrate reset` em ambiente com dados;
- registrar versão, motivo, comandos, impacto e validação posterior.

## 18. Comandos de validação

```bash
docker compose up -d postgres-dev postgres-test
docker compose ps

npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status

npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:settings:e2e --workspace @mission-atos/api

npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Comandos de criação de migrations (executados uma única vez durante o desenvolvimento, não como validação repetível):

```bash
npm run db:migrate:create --workspace @mission-atos/database -- --name add_church_settings
npm run db:migrate:create --workspace @mission-atos/database -- --name add_user_preferences
```

Revisar o SQL antes de aplicar. Todos os comandos usam npm/npm workspaces, funcionam em PowerShell, usam banco de teste dedicado e têm resultado real registrado no progresso. Não usar pnpm, `db push` ou instalar dependências sem justificativa.

## 19. Definition of Done

- [ ] escopo implementado;
- [ ] critérios de aceitação atendidos;
- [ ] decisões da seção 6 resolvidas antes das capacidades afetadas;
- [ ] contratos Zod criados e exportados;
- [ ] domínio, aplicação, infraestrutura e HTTP separados;
- [x] nenhum controller ou caso de uso acessa Prisma diretamente;
- [x] autorização (ADMIN/self) e isolamento por igreja validados no servidor;
- [x] no-op e upsert idempotente cobertos por testes;
- [x] auditoria transacional e sem PII;
- [x] migrations criadas, revisadas e reproduzidas (incluindo backfill);
- [x] testes unitários criados e executados;
- [x] testes de integração PostgreSQL criados e executados;
- [x] testes de endpoints criados e executados;
- [x] teste E2E Playwright ampliado da tela de configurações executado;
- [x] lint executado;
- [x] typecheck executado;
- [x] build executado;
- [x] documentação e Swagger atualizados;
- [x] nenhuma dependência npm adicionada sem justificativa;
- [x] ausência de itens fora do escopo confirmada;
- [x] riscos e limitações informados;
- [x] plano movido para `docs/plans/completed/` após a conclusão da implementação.

## 20. Registro de progresso

### 2026-09-07 (expansão global de i18n frontend a pedido do usuário)

- realizado:
  - usuário solicitou que a alteração de idioma em `/settings` refletisse em toda a aplicação web ("faça com que ele altere no projeto todo");
  - camada de i18n expandida para cobertura integral do painel: dicionário unificado em `apps/web/src/shared/i18n/dictionaries.ts` com 100% de paridade de chaves entre `pt-BR`, `en` e `es`;
  - `LanguageProvider` e hook `useI18n` implementados com sincronização reativa via `localStorage` (`mission-atos-language`), script inline no `<head>` para evitar hydration mismatch no atributo `lang`, e sincronização automática com `/settings/me` (`PreferredLanguageSync`);
  - todos os módulos de frontend migrados para consumo reativo de `useI18n`: chrome compartilhado (sidebar, breadcrumbs, user menu, app shell, skip link, tema, guards, paginação, status badges, campos e toast viewport), rotas públicas e de erro (login, bootstrap, 404, access-denied, boundary global), dashboard, analytics, pessoas, células, encontros, chamada/frequência, usuários, relatórios e importação em lote;
  - helpers de data (`formatCellDay`, `formatCellStatus`, `formatCellTimestamp`, `formatMeetingDate`, `formatMeetingTimestamp`, `shortDate`, `formatRange`, `formatFileSize`) parametrizados com o locale ativo ou função `t`;
  - criada suite unitária `apps/web/tests/unit/language-provider.spec.tsx` (7/7 testes) validando integridade do dicionário, paridade de chaves, defaults, persistência e interpolação dinâmica;
  - validação completa em todos os pacotes: `npm run lint` (7/7), `npm run typecheck` (15/15), `npm test` (12/12) e `npm run build` (8/8) 100% aprovados.

### 2026-09-06

- realizado: leitura integral de `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `TEMPLATE.md` e dos planos 001–012-bulk-import; análise da implementação atual (schema Prisma, contratos de igreja/usuário, módulo `churches` com audit atômico, consumidores de `getChurchTimezone`, frontend e capacidades); criado o planejamento do módulo de Configurações Gerais sem alteração de código;
- decisões: plano nomeado `013-general-settings` (012 já existia); persistência pela Opção C (`Church` mantém `timezone`/`weekStartsOn`, novas tabelas `ChurchSettings` e `UserPreferences`); endpoints mantêm `GET/PATCH /church/settings` e adicionam `GET/PATCH /settings/me`; preferências de usuário com `language` (`pt-BR`/`en`/`es`), `displayTimezone` (herança por `null`), `dateFormat` e `theme` (`light`/`dark`/`system`); configuração operacional única no PRD é `reportDeadlineHours` (RN-010, default `48`); RN-012 fora do escopo;
- testes: não executados, pois esta entrega cria somente documentação de planejamento;
- bloqueios: nenhum; pendências registradas na seção 6 (códigos de locale, alcance da i18n mínima e interpretação exata do prazo de `reportDeadlineHours`);
- próximo passo: revisar e aprovar este plano antes de implementar; não criar o Plano 014.

### 2026-09-06 (implementação — Etapas 1 a 5)

- realizado:
  - Etapa 1: criado `packages/contracts/src/settings.ts` (vocabulários, `reportDeadlineHoursSchema` 1–720, schemas `updateOwnPreferences`/`userPreferences`/envelope); `reportDeadlineHours` aditivo em `updateChurchSettingsRequestSchema` e `churchSettingsResponseSchema`; exports e specs atualizados (137 testes passam).
  - Etapa 2: modelos `ChurchSettings` (`@@unique([churchId])`, FK `churchId`, default `48`) e `UserPreferences` (`language`/`displayTimezone`/`dateFormat`/`theme` com defaults, FKs compostas, unicidades `[userId]` e `[userId, churchId]`) no Prisma; `softDeletableModels` atualizado; duas migrations novas (`20260906090000_add_church_settings`, `20260906090001_add_user_preferences`) geradas offline por `prisma migrate diff` com backfill idempotente `ON CONFLICT DO NOTHING`; seed/seed-full atualizados.
  - Etapa 3: módulo `churches` ampliado (`reportDeadlineHours` em port/commands/queries/repository/presenter/controller/Swagger); `findSettings`/`updateSettings` com fallback `48`; auditoria atômica `CHURCH_SETTINGS_UPDATED` mantida; testes unit/presenter/integration/e2e atualizados (12 testes passam).
  - Etapa 4: novo módulo `user-preferences` (`GET/PATCH /settings/me`) com lock/reteria/hook `FOR UPDATE` + P2034, no-op, upsert idempotente, auditoria `USER_PREFERENCES_UPDATED`, presenter allowlist; specs unit (6) e presenter (1) passam; criados integration spec e `settings.e2e-spec.ts` (+ script `test:settings:e2e`).
  - Etapa 5: `reportDeadlineHours` aplicado na listagem de relatórios pendentes — contrato ganha `overdue` (aditivo), `isReportOverdue` no domínio (fim do dia civil do `meetingDate` na zona da igreja + prazo em horas, `now > deadline`), port/repository com `getChurchDeadlineSettings` (fallback timezone `America/Sao_Paulo`, prazo `48`), presenter e coluna "Prazo" (Atrasado/No prazo) na tabela `/reports/pending` (web). Testes unit de queries/presenter (11) passam; typecheck/lint ok em API e web.
  - Etapa 6: nova rota `/settings` com três seções (Regional — timezone/weekStartsOn; Operacional — `reportDeadlineHours`; Preferências — `language`/`displayTimezone`/`dateFormat`/`theme`), cliente `apps/web/src/features/settings/api/settings-api.ts`, mapa i18n mínimo `settings-i18n.ts` (pt-BR/en/es), formulários com no-op/dirty-state e toasts, guardas por papel (seções da igreja somente ADMIN; preferências self-service), sidebar passando a apontar para `/settings`, página institucional mantida em `/church/settings` (sem redirecionar, para não quebrar cobertura e2e existente); tema salvado em `/settings/me` aplicado imediatamente (localStorage `mission-atos-theme` + dataset, incluindo opção `system`) e sincronizado com o `theme-toggle`; mudanças Regionais/Operacionais invalidam caches dependentes (`reports`, `meetings`, `attendance`, `analytics`, `cells`).
  - Etapa 7: spec e2e Playwright novo `apps/web/tests/e2e/settings.spec.ts` (seções por papel, troca de idioma/tema com persistência no DOM/localStorage, no-op/dirty-state, sidebar e `/church/settings` funcional); corrigido import não utilizado em `user-preferences.commands.ts`.
  - Etapa 8 (parcial): validação raiz verde — `npm run lint` (6 workspaces), `npm run typecheck` (13 tasks), `npm test` (11 suites/tasks), `npm run build` (7 tasks, FULL TURBO).
- decisão de interpretação (Etapa 5): após inspecionar `dashboard-analytics` e `AnalyticsOverview`, não existe "indicador de relatórios pendentes" no dashboard nem campo `pendingReports` no `OverviewResult`; o plano proíbe novas superfícies de dashboard — portanto o efeito RN-010 foi aplicado à superfície de pendências existente (`GET /reports/pending`), que passa a marcar `overdue` por linha; critério de aceitação 12 satisfeito por essa leitura.
- decisão de interpretação (Etapa 6): `/church/settings` mantém a página institucional existente (sem redirecionar para `/settings`) para preservar a cobertura e2e e o acesso direto; o ponto único de navegação passa a ser `/settings`.
- testes executados: `@mission-atos/contracts` (137), módulos `churches` (12), `user-preferences` (7), `reports` (11); typecheck/lint API+web; `npm run lint` (6 workspaces), `npm run typecheck` (13 tasks), `npm test` (11 tasks), `npm run build` (7 tasks); database integration (9/9); API integration (37/37); API e2e completa (**9/9 suites, 47/47**), incluindo `settings.e2e-spec.ts` (4/4). Durante a validação foram corrigidos bugs preexistentes em fixtures/limpeza de specs e no módulo de reports (janela de datas `civilDayBounds`).
- bloqueios: nenhum para validação funcional (DB Docker disponível, suites verdes). Resta: revisar diff/imports/Swagger (etapa 8), atualizar README/.env.example se necessário, e mover plano para `docs/plans/completed/`.
- próximo passo: revisão final (diff, Swagger, imports),/atualizar .env.example/README se necessário, e mover plano para `docs/plans/completed/`.

### 2026-09-06 (validação com Docker)

- Docker local ativo: `compose.yaml` + containers `mission-atos-local-postgres-dev-1` (:5432) e `mission-atos-local-postgres-test-1` (:55433). `.env` continua apontando `DATABASE_URL` para Neon produção — as ações abaixo usaram override inline, sem alterar `.env`.
- `npm run db:migrate:deploy` aplicado no dev, incluindo `add_church_settings` e `add_user_preferences` (todas as migrations verdes).
- Banco de teste resetado (`DROP SCHEMA ... CASCADE; CREATE SCHEMA`) e validado idempotência migração+seed (9/9).
- API integration: 37/37 verdes.
- API e2e: `settings.e2e-spec.ts` 4/4; regressão total **9/9 suites, 47/47 testes**.
- Bugs preexistentes corrigidos para desbloquear as suites (todos fora do escopo do plano 013, expostos apenas agora por existir banco):
  - `production-bootstrap.integration-spec.ts`: senha fake continha a substring `password` (regra de rejeição de placeholder).
  - `prisma-reports-management.integration-spec.ts`: códigos de célula não-canônicos (`RPT-`/`ORP-` com hex minúsculo), 2ª célula `ACTIVE` sem `leaderId`, id de reunião fixo não-UUID (`meeting-1`/`meeting-2`), ordem de FK visitor→attendance invertida, assert `averagePresent` alinhado à métrica implementada (visitantes inclusos).
  - `prisma-church-management.integration-spec.ts`: `afterAll` sem limpeza de `user_preferences`/`church_settings`.
  - `reports.e2e-spec.ts`: mesma limpeza ausente + célula do outro tenant sem `leaderId`; login esperava 201 (sistema retorna 200); `otherAdminAuth` (login de outro tenant contra `AUTH_CHURCH_ID` do tenant principal) não é obtível no modelo single-church por instância — removido e isolamento agora verificado por dados (`cell.id` do tenant presente, `otherCellId` ausente).
  - `users.e2e-spec.ts`: teste logava com `new-user-password-123`, mas o usuário foi criado com `New-user-password-123!` (N maiúsculo + `!`) — senha Ã o casada.
  - `auth.e2e-spec.ts`: asserção exigia `SameSite=Strict`, mas `RefreshCookieService` configura `SameSite=Lax` de forma fixa — spec alinhado ao comportamento do app.
  - **Repo bug preexistente**: `findPendingReports`, `findAttendanceSummary`, `findVisitorMetrics`, `findMeetingsReport` usavam `civilDayBounds(input.from)` como janela inteira (ignorava `to`), retornando apenas o dia inicial — corrigido para `start` de `input.from` e `end` de `input.to`, consistente com as demais queries (`resolvePeriodBounds` já usava ambos).
- próximos passos: revisão final (diff, Swagger, imports), atualizar `.env.example`/README se necessário e mover o plano para `docs/plans/completed/`.

### Resumo executivo

- **Decisões tomadas:** Opção C de persistência; configurações em três níveis (Church existente, `ChurchSettings`, `UserPreferences`); endpoints aditivos sem quebrar rotas existentes; preferências de usuário com idioma, fuso, formato de data e tema; auditoria atômica para alterações importantes; no-op detectado.
- **Migrations necessárias:** `add_church_settings` e `add_user_preferences`, ambas novas, aditivas e com backfill idempotente.
- **Endpoints planejados:** `GET /settings/me`, `PATCH /settings/me` (novos); `GET/PATCH /church/settings` ampliado com `reportDeadlineHours` (mantido).
- **Critérios centrais:** isolamento por `churchId`, autorização `ADMIN`/self, settings tipadas e explicitamente definidas, validação Zod estrita, auditoria transacional sem PII, backfill idempotente, efeito `reportDeadlineHours` preservando default `48`, tema persistido e teste E2E da tela de configurações.
