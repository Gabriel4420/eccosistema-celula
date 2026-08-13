# Plano 007 — Gestão de células

**Status:** Aprovado  
**Responsável:** Missão Atos — time de engenharia  
**Criado em:** 2026-08-08  
**Atualizado em:** 2026-08-09  
**PRD relacionado:** `PRD.md` RF-004, RF-005, RF-018, RN-001, RN-002, RN-007 e US-002; PDF RF-004, RN-001, RN-005, RN-006, RN-014, RN-016, US-006, US-008 e matriz básica de permissões  
**ADRs relacionadas:** `docs/decisions/003-token-transport.md`; `docs/decisions/004-direct-cell-leadership.md`; `docs/decisions/005-idempotent-status-transitions.md`; `docs/decisions/006-idempotency-key.md`  
**Branch ou issue:** a definir

---

## 1. Objetivo

Implementar a gestão de células de ponta a ponta, preservando o monólito modular e a fundação do Plano 006.1, para que usuários autorizados possam listar, pesquisar, filtrar, cadastrar, consultar, editar, ativar, suspender e administrar a liderança de células pela aplicação web.

Ao final da execução futura deste plano, o fluxo deverá estar completo em banco/domínio, aplicação, API, contratos, frontend e testes. Toda operação deverá derivar `churchId` do principal autenticado, impedir acesso entre igrejas, aplicar papel e escopo no servidor, preservar histórico, usar exclusão lógica e produzir auditoria de negócio nas alterações relevantes.

Este documento é somente planejamento. Sua criação não autoriza implementação, instalação de dependências, execução de migrations ou criação de dados.

## 2. Contexto

Os Planos 001 a 006.1 entregaram monorepo npm/Turborepo, PostgreSQL/Prisma, autenticação, autorização, usuários, igreja, pessoas e uma aplicação Next.js navegável. A API atual possui os módulos `identity`, `permissions`, `users`, `churches` e `people`; não possui módulo `cells`. A web consome somente endpoints reais e já fornece sessão em memória, cliente HTTP tipado, cache leve, formulários, tabela responsiva, paginação, diálogos, feedback, skeletons e guards visuais.

Fontes analisadas para este planejamento:

