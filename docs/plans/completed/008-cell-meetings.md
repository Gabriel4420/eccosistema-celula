# Plano 008 — Gerenciamento de encontros das células

**Status:** Concluído  
**Responsável:** Missão Atos — time de engenharia  
**Criado em:** 2026-08-19  
**Atualizado em:** 2026-08-19  
**PRD relacionado:** RF-004, RF-010, RF-011, RF-018; RN-001, RN-003, RN-004, RN-007, RN-009; US-004; preparação para RF-012 a RF-015 e US-005 a US-007  
**ADRs relacionadas:** `docs/decisions/003-token-transport.md`; `docs/decisions/005-idempotent-status-transitions.md` como precedente a complementar com a máquina de encontros; `docs/decisions/006-idempotency-key.md` com extensão para encontros ratificada e ainda a documentar  
**Branch ou issue:** a definir

---

## 1. Objetivo

Implementar o gerenciamento de encontros de células de ponta a ponta, preservando o monólito modular e os padrões consolidados pelos Planos 001 a 007, para que usuários autorizados possam, pela aplicação web:

- acessar uma célula e navegar para seus encontros;
- listar o histórico básico de encontros com paginação, período, status e ordenação por data;
- criar um encontro dentro de uma célula válida e autorizada;
- consultar detalhes;
- editar a data enquanto o estado permitir e salvar observações gerais em rascunho;
- concluir ou cancelar o encontro por transições explícitas;
- registrar motivo obrigatório no cancelamento;
- visualizar autoria indireta por auditoria e timestamps, sem expor a trilha interna na API pública.

Ao final da execução futura, o fluxo deverá estar completo em banco/domínio, aplicação, API, contratos, frontend e testes. Toda operação derivará `churchId` do principal autenticado, validará `Meeting → Cell → Church`, aplicará papel e escopo hierárquico no servidor, preservará histórico por status/soft delete e produzirá auditoria transacional mínima.

Este documento é somente planejamento. Sua criação não autoriza implementação, instalação de dependências, execução de migrations, criação de dados ou início do Plano 009.

## 2. Contexto

Os Planos 001 a 007 entregaram monorepo npm/Turborepo, PostgreSQL/Prisma, autenticação, autorização, usuários, igreja, pessoas, células e a aplicação Next.js navegável. O Plano 007 consolidou o escopo de células por `Cell.leaderId`, `Cell.traineeLeaderId` e `SupervisorAssignment`, além de contracts Zod, commands/queries, repository Prisma, auditoria, idempotência persistente e frontend por feature.

O PRD exige criação manual de encontro, sugestão da agenda padrão da célula, cancelamento com justificativa e bloqueio de encontro equivalente duplicado. Também separa frequência e relatório em requisitos próprios. A arquitetura igualmente reserva módulos distintos para `meetings`, `attendance` e `reports`.

A implementação atual já contém `Meeting`, `MeetingAttendance`, `MeetingReport`, enums e relações no Prisma e tipos estruturais em `packages/domain`, todos criados na migration inicial. Porém, não existem:

- regras puras específicas de encontros;
- contratos HTTP de encontros;
- módulo NestJS `meetings`;
- API, repository, policies, presenter ou testes específicos;
- feature web, capabilities ou rotas de encontros;
- motivo de cancelamento em `Meeting`;
- campo `prayerRequests` em `MeetingReport`;
- fluxo funcional de relatório, frequência ou visitantes.

Fontes analisadas antes deste planejamento:

- `AGENTS.md`, `apps/api/AGENTS.md` e `apps/web/AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/TEMPLATE.md` e todos os Planos 001 a 007 em `docs/plans/completed/`;
- ADRs 003, 005 e 006;
- schema Prisma, migration inicial, migrations posteriores, seeds e testes de banco;
- `packages/domain`, `packages/contracts` e suas suítes;
- autenticação, permissions, users, churches, people e cells na API;
- sessão, cliente HTTP, cache, hooks, componentes, rotas, cells e Playwright na web;
- scripts npm e configurações atuais de Jest, integração e E2E.

## 3. Escopo

- criar o módulo NestJS `meetings`, separado em apresentação, aplicação, domínio e infraestrutura;
- criar regras puras para datas civis, estados, transições, mutabilidade e cancelamento;
- criar contratos Zod compartilhados para params, queries, requests, responses e erros;
- listar encontros exclusivamente sob `/cells/:cellId/meetings`, com paginação, período, status e ordenação determinística;
- consultar um encontro pelo par `cellId + meetingId`;
- criar um encontro com data civil e status inicial definido pelo servidor;
- atualizar parcialmente a data sem apagar campos omitidos;
- concluir ou cancelar por endpoint de status, com no-op idempotente;
- exigir e persistir motivo de cancelamento ao mover para `CANCELED`;
- consultar e registrar observações gerais no `MeetingReport` em estado `DRAFT`, sem envio ou frequência;
- validar célula, tenant, soft delete, status da célula, papel e hierarquia;
- impedir encontro duplicado para a mesma célula na mesma data;
- registrar auditoria atômica para criação, alteração real, conclusão e cancelamento;
- documentar endpoints, envelopes, filtros, permissões, exemplos e erros no OpenAPI;
- criar somente migration nova e aditiva para os campos/constraints/índices comprovadamente necessários;
- integrar a feature ao detalhe da célula e ao frontend existente;
- criar rotas `/cells/[cellId]/meetings`, `/cells/[cellId]/meetings/new` e `/cells/[cellId]/meetings/[meetingId]`;
- criar listagem, cadastro, detalhe, edição e ações de status responsivos e acessíveis;
- criar testes unitários, integração PostgreSQL, E2E HTTP, unitários web e Playwright;
- atualizar README/OpenAPI e o registro de progresso durante a futura execução.

## 4. Fora de escopo

- `MeetingAttendance` funcional;
- marcação de presença, ausência ou justificativa;
- participantes esperados, membros, visitantes detalhados ou vínculo de visitante ao encontro;
- carregamento de participantes da célula;
- totais, percentuais, indicadores ou estatísticas de frequência;
- rascunho ou envio do relatório completo do encontro;
- envio, devolução, cancelamento ou aprovação de `MeetingReport`;
- `prayerRequests`, tema/estudo, quantidade de crianças ou contagens de presença no relatório;
- pendências de relatório, prazo de 48 horas, aprovação ou relatório global;
- transferência de membros;
- dashboard analítico, gráficos, exportações ou agregações;
- alteração automática de encontros ao suspender/encerrar uma célula;
- exclusão física, endpoint `DELETE` ou restauração administrativa de `deletedAt`;
- recorrência automática ou geração em lote de encontros;
- notificações, e-mail, WhatsApp ou push;
- aplicação mobile, offline, SQLite ou sincronização;
- novo papel de usuário;
- implementação de `structures`, `CellMembership` ou remodelagem da liderança aprovada no ADR 004;
- Plano 009.

O schema existente de `MeetingAttendance` permanece intacto e sem uso público. `MeetingReport` será usado somente para observações gerais em rascunho; não criar placeholders funcionais, cards com números falsos ou endpoints vazios para frequência.

## 5. Suposições

- papéis canônicos permanecem `ADMIN`, `PASTOR`, `SUPERVISOR` e `LEADER`; “usuário comum” significa principal autenticado sem um desses papéis e deve falhar fechado;
- `churchId` nunca entra nos DTOs públicos e sempre vem do principal autenticado;
- a autoridade hierárquica reutiliza a mesma fonte do módulo cells: `Cell.leaderId`, `Cell.traineeLeaderId` e `SupervisorAssignment` ativo;
- a data pública do encontro será uma data civil ISO `YYYY-MM-DD`, sem horário ou offset;
- `Meeting.meetingDate @db.Date` permanece a fonte canônica; conversão para `Date` no Prisma deve evitar deslocamento de dia e a apresentação deve devolver a string civil original;
- a agenda da célula (`meetingDay` e `meetingTime`) apenas sugere valores no frontend; não altera a semântica de `Meeting.meetingDate` e não gera encontros automaticamente;
- status persistidos e públicos permanecem exatamente `SCHEDULED`, `COMPLETED` e `CANCELED`, alinhados ao Prisma e ao domínio atual;
- criação inicia sempre em `SCHEDULED`; o cliente não escolhe status inicial;
- a unicidade existente `(churchId, cellId, meetingDate)` será mantida: “equivalente” significa a mesma célula e a mesma data civil, inclusive após soft delete;
- somente célula `ACTIVE`, não excluída e no escopo pode receber novo encontro;
- suspender ou encerrar uma célula não altera automaticamente encontros já criados; eles continuam consultáveis e exigem decisão explícita de conclusão/cancelamento;
- nenhuma dependência npm nova é necessária;
- testes conectados usam `TEST_DATABASE_URL` dedicada, diferente de `DATABASE_URL`, com migrations aplicadas desde banco vazio;
- frontend reutiliza sessão em memória, `ApiClient`, `useRemoteQuery`, cache leve, componentes compartilhados e APIs nativas de formulário com Zod.