- `AGENTS.md`, `apps/api/AGENTS.md` e `apps/web/AGENTS.md`;
- `docs/product/PRD.md` e o PDF existente `docs/product/PRD_Ecossistema_Gestao_Celulas.pdf`, correspondente ao PRD em PDF citado na solicitação;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/TEMPLATE.md` e todos os planos em `docs/plans/completed/`;
- `apps/web`, `apps/api`, `packages/contracts`, `packages/domain`, `packages/database`, migrations, autenticação, usuários, igreja, pessoas e testes atuais.

O schema já contém `Cell`, porém ele representa um recorte menor que o modelo conceitual. A diferença mais importante é a liderança: o código atual usa `Cell.leaderId` e `Cell.traineeLeaderId` apontando para `User`; PRD e arquitetura descrevem `CellLeadership` apontando para `Person`. Não há `UserChurch`, vínculo `User`–`Person`, `CellLeadership`, `StructureNode`, `CellProfile` ou módulo de estruturas. Criar simultaneamente as duas representações geraria duas fontes de verdade e está proibido.

## 3. Escopo

- criar o módulo NestJS `cells`, separado em apresentação, aplicação, domínio e infraestrutura;
- listar células com paginação, busca, filtros e ordenação determinística;
- consultar uma célula por UUID e retornar dados básicos relacionados;
- cadastrar e atualizar parcialmente uma célula;
- ativar e suspender uma célula sem exclusão física;
- atribuir ou alterar líder;
- atribuir, alterar ou remover líder em treinamento dentro do modelo de liderança aprovado;
- aplicar isolamento por igreja em todas as consultas, joins e mutações;
- aplicar autorização por papel, tenant, relação com a célula e escopo de supervisão disponível;
- criar contratos Zod compartilhados, DTOs finos, presenters e erros públicos estáveis;
- documentar endpoints, envelopes, filtros, erros e permissões no OpenAPI;
- gerar auditoria transacional para criação e alterações relevantes;
- criar somente migrations novas e aditivas necessárias às invariantes, pesquisa e estratégia aprovada de idempotência;
- integrar a feature à web existente, sem criar arquitetura paralela;
- criar rotas `/cells`, `/cells/new` e `/cells/[id]`; edição ficará na tela de detalhe, seguindo o padrão de pessoas/usuários;
- implementar listagem, cadastro, detalhes, edição e ações de status/liderança com estados acessíveis e responsivos;
- usar busca remota e paginada para seletores de liderança;
- criar testes unitários, de integração PostgreSQL, HTTP e Playwright;
- atualizar documentação operacional e o registro de progresso durante a execução.

## 4. Fora de escopo

- `CellMembership`, membros da célula e transferência de participantes;
- encontros, frequência, visitantes em encontros e relatório semanal;
- multiplicação, encerramento completo com motivo/destino, histórico estrutural ou notificações;
- mapa, latitude, longitude e geolocalização;
- dashboard analítico, indicadores, gráficos, relatórios e exportações;
- aplicativo mobile, offline e sincronização;
- implementação completa de `StructureLevel`, `StructureNode`, `CellProfile`, `Address` ou organizações;
- capacidade, data de início e previsão de multiplicação, enquanto seus fluxos e modelos relacionados não estiverem aprovados;
- funções `ASSISTANT_LEADER`, `SECRETARY` e `HOST`;
- CRUD de papéis, criação do papel `AUXILIAR` ou alteração da matriz global de usuários;
- exclusão física, endpoint `DELETE` ou liberação do código após soft delete;
- recuperação de senha, mudança do transporte de tokens ou nova biblioteca visual;
- Plano 008.

O recorte sem `StructureNode` é uma divergência consciente em relação ao PRD em PDF e ao modelo conceitual da arquitetura; o `PRD.md` vigente exige supervisor, mas não `StructureNode`, em US-002. A execução só poderá adiar estrutura após aceite explícito do responsável de produto. Sem esse aceite, Gestão de Células depende primeiro de uma entrega de estruturas e este plano permanece bloqueado; não será criado um `structureNodeId` fictício ou sem integridade apenas para satisfazer o contrato.

## 5. Suposições

- o MVP continua operando inicialmente com uma igreja, mas nenhuma query poderá omitir `churchId`;
- os papéis implementados permanecem `ADMIN`, `PASTOR`, `SUPERVISOR` e `LEADER`; `AUXILIAR` do PRD não será criado neste plano;
- `CellStatus` permanece `FORMING`, `ACTIVE`, `SUSPENDED` e `CLOSED`;
- a ação de “desativar” da interface corresponde a `SUSPENDED`; `CLOSED` exige futuro fluxo de encerramento e `deletedAt` permanece reservado à exclusão lógica administrativa sem endpoint neste plano;
- célula `ACTIVE` exige líder; `FORMING` e `SUSPENDED` podem permanecer temporariamente sem líder; `CLOSED` não é criado nem selecionado pela UI desta entrega;
- o código é informado pelo usuário, normalizado e reservado por igreja mesmo após inativação ou exclusão lógica;
- `meetingDay` usa `DayOfWeek`; no transporte, o nome público será `meetingDay`, alinhado ao código atual, com documentação de equivalência ao `weekday` conceitual;
- `meetingTime` é transportado como `HH:mm` e persistido como PostgreSQL `TIME(0)`, sem conversão UTC, pois representa horário local recorrente da igreja;
- o endereço continua sendo texto simples em `Cell.address`; a entidade `Address` conceitual não será antecipada;
- o frontend reutilizará componentes próprios, APIs nativas de formulário, Zod, cache leve e cliente HTTP do Plano 006.1;
- nenhuma dependência npm nova é necessária;
- testes conectados usam `TEST_DATABASE_URL` dedicada, diferente de `DATABASE_URL`, e todas as migrations desde banco vazio.

## 6. Perguntas e decisões pendentes

### 6.1 Fonte canônica de liderança — decisão do Plano 007 e ADR de ratificação

- [x] decisão deste plano: manter `leaderId` e `traineeLeaderId` apontando para `User`, porque esse é o modelo persistido, possui FKs compostas por igreja e se integra aos papéis, autenticação e `SupervisorAssignment` atuais;
- [x] criar e aprovar, no primeiro milestone e antes de código dependente, ADR que ratifique essa divergência incremental em relação ao modelo conceitual; a ADR documenta a dívida, mas não reabre a implementação deste plano para duas alternativas — **ratificada por `docs/decisions/004-direct-cell-leadership.md`**;
- [x] não criar `CellLeadership`, vínculo `User`–`Person`, dual-write, fallback ou migração de liderança no Plano 007;
- [x] uma convergência futura para `Person` + `CellLeadership` exigirá plano próprio, vínculo explícito `User`–`Person`, backfill verificável e remoção das colunas diretas na mesma transição de fonte de verdade.

### 6.2 Código e estados

- [x] aprovar a estratégia proposta de código manual canônico: trim, uppercase, remoção de diacríticos, separador `-`, 1–50 caracteres e regex `^[A-Z0-9]+(?:-[A-Z0-9]+)*$`;
- [x] confirmar que “desativar” significa `SUSPENDED`, que “ativar” significa `ACTIVE` e que `CLOSED` fica indisponível até o fluxo de encerramento;
- [x] confirmar se criação deve iniciar em `FORMING` por padrão ou aceitar `ACTIVE` apenas quando líder e demais obrigatórios estiverem válidos; **decisão: `FORMING` por padrão e `ACTIVE` explícito (exige líder e supervisor elegíveis)**.

### 6.3 Elegibilidade e escopo

- [x] líder responsável é `User` `ACTIVE`, não excluído, da mesma igreja e com vínculo ativo ao papel `LEADER`;
- [x] confirmar a elegibilidade funcional do trainee: **decisão — `User` `ACTIVE`, não excluído e da mesma igreja, sem exigir papel inexistente `TRAINEE_LEADER`; possuir `LEADER` é permitido, mas não obrigatório para a função de treinamento**;
- [x] não criar papel de autorização `TRAINEE_LEADER`; função na célula e papel de acesso são conceitos distintos;
- [x] confirmar que a mesma pessoa/usuário pode liderar mais de uma célula; **decisão — permitir, pois não existe regra contrária nem constraint atual**;
- [x] confirmar que supervisor enxerga células cujo `leaderId` esteja em `SupervisorAssignment` ativo sob seu `userId`; células sem líder ficam visíveis somente a `ADMIN` e `PASTOR`; **decisão aprovada**;
- [x] confirmar que líder enxerga células em que é líder ou líder em treinamento e só pode editar reunião/endereço da própria célula; **decisão aprovada**;
- [x] confirmar se `PASTOR` pode alterar status e liderança; **decisão — sim, alinhada à matriz do PRD: pode criar/editar/status/liderança em toda a igreja, com revalidação de papel atual**.

Supervisão proposta para fechar US-002 sem duplicar fonte de verdade:

- `SupervisorAssignment` permanece a única fonte de supervisão; não adicionar `Cell.supervisorId`;
- criação e troca de líder recebem `supervisorId` e validam/criam o vínculo ativo supervisor–líder na mesma transação da célula;
- supervisor deve ser `User` `ACTIVE`, não excluído, da mesma igreja e possuir papel ativo `SUPERVISOR`;
- cada líder poderá possuir no máximo um `SupervisorAssignment` ativo por igreja; adicionar índice único parcial após preflight;
- vínculo ativo conflitante com outro supervisor retorna `409 CELL_SUPERVISOR_CONFLICT`, sem reatribuição silenciosa;
- trocar líder não exclui automaticamente o vínculo anterior, pois ele pode servir a outra célula; limpeza/transferência global exige caso de uso próprio;
- listagem e detalhe retornam o supervisor derivado do vínculo ativo do líder; célula sem líder em `FORMING`/`SUSPENDED` pode ter supervisor nulo, mas criação `ACTIVE` exige líder e supervisor.

### 6.4 Recorte estrutural do PRD — gate de produto

- [x] obter aceite explícito de que o Plano 007 implementará o modelo `Cell` existente sem `structureNodeId`, `profileId`, capacidade e datas de multiplicação; **aceite registrado junto à aprovação deste plano em 2026-08-09**;
- [ ] se o aceite for recusado, interromper a execução e planejar/entregar `structures` antes de retomar células; não ampliar silenciosamente este plano com um módulo estrutural parcial;
- [x] o plano não alegará conformidade integral com o cadastro conceitual do PDF (RF-004/US-006) enquanto esse aceite não estiver registrado; a supervisão de `PRD.md` US-002 permanece obrigatória neste plano.

### 6.5 Idempotência — decisão bloqueante e ADR obrigatória

- [x] aprovar ADR para a estratégia transversal de `Idempotency-Key` antes de criar persistência genérica; **ratificada por `docs/decisions/006-idempotency-key.md`**;
- [x] recomendação aprovada: `POST /cells` aceita cabeçalho UUID obrigatório, persiste chave, ator, igreja, operação, hash canônico do request e resultado/recurso em uma tabela genérica; repetição idêntica devolve a resposta original e reutilização com payload diferente retorna conflito;
- [x] mutações `PATCH` usam semântica de estado desejado, são idempotentes por natureza e não geram atualização/auditoria em no-op; podem aceitar a chave opcionalmente após existir a infraestrutura compartilhada;
- [x] definir retenção e limpeza das chaves antes de produção; TTL definido na ADR 006 (`expires_at` + purge periódico, sem remover célula/auditoria); não armazenar token, PII ou payload integral.

Comportamento mínimo a ser ratificado na ADR:

- chave única por `churchId + actorId + operation + key`;
- reserva da chave, criação da célula e auditoria na mesma transação;
- duas requisições concorrentes com a mesma chave e mesmo hash produzem uma única célula;
- replay concluído devolve o mesmo status `201`, mesmo envelope e mesmo identificador da resposta original;
- mesma chave com hash diferente retorna `409 IDEMPOTENCY_KEY_CONFLICT`;
- estado intermediário não pode devolver sucesso parcial: a segunda requisição aguarda o resultado confirmado ou recebe erro transitório estável definido na ADR;
- falha transacional não deixa chave concluída sem recurso nem auditoria;
- retenção e limpeza nunca removem a célula ou o `AuditLog` associado.

As ADRs de 6.1 e 6.5 registram decisões arquiteturais conforme `ARCHITECTURE.md`; somente idempotência permanece uma escolha técnica aberta. As demais pendências são gates de produto/domínio e devem ser fechadas antes da implementação dependente.

## 7. Áreas afetadas

### Aplicação web

- novas rotas e feature `apps/web/src/features/cells/`;
- novas capabilities visuais de leitura, criação, edição, status e liderança;
- novo item “Células” na sidebar e atalho autorizado no dashboard simples;
- reutilização de shell, sessão, cliente HTTP, `useRemoteQuery`, cache, tabela, paginação, campos, diálogo, alertas e estados existentes;
- nenhuma importação de Prisma e nenhuma regra crítica exclusiva em React.

Capabilities previstas, todas fail-closed: `viewCells`, `createCells`, `editCellGeneralData`, `editCellSchedule`, `changeCellStatus` e `changeCellLeadership`. Elas refletem a matriz da seção 8.5 e não concedem autoridade à API.

### API

- novo `apps/api/src/modules/cells/` e registro em `AppModule`;
- controller fino, queries/commands, authorization, policies, ports, tipos, erros, presenter e adapter Prisma;
- extensão mínima do módulo `users` para seleção remota de líderes somente se `GET /users` não puder ser reutilizado com segurança para `PASTOR`;
- nenhuma criação de microsserviço, CRUD genérico ou acesso Prisma em controller/caso de uso.

Estrutura proposta:

```text
apps/api/src/modules/cells/
├── application/
│   ├── cell-management.authorization.ts
│   ├── cell-management.commands.ts
│   ├── cell-management.error.ts
│   ├── cell-management.port.ts
│   ├── cell-management.queries.ts
│   └── cell-management.types.ts
├── domain/
│   ├── cell-management.policy.ts
│   └── cell-normalization.ts
├── infrastructure/
│   ├── prisma-cell-management.repository.ts
│   └── prisma-cell-management.integration-spec.ts
├── presentation/
│   ├── cell.controller.ts
│   └── cell.presenter.ts
└── cells.module.ts
```

### Banco de dados

- reutilizar `Cell`, `User`, `Role`, `UserRole`, `SupervisorAssignment`, `Church` e `AuditLog`;
- adicionar somente constraints/índices ausentes e a persistência de idempotência aprovada;
- manter as FKs diretas para `User`; não criar `CellLeadership`, `UserChurch` ou vínculo `User`–`Person` neste plano;
- não alterar seed com células ou pessoas reais.

### Contratos compartilhados

- criar `packages/contracts/src/cells.ts` e exportar por `index.ts`;
- incluir schemas estritos de params, query, criação, patch, status, líder, líder em treinamento, item, página e erro;
- reutilizar `cellStatuses`/`daysOfWeek` do domínio apenas quando isso não criar dependência invertida; o pacote de contratos mantém valores explícitos compatíveis e testes de paridade;
- não expor `churchId`, `deletedAt`, objetos Prisma ou metadados internos de idempotência.

### Infraestrutura

- nenhuma dependência ou serviço externo novo;
- migration nova, PostgreSQL de teste e scripts npm do workspace;
- eventual tabela genérica de idempotência somente após ADR.

### Documentação

- OpenAPI e README com rotas, permissões, filtros, estados, normalização, idempotência e erros;
- ADRs aprovadas e registro deste plano atualizado com resultados reais.

## 8. Modelo e regras de negócio

### 8.1 Análise do modelo existente

| Aspecto | Implementação atual | PRD/arquitetura | Direção mínima do Plano 007 |
| --- | --- | --- | --- |
| tenant | `Cell.churchId` + FK | igreja/organização | manter e exigir em todas as queries |
| código | `varchar(50)`, unique `(churchId, code)` | código único por igreja | manter unique; adicionar normalização/check aprovado |
| nome | `varchar(160)` | nome/descrição | manter nome; descrição fora deste corte |
| status | `FORMING/ACTIVE/SUSPENDED/CLOSED` | status operacional | manter enum; expor somente transições aprovadas |
| liderança | duas FKs compostas para `User` | `CellLeadership.personId` | manter `User` como única fonte no Plano 007 e ratificar por ADR |
| supervisor | derivado por `SupervisorAssignment` entre usuários | supervisor obrigatório em `PRD.md` e estrutura no PDF | manter assignment como fonte única, torná-lo não ambíguo e não duplicar coluna em `Cell` |
| reunião | `meetingDay` + `TIME(0)` | `weekday` + `start_time` | manter nomes públicos atuais e documentar equivalência |
| endereço | texto obrigatório de até 500 | `address_id` + geografia | manter texto; geografia fora de escopo |
| estrutura/perfil | inexistentes | `structure_node_id`, `profile_id` | não adicionar sem módulos correspondentes |
| capacidade/datas | inexistentes | capacidade/início/meta | adiar conforme fora de escopo |
| soft delete | `deletedAt` | obrigatório | filtrar sempre; sem delete físico |
| pesquisa | sem GIN de célula | busca por nome/código | migration de índices somente após medir consulta |

### 8.2 Campos públicos do corte

- `id`: UUID gerado, somente saída;
- `code`: obrigatório, canônico, 1–50;
- `name`: obrigatório, trim e espaços colapsados, 1–160;
- `status`: `FORMING | ACTIVE | SUSPENDED | CLOSED` na leitura; escrita limitada por operação;
- `leaderId`: UUID nullable conforme estado;
- `traineeLeaderId`: UUID nullable;
- `supervisorId`: UUID de entrada/saída derivada quando houver líder; não é coluna de `Cell`;
- `meetingDay`: `DayOfWeek` obrigatório;
- `meetingTime`: string `HH:mm` obrigatória;
- `address`: texto normalizado obrigatório, 1–500;
- `createdAt` e `updatedAt`: ISO 8601 UTC somente na saída;
- `churchId` e `deletedAt`: internos.

### 8.3 Invariantes

1. Toda célula pertence a exatamente uma igreja.
2. `churchId` vem exclusivamente de `AuthenticatedPrincipal`.
3. Nenhum body, query ou param aceita `churchId` como autoridade.
4. Toda busca por ID combina `id`, `churchId` e `deletedAt: null`.
5. Recurso de outra igreja é indistinguível de ausente (`404 CELL_NOT_FOUND`).
6. Código é normalizado antes da verificação e persistência e é único por igreja, inclusive após soft delete.
7. Nome e endereço são normalizados; string vazia é inválida.
8. Líder e treinando existem, estão ativos, não excluídos, pertencem à mesma igreja e cumprem a elegibilidade aprovada.
9. Líder e treinando não podem ser o mesmo registro; o check atual permanece.
10. Célula `ACTIVE` exige líder.
11. `meetingDay` aceita somente o enum atual e `meetingTime` somente `HH:mm`, persistido como `TIME(0)`.
12. PATCH preserva campos omitidos; `null` só remove liderança quando a regra de estado permitir.
13. Payload vazio ou alteração sem efeito não muda `updatedAt` nem cria auditoria.
14. Desativação usa `SUSPENDED`; não define `deletedAt` e não apaga histórico.
15. `CLOSED` não é reaberto nem selecionado sem futuro caso de uso de encerramento.
16. Não existe método de exclusão física no port, repository, controller ou web.
17. A API resolve papel, tenant, escopo e vínculo; capabilities do frontend são apenas UX.
18. Mutação e `AuditLog` pertencem à mesma transação.
19. O banco deve espelhar a invariante de célula ativa com check equivalente a `status <> 'ACTIVE' OR leader_id IS NOT NULL`.
20. A função de trainee não cria automaticamente papel de autorização; sua elegibilidade segue a decisão específica da seção 6.3.
21. Um líder possui no máximo um supervisor ativo por igreja; supervisão da célula é derivada desse vínculo.
22. Célula criada como `ACTIVE` exige líder e supervisor elegíveis; `FORMING`/`SUSPENDED` podem permanecer sem ambos.

### 8.4 Paginação, busca, filtros e ordenação

- `page`: inteiro >= 1, padrão 1;
- `pageSize`: 1–100, padrão 20;
- `search`: trim, até 160, busca case-insensitive por nome ou código;
- `status`: um valor de `CellStatus`; todos os quatro estados não excluídos são visíveis dentro do escopo do ator, embora a UI desta entrega só altere `ACTIVE` e `SUSPENDED`;
- `leaderId`: UUID de usuário elegível da mesma igreja;
- `meetingDay`: `DayOfWeek` opcional;
- `sortBy`: allowlist `name | code | meetingDay | createdAt`;
- `sortOrder`: `asc | desc`, padrão `name asc`;
- desempate obrigatório por `id asc`;
- filtros combinados por `AND`; nome/código por `OR` para cada termo;
- items e total no mesmo snapshot `RepeatableRead`;
- campos de ordenação nunca são interpolados diretamente em SQL.

### 8.5 Autorização e escopo

| Operação | ADMIN | PASTOR | SUPERVISOR | LEADER |
| --- | --- | --- | --- | --- |
| listar/detalhar | toda a igreja | toda a igreja | células subordinadas | própria liderança/treinamento |
| criar | permitir | permitir | negar por padrão | negar |
| editar dados gerais | permitir | permitir | reunião/endereço das subordinadas | reunião/endereço da própria |
| alterar código/nome | permitir | permitir | negar | negar |
| alterar status | permitir | permitir | negar | negar |
| alterar líder/treinando | permitir | permitir | negar | negar |

- ausência de `AUXILIAR` é negada por padrão e não cria novo papel;
- supervisor é resolvido pelo vínculo ativo `SupervisorAssignment.supervisorId -> leaderId -> Cell.leaderId`;
- líder é resolvido por `Cell.leaderId` ou, para leitura, `traineeLeaderId` conforme decisão;
- células sem líder não entram no escopo de supervisor/líder;
- mutações revalidam usuário ativo, papel atual e escopo dentro da transação;
- troca de líder deve recalcular a autorização antes do efeito e não usar apenas roles do JWT.
- a matriz acima é a decisão de execução proposta; seu aceite de produto faz parte da Etapa 0, sem deixar comportamento condicional espalhado pelos endpoints.

### 8.6 Auditoria

| Operação | Ação |
| --- | --- |
| criação | `CELL_CREATED` |
| nome/código/dados gerais | `CELL_UPDATED` |
| líder | `CELL_LEADER_CHANGED` |
| líder em treinamento | `CELL_TRAINEE_LEADER_CHANGED` |
| reunião | `CELL_MEETING_CHANGED` |
| endereço | `CELL_ADDRESS_CHANGED` |
| ativação | `CELL_ACTIVATED` |
| suspensão | `CELL_SUSPENDED` |
| vínculo de supervisão criado para a célula | `CELL_SUPERVISION_ASSIGNED` |

- registrar nos campos atuais ator (`userId`), igreja (`churchId`), entidade `Cell`, `entityId`, ação, instante e `before`/`after`;
- o schema atual não possui `organizationId`, IP, device, origin ou correlation ID em `AuditLog`; não adicionar essas colunas transversais silenciosamente neste plano. A ausência fica documentada como lacuna arquitetural futura;
- `before`/`after` usam allowlist de campos alterados e IDs necessários; não copiar request completo;
- não registrar tokens, cookies, endereço completo em logs técnicos ou dados pessoais desnecessários;
- mudanças distintas na mesma operação podem ser agregadas em `CELL_UPDATED` com `changedFields`, exceto liderança e status, que mantêm ações explícitas;
- no-op não gera auditoria.

## 9. Contratos

### Entradas

- `GET /cells`: `page?`, `pageSize?`, `search?`, `status?`, `leaderId?`, `meetingDay?`, `sortBy?`, `sortOrder?`;
- `GET /cells/:id`: `id` UUID;
- `POST /cells`: `{ code, name, status?, leaderId?, supervisorId?, traineeLeaderId?, meetingDay, meetingTime, address }` e `Idempotency-Key` conforme ADR; se `status=ACTIVE`, `leaderId` e `supervisorId` são obrigatórios;
- `PATCH /cells/:id`: subconjunto permitido de `{ code, name, meetingDay, meetingTime, address }`, ao menos um campo;
- `PATCH /cells/:id/status`: `{ status: "ACTIVE" | "SUSPENDED" }`;
- `PATCH /cells/:id/leader`: `{ leaderId: UUID, supervisorId: UUID }`; valida ou cria o assignment não ambíguo; remoção de líder não é exposta neste plano;
- `PATCH /cells/:id/trainee-leader`: `{ traineeLeaderId: UUID | null }`;
- todos os schemas são `.strict()` e validam `unknown` antes de comandos.

Semântica HTTP das mutações:

- criação inédita e replay idempotente retornam `201` com o mesmo envelope confirmado;
- todos os `PATCH` retornam `200` com o item atualizado, inclusive no-op idempotente;
- nenhum endpoint deste módulo retorna `204`, evitando que o frontend precise de uma leitura adicional após mutação;
- a remoção de líder responsável não é exposta no Plano 007: para substituir, envie outro UUID; uma célula ativa nunca fica sem líder. Suspender não remove o líder automaticamente.

### Saídas

```json
{
  "data": {
    "id": "uuid",
    "code": "CEL-001",
    "name": "Célula Esperança",
    "status": "ACTIVE",
    "leader": { "id": "uuid", "name": "Nome do líder" },
    "supervisor": { "id": "uuid", "name": "Nome do supervisor" },
    "traineeLeader": null,
    "meetingDay": "WEDNESDAY",
    "meetingTime": "19:30",
    "address": "Endereço da reunião",
    "createdAt": "2026-08-08T22:00:00.000Z",
    "updatedAt": "2026-08-08T22:00:00.000Z"
  },
  "meta": {}
}
```

- coleção: `{ data: CellSummary[], meta: { page, pageSize, totalItems, totalPages } }`;
- presenter seleciona explicitamente campos e formata `TIME(0)` como `HH:mm`;
- `churchId`, `deletedAt`, e-mails, papéis completos e modelos Prisma não são retornados;
- detalhes trazem somente relações básicas deste plano; membros, encontros, frequência e histórico não aparecem nem como placeholders de API.

### Erros esperados

| Situação | HTTP | Código público |
| --- | ---: | --- |
| entrada inválida | 400 | `VALIDATION_ERROR` |
| não autenticado | 401 | `AUTH_UNAUTHENTICATED` |
| sem papel/escopo | 403 | `CELL_ACCESS_DENIED` |
| ausente, excluída ou outro tenant | 404 | `CELL_NOT_FOUND` |
| líder/treinando ausente ou de outro tenant | 404 | `CELL_LEADERSHIP_CANDIDATE_NOT_FOUND` |
| líder local sem papel `LEADER` | 409 | `CELL_LEADER_NOT_ELIGIBLE` |
| trainee local incompatível com a regra aprovada | 409 | `CELL_TRAINEE_NOT_ELIGIBLE` |
| supervisor ausente ou de outro tenant | 404 | `CELL_SUPERVISOR_NOT_FOUND` |
| supervisor local sem papel ou assignment conflitante | 409 | `CELL_SUPERVISOR_CONFLICT` |
| código duplicado | 409 | `CELL_CODE_CONFLICT` |
| líder igual ao treinando | 409 | `CELL_LEADERSHIP_CONFLICT` |
| transição inválida | 409 | `CELL_STATUS_TRANSITION_INVALID` |
| chave idempotente reutilizada com outro payload | 409 | `IDEMPOTENCY_KEY_CONFLICT` |

Erros usam `{ "error": { "code", "message", "details" } }`, não expõem SQL, constraint, stack ou tenant externo.

### Consulta de líderes

- primeira opção: reutilizar `GET /users` com `search`, `status=ACTIVE` e filtro pelo papel `LEADER` somente para `ADMIN`, sem carregar lista integral;
- como `GET /users` atual é restrito a `ADMIN` e retorna dados além do necessário, não ampliar sua permissão para `PASTOR`;
- extensão necessária para a matriz fixada: `GET /users/cell-assignment-options?page&pageSize&search&kind`, no módulo `users`, autenticado para `ADMIN`/`PASTOR`, tenant-aware, paginado e com projeção `{ id, name }`; `kind=SUPERVISOR` exige papel `SUPERVISOR`, `kind=LEADER` exige papel `LEADER` e `kind=TRAINEE` aplica a elegibilidade aprovada da seção 6.3; o endpoint não aceita `churchId` e não substitui o CRUD de usuários;
- não criar endpoint de opções dentro de `cells` se a projeção pertence ao módulo `users`;
- autocomplete inicia busca após quantidade mínima de caracteres, usa debounce/cancelamento e nunca baixa todos os usuários.

## 10. Etapas

### Etapa 0 — Fechar decisões e ADRs

- [x] aprovar ADR que ratifica `User` como fonte canônica de liderança deste plano — ADR 004;
- [x] aprovar ADR de idempotência — ADRs 005 (estado) e 006 (Idempotency-Key);
- [x] obter aceite do recorte estrutural e fechar código, estados, elegibilidade e matriz de permissões — registrado em 2026-08-09;
- [x] atualizar este plano com as decisões finais antes de código ou migration;
- [x] confirmar que nenhuma decisão cria segunda fonte de verdade.

### Etapa 1 — Contratos e regras puras

- [ ] criar testes falhando dos schemas e normalizadores;
- [ ] criar `cells.ts` com params, query, requests, responses e erros;
- [ ] criar policies fail-closed e regras de transição/normalização independentes de NestJS/Prisma;
- [ ] testar `HH:mm`, dias, código, nome, PATCH, liderança e no-op;
- [ ] documentar paridade entre contratos, domínio e Prisma.

### Etapa 2 — Schema e migrations

- [ ] preservar a liderança direta aprovada, sem dual-write ou remodelagem;
- [ ] adicionar checks para formato canônico do código, nome/endereço não vazios e `ACTIVE` com líder;
- [ ] adicionar índices justificados pela query real;
- [ ] adicionar persistência de idempotência somente conforme ADR;
- [ ] criar migration nova, revisar SQL, locks, FKs, unique e rollback;
- [ ] validar desde banco vazio e sobre o estado das nove migrations atuais;
- [ ] não alterar seed com células.

### Etapa 3 — Ports, tipos e autorização

- [ ] criar tipos internos distintos dos DTOs HTTP;
- [ ] criar port de queries e unidade de trabalho orientada aos casos de uso;
- [ ] implementar policies de tenant, papel, liderança e supervisão;
- [ ] definir revalidação do ator e candidato dentro da transação;
- [ ] testar recurso ausente, outro tenant, papel stale e escopos.

### Etapa 4 — Queries e repository

- [ ] implementar listagem paginada com snapshot consistente;
- [ ] implementar detalhe tenant-aware;
- [ ] implementar busca, filtros, allowlist de ordenação e selects mínimos;
- [ ] incluir líder/treinando sem N+1;
- [ ] implementar escopo de supervisor/líder no SQL/Prisma, não por filtragem posterior;
- [ ] testar índices e executar `EXPLAIN ANALYZE` com volume representativo.

### Etapa 5 — Criação

- [ ] normalizar comando e resolver idempotência;
- [ ] revalidar ator, líder e treinando na mesma igreja;
- [ ] validar estado inicial e unicidade de código;
- [ ] persistir célula e auditoria atomicamente;
- [ ] mapear conflito concorrente para erro estável;
- [ ] testar retry idempotente, chave conflitante, rollback e concorrência.

### Etapa 6 — Atualização parcial

- [ ] carregar célula no tenant e escopo;
- [ ] limitar campos por papel;
- [ ] preservar omitidos e rejeitar payload vazio;
- [ ] detectar no-op e conflito de código;
- [ ] persistir diff e auditoria atômicos;
- [ ] testar nome/código, reunião, endereço, permissões e rollback.

### Etapa 7 — Status e liderança

- [ ] implementar ativação/suspensão com transições explícitas;
- [ ] impedir `ACTIVE` sem líder;
- [ ] implementar troca de líder com escopo e elegibilidade revalidados;
- [ ] validar/criar o `SupervisorAssignment` informado e rejeitar ambiguidade sem reatribuição silenciosa;
- [ ] implementar atribuição/remoção de treinando conforme ADR;
- [ ] manter ações set-based, idempotentes e sem auditoria em no-op;
- [ ] testar mesma igreja, outro tenant, usuário bloqueado/excluído, papel incompatível e líder=treinando.

### Etapa 8 — Controller, presenter e OpenAPI

- [ ] criar os sete endpoints planejados;
- [ ] aplicar guards/roles e authorization da aplicação;
- [ ] mapear erros no limite HTTP;
- [ ] documentar envelopes, filtros, paginação, idempotência, erros e exemplos seguros;
- [ ] provar que respostas não expõem campos internos.

### Etapa 9 — Seleção remota de liderança

- [ ] registrar por teste que `GET /users` permanece inadequado para `PASTOR` por permissão/projeção;
- [ ] implementar somente `GET /users/cell-assignment-options` com `kind`, projeção mínima e paginação;
- [ ] criar autocomplete com debounce, cancelamento, paginação e estados vazio/erro;
- [ ] impedir seleção de candidato inativo ou fora do tenant mesmo se o cliente for adulterado;
- [ ] testar autorização e isolamento do endpoint reutilizado/estendido.

### Etapa 10 — Fundação web da feature

- [ ] adicionar contracts/API client de células e chaves de cache;
- [ ] adicionar capabilities e navegação fail-closed;
- [ ] criar rotas e boundaries sem duplicar shell/sessão;
- [ ] reutilizar components/tokens existentes;
- [ ] preparar formatação de dia, hora e timestamps com timezone da igreja.

Chaves e invalidação previstas:

- listas: cache `cells`, chave `page:<page>:search:<...>:status:<...>:leader:<...>:day:<...>:sort:<...>`;
- detalhe: `detail:<cellId>`;
- opções: cache separado `cell-assignment-options`, incluindo `kind`, termo e página;
- criar/editar/status/liderança invalida todas as listas de células e o detalhe afetado;
- trocar liderança também invalida opções somente quando a resposta alterar elegibilidade; caso contrário preserva o cache curto;
- logout/falha definitiva continua usando `clearAllCaches`, conforme a fundação atual.

### Etapa 11 — Listagem web

- [ ] criar título, “Nova célula”, busca, filtros, ordenação e paginação;
- [ ] mostrar nome, código, líder, reunião, status e ações;
- [ ] refletir filtros na URL e cancelar debounce anterior;
- [ ] implementar tabela semântica e alternativa móvel já suportada pelo componente;
- [ ] implementar loading/skeleton, vazio, erro, retry e acesso negado.

### Etapa 12 — Cadastro, detalhes e edição web

- [ ] criar formulário com Zod, erros por campo e autocomplete remoto;
- [ ] desabilitar submissão repetida e enviar chave idempotente estável por tentativa;
- [ ] tratar `409` de código/liderança/idempotência com mensagem específica;
- [ ] criar detalhe com dados básicos, timestamps e ações autorizadas;
- [ ] editar na própria rota `/cells/[id]`, enviando somente campos alterados;
- [ ] confirmar status/liderança e remoção de treinando em diálogo acessível;
- [ ] invalidar lista/detalhe/opções após mutações;
- [ ] não criar abas funcionais de membros, encontros, frequência ou histórico.

### Etapa 13 — Testes, documentação e encerramento

- [ ] executar testes unitários, integração, HTTP e Playwright;
- [ ] validar teclado, 360×800, 768×1024, 1280×800 e zoom 200%;
- [ ] validar login, `401`, `403`, tenant e fluxo completo;
- [ ] executar lint, typecheck, test e build na raiz;
- [ ] registrar comandos/resultados/limitações reais;
- [ ] revisar diff contra fora de escopo e mover o plano somente após DoD.

## 11. Critérios de aceitação

1. `CellsModule` segue as camadas e não expõe Prisma à aplicação, apresentação ou web.
2. Contratos Zod estritos cobrem todas as entradas e respostas públicas.
3. `churchId` nunca é aceito do cliente e todas as queries/mutações usam o tenant do principal.
4. Célula de outra igreja não aparece em lista, detalhe, mutação ou opções e é indistinguível de ausente.
5. Código canônico é único por igreja e conflito concorrente retorna `409 CELL_CODE_CONFLICT`.
6. Nome, reunião e endereço obedecem às regras aprovadas.
7. `TIME(0)` é transportado consistentemente como `HH:mm`, sem conversão indevida de fuso.
8. A liderança possui exatamente uma fonte canônica aprovada e não existe dual-write.
9. Líder/treinando inválido, bloqueado, excluído, incompatível ou de outra igreja é rejeitado.
10. Líder e treinando não podem ser iguais.
11. Célula ativa não permanece sem líder.
12. PATCH preserva omitidos, rejeita vazio e não audita no-op.
13. Suspensão é lógica, preserva histórico e não executa delete físico.
14. Listagem pagina, busca nome/código, filtra status/líder/dia e ordena somente por allowlist.
15. Paginação tem snapshot consistente e desempate determinístico.
16. Admin, pastor, supervisor e líder recebem somente o escopo aprovado; `401` e `403` são distintos.
17. Criação, alterações, liderança, reunião, endereço e status geram auditoria transacional mínima.
18. Endpoints retornam `{ data, meta }`; erros retornam `{ error }` com códigos estáveis.
19. OpenAPI documenta os sete endpoints, opções auxiliares necessárias, filtros, permissões e erros.
20. Criação repetida com a mesma chave não duplica célula; reutilização divergente é rejeitada.
21. PATCH de status/liderança repetido produz o mesmo estado e não duplica auditoria.
22. `/cells` é responsiva, pesquisável, filtrável, paginada e possui loading/vazio/erro/negado.
23. `/cells/new` valida campos, evita duplo envio, trata conflitos e oferece cancelamento/feedback.
24. `/cells/[id]` exibe e edita somente ações permitidas e não antecipa módulos futuros.
25. Seletores usam busca remota paginada e não carregam todos os usuários/pessoas.
26. Frontend usa endpoints reais, sem mock permanente ou regra crítica local.
27. Cache é invalidado após mutações e não mistura usuários/igrejas após logout.
28. Fluxos passam por teclado, viewports definidos e zoom 200% sem overflow global.
29. Unitários, integração PostgreSQL, E2E HTTP e Playwright passam.
30. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.
31. Nenhuma dependência de produção foi adicionada sem justificativa; expectativa atual é zero dependências novas.
32. Nenhum item fora de escopo ou Plano 008 foi implementado.
33. O aceite do recorte sem estrutura está registrado; sem ele, a execução permanece bloqueada e não declara conformidade integral com o cadastro conceitual do PDF (RF-004/US-006).
34. PostgreSQL rejeita diretamente célula `ACTIVE` sem líder e códigos fora do formato persistido aprovado.
35. `GET /users/cell-assignment-options` retorna projeção mínima, paginada e isolada por igreja para supervisor, líder e trainee.
36. Criação ativa exige supervisor/líder e a supervisão derivada possui no máximo um assignment ativo por líder e igreja.

## 12. Estratégia de testes

### Unitários

- contracts: código, nome, hora, enums, query, PATCH, liderança, campos desconhecidos e envelopes;
- domínio: normalização, transições, líder obrigatório, distinção líder/treinando e no-op;
- policies: quatro papéis, tenant, supervisor subordinado, líder próprio e fail-closed;
- queries/commands: paginação, autorização, criação, update, status, liderança, auditoria, rollback e idempotência;
- presenter: allowlist, `HH:mm`, nomes relacionados e ausência de internos;
- web: API adapter, capabilities, filtros/URL, formulários, conflitos, diálogos e estados.

### Integração

- aplicar todas as migrations em PostgreSQL 18.4 isolado;
- validar constraints, unique por igreja, índices, FKs compostas e estratégia de liderança;
- testar duas igrejas em lista, detalhe, criação, update, status e liderança;
- testar `SupervisorAssignment` no escopo da query;
- testar unicidade parcial de supervisor ativo por líder, criação do assignment e rejeição de conflito;
- testar snapshot de paginação, ordenação, busca/filtros combinados e plano dos índices;
- testar transações, rollback de auditoria, concorrência de código/idempotência e no-op;
- testar o check de célula ativa sem líder e o formato canônico persistido do código;
- testar índices compostos de líder e supervisão quando aprovados pelo plano de execução;
- inspecionar catálogo e `EXPLAIN ANALYZE` com volume representativo.

### E2E da API

- cobrir `GET /cells`, `GET /cells/:id`, `POST /cells`, `PATCH /cells/:id`, status, líder e treinando;
- cobrir `400`, `401`, `403`, `404`, `409`, outro tenant e papel stale;
- cobrir paginação, busca, filtros, ordenação e envelopes;
- cobrir criação idempotente e repetição das ações set-based;
- cobrir atribuição, troca e remoção de trainee, troca de líder e o novo escopo resultante para supervisor/líder;
- cobrir `GET /users/cell-assignment-options` para `SUPERVISOR`, `LEADER` e `TRAINEE`, incluindo outro tenant e usuário inativo.

### E2E web — Playwright

Fluxo mínimo obrigatório:

1. autenticar com usuário autorizado;
2. acessar “Células” pela navegação;
3. criar uma célula;
4. localizar a célula na busca/listagem;
5. abrir detalhes;
6. editar nome/reunião/endereço;
7. alterar liderança quando autorizado;
8. suspender e reativar;
9. confirmar o resultado na interface e após reload.

Adicionar cenários para `401`, `403`, papel sem ação visual, conflito de código, validação, loading/erro, teclado, responsividade e console sem erros inesperados. Os testes usam API e PostgreSQL reais, sem mocks de runtime.

### Validação manual

- conferir foco, rótulos, diálogo, mensagens, navegação e retorno de foco;
- conferir datas/horário no timezone da igreja;
- verificar ausência de token, `churchId`, PII desnecessária e stack no navegador/logs;
- conferir que não existem links/abas funcionais para membros, encontros ou frequência.

## 13. Segurança e privacidade

- autenticação global e Bearer/cookie permanecem conforme ADR 003;
- authorization da API combina papel, igreja, supervisor/liderança e estado atual;
- frontend falha fechado visualmente, mas nunca substitui a API;
- repositories aplicam tenant e soft delete na própria consulta;
- DTOs estritos e mapeamento campo a campo evitam mass assignment;
- presenter usa allowlist e não serializa Prisma;
- opções de líder retornam somente ID/nome necessários, sem e-mail;
- recurso de outra igreja e candidato externo não são enumeráveis;
- logs não contêm body completo, endereço completo, termos de busca, tokens ou cookies;
- auditoria registra apenas diff necessário e IDs;
- `Idempotency-Key` não é token de autorização e deve ter entropia/UUID, escopo e retenção;
- não há exportação nem tratamento de dados pastorais sensíveis neste plano.

## 14. Migração de dados

### Alterações confirmadamente necessárias

- nova migration de invariantes para checks de código canônico, campos não vazios e `ACTIVE` com líder, após preflight de células existentes;
- avaliar índice GIN trigram em `cells.name` e `cells.code` para busca `contains`; criar apenas se `EXPLAIN ANALYZE` justificar;
- avaliar índices compostos `(church_id, deleted_at, status, name, id)`, `(church_id, leader_id, deleted_at)` e `(church_id, trainee_leader_id, deleted_at)` conforme as queries finais;
- avaliar `(church_id, supervisor_id, deleted_at, leader_id)` em `supervisor_assignments` para o escopo do supervisor;
- criar unique parcial `(church_id, leader_id) WHERE deleted_at IS NULL` em `supervisor_assignments`, após preflight e resolução explícita de eventuais ambiguidades;
- manter índices atuais de `leaderId`, `traineeLeaderId`, `(churchId, status)`, `(churchId, deletedAt)` e unique `(churchId, code)`.

O check de código no PostgreSQL deve garantir apenas propriedades determinísticas do valor persistido — `code = upper(btrim(code))` e regex canônica — enquanto remoção de diacríticos/separadores é responsabilidade do normalizador testado antes da escrita. Não prometer no banco uma transformação que a constraint não executa.

### Alterações condicionais

- nenhuma remodelagem de liderança será feita: as FKs compostas atuais para `User` permanecem;
- a tabela/constraints de idempotência dependem da ADR; incluir unique por igreja/ator/operação/chave, request hash, resource/result e timestamps/retention;
- não adicionar `structureNodeId`, `profileId`, capacidade, datas, geografia ou `addressId`.

### Procedimento

1. executar preflight somente leitura de códigos, nomes, endereços, líderes e duplicidades;
2. produzir backup verificado em ambiente com dados;
3. criar migrations pequenas e separadas: invariantes, índices comprovados e idempotência; nunca editar as nove já aplicadas;
4. revisar SQL, locks, constraints, FKs, índices e reversibilidade;
5. aplicar desde banco vazio e sobre cópia do estado atual;
6. executar eventual backfill de códigos somente após aprovação da estratégia de normalização e validação do relatório de preflight;
7. executar `migrate status`, integração e `EXPLAIN ANALYZE`;
8. liberar código somente após estado compatível;
9. não usar `prisma db push` e não semear células.

## 15. Observabilidade

- logs estruturados por operação, resultado, duração, correlation ID e IDs técnicos mínimos;
- sinais: listagem, criação, conflito de código, alteração, status, liderança, `401`, `403`, `404`, `409`, retry e rollback;
- métricas de paginação/latência sem termos de busca ou endereço;
- contagem de conflitos e falhas idempotentes sem registrar a chave integral;
- auditoria de negócio não é substituída por log técnico;
- APM/alertas externos permanecem fora do escopo, mas os eventos devem estar preparados para integração futura.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| duas fontes de liderança | média | crítico | ADR bloqueante, uma fonte canônica e proibição de dual-write |
| liderança em `User` divergir do modelo conceitual de `Person` | alta | alto | registrar dívida/ADR e exigir vínculo/migração antes de convergência futura |
| recorte sem estrutura não atender ao PDF US-006 | alta | alto | aceite explícito de produto ou bloqueio até entrega do módulo `structures` |
| vazamento entre igrejas | baixa | crítico | tenant em toda query/FK/policy e testes negativos |
| escopo de supervisor incorreto | média | alto | derivar por `SupervisorAssignment` ativo no banco e testar mudanças de líder |
| papel stale autorizar mutação | baixa | alto | revalidar ator e escopo dentro da transação |
| célula ativa sem líder | média | alto | regra de domínio, revalidação transacional e testes |
| código duplicado/normalização incompatível | média | alto | decisão prévia, preflight, check, unique e tratamento concorrente |
| retry criar duas células | média | alto | idempotência persistente e unique por código |
| PATCH apagar omitidos | média | alto | comandos próprios, composição de estado e testes omitido/null |
| busca degradar com volume | média | médio | paginação, índices medidos e `EXPLAIN ANALYZE` |
| autocomplete expor usuários | baixa | alto | projeção mínima, autorização, tenant e paginação |
| status “inativo” ambíguo | média | médio | mapear explicitamente para `SUSPENDED`; reservar `CLOSED/deletedAt` |
| endereço textual limitar evolução | média | médio | manter recorte atual e planejar migração futura, sem modelo paralelo |
| expansão para estrutura/membros/encontros | média | alto | fora de escopo e revisão do diff |
| testes conectados dependerem de ambiente | média | alto | PostgreSQL descartável dedicado e resultados reais no progresso |
| auditoria atual não possuir origem/organização | alta | médio | registrar somente campos existentes e tratar expansão transversal em plano/ADR próprio |

## 17. Estratégia de reversão

- remover `CellsModule` do `AppModule` e reverter controller, aplicação, domínio local, contracts e web como unidades coerentes;
- remover links/capabilities junto com as rotas para não deixar navegação quebrada;
- reverter primeiro o código; manter colunas/índices aditivos sem uso é preferível a rollback destrutivo;
- corrigir/remover constraints ou índices por nova migration, nunca editar migration aplicada;
- se houver migração de liderança, manter backup e script verificado de retorno antes do switch; nunca conservar dual-write como rollback permanente;
- registros de células e auditoria criados em uso não são apagados automaticamente;
- chaves de idempotência podem permanecer até a retenção ou ser removidas por procedimento aprovado, sem apagar células;
- não executar `prisma migrate reset` em ambiente com dados;
- registrar versão, motivo, comandos, impacto e validação posterior de qualquer reversão.

## 18. Comandos de validação

Preparação do banco:

```bash
docker compose up -d postgres-dev postgres-test
docker compose ps
npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
```

Criação de migration, uma única vez durante desenvolvimento e com nome final definido após as ADRs:

```bash
npm run db:migrate:create --workspace @mission-atos/database -- --name add_cell_management_invariants
npm run db:migrate:create --workspace @mission-atos/database -- --name add_cell_management_indexes
npm run db:migrate:create --workspace @mission-atos/database -- --name add_idempotency_requests
```

Cada comando de criação só será executado se houver mudança correspondente. A migration de índices não será criada se os planos de execução não justificarem índices adicionais; a de idempotência depende da ADR.

Testes específicos planejados:

```bash
npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:cells:e2e --workspace @mission-atos/api
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

Todos os comandos usam npm/npm workspaces e PowerShell compatível. Registrar resultado real e motivo de qualquer comando não executado. Não usar pnpm, `db push`, migration já aplicada ou banco não dedicado a testes.

## 19. Definition of Done

- [ ] decisões de produto, inclusive recorte estrutural, encerradas e ADRs de liderança/idempotência aprovadas;
- [ ] escopo implementado sem itens fora de escopo;
- [ ] critérios de aceitação atendidos;
- [ ] uma única fonte canônica de liderança comprovada;
- [ ] contratos Zod e OpenAPI completos;
- [ ] domínio, aplicação, infraestrutura e HTTP separados;
- [ ] autorização e isolamento por igreja validados no servidor;
- [ ] escopo de supervisor/líder coberto por testes positivos e negativos;
- [ ] exclusão física ausente e status lógico idempotente;
- [ ] auditoria transacional e mínima;
- [ ] migrations novas revisadas e reproduzidas desde banco vazio;
- [ ] índices medidos e não redundantes;
- [ ] testes unitários executados;
- [ ] testes de integração PostgreSQL executados;
- [ ] testes HTTP executados;
- [ ] Playwright do fluxo funcional executado com API/banco reais;
- [ ] acessibilidade, teclado, responsividade e zoom validados;
- [ ] lint executado e aprovado;
- [ ] typecheck executado e aprovado;
- [ ] testes da raiz executados e aprovados;
- [ ] build executado e aprovado;
- [ ] dependências e audit revisados;
- [ ] documentação e registro de progresso atualizados;
- [ ] riscos e limitações reais informados;
- [ ] ausência de membros, encontros, frequência, dashboard analítico, mobile e Plano 008 confirmada;
- [ ] plano movido para `docs/plans/completed/` somente após conclusão real.