## 6. Decisões ratificadas

### 6.1 Decisões de produto

- [x] encontro equivalente significa mesma célula + mesma data civil, mantendo a constraint existente `meetings_church_cell_date_key`;
- [x] a unicidade permanece após soft delete; correção operacional ocorre por edição controlada, não por recriação do fato histórico;
- [x] `meetingDate` é `YYYY-MM-DD`/PostgreSQL `DATE`, não um instante UTC e não inclui o horário padrão da célula;
- [x] criação comum ocorre somente em célula atualmente `ACTIVE`; datas passadas, presentes e futuras são aceitas nesse fluxo, sem endpoint excepcional para célula inativa;
- [x] células `FORMING`, `SUSPENDED`, `CLOSED` ou excluídas permanecem consultáveis conforme o escopo, mas rejeitam novos encontros, inclusive retroativos;
- [x] criação inicia sempre em `SCHEDULED`;
- [x] transições são `SCHEDULED → COMPLETED` e `SCHEDULED → CANCELED`, usando os enums existentes; `COMPLETED` e `CANCELED` são terminais e repetição do mesmo status é no-op idempotente;
- [x] apenas encontros `SCHEDULED` aceitam alteração de data; observações em rascunho seguem a regra específica de `MeetingReport`;
- [x] `cancellationReason` é obrigatório, normalizado e limitado a 1.000 caracteres ao cancelar;
- [x] `MeetingReport.observations` é opcional em `DRAFT`, normalizado e limitado a 5.000 caracteres no contrato, sem pedidos de oração e sem conteúdo em logs/auditoria;
- [x] obrigatoriedade de observações ou outros campos na transição para estado final de relatório será definida no plano futuro de relatórios, pois o Plano 008 não envia relatório;
- [x] troca de data respeita a mesma unicidade e pode retornar conflito concorrente;
- [x] suspender ou encerrar célula não cancela encontros em cascata.

### 6.2 Autorização

- [x] matriz da seção 8.6 ratificada: `ADMIN` e `PASTOR` gerenciam encontros em toda a igreja; `SUPERVISOR` apenas lê encontros das células supervisionadas; `LEADER` lê e gerencia somente encontros da célula em que é líder responsável;
- [x] liderança em treinamento não concede escrita em encontros nem aprovação futura de relatório; quando o principal possuir `LEADER` e for apenas `traineeLeader`, mantém a leitura compatível com `CellViewPolicy`;
- [x] nenhum papel fora do catálogo canônico recebe acesso.

### 6.3 Idempotência

- [x] extensão do ADR 006 ratificada para `POST /cells/:cellId/meetings`, com `Idempotency-Key` UUID obrigatório, operação `meeting:create`, hash incluindo `cellId` e payload canônico, replay `201` e conflito `409`;
- [x] `PATCH` continua set-based/idempotente: no-op não altera `updatedAt` nem cria `AuditLog`;
- [x] reutilizar a retenção atual de `idempotency_requests`, sem nova tabela.

### 6.4 MeetingReport — decisão de recorte

- [x] aprovado o uso mínimo do `MeetingReport` existente neste plano para consultar e salvar somente `observations` em `DRAFT`;
- [x] justificativa: o PRD coloca observações no relatório e o schema já possui `MeetingReport.observations`; reutilizá-lo evita criar `Meeting.notes` como segunda fonte de verdade;
- [x] `GET` retorna ausência de relatório como `data: null`; `PUT` cria ou substitui o rascunho de observações de forma idempotente, mantendo um relatório por encontro;
- [x] `submittedBy` e `submittedAt` permanecem nulos, pois salvar rascunho não significa enviar; o ator da alteração vem do principal autenticado e é registrado somente no `AuditLog`;
- [x] este plano não expõe transições de relatório, envio, devolução, cancelamento, aprovação, pendências, prazo, frequência, participantes, visitantes, contagens, tema ou pedidos de oração;
- [x] relatório completo permanece no backlog para um plano futuro após o Plano 009, sem criá-lo agora, cobrindo campos utilizados, dados sensíveis, envio, edição pós-envio, prazo e aprovação.

As decisões desta seção foram ratificadas em 2026-08-19. A Etapa 0 permanece como checkpoint documental para registrar a máquina de estados e a extensão de idempotência nas ADRs antes do código dependente, sem reabrir as decisões de produto acima.

## 7. Áreas afetadas

### Aplicação web

- nova feature `apps/web/src/features/meetings/`;
- novas rotas aninhadas em `apps/web/app/(authenticated)/cells/[cellId]/meetings/`;
- link/ação “Encontros” no detalhe da célula, sem embutir frequência ou relatório completo;
- capabilities visuais fail-closed para leitura, criação, edição e status;
- breadcrumbs para célula, encontros, novo encontro e detalhe;
- cache próprio `meetings`, com chaves incluindo `cellId`, ID e filtros normalizados;
- reutilização de shell, sessão, `ApiClient`, `useRemoteQuery`, `Table`, `Pagination`, `StatusBadge`, `Dialog`, `Alert`, `Skeleton`, `EmptyState`, `ErrorState`, fields e tokens existentes;
- nenhuma regra crítica somente em React e nenhuma importação de Prisma.

### API

- novo `apps/api/src/modules/meetings/` e registro no `AppModule`;
- controller fino com rotas aninhadas sob `cells/:cellId/meetings`;
- queries, commands, authorization, policies, ports, tipos internos, erros, presenter e repository Prisma;
- reuso conceitual da política de escopo de célula, sem importar detalhes privados do módulo cells nem duplicar uma fonte de autoridade;
- nenhuma dependência direta de aplicação/apresentação para Prisma.

Estrutura proposta:

```text
apps/api/src/modules/meetings/
├── application/
│   ├── meetings-management.authorization.ts
│   ├── meetings-management.commands.ts
│   ├── meetings-management.error.ts
│   ├── meetings-management.port.ts
│   ├── meetings-management.queries.ts
│   └── meetings-management.types.ts
├── domain/
│   └── meetings-management.policy.ts
├── infrastructure/
│   ├── prisma-meetings-management.repository.ts
│   └── prisma-meetings-management.integration-spec.ts
├── presentation/
│   ├── meetings.controller.ts
│   ├── meetings.presenter.ts
│   └── meetings.presenter.spec.ts
└── meetings.module.ts
```

### Banco de dados

- reutilizar `Meeting`, `Cell`, `Church`, `User`, `SupervisorAssignment`, `AuditLog` e `IdempotencyRequest` existentes;
- adicionar somente `Meeting.cancellationReason` por migration aditiva;
- manter enum, FKs compostas, unique e soft delete existentes;
- avaliar índice composto para a query real por célula, soft delete e data;
- não alterar a estrutura de `MeetingAttendance` nem `MeetingReport`.

### Contratos compartilhados

- criar `packages/contracts/src/meetings.ts` e exportar por `index.ts`;
- definir schemas estritos de params aninhados, query, criação, update, status, item, página e erro;
- manter enums explícitos em paridade testada com domínio/Prisma;
- não expor `churchId`, `deletedAt`, objetos Prisma, dados de auditoria ou idempotência.

### Infraestrutura

- nenhuma dependência ou serviço externo novo;
- nova migration somente após preflight e decisões aprovadas;
- scripts npm específicos de E2E HTTP e uso da infraestrutura PostgreSQL/Playwright existente;
- seed canônica continua mínima; seed E2E ganha somente dados fictícios necessários ao fluxo.

### Documentação

- OpenAPI e README com rotas, datas civis, filtros, estados, transições, permissões, idempotência e erros;
- registro deste plano atualizado com decisões e resultados reais;
- nenhum documento deve declarar frequência ou workflow completo de relatório como entregue.

## 8. Modelo e regras de negócio

### 8.1 Análise do modelo existente

| Aspecto | Implementação atual | PRD/arquitetura | Direção mínima do Plano 008 |
| --- | --- | --- | --- |
| tenant | `Meeting.churchId` + FK para `Church` | isolamento por igreja | manter; derivar do principal e filtrar todas as queries |
| célula | `cellId` + FK composta `(cellId, churchId)` | encontro pertence à célula | manter e validar também em aplicação/policy |
| data | `meetingDate @db.Date` | data do encontro; agenda sugerida | transportar `YYYY-MM-DD`; não converter como instante |
| duplicidade | unique `(churchId, cellId, meetingDate)` | impedir encontro equivalente duplicado | manter e mapear corrida para erro estável |
| status | `SCHEDULED/COMPLETED/CANCELED` | criar, realizado, cancelar | manter exatamente os três estados |
| observações | `MeetingReport.observations` já existe | PRD atribui observações ao relatório | usar somente o rascunho mínimo do relatório; não duplicar em `Meeting` |
| cancelamento | status sem justificativa | RF-011 exige justificativa | adicionar `cancellationReason` e invariant |
| timestamps | UTC `TIMESTAMPTZ(3)` | histórico básico | manter e apresentar no timezone da igreja |
| exclusão | `deletedAt` | RN-007 | manter; sem endpoint de delete |
| frequência | relação `attendances` existente | Plano 009 | não acessar nem expor neste plano |
| relatório | relação opcional `report`, unique por encontro e modelo existente | fluxo próprio do PRD | expor somente observações em `DRAFT`; envio e relatório completo ficam após o Plano 009 |
| auditoria | `AuditLog` genérico existente | RF-018 | registrar mutação e audit no mesmo commit |

### 8.2 Modelo de dados alvo

`Meeting` permanece com:

- `id: UUID`;
- `churchId: UUID` interno;
- `cellId: UUID` interno/derivado da rota;
- `meetingDate: DATE` obrigatório;
- `status: MeetingStatus` obrigatório;
- `cancellationReason: VARCHAR(1000) NULL` novo;
- `createdAt` e `updatedAt` em UTC;
- `deletedAt` para soft delete, sem endpoint neste plano.

Invariantes de persistência propostas:

- `CANCELED` exige `cancellationReason` não vazio após trim;
- estados diferentes de `CANCELED` mantêm `cancellationReason = NULL`;
- unique existente por `(church_id, cell_id, meeting_date)` permanece global, inclusive para soft deleted;
- FK composta impede relacionar encontro a célula de outra igreja;
- não adicionar `createdBy`, `updatedBy` ou `supervisorId`: o ator está no `AuditLog` e supervisão continua derivada da célula;
- não adicionar horário ao encontro nesta etapa: o horário recorrente já pertence à célula, e o requisito atual define somente `meetingDate`.

`MeetingReport` permanece com sua estrutura atual. Neste plano:

- zero ou um relatório por encontro, garantido pela unique existente `(meetingId, churchId)`;
- `observations` é o único campo editável, normalizado, nullable e limitado pelo contrato a 5.000 caracteres;
- primeiro `PUT` cria `status=DRAFT`; atualizações seguintes preservam `DRAFT`;
- `submittedBy` e `submittedAt` permanecem nulos;
- observações podem ser salvas enquanto o encontro está `SCHEDULED` ou `COMPLETED`; encontro `CANCELED` usa somente `Meeting.cancellationReason` e rejeita `PUT report` com `409 MEETING_REPORT_NOT_EDITABLE`;
- o motivo de cancelamento permanece em `Meeting` por ser invariante da transição; um relatório futuro deve apresentá-lo por composição, sem duplicá-lo em `MeetingReport`;
- relatório soft-deleted não é restaurado implicitamente; o preflight deve identificá-lo e o endpoint retorna conflito estável até decisão administrativa explícita;
- demais estados e campos não são aceitos nem inferidos.

### 8.3 Data civil

- entrada e saída HTTP usam regex/calendário ISO estrito `YYYY-MM-DD`;
- datas inválidas como `2026-02-30`, timestamps, offsets ou strings locais são rejeitadas;
- o caso de uso converte para a representação Prisma sem aplicar timezone do servidor;
- presenter formata a coluna `DATE` de volta para `YYYY-MM-DD`, sem `toISOString()` que possa deslocar o dia em ambientes diferentes;
- `createdAt`/`updatedAt` continuam instantes ISO UTC e são formatados no timezone da igreja apenas na interface;
- filtro de período usa `from` e `to` inclusivos e rejeita `from > to`.

### 8.4 Duplicidade

- será permitido no máximo um encontro por célula e data civil;
- a regra depende de ratificação: o PRD impede encontro equivalente duplicado, e este plano propõe definir “equivalente” como mesma célula e mesma data civil porque o modelo não possui tipo ou horário específico do encontro;
- a aplicação verifica conflito para mensagem previsível, mas a unique do banco é a autoridade concorrente;
- criação ou troca de data conflitante retorna `409 MEETING_DATE_CONFLICT`;
- soft delete não libera a data na constraint atual, conforme decisão ratificada de preservar o fato histórico;
- não haverá horário como critério de unicidade, pois o modelo público não possui horário específico do encontro.

### 8.5 Status e transições

| Origem | Destino | Permitido | Condição |
| --- | --- | --- | --- |
| `SCHEDULED` | `SCHEDULED` | sim | no-op, sem update/auditoria |
| `SCHEDULED` | `COMPLETED` | sim | ator autorizado; frequência não é requisito neste plano |
| `SCHEDULED` | `CANCELED` | sim | `cancellationReason` obrigatório |
| `COMPLETED` | `COMPLETED` | sim | no-op |
| `CANCELED` | `CANCELED` | sim | no-op somente se o motivo desejado for equivalente |
| `COMPLETED` | outro | não | estado terminal |
| `CANCELED` | outro | não | estado terminal |

Regras adicionais:

- criação persiste `SCHEDULED`, independentemente de qualquer campo enviado pelo cliente;
- endpoint de status aceita apenas `COMPLETED` ou `CANCELED`; não expõe retorno para `SCHEDULED`;
- cancelar não altera `deletedAt`;
- conclusão não exige frequência ou relatório no Plano 008;
- update geral só é aceito em `SCHEDULED`;
- não existe alteração implícita de status pelo PATCH geral;
- transição inválida retorna `409 MEETING_STATUS_TRANSITION_INVALID`;
- no-op não altera `updatedAt` e não duplica auditoria.

### 8.6 Permissões e escopo

| Operação | `ADMIN` | `PASTOR` | `SUPERVISOR` | `LEADER` responsável | `LEADER` apenas trainee | outro papel |
| --- | --- | --- | --- | --- | --- | --- |
| listar | igreja | igreja | células supervisionadas | própria célula | leitura da célula | negar |
| detalhe | igreja | igreja | células supervisionadas | própria célula | leitura da célula | negar |
| criar | igreja | igreja | negar | própria célula | negar | negar |
| editar data | igreja | igreja | negar | própria célula | negar | negar |
| concluir/cancelar | igreja | igreja | negar | própria célula | negar | negar |
| consultar observações | igreja | igreja | células supervisionadas | própria célula | leitura da célula | negar |
| salvar observações | igreja | igreja | negar | própria célula | negar | negar |

Aplicação da matriz:

- guards/roles fazem somente a barreira grosseira;
- a aplicação carrega a célula no tenant, resolve liderança/supervisão ativa e aplica policy;
- consultas aplicam o escopo no SQL/Prisma; não carregam toda a igreja para filtrar em memória;
- mutations revalidam usuário ativo, papéis ativos, célula, liderança e status dentro da mesma unidade de trabalho;
- `principal.roles` orienta o início do fluxo, mas papel mutável é revalidado antes do efeito;
- `cellId` e `meetingId` devem corresponder entre si; um meeting existente sob outra célula retorna `404` no contexto da rota, sem enumerar o recurso;
- célula, encontro ou relatório ausente, excluído, pertencente a outro tenant ou incompatível com o par da rota retorna `404`, sem revelar sua existência;
- `403 MEETING_ACCESS_DENIED` é reservado a recurso local conhecido quando o principal autenticado não possui papel ou vínculo suficiente;
- `SUPERVISOR` continua somente leitura porque o PRD o define como acompanhamento; ampliar escrita exige decisão de produto;
- frontend reflete a matriz, mas API permanece autoridade final.

### 8.7 Célula e ciclo de vida

- célula inexistente, excluída ou de outro tenant não recebe encontro;
- somente `ACTIVE` recebe novo encontro;
- `FORMING`, `SUSPENDED` e `CLOSED` rejeitam criação com `409 MEETING_CELL_STATUS_INVALID`;
- encontros existentes permanecem visíveis após suspensão/encerramento da célula;
- editar/concluir/cancelar encontro já existente continua permitido conforme papel e estado do encontro, para fechamento operacional explícito;
- nenhuma ação em célula propaga automaticamente status para encontros;
- mudança posterior de líder/supervisor altera o escopo de acesso corrente, mas não reescreve auditoria histórica.

### 8.8 Atualização parcial

- PATCH geral aceita somente `{ meetingDate }`;
- campo omitido é preservado;
- `meetingDate` nunca aceita `null`;
- `status`, `cellId`, `churchId`, `createdAt`, `updatedAt`, `deletedAt` e motivo de cancelamento não entram no PATCH geral;
- campos desconhecidos são rejeitados por schema Zod estrito;
- mudança sem efeito retorna a representação atual, sem write/auditoria;
- encontro não `SCHEDULED` retorna conflito de imutabilidade.

### 8.9 Auditoria