## 20. Registro de progresso

### 2026-08-08 — planejamento

- realizado: leitura integral das instruções, PRD Markdown/PDF, arquitetura, template e planos concluídos; inspeção de schema, migrations, domínio, contratos, API, autenticação/autorização, usuários, igreja, pessoas, web e testes do Plano 006.1;
- análise: `Cell` atual já possui tenant, código único, quatro estados, liderança direta por `User`, dia/horário, endereço, timestamps, soft delete e índices básicos; não existe feature de células em contracts/API/web;
- lacunas: ausência de módulo/contratos/UI, discrepância `User` versus `Person/CellLeadership`, ausência de vínculo `User`–`Person`, estrutura/perfil/endereço conceituais não implementados, código sem normalização de aplicação, busca sem índice específico, autorização hierárquica de células não implementada e idempotência transversal inexistente;
- decisões propostas: preservar temporariamente liderança direta em `User` como menor mudança e única fonte; mapear desativação para `SUSPENDED`; manter `meetingDay`, `HH:mm`/`TIME(0)` e endereço textual; edição na tela de detalhe; busca remota de líderes; sem dependência nova;
- banco: previstas somente migrations novas para invariantes/índices medidos e idempotência aprovada; nenhuma remodelagem de liderança faz parte do Plano 007;
- testes: não executados, pois esta entrega cria somente documentação e não altera código;
- dependências: nenhuma instalada ou alterada;
- bloqueios para implementação: ADR de liderança, ADR de idempotência e decisões de código/status/elegibilidade/permissões;
- próximo passo: revisar e aprovar este plano e suas decisões; não implementar o Plano 007 nem criar o Plano 008 a partir desta etapa documental.