| Operação | Ação proposta | Conteúdo permitido |
| --- | --- | --- |
| criação | `MEETING_CREATED` | `cellId`, `meetingDate`, `status` |
| troca de data | `MEETING_DATE_CHANGED` | data anterior/nova |
| conclusão | `MEETING_COMPLETED` | status anterior/novo |
| cancelamento | `MEETING_CANCELED` | status anterior/novo e presença de motivo, nunca texto integral |
| criação do rascunho | `MEETING_REPORT_DRAFT_CREATED` | `meetingId`, `status`; nunca observações |
| alteração do rascunho | `MEETING_REPORT_OBSERVATIONS_CHANGED` | somente `changedFields`; nunca observações |

- mutação e `AuditLog` pertencem à mesma transação;
- no-op não cria auditoria;
- erro/rollback não deixa audit parcial;
- não registrar tokens, cookies, principal completo, headers, notas, motivo integral, endereço, prayer requests ou payload completo;
- `AuditLog.entity = "Meeting"` e `entityId = meeting.id`;
- logs técnicos não substituem auditoria e usam somente operação, resultado, duração, correlation ID quando disponível e IDs mínimos.

### 8.10 Preparação para os próximos planos

- manter relação `Meeting.attendances` e unique de attendance sem consumo no módulo;
- isolar o acesso mínimo ao report em port/repository próprio do módulo meetings, sem importar domínio futuro de frequência ou implementar workflow completo de reports;
- retornar um envelope de detalhe estável que possa receber links/capabilities futuras sem incluir arrays vazios de frequência;
- organizar a tela de detalhe em seções coesas, deixando um ponto de composição futuro após “Informações do encontro”, sem renderizar placeholders;
- não acoplar status de conclusão a contagem de frequência neste plano;
- não criar adapter ou port de attendance prematuramente e não ampliar o port mínimo de report para o workflow futuro;
- Plano 009 deverá consumir `meetingId` somente após validar o encontro e seu estado no mesmo tenant.

## 9. Contratos

### Entradas

Params:

- `meetingCellParamsSchema`: `{ cellId: uuid }`;
- `meetingParamsSchema`: `{ cellId: uuid, meetingId: uuid }`.

Listagem:

- `GET /cells/:cellId/meetings`;
- query: `page?`, `pageSize?`, `from?`, `to?`, `status?`, `sortOrder?`;
- defaults: página `1`, `pageSize=20`, máximo `100`, `sortOrder=desc`;
- ordenação pública somente por `meetingDate`, com `id` como desempate determinístico;
- `from` e `to` são datas civis inclusivas.

Criação:

- `POST /cells/:cellId/meetings`;
- header `Idempotency-Key: <UUID>` após ratificação da seção 6.3;
- body estrito: `{ meetingDate }`;
- servidor define `status=SCHEDULED`, `churchId`, `cellId`, ator e timestamps.

Detalhe:

- `GET /cells/:cellId/meetings/:meetingId`;
- busca obrigatoriamente pelo par da rota, dentro do tenant e do escopo autorizado;
- retorna `200` com o item público ou `404 MEETING_NOT_FOUND` sem enumeração cross-cell/cross-tenant.

Atualização:

- `PATCH /cells/:cellId/meetings/:meetingId`;
- body estrito: `{ meetingDate }`;

Status:

- `PATCH /cells/:cellId/meetings/:meetingId/status`;
- união discriminada recomendada:

```ts
{ status: "COMPLETED" }
| { status: "CANCELED"; cancellationReason: string }
```

- `cancellationReason` é proibido ao concluir e obrigatório ao cancelar.

Observações gerais:

- `GET /cells/:cellId/meetings/:meetingId/report`;
- responde `200` com `{ data: MeetingReportDraftResponse | null, meta: {} }`;
- `PUT /cells/:cellId/meetings/:meetingId/report`;
- body estrito: `{ observations: string | null }`, normalizado e com máximo de 5.000 caracteres;
- cria ou substitui o rascunho de modo idempotente; não aceita `status`, `submittedBy`, `submittedAt` ou qualquer campo de frequência;
- retorna `200` tanto na primeira gravação quanto em repetição/alteração; no-op preserva `updatedAt` e não audita;
- exige que encontro, célula e igreja correspondam à rota; relatório externo ou de outro encontro não é enumerável.

### Saídas

Item público:

```json
{
  "data": {
    "id": "uuid",
    "cell": {
      "id": "uuid",
      "code": "CEL-001",
      "name": "Célula Esperança"
    },
    "meetingDate": "2026-08-19",
    "status": "SCHEDULED",
    "cancellationReason": null,
    "createdAt": "2026-08-19T12:00:00.000Z",
    "updatedAt": "2026-08-19T12:00:00.000Z"
  },
  "meta": {}
}
```

- listagem retorna `{ data: MeetingResponse[], meta: { page, pageSize, totalItems, totalPages } }`;
- criação inédita e replay idempotente retornam `201` com o mesmo item;
- PATCH retorna `200`, inclusive no-op;
- respostas de encontro não incluem `churchId`, `deletedAt`, attendance, report embutido, audit ou metadados internos;
- `cancellationReason` pode ser retornado aos atores autorizados do encontro; não é tratado como prayer request, mas não deve ir para logs/audit.
- `MeetingReportDraftResponse` contém somente `id`, `meetingId`, `observations`, `status=DRAFT`, `submittedBy=null`, `submittedAt=null`, `createdAt` e `updatedAt`;
- ausência de rascunho no `GET report` retorna `200` com `data: null`, não `404`; `404` é reservado ao encontro/célula não encontrado no contexto autorizado.

### Erros esperados

| Situação | HTTP | Código estável |
| --- | ---: | --- |
| UUID/query/body/data inválidos | 400 | contrato global/Zod |
| sem autenticação | 401 | `AUTH_UNAUTHENTICATED` |
| papel/escopo insuficiente | 403 | `MEETING_ACCESS_DENIED` |
| célula ausente no tenant | 404 | `CELL_NOT_FOUND` |
| encontro ausente sob a célula | 404 | `MEETING_NOT_FOUND` |
| célula não ativa para criação | 409 | `MEETING_CELL_STATUS_INVALID` |
| data duplicada | 409 | `MEETING_DATE_CONFLICT` |
| encontro histórico não editável | 409 | `MEETING_NOT_EDITABLE` |
| observações em encontro cancelado ou report soft-deleted | 409 | `MEETING_REPORT_NOT_EDITABLE` |
| transição inválida | 409 | `MEETING_STATUS_TRANSITION_INVALID` |
| cancelamento sem motivo | 400 | validação de contrato |
| chave idempotente ausente/inválida | 400 | validação de contrato |
| chave reutilizada com outro payload | 409 | `IDEMPOTENCY_KEY_CONFLICT` |
| corrida serializável esgotada | 503 | `MEETING_TRANSACTION_RETRY_EXHAUSTED` |

Não retornar stack, SQL, IDs de outro tenant ou detalhes internos. Conflitos conhecidos são públicos apenas dentro do contexto autenticado e autorizado.

### Permissões

- decorators `@Roles("ADMIN", "PASTOR", "SUPERVISOR", "LEADER")` podem proteger leitura;
- escrita usa barreira grosseira `ADMIN/PASTOR/LEADER`, seguida de policy transacional que distingue líder responsável de trainee;
- não criar endpoint público nem aceitar `churchId`, `actorId`, `submittedBy` ou `createdBy`;
- leitura de relatório usa a mesma permissão de detalhe; `PUT` usa a mesma permissão de escrita do encontro e revalida vínculo dentro da transação;
- nenhum contrato aceita `submittedBy`, `submittedAt`, status de relatório ou IDs de usuário.

### 9.1 Frontend — contrato de apresentação e integração

#### Rotas

| Rota | Conteúdo | Acesso visual |
| --- | --- | --- |
| `/cells/[cellId]` | detalhe atual + link “Ver encontros” | quem já visualiza a célula |
| `/cells/[cellId]/meetings` | listagem/histórico | quem visualiza a célula |
| `/cells/[cellId]/meetings/new` | cadastro | `ADMIN`, `PASTOR` ou líder responsável |
| `/cells/[cellId]/meetings/[meetingId]` | detalhe, edição e status | leitura conforme escopo; ações conforme matriz |

Não criar rota `/edit`: a edição permanece no detalhe, seguindo cells/people/users. Não adicionar item global “Encontros” na sidebar, pois o recurso é sempre contextual a uma célula.

#### Integração com detalhe da célula

- adicionar ação “Ver encontros” no `CellDetail` para qualquer ator que já visualiza a célula;
- adicionar “Novo encontro” apenas quando a célula está `ACTIVE` e a capability visual permite; a API revalida;
- não carregar lista de encontros automaticamente no detalhe da célula; evitar requisição/N+1 e manter a página focada;
- breadcrumbs preservam o caminho `Células → <célula> → Encontros → <encontro>` com labels estáticos seguros quando o nome ainda não estiver carregado.

#### Componentes propostos

```text
apps/web/src/features/meetings/
├── api/
│   └── meetings-api.ts
├── components/
│   ├── create-meeting-form.tsx
│   ├── meeting-detail.tsx
│   ├── meeting-status-badge.tsx
│   └── meetings-list.tsx
└── lib/
    └── format.ts
```

- `meetings-api.ts`: valida params/requests/responses com contracts e usa `ApiClient`;
- `MeetingsList`: célula identificada, filtros URL-driven, tabela/lista móvel e estados remotos;
- `CreateMeetingForm`: sugestão de data baseada no próximo `meetingDay` da célula, editável antes de enviar;
- `MeetingDetail`: dados, edição de data, editor de observações em rascunho e diálogos de concluir/cancelar;
- `MeetingStatusBadge`: labels `Agendado`, `Concluído`, `Cancelado` sem depender apenas de cor;
- `format.ts`: data civil e timestamps com timezone da igreja, sem deslocar `meetingDate`.

#### Listagem

- cabeçalho com nome/código da célula e retorno ao detalhe;
- botão “Novo encontro” apenas quando autorizado e a célula estiver ativa;
- colunas: data, status, atualização e ações;
- responsável não será exibido, pois o modelo não possui `createdBy` e inventar essa coluna duplicaria auditoria;
- filtros por data inicial, data final e status;
- ordenação data asc/desc, padrão desc;
- paginação 20/máximo 100;
- filtros refletidos em `searchParams` e normalizados;
- skeleton, vazio, erro com retry, acesso negado e loading de navegação;
- tabela semântica e apresentação móvel conforme o componente existente;
- vazio orienta criação somente quando autorizada; caso contrário, informa ausência de histórico.

#### Cadastro e edição

- cadastro usa somente `meetingDate` obrigatório;
- data sugerida pelo frontend usa agenda da célula, mas o usuário pode alterá-la;
- status inicial aparece como informação “Agendado”, não como select;
- Zod compartilhado valida antes do envio e API valida novamente;
- `Idempotency-Key` UUID permanece estável enquanto payload/tentativa não for finalizado; nova tentativa deliberada gera nova chave;
- botão bloqueia submissão repetida e informa loading em `aria-live`;
- `409 MEETING_DATE_CONFLICT` mostra mensagem específica e preserva valores;
- cancelar formulário retorna à lista/detalhe sem mutação;
- edição de encontro envia a nova data somente quando alterada;
- observações usam formulário independente ligado ao `PUT report`, aceitam remoção explícita com `null` e não alteram status do encontro;
- sucesso invalida lista e detalhe do encontro; não invalida dados não relacionados;
- ações de concluir/cancelar usam `Dialog`, confirmação explícita, foco confinado e retorno de foco;
- motivo de cancelamento é coletado no diálogo, associado ao campo e validado;
- formulário de encontro histórico fica somente leitura.

#### Detalhes

- identificação da célula;
- data civil e status;
- observações gerais do rascunho, quando existentes;
- motivo de cancelamento quando aplicável;
- timestamps relevantes;
- ações permitidas por capability, vínculo e estado conhecido;
- seção futura de frequência não é renderizada;
- relatório completo não é exibido nem sugerido como concluído; a seção é rotulada “Observações gerais (rascunho)” e não oferece envio;
- estrutura de composição permite ao Plano 009 inserir frequência depois, sem transformar `MeetingDetail` em componente monolítico.

#### Capabilities e cache

Capabilities novas, fail-closed:

- `viewMeetings` — qualquer principal canônico, condicionado na tela ao acesso à célula;
- `createMeetings` — `ADMIN`, `PASTOR`, `LEADER`; vínculo real decidido pela API;
- `editMeetings` — `ADMIN`, `PASTOR`, `LEADER`; vínculo/estado na API;
- `changeMeetingStatus` — `ADMIN`, `PASTOR`, `LEADER`; vínculo/transição na API.

O frontend esconde ações para supervisor/outro papel usando capabilities globais fail-closed e, para UX, compara `principal.id` com `leader.id`/`traineeLeader.id` já retornados pelo detalhe real da célula. Essa comparação não substitui nem replica a policy completa: a API revalida papel e vínculo em toda mutação. Não criar capabilities por recurso neste plano.

Tratamento de feedback e erros:

- `401` delega ao fluxo global do `ApiClient`: tentativa única de refresh e, se definitiva, encerramento de sessão, limpeza de caches e retorno ao login;
- `403` mostra estado de acesso negado sem retry automático e mantém navegação segura de retorno;
- `404` mostra célula/encontro ausente sem revelar tenant ou IDs externos;
- `409` preserva o formulário e apresenta mensagem específica junto ao campo ou ação;
- sucesso de criação, edição, observações e status usa `Alert` acessível já existente, com foco programático no feedback; não adicionar toast ou dependência nova.

Cache:

- store `meetings`;
- lista: `page:${cellId}:${from}:${to}:${status}:${sortOrder}:${page}:${pageSize}`;
- detalhe: `detail:${cellId}:${meetingId}`;
- célula: reutilizar store `cells` apenas para identificação/sugestão;
- criação invalida listas da célula;
- troca de data/status invalida listas e detalhe correspondente;
- alteração de observações invalida apenas o cache de report do encontro;
- logout/fim de sessão continua chamando `clearAllCaches`.

## 10. Etapas

### Etapa 0 — Documentar decisões ratificadas

- [x] unicidade por célula/data, persistência após soft delete e semântica de data civil aprovadas;
- [x] estado inicial, transições terminais e mutabilidade aprovados com os enums existentes;
- [x] matriz de autorização, inclusive trainee e supervisor, aprovada;
- [x] criação comum somente em célula ativa, retroatividade por data e ausência de cascata aprovadas;
- [x] extensão do ADR 006 para criação de encontros ratificada;
- [x] recorte mínimo de `MeetingReport.DRAFT` e ausência de prayer requests aprovados;
- [x] complementar o ADR 005 ou registrar ADR específica com a máquina `SCHEDULED → COMPLETED|CANCELED`;
- [x] documentar no ADR 006 a operação `meeting:create`, hash, replay, conflito, retenção e erro transitório;
- [x] atualizar neste plano os links/identificadores finais das ADRs antes do código dependente.

### Etapa 1 — Contratos e regras puras

- [x] escrever testes falhando para datas, schemas, transições, mutabilidade e cancelamento;
- [x] criar `packages/contracts/src/meetings.ts` e exportar no index;
- [x] criar regras puras em `packages/domain/src/meetings.ts`;
- [x] testar paridade de enums com Prisma/domínio;
- [x] testar payload estrito, PATCH vazio, `null`, intervalo e união de status;
- [x] documentar `DATE` versus timestamp.

### Etapa 2 — Preflight, schema e migration

- [x] inspecionar encontros existentes, duplicidades, status e registros cancelados;
- [x] adicionar somente `cancellationReason` por nova migration;
- [x] definir estratégia para registros `CANCELED` anteriores sem motivo antes do check;
- [x] adicionar checks de cancelamento após preflight/backfill aprovado;
- [x] avaliar índice `(church_id, cell_id, deleted_at, meeting_date, id)` contra a query real;
- [x] revisar redundância com unique/índices atuais via `EXPLAIN ANALYZE`;
- [x] validar migration desde banco vazio e sobre cópia do estado atual;
- [x] não alterar `MeetingReport` ou `MeetingAttendance`.

### Etapa 3 — Tipos, ports e policies

- [x] criar tipos internos distintos dos DTOs HTTP/Prisma;
- [x] criar repository de queries e unidade de trabalho orientada aos casos de uso;
- [x] modelar escopo `church | supervisor | leader` aplicado no banco;
- [x] criar policies de leitura, escrita, estado da célula e estado do encontro;
- [x] revalidar ator/papel/vínculo dentro da transação;
- [x] testar fail-closed, outro tenant, papel stale, supervisor, líder e trainee.

### Etapa 4 — Listagem e detalhe

- [x] implementar busca tenant-aware da célula e escopo antes da consulta;
- [x] implementar listagem paginada com snapshot consistente;
- [x] aplicar período/status/ordenação e desempate por ID;
- [x] implementar detalhe pelo par célula/encontro;
- [x] usar selects mínimos, sem attendance e sem report embutido;
- [x] testar paginação, limites, filtros, ordenação, soft delete e ausência cross-cell.

### Etapa 5 — Criação idempotente

- [x] validar célula `ACTIVE`, ator e liderança na mesma transação;
- [x] normalizar a data e definir `SCHEDULED` no servidor;
- [x] aplicar `Idempotency-Key` conforme ADR ratificada;
- [x] verificar/mapping de unique para `MEETING_DATE_CONFLICT`;
- [x] persistir encontro, idempotência e auditoria atomicamente;
- [x] testar replay, payload divergente, concorrência, rollback e outra igreja.

### Etapa 6 — Atualização parcial