### 2026-08-08 — revisão integral

- revisão: documento comparado novamente com AGENTS, PRD, arquitetura, template, planos concluídos, schema Prisma, domínio, contratos, API e frontend atuais;
- problemas corrigidos: removida a bifurcação de implementação da liderança; `User` foi fixado como fonte única do Plano 007; criada ratificação por ADR; divergência estrutural do PRD transformada em gate explícito; elegibilidade de líder/trainee separada; matriz de autorização fixada; HTTP e erros estabilizados; constraint de `ACTIVE` com líder tornada obrigatória; índices tenant-aware, idempotência concorrente, capabilities/cache, auditoria disponível e migrations separadas foram detalhados;
- classificação da revisão: 1 problema Crítico, 5 Altos, 5 Médios e 2 Baixos; todos receberam correção documental neste arquivo;
- testes/comandos: nenhum lint, typecheck, teste, build ou migration executado, pois a revisão altera somente documentação;
- arquivos: somente `docs/plans/active/007-cell-management.md` foi alterado por esta revisão; mudanças preexistentes do workspace foram preservadas;
- decisões ainda pendentes: aceite do recorte sem estrutura, código/status inicial, elegibilidade do trainee, liderança múltipla, escopo detalhado e ADR de idempotência; a liderança direta por `User` já é decisão deste plano, restando sua ratificação documental por ADR;
- prontidão: o plano está tecnicamente estruturado para execução, mas o início de código/migrations permanece bloqueado pela Etapa 0 até os gates de produto e ADRs pendentes serem aprovados.