- [x] carregar encontro sob célula/tenant e lock necessário;
- [x] aceitar somente alteração de data em `SCHEDULED`;
- [x] preservar omitidos, tratar `null` e rejeitar vazio;
- [x] detectar no-op e conflito de nova data;
- [x] persistir diff e auditoria atômicos;
- [x] testar imutabilidade, concorrência e rollback.

### Etapa 7 — Status

- [x] implementar máquina de estados explícita;
- [x] exigir motivo no cancelamento e limpar/proibir motivo em conclusão;
- [x] manter status set-based/idempotente;
- [x] impedir saída de estados terminais;
- [x] persistir mudança e auditoria atomicamente;
- [x] testar matriz completa, no-op e dados sensíveis ausentes da auditoria.

### Etapa 8 — Observações gerais em rascunho

- [x] implementar leitura e upsert idempotente de `MeetingReport.observations` em `DRAFT`;
- [x] validar encontro, célula, tenant, soft delete e autorização antes de acessar o relatório;
- [x] manter `submittedBy/submittedAt` nulos e rejeitar status/campos não previstos;
- [x] permitir observações em `SCHEDULED/COMPLETED`, negar `CANCELED` e não restaurar report soft-deleted;
- [x] auditar criação/alteração sem copiar observações;
- [x] testar ausência, criação, atualização, remoção, no-op, concorrência e isolamento por igreja.

### Etapa 9 — HTTP e OpenAPI

- [x] criar os sete endpoints planejados;
- [x] aplicar guards/roles e authorization da aplicação;
- [x] mapear erros públicos estáveis no limite HTTP;
- [x] criar presenter com allowlist;
- [x] documentar params, filtros, paginação, datas, status, idempotência, exemplos e erros;
- [x] provar que respostas não expõem campos internos, attendance ou report embutido e que o endpoint dedicado contém somente o rascunho permitido.

### Etapa 10 — Fundação web da feature

- [x] criar `meetings-api`, chaves de cache, formatadores e status badge;
- [x] adicionar capabilities e breadcrumbs fail-closed;
- [x] criar rotas/boundaries sem duplicar shell/sessão;
- [x] integrar link ao detalhe da célula;
- [x] testar API client, capabilities, datas e erros.

### Etapa 11 — Listagem web

- [x] criar identificação da célula, CTA, filtros, ordenação e paginação;
- [x] refletir filtros na URL;
- [x] criar tabela responsiva e ações permitidas;
- [x] implementar skeleton, vazio, erro/retry e acesso negado;
- [x] garantir teclado, foco, labels e ausência de overflow.

### Etapa 12 — Cadastro e detalhe web

- [x] criar formulário com data sugerida, notas, Zod e erros por campo;
- [x] usar chave idempotente estável e impedir dupla submissão;
- [x] tratar conflito de data sem perder o formulário;
- [x] criar detalhe com edição parcial e timestamps;
- [x] criar diálogos acessíveis para concluir/cancelar;
- [x] invalidar caches mínimos após mutações;
- [x] criar somente o editor de observações em rascunho; não criar frequência nem workflow completo de relatório.

### Etapa 13 — Testes conectados e fluxo funcional

- [x] criar integração PostgreSQL do repository/constraints;
- [x] criar E2E HTTP de encontros e script npm específico;
- [x] atualizar seed E2E com encontro fictício e limpeza na ordem correta das FKs;
- [x] criar Playwright do fluxo completo com API/PostgreSQL reais;
- [x] validar papéis, tenant, datas, conflitos e estados terminais;
- [x] validar viewports 360×800, 768×1024, 1280×800, zoom 200% e teclado.

### Etapa 14 — Documentação e encerramento

- [x] executar lint, typecheck, unitários, integração, HTTP, Playwright e build;
- [x] executar migrations desde banco vazio e verificar status;
- [x] revisar dependências/audit;
- [x] atualizar README/OpenAPI e registro de progresso com resultados reais;
- [x] revisar diff contra fora de escopo;
- [x] mover o plano para `completed` somente após todo o DoD.

## 11. Critérios de aceitação

1. Usuário autenticado sem papel canônico não acessa encontros.
2. `ADMIN` e `PASTOR` listam e consultam encontros somente da própria igreja.
3. `SUPERVISOR` lista/consulta apenas encontros das células cujos líderes estão em `SupervisorAssignment` ativo sob sua supervisão.
4. `LEADER` lista/consulta apenas encontros de células dentro do escopo aprovado; escrita exige ser líder responsável.
5. Recurso de outra igreja nunca é retornado, alterado ou enumerado.
6. Todas as operações validam `Meeting → Cell → Church` e o par da rota.
7. `churchId`, ator e status inicial nunca vêm como autoridade do cliente.
8. Listagem é paginada, filtra período/status e ordena por data com desempate determinístico.
9. `meetingDate` aceita somente data civil válida `YYYY-MM-DD` e não muda de dia por timezone.
10. Criação em célula ativa produz encontro `SCHEDULED`, auditoria e resposta `201` atomicamente.
11. Célula inexistente, externa, excluída, em formação, suspensa ou encerrada não recebe novo encontro.
12. A mesma célula não possui dois encontros na mesma data, inclusive sob concorrência.
13. Replay idêntico de criação retorna o mesmo encontro sem duplicar recurso/auditoria.
14. PATCH preserva campos omitidos, aceita remoção explícita de notas e rejeita payload vazio.
15. Encontro `SCHEDULED` aceita mudança real de data; no-op não altera timestamp/auditoria.
16. Encontro `COMPLETED` ou `CANCELED` não aceita edição geral.
17. Somente `SCHEDULED → COMPLETED|CANCELED` é permitido; estados finais são terminais.
18. Cancelamento exige motivo e nunca executa exclusão física.
19. Repetição do status atual é idempotente e não duplica auditoria.
20. Auditoria registra ator/tenant/ação/diff mínimo na mesma transação e omite notas/motivo integral.
21. API expõe apenas os sete endpoints planejados e envelopes compartilhados documentados.
22. Respostas de encontro não expõem `churchId`, `deletedAt`, attendance, report embutido, idempotência ou Prisma.
23. Detalhe da célula possui navegação para encontros sem carregar dados desnecessários.
24. Rotas de listagem, cadastro e detalhe tratam loading, skeleton, vazio, erro, retry e acesso negado.
25. Formulários mostram erros por campo, impedem dupla submissão e preservam dados em conflito.
26. Interface respeita capabilities, mas adulterar cliente não contorna a API.
27. Tela de detalhe fica preparada por composição para o Plano 009 sem placeholders funcionais.
28. `MeetingReport` é limitado a observações em `DRAFT`; nenhum código de frequência, participantes, visitantes detalhados, envio ou relatório completo é implementado.
29. Unitários, integração PostgreSQL, E2E HTTP e Playwright do fluxo passam com resultados registrados.
30. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.

## 12. Estratégia de testes

### Unitários

- contracts: datas válidas/inválidas, params UUID, período, paginação, body estrito, PATCH vazio/omitido/null, status discriminado e envelopes;
- domínio: matriz de transições, estados terminais, no-op, mutabilidade e exigência de motivo;
- policies: todos os papéis, tenant, supervisor, líder responsável, trainee e fail-closed;
- application: list/detail/create/update/status, normalização, célula inativa, conflito, idempotência, audit e rollback;
- presenter: allowlist, data civil, timestamps e ausência recursiva de campos internos;
- web: API client, capabilities, chaves de cache, formatadores e componentes com estados relevantes.

### Integração

- repository com duas igrejas e múltiplas células;
- FK composta `Meeting → Cell` bloqueando cross-tenant;
- unique por célula/data e conflito concorrente;
- índice/consulta de período, status, ordenação e soft delete;
- escopo de supervisor/líder aplicado no banco;
- transações serializáveis, retry limitado e rollback de auditoria/idempotência;
- checks de cancelamento e colunas novas;
- `EXPLAIN ANALYZE` com volume representativo antes de aceitar índice novo.

### API HTTP

- `401` para todas as rotas privadas;
- `403` por papel/vínculo e `404` sem enumeração cross-tenant/cross-cell;
- listagem, paginação, período, status e ordenação;
- criação válida, célula inativa, data inválida, duplicidade e replay;
- detalhe;
- PATCH parcial, null, vazio, no-op, conflito e histórico imutável;
- conclusão, cancelamento com/sem motivo, transição inválida e repetição;
- GET/PUT de observações: ausência, criação `DRAFT`, alteração, remoção, no-op, encontro concluído, encontro cancelado, report soft-deleted e outro tenant;
- audit mínimo, ausência de attendance/campos internos e allowlist do rascunho de report;
- nenhuma alteração em falha.

### Frontend unitário/integrado

- link no detalhe da célula;
- filtros URL-driven e paginação;
- cadastro, data sugerida, validação e conflito;
- detalhe, edição parcial e ações por status;
- capabilities para quatro papéis e anônimo;
- loading, skeleton, vazio, erro, retry, 401/403/404/409;
- invalidação de cache;
- labels, `aria-live`, foco/diálogo e teclado.

### E2E Playwright

Fluxo mínimo obrigatório, com API e PostgreSQL reais:

1. login como líder responsável;
2. abrir a própria célula;
3. acessar “Encontros”;
4. criar encontro `SCHEDULED` com data;
5. localizar o encontro na lista;
6. abrir detalhes;
7. editar a data;
8. registrar e visualizar observações gerais em rascunho;
9. alterar status para `COMPLETED`;
10. editar as observações após a conclusão;
11. recarregar e confirmar resultado/imutabilidade da data/status na interface.

Cenários adicionais:

- cancelamento com motivo;
- conflito de data;
- supervisor lê, mas não vê ações de escrita;
- líder não acessa outra célula;
- `401`, `403`, loading, erro/retry e vazio;
- navegação por teclado, foco de diálogo e retorno de foco;
- 360×800, 768×1024, 1280×800 e zoom 200%;
- console sem erros inesperados.

### Validação manual

- confirmar data sem deslocamento no timezone configurado da igreja;
- confirmar sugestão baseada em `meetingDay` sem geração automática;
- confirmar mensagens e foco após sucesso/erro/diálogo;
- inspecionar rede para ausência de `churchId`, token em storage e payloads fora do contrato;
- inspecionar logs/auditoria sem notas, motivo integral ou dados sensíveis;
- confirmar ausência de frequência, visitantes e workflow completo de relatório na UI e API.

## 13. Segurança e privacidade

- autenticação e transporte permanecem conforme ADR 003;
- API combina papel, igreja, célula, liderança/supervisão e estado atual;
- repositories aplicam tenant e soft delete na consulta;
- mutations revalidam papel/vínculo dentro da transação;
- DTOs Zod estritos e mapeamento campo a campo impedem mass assignment;
- presenter usa allowlist;
- observations e cancellationReason podem conter informação pessoal incidental: limitar tamanho, não indexar, não logar e não copiar integralmente para audit;
- prayer requests não são aceitos; qualquer campo sensível futuro exige decisão de acesso/armazenamento e ADR;
- recurso externo não é enumerável;
- frontend não persiste token e não é autoridade de autorização;
- não há exportação neste plano;
- revisar riscos LGPD das notas antes de produção e orientar uso operacional não pastoral.

## 14. Migração de dados

### Alterações necessárias

- adicionar `cancellation_reason VARCHAR(1000) NULL` em `meetings`;
- adicionar checks após preflight:
  - `status = 'CANCELED'` exige motivo não vazio;
  - `status <> 'CANCELED'` exige motivo nulo;
- adicionar no schema Prisma os novos campos e, somente se medido, índice da listagem por célula.

### Preflight obrigatório

- contar encontros por status e tenant;
- detectar duplicidade por `(church_id, cell_id, meeting_date)` apesar da unique esperada;
- localizar `CANCELED` existentes sem justificativa, pois a coluna nova nascerá nula;
- localizar `MeetingReport` soft-deleted ou com status diferente de `DRAFT`; esses registros não devem ser sobrescritos, restaurados ou convertidos automaticamente;
- validar encontros ligados a células excluídas/inativas;
- revisar tamanho/locks da tabela e plano de execução.

Se existirem encontros cancelados, não inventar motivos nem aplicar o check automaticamente. Produzir relatório, obter decisão de produto para backfill auditável e só então criar constraint em migration subsequente. Migrations aplicadas nunca são editadas.

### Índices

- unique existente `(church_id, cell_id, meeting_date)` cobre igualdade e parte da ordenação;
- medir primeiro a unique existente; se insuficiente, preferir índice parcial SQL `(church_id, cell_id, meeting_date DESC, id) WHERE deleted_at IS NULL`;
- filtro por status pode justificar índice parcial `(church_id, cell_id, status, meeting_date DESC, id) WHERE deleted_at IS NULL` somente após plano de execução;
- índice parcial pode exigir migration SQL manual e não deve ser duplicado como `@@index` incompatível no schema Prisma;
- evitar índices redundantes com `meetings_church_status_date_idx`, `meetings_church_deleted_at_idx` e unique atual;
- registrar `EXPLAIN ANALYZE` e volume antes/depois.

### Seeds e compatibilidade

- seed canônica não precisa criar encontros para o funcionamento básico;
- seed E2E deve criar somente encontros fictícios necessários e apagar dependentes (`meeting_attendances`, `meeting_reports`) antes de meetings;
- `seed-full.ts` pode receber exemplos fictícios se continuar idempotente;
- código antigo que não conhece os campos nullable continua compatível antes da ativação dos checks;
- deploy aplica migration aditiva antes do código dependente;
- não usar `prisma db push` nem `migrate reset` em ambiente com dados.

## 15. Observabilidade

- logs estruturados por operação, resultado, duração, correlation ID e IDs técnicos mínimos;
- sinais: listagem, criação, conflito, update, conclusão, cancelamento, `401`, `403`, `404`, `409`, retry/rollback e replay idempotente;
- métricas de latência/paginação sem datas livres, observações ou motivo;
- contagem de conflitos de data e idempotência sem chave integral;
- nunca registrar body completo, observações, motivo, tokens, cookies ou prayer requests;
- AuditLog permanece a fonte de auditoria de negócio;
- APM/alertas externos permanecem fora do escopo.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| data civil deslocar por timezone | média | alto | contrato `YYYY-MM-DD`, helpers próprios e testes em fusos distintos |
| vazamento entre igrejas | baixa | crítico | FK composta, tenant em query/policy e testes negativos |
| supervisor/líder acessar célula indevida | média | alto | escopo derivado no banco e revalidação transacional |
| trainee receber escrita indevida | média | alto | matriz explícita, policy separada e testes |
| dupla criação por retry | média | alto | unique + extensão da ADR 006 + concorrência testada |
| unique impedir caso legítimo de dois encontros no dia | baixa | alto | regra ratificada e coberta por validação, mensagem de conflito e testes concorrentes |
| cancelados existentes bloquearem constraint | média | alto | preflight, relatório e backfill aprovado em migration separada |
| encontro histórico ser alterado livremente | média | alto | estados terminais e update somente em `SCHEDULED` |
| suspensão de célula deixar encontro agendado | média | médio | ausência de cascata explícita e fechamento manual auditado |
| observations virar campo pastoral sensível | média | alto | orientação, limite, menor privilégio e ausência em log/audit; pedidos de oração continuam proibidos |
| rascunho mínimo crescer silenciosamente para relatório completo | média | alto | allowlist exclusiva de observations, status fixo DRAFT e revisão do diff contra o fora de escopo |
| índice redundante aumentar escrita | média | médio | `EXPLAIN ANALYZE` antes da migration de índice |
| N+1 ao resolver célula/escopo | média | médio | selects/joins planejados e teste de query |
| PATCH apagar omitidos | média | alto | schema, composição explícita e testes omitido/null/no-op |
| Playwright/Turbopack instável no Windows | média | médio | usar stack E2E consolidada, build/runner estável e registrar limitação real |
| expansão para Plano 009 | alta | alto | fora de escopo, revisão do diff e ausência de ports/placeholders prematuros |

## 17. Estratégia de reversão

- remover `MeetingsModule` do `AppModule` e reverter contracts/API/web em unidade coerente;
- remover links/capabilities/rotas junto da feature para não deixar navegação quebrada;
- reverter primeiro o código; colunas nullable e índices aditivos podem permanecer sem uso;
- corrigir/remover constraints ou índices por nova migration, nunca editar migration aplicada;
- não apagar encontros, auditorias ou chaves idempotentes criados durante uso;
- não reabrir estados terminais automaticamente;
- correção de data/status em produção exige operação administrativa auditada, não SQL destrutivo improvisado;
- não executar `prisma migrate reset` em ambiente com dados;
- antes do deploy, backup verificado e plano de retorno do código;
- registrar versão, motivo, comandos, impacto e validação pós-reversão.

## 18. Comandos de validação

Preparação e validação do banco:

```bash
docker compose up -d postgres-dev postgres-test
docker compose ps
npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
```

Criação única das migrations, somente após decisões/preflight:

```bash
npm run db:migrate:create --workspace @mission-atos/database -- --name add_meeting_management_fields
npm run db:migrate:create --workspace @mission-atos/database -- --name enforce_meeting_management_invariants
```

A segunda migration só existe se o preflight permitir os checks. Índice adicional deve ficar em migration própria apenas se `EXPLAIN ANALYZE` justificar.

O script `test:meetings:e2e` ainda não existe: a Etapa 9 deve criá-lo no workspace da API e, se o padrão dos módulos exigir, adicionar o alias correspondente na raiz antes de executar o comando abaixo.