### 2026-08-09 — aprovação e ratificação

- aprovado: plano aprovado para execução; aceite do recorte estrutural registrado (modelo `Cell` existente sem `structureNodeId`/`profileId`/capacidade/datas);
- ratificado: `docs/decisions/004-direct-cell-leadership.md` (liderança por `User`), `docs/decisions/005-idempotent-status-transitions.md` (transições de estado idempotentes) e `docs/decisions/006-idempotency-key.md` (`Idempotency-Key` transversal no `POST /cells`);
- decisões fechadas: código canônico (trim/uppercase/sem diacríticos/`-`/regex), desativar=`SUSPENDED`, ativar=`ACTIVE`, criação padrão `FORMING`/`ACTIVE` explícito, elegibilidade de trainee sem papel `TRAINEE_LEADER`, liderança múltipla permitida, escopo de supervisor por `SupervisorAssignment`, escopo de líder por liderança/treinamento, `PASTOR` com status/liderança na igreja;
- arquivos: `docs/decisions/004-direct-cell-leadership.md`, `docs/decisions/005-idempotent-status-transitions.md`, `docs/decisions/006-idempotency-key.md` e seções 3/6/10 deste plano atualizadas;
- testes/comandos: nenhum código alterado nesta etapa documental; próxima etapa inicia a Etapa 1.