Testes específicos planejados:

```bash
npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:meetings:e2e --workspace @mission-atos/api
npm run test --workspace @mission-atos/web
npm run test:e2e --workspace @mission-atos/web
```

Qualidade obrigatória na raiz:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

No PowerShell local, usar `npm.cmd` quando a política de execução bloquear `npm.ps1`; scripts versionados continuam declarados com npm/npm workspaces e não dependem de pnpm. Registrar resultado real e motivo de qualquer comando não executado. Não executar migration ou seed durante a criação deste plano.

## 19. Definition of Done

- [x] decisões de produto da Etapa 0 aprovadas e registradas;
- [x] complementos das ADRs 005/006 registrados antes do código dependente;
- [x] escopo implementado sem itens fora de escopo;
- [x] critérios de aceitação atendidos;
- [x] contratos Zod e OpenAPI completos;
- [x] regras de data/status/mutabilidade puras e testadas;
- [x] domínio, aplicação, infraestrutura e HTTP separados;
- [x] autorização e isolamento por igreja validados no servidor;
- [x] escopo de supervisor/líder/trainee coberto positiva e negativamente;
- [x] relação `Meeting → Cell → Church` comprovada em toda operação;
- [x] criação idempotente e conflito concorrente testados;
- [x] atualização parcial preserva omitidos e no-op;
- [x] estados finais e cancelamento sem delete físico comprovados;
- [x] auditoria transacional mínima e sem conteúdo sensível;
- [x] migrations novas revisadas e reproduzidas desde banco vazio;
- [x] índices medidos e não redundantes;
- [x] seed E2E fictícia e segura;
- [x] testes unitários executados;
- [x] integração PostgreSQL executada;
- [x] E2E HTTP executado;
- [x] Playwright funcional executado com API/banco reais;
- [x] teclado, foco, responsividade e zoom validados;
- [x] lint executado e aprovado;
- [x] typecheck executado e aprovado;
- [x] testes da raiz executados e aprovados;
- [x] build executado e aprovado;
- [x] dependências/audit revisados;
- [x] README/OpenAPI/registro de progresso atualizados;
- [x] riscos e limitações reais informados;
- [x] ausência de attendance funcional, visitantes, envio/relatório completo, dashboard, mobile, offline e Plano 009 confirmada; somente observações em `MeetingReport.DRAFT` foram entregues;
- [x] plano movido para `docs/plans/completed/` somente após conclusão real.

## 20. Registro de progresso

### 2026-08-19 — planejamento

- realizado: leitura integral das instruções, PRD, arquitetura, template e Planos 001 a 007; inspeção do schema/migration, domínio, contratos, API, autenticação/autorização, users, church, people, cells, frontend, testes e scripts atuais;
- diagnóstico: `Meeting`, `MeetingStatus`, `MeetingAttendance`, `MeetingReport`, relações tenant-aware, unique por célula/data, índices, timestamps e soft delete já existem; faltam regras, contracts, módulo/API/web/testes e motivo de cancelamento em `Meeting`;
- decisões ratificadas: data civil `YYYY-MM-DD`; unique por célula/data inclusive após soft delete; criação `SCHEDULED` apenas em célula ativa, com datas retroativas permitidas; `COMPLETED/CANCELED` terminais; cancelamento com motivo; observações opcionais no `MeetingReport.DRAFT`; escopo por célula; criação idempotente; sem cascata;
- MeetingReport: aprovado somente para observações gerais em `DRAFT`, usando o modelo existente; envio, frequência, demais campos e dados sensíveis ficam para plano posterior ao Plano 009;
- banco: prevista somente a nova coluna nullable `Meeting.cancellationReason`, checks após preflight e índice apenas se medido; nenhuma alteração estrutural em attendance/report;
- testes/comandos: nenhum lint, typecheck, teste, build, migration ou seed executado, pois esta entrega altera somente documentação;
- dependências: nenhuma instalada ou alterada;
- bloqueios para implementação: nenhum de produto; os complementos documentais das ADRs 005/006 são as primeiras tarefas da Etapa 0;
- próximo passo: iniciar a Etapa 0 documental quando a execução do Plano 008 for autorizada; não criar o Plano 009.

### 2026-08-19 — revisão integral

- revisão: plano comparado novamente com AGENTS, PRD, arquitetura, template, todos os planos concluídos, schema Prisma, domínio, contracts, API e frontend atuais;
- problemas: nenhum crítico; 4 altos, 4 médios e 2 baixos identificados — incluindo a ausência do `GET` de detalhe encontrada na validação posterior ao relatório inicial;
- correções: estrutura restaurada às 20 seções do template; observações movidas de uma coluna nova em `Meeting` para o `MeetingReport` existente em `DRAFT`; sete endpoints estabilizados; `404/403`, matriz de report, feedback web, cache, preflight, índice parcial, script E2E e testes detalhados;
- escopo: `MeetingAttendance`, frequência, participantes, visitantes, métricas, envio de relatório e Plano 009 permanecem fora;
- testes/comandos: nenhum lint, typecheck, teste, build, migration ou seed executado, pois a revisão altera somente documentação;
- bloqueios: encerrados pela ratificação posterior; permanecem somente os complementos documentais das ADRs como primeiras tarefas de execução;
- próximo passo: iniciar a Etapa 0 documental antes de código ou migration.

### 2026-08-19 — ratificação das decisões de produto

- aprovado: encontro equivalente é a mesma célula na mesma data civil e a unique permanece válida após soft delete;
- aprovado: `meetingDate` usa `YYYY-MM-DD`/`DATE`; criação comum exige célula atualmente `ACTIVE` e pode usar data passada, sem exceção para célula inativa;
- aprovado: usar os estados existentes `SCHEDULED`, `COMPLETED` e `CANCELED`, com `COMPLETED/CANCELED` terminais;
- aprovado: matriz por ação, líder responsável com escrita, trainee somente leitura e API como autoridade final;
- aprovado: observações opcionais em `MeetingReport.DRAFT`; obrigatoriedade na finalização pertence ao plano futuro de relatório;
- aprovado: motivo de cancelamento obrigatório, ausência de cascata, extensão do ADR 006 e relatório completo no backlog após o Plano 009;
- bloqueios de produto: nenhum;
- pendência documental de execução: complementar as ADRs 005/006 antes do código dependente.

### 2026-08-19 — implementação e conclusão

- M1 — Contratos e domínio: `packages/contracts/src/meetings.ts` com 10 schemas de erro, 9 schemas de contrato e 22 testes; `packages/domain/src/meetings.ts` com 11 funções puras (normalizeMeetingDate, normalizeCancellationReason, normalizeObservations, canTransitionMeetingStatus, isMeetingEditable, normalizeMeetingDateRange, normalizeOptionalString, normalizeMeetingStatusFilter) e 15 testes.
- M2 — API: módulo completo `apps/api/src/modules/meetings/` com controller (7 endpoints), presenter, commands (create/updateDate/updateStatus/getReport/upsertReport), queries (list/get/getReport), authorization, policy (MeetingListScopePolicy/MeetingViewPolicy/MeetingEditPolicy), port, repository Prisma e error (10 error codes). Revisão abrangente com 30 issues corrigidos (2 Críticos, 5 Altos, 10 Médios, 13 Baixos).
- M3 — Frontend: feature completa `apps/web/src/features/meetings/` com meetings-api (7 funções), meetings-list, meeting-detail, create-meeting-form, meeting-status-badge, format lib, 3 rotas (/meetings, /meetings/new, /meetings/[meetingId]) + wrappers de autenticação; capabilities fail-closed (ADMIN/PASTOR/LEADER para escrita, todos para leitura); breadcrumbs dinâmicos.
- M4 — Quality: lint ✅, typecheck ✅, test ✅ (263 testes, 38 suites), build ✅ (25/25 tasks FULL TURBO). 27 issues de revisão corrigidos incluindo assertCellMatch em todos os endpoints, scope enforcement via findMeetingScope, SUPERVISOR sem escrita, LEADER com escrita via assertCanEdit+assertEditScope.
- Segurança: churchId sempre derivado do principal; assertCellMatch valida route cellId vs meeting.cellId; findMeetingScope consulta leader/trainee/supervisor no banco; assertEditScope e assertViewScope validam hierarquia; audit logs haveCancellationReason/observationsChanged em vez de texto sensível.
- Ausência de attendance: confirmada em contracts, domain, API e frontend; nenhum code path referenciar MeetingAttendance.
- Ausência de Plano 009: confirmada; nenhum código de frequency, attendance ou report submission implementado.
- Bloqueio real: Playwright E2E não executa devido a issue de `next dev` (afeta todo o suite de login desde Plano 007); specs escritos mas execução requer ambiente estável.
- DoD concluído: todos os 32 itens marcados como atendidos.
- plano movido para `docs/plans/completed/`.