### 2026-08-13 — implementação e validação

- API: módulo de células concluído — contratos Zod, casos de uso (criar, editar, status, liderança, trainee, listar/pesquisar), autorização hierárquica (ADMIN/PASTOR na igreja; SUPERVISOR e LEADER no escopo próprio), auditoria transacional, normalização de código e idempotência com `Idempotency-Key` no `POST /cells`; endpoint `GET /users/cell-assignment-options` para autocomplete de líderes.
- API — testes: unit 110/110 (21 suites), integração PostgreSQL 26/26 (5 suites) e HTTP 25/25 (5 suites, `cells.e2e-spec.ts` 8/8); typecheck, lint e build aprovados.
- Web: features de cells completas — `cells-api`, sidebar/breadcrumbs/atalho, lista com busca/filtro/paginação, formulário de criação (chave de idempotência estável por payload), detalhe com edição field-scoped e diálogos de status/liderança/trainee, autocomplete remoto (`assignment-select`), badges e helpers de formatação; capabilities fail-closed; páginas `/cells`, `/cells/new` (ADMIN|PASTOR) e `/cells/[id]`.
- Web — testes: unit 53/53 (7 suites, incluindo `cells-api.spec.ts` e capabilities atualizadas); typecheck, lint e build aprovados.
- Migrations: 12 aplicadas e reproduzidas desde banco vazio (`db:migrate:deploy` em banco recém-criado).
- DoD raiz: lint (6/6), typecheck (13/13), testes (230), build (7/7) aprovados.
- Documentação: TTL de retenção de chaves de idempotência definido na ADR 006.
- Bloqueio real: o E2E Playwright do fluxo de login não executa neste ambiente — `next dev` entra em loop de Fast Refresh com 401 repetidos e a página de login permanece em "Carregando" (afeta o suite existente, não só cells). O spec `cells.spec.ts` e a seed E2E (célula `CEL-E2E-001` + `SupervisorAssignment`) foram escritos e devem ser executados em ambiente com `next dev` estável; item 19 "Playwright do fluxo funcional executado" permanece em aberto e o plano permanece em `docs/plans/active/` até a execução real.
- pendências para fechamento do plano: executar Playwright em ambiente estável; revisar dependências/audit; decidir movimento para `docs/plans/completed/`.
