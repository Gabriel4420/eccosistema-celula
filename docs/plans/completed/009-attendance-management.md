# Plano 009 — Gestão de frequência dos encontros

## 1. Objetivo

Planejar a entrega ponta a ponta da frequência de um encontro de célula: determinar participantes historicamente elegíveis, consultar e salvar marcações, mostrar resumo, registrar visitantes e disponibilizar uma experiência web mobile-first, com isolamento por igreja, autorização hierárquica, concorrência otimista, auditoria e testes.

Este documento registra o plano e a execução concluída da gestão de frequência.

**Status:** Concluído

**Responsável:** time de engenharia Missão Atos

**Criado em:** 2026-08-22

**Concluído em:** 2026-08-24

**Referências:** PRD RF-004, RF-006 a RF-009, RF-012 e RF-018; RN-001, RN-004 a RN-008 e RN-011; US-004 e US-005; ADRs 003, 005 e 006

**Pré-requisito:** Plano 008 concluído e encontros funcionais

**Branch:** `master`

## 2. Contexto

O repositório já possui `Person`, `Cell`, `Meeting`, `MeetingAttendance`, `AuditLog`, contratos compartilhados, autenticação e escopo hierárquico. O enum persistido de frequência é `PRESENT | ABSENT | EXCUSED`, e `MeetingAttendance` já tem a unique `(churchId, meetingId, personId)`. O encontro usa data civil e os estados `SCHEDULED | COMPLETED | CANCELED`.

Há, porém, lacunas para executar frequência com segurança:

- `CellMembership` existe no schema e no domínio, mas não há módulo funcional completo nem garantias suficientes para consulta histórica;
- `Meeting` não possui revisão de frequência para impedir perda silenciosa em edições concorrentes;
- visitantes ainda não possuem representação específica;
- API, contratos e frontend de frequência não existem;
- a policy de edição de encontros não representa com segurança a diferença entre líder responsável e trainee.

A solução seguirá o monólito modular e as camadas existentes. Não criará uma segunda fonte de verdade para membros, regras críticas no frontend ou arquitetura paralela.

## 3. Escopo

- regras puras de elegibilidade histórica, status e resumo;
- leitura interna mínima de `CellMembership` para a data do encontro;
- consulta do snapshot completo de frequência;
- salvamento atômico em lote, replace-set, idempotente e com revisão otimista;
- marcação explícita como presente, ausente ou justificado;
- `UNMARKED` calculado, nunca persistido;
- visitantes previstos no MVP, usando `Person` central e `MeetingVisitor`;
- cadastro rápido de visitante com reutilização da normalização/deduplicação de pessoas;
- repositories, casos de uso, policies, controllers, presenters, OpenAPI e erros estáveis;
- auditoria agregada;
- rota web dedicada e integração com detalhes do encontro;
- experiência mobile-first, acessível, sem autosave;
- migrations aditivas, preflight, testes unitários, integração, API, frontend e E2E.

## 4. Fora de escopo

- CRUD completo ou módulo geral de membros da célula;
- fechamento/reabertura próprio da frequência;
- estado persistido `UNMARKED` ou novo enum `JUSTIFIED`;
- vínculo automático do visitante com a célula;
- gestão geral de visitantes ou deduplicação paralela à de pessoas;
- relatório analítico, ranking, tendências, gráficos ou dashboard global;
- notificações, geolocalização, reconhecimento facial ou QR Code;
- check-in automático, aplicativo nativo ou sincronização offline avançada;
- mudanças no `MeetingReport`;
- implementação do Plano 010.

## 5. Suposições

- O Plano 008 e sua máquina de estados estão em produção antes deste plano.
- A data civil do encontro é apresentada no timezone da igreja e convertida em limites UTC para consultas históricas.
- `Person.deletedAt` é a fonte atual para atividade da pessoa; não se inventará `Person.status`.
- `ADMIN`, `PASTOR`, `SUPERVISOR` e `LEADER` continuam sendo os papéis canônicos.
- O vínculo de líder responsável e o indicador de trainee existentes serão reutilizados.
- A API permanece a autoridade final; dados de igreja nunca vêm do cliente como autoridade.
- O lote máximo de 500 participantes atende ao MVP e será documentado no contrato/OpenAPI.
- O frontend carregará o encontro inteiro e fará busca local, sem paginação.

## 6. Perguntas e decisões pendentes

Não há decisão de produto pendente para iniciar a execução. Foram adotadas:

- [x] ausência de registro significa `UNMARKED` somente na resposta/UI;
- [x] persistir `PRESENT`, `ABSENT` e o equivalente existente `EXCUSED`;
- [x] permitir salvar em `SCHEDULED` e editar em `SCHEDULED` ou `COMPLETED`;
- [x] tornar `CANCELED` somente leitura e excluí-lo dos cálculos operacionais;
- [x] não criar fechamento/reabertura de frequência;
- [x] usar lote replace-set com `expectedRevision`, sem autosave;
- [x] incluir visitantes no MVP com registro específico e `Person` central;
- [x] não expandir `CellMembership` para CRUD completo.

Pendências de execução, não de produto:

- [x] registrar ADR para replace-set, revisão, retry idempotente e visitante;
- [x] executar preflight e documentar conflitos de vínculos antes das constraints;
- [x] confirmar os nomes finais de índices dentro do limite do PostgreSQL.

## 7. Áreas afetadas

### Banco de dados

- `packages/database/prisma/schema.prisma` e novas migrations;
- preflight de `CellMembership` e `MeetingAttendance`;
- seed somente se necessário para cenários de desenvolvimento/teste.

### Domínio e contratos

- `packages/domain`: elegibilidade, transições permitidas, resumo e interfaces;
- `packages/contracts`: schemas Zod de snapshot, lote, visitantes e erros;
- nenhuma regra de negócio duplicada no frontend.

### API

- novo módulo de aplicação/infraestrutura de attendance integrado a cells/meetings/people/audit;
- policy própria, repositories, casos de uso, controllers, presenters e OpenAPI.

### Frontend

- feature de attendance em `apps/web`;
- rota `/cells/[id]/meetings/[meetingId]/attendance`;
- CTA e resumo compacto no detalhe do encontro;
- extensão do `ApiClient` para `DELETE`, se ainda ausente.

### Documentação e ADRs

- novo ADR sobre lote, revision, visitantes e idempotência, estendendo o ADR 006;
- documentação de contrato, códigos HTTP, limites e semântica replace-set.

## 8. Modelo e regras de negócio

### Modelo de dados

**Meeting**

- adicionar `attendanceRevision Int @default(0)`;
- criar check `attendance_revision >= 0`;
- não adicionar `closedAt`, `closedBy` ou estado de fechamento.

**MeetingAttendance**

- manter a unique existente `(churchId, meetingId, personId)`;
- manter exclusão lógica;
- omissão no lote restaura o estado desejado para `UNMARKED` por soft delete;
- nova marcação da mesma pessoa restaura a linha existente, em vez de inserir outra;
- não persistir `UNMARKED`.

**MeetingVisitor**

- `id`, `churchId`, `meetingId`, `personId`;
- `invitedByPersonId` opcional;
- observação operacional opcional, com tamanho limitado;
- `createdAt`, `updatedAt` e `deletedAt`;
- unique `(churchId, meetingId, personId)`;
- FKs tenant-aware para `Meeting`, `Person` e a presença correspondente em `MeetingAttendance`;
- relação opcional tenant-aware do convidador com `Person`;
- índices apenas para consultas reais por encontro, pessoa e registros ativos.

**CellMembership**

- não ganhará CRUD neste plano;
- adicionar check `leftAt IS NULL OR leftAt >= joinedAt`;
- para registros não excluídos, garantir `ACTIVE` com `leftAt` nulo e `INACTIVE | TRANSFERRED` com `leftAt` preenchido;
- soft delete não representa transferência: deve preservar `joinedAt`, `leftAt` e o status histórico coerente do intervalo;
- tratar cada vínculo como intervalo imutável: retorno ou reativação cria novo `CellMembership`; nunca reabrir nem reescrever `joinedAt`/`leftAt` de intervalo encerrado;
- índice para consulta histórica por igreja, célula, entrada/saída e exclusão;
- partial unique concreta de `(churchId, personId)` quando `deletedAt IS NULL`, `status = ACTIVE` e `leftAt IS NULL`, sem criar coluna ou conceito de vínculo `primary`;
- aplicar constraints somente após preflight e correção explícita dos dados incompatíveis.

### Elegibilidade histórica

Para a data civil `meetingDate`, calcular início inclusivo e início do dia seguinte no timezone IANA da igreja e convertê-los para UTC. Uma pessoa é elegível quando:

- o encontro e a célula pertencem à igreja autenticada;
- `joinedAt` é anterior ao limite UTC do dia seguinte;
- `leftAt` é nulo ou igual/posterior ao início UTC do encontro;
- `CellMembership.deletedAt` é nulo ou igual/posterior ao início UTC;
- `Person.deletedAt` é nulo ou igual/posterior ao início UTC;
- o intervalo pertence à própria célula do encontro.

O status atual `INACTIVE` ou `TRANSFERRED` não apaga elegibilidade passada se o intervalo contiver a data. Pessoas admitidas depois ou desligadas antes não aparecem. Múltiplos vínculos elegíveis da mesma pessoa são deduplicados na leitura; sobreposição é anomalia reportada pelo preflight, não fonte de duplicidade no snapshot. Um retorno posterior à mesma célula cria outro intervalo e não torna a pessoa elegível no período entre os vínculos.

Nesta versão, os limites UTC são derivados do timezone vigente da igreja no momento da consulta. O resultado histórico não terá cache permanente, pois uma futura alteração desse timezone pode mudar os limites. Persistir um snapshot de timezone exigirá ADR/plano próprio e não ampliará este plano.

### Status e edição

- `SCHEDULED`: leitura e escrita permitidas conforme policy, inclusive marcação antecipada;
- `COMPLETED`: leitura e edição permitidas conforme policy;
- `CANCELED`: leitura apenas; PUT/POST/DELETE retornam erro de conflito de estado;
- encontro cancelado mantém e retorna o snapshot histórico, com `isReadOnly: true` e resumo marcado `isOperational: false`; frequência persistida não é apagada nem artificialmente zerada;
- não existe fechamento ou reabertura independente.

### Lote, atomicidade e concorrência

- o PUT representa o conjunto desejado completo dos participantes regulares;
- ausências são explicitamente `ABSENT`; IDs omitidos tornam-se `UNMARKED` por soft delete;
- validar todo o payload antes de mutar;
- até 500 itens, `personId` único e status válido;
- todas as alterações, revision e auditoria usam uma única transação;
- adquirir a revisão antes de qualquer mutação por compare-and-swap atômico (`UPDATE Meeting SET attendanceRevision = attendanceRevision + 1 WHERE id = ... AND attendanceRevision = expectedRevision`) e exigir exatamente uma linha afetada; implementação equivalente com lock pessimista só será aceita se oferecer a mesma serialização;
- se o compare-and-swap falhar, ler o snapshot atual fora da tentativa abortada e decidir entre retry idempotente ou `409`; nenhuma attendance, visitor ou auditoria pode ser confirmada antes da aquisição bem-sucedida;
- no-op preserva revision, timestamps e não audita;
- mudança real incrementa `attendanceRevision` exatamente uma vez, inclusive nas mutações de visitante;
- revision divergente e estado diferente retorna `409 ATTENDANCE_REVISION_CONFLICT`;
- retry com revision antiga, mas estado desejado já persistido, retorna `200` com snapshot atual;
- para detectar esse retry, comparar mapas canônicos de participantes regulares ordenados por `personId`, ignorando ordem do payload, timestamps, linhas soft-deleted e attendances vinculadas a visitantes.

### Visitantes

- RF-009, US-005 e RN-005 colocam visitantes no MVP;
- usar `Person` existente ou criar pessoa via cadastro rápido com nome obrigatório e telefone opcional;
- reutilizar normalização e deduplicação do módulo people;
- rejeitar pessoa elegível da célula, de outra igreja, excluída ou inativa antes do encontro;
- `invitedByPersonId`, quando informado, deve identificar pessoa da mesma igreja, existente e historicamente não excluída na data do encontro;
- observação operacional é normalizada e limitada a 500 caracteres no contrato Zod, aplicação, coluna do banco e UI;
- visitante é sempre `PRESENT` e não entra no array do lote;
- visitante soma em `totalPresent`, mas não no denominador da frequência;
- resposta calcula `contactPending` quando o cadastro rápido não tiver telefone;
- criação ou restauração atualiza atomicamente `MeetingVisitor` e a `MeetingAttendance` correspondente, força `PRESENT`, altera apenas campos permitidos e incrementa a revision uma vez;
- remoção faz soft delete atômico de `MeetingVisitor` e da attendance correspondente, incrementa a revision quando houver mudança real e nunca apaga `Person`;
- não criar vínculo automático com a célula.

### Resumo

- `eligibleCount`;
- `presentParticipants`, `absentParticipants`, `excusedParticipants` e `unmarkedParticipants`;
- `visitorCount`;
- `totalPresent = presentParticipants + visitorCount`;
- `markingProgress = marcados / elegíveis`;
- `attendancePercentage = presentParticipants / eligibleCount * 100`;
- percentuais são `null` quando `eligibleCount = 0`;
- visitantes sempre aparecem separadamente e ficam fora do denominador.

### Experiência web mobile-first

- carregar a lista completa e pesquisar localmente por nome, sem paginação;
- representar cada participante por controle segmentado acessível: `Presente`, `Ausente`, `Justificado` e `Limpar marcação`;
- usar labels textuais, foco visível, teclado e áreas de toque de no mínimo 44 px; cor ou gesto nunca serão o único indicador;
- manter a edição local até `Salvar frequência`, sem autosave ou swipe obrigatório;
- desabilitar duplo envio, preservar alterações após erro e oferecer retry manual;
- proteger dirty state na navegação interna e por `beforeunload`; após sucesso, limpar o estado pendente;
- em `409`, preservar a edição local, buscar o snapshot atual e oferecer comparar/reaplicar ou descartar/recarregar, sem sobrescrita automática;
- `401` usa o encerramento global da sessão; `403` mostra acesso negado sem formulário editável;
- atualizar o cache do snapshot canônico e invalidar o resumo/detalhe do encontro após lote, inclusão ou remoção de visitante;
- estender minimamente o `ApiClient` com `DELETE`, preservando autenticação e tratamento global de erros;
- cobrir loading/skeleton, vazio, erro/retry, acesso negado, cancelado/read-only, dirty, salvando, sucesso e conflito.

## 9. Contratos

### Entradas

`PUT /cells/:cellId/meetings/:meetingId/attendance`:

```ts
{
  expectedRevision: number;
  attendance: Array<{
    personId: string;
    status: "PRESENT" | "ABSENT" | "EXCUSED";
  }>;
}
```

O schema será estrito, aceitará no máximo 500 itens e rejeitará IDs repetidos.

`POST .../attendance/visitors` aceitará uma união discriminada entre:

- pessoa existente: `personId`, `invitedByPersonId?`, `observation?`;
- cadastro rápido: `name`, `phone?`, `invitedByPersonId?`, `observation?`.

O POST exige `Idempotency-Key`, validado conforme ADR 006. Para a mesma chave e payload, o replay devolve exatamente o mesmo status `201` e o mesmo corpo canônico da primeira resposta; reutilização com payload diferente retorna `409`. `churchId`, status da presença e autor não são aceitos do cliente.

### Saídas

`GET /cells/:cellId/meetings/:meetingId/attendance` retorna:

- identificação segura do encontro/célula e seu status;
- `revision`;
- participantes elegíveis com marcação ou `UNMARKED` calculado;
- visitantes e indicador calculado de contato pendente;
- resumo definido na seção 8;
- `isReadOnly` no snapshot e `isOperational` no resumo, permitindo representar encontro cancelado sem apagar ou zerar seu histórico;
- capacidades derivadas da policy para orientar a UI.

PUT e mutações de visitante retornam o snapshot canônico atualizado. Presenters não expõem `churchId`, `deletedAt`, tipos Prisma, contatos desnecessários ou detalhes internos.

### Endpoints e códigos HTTP

| Método | Caminho | Resultado |
|---|---|---|
| GET | `/cells/:cellId/meetings/:meetingId/attendance` | Snapshot combinado; `200` |
| PUT | `/cells/:cellId/meetings/:meetingId/attendance` | Replace-set atômico; `200` |
| POST | `/cells/:cellId/meetings/:meetingId/attendance/visitors` | Visitante criado/restaurado; `201`, inclusive no replay idempotente |
| DELETE | `/cells/:cellId/meetings/:meetingId/attendance/visitors/:personId` | Soft delete; `204`, repetição no-op |

Não criar endpoints separados para elegíveis, resumo ou uma requisição por pessoa.

### Erros

- `400`: payload inválido, campo desconhecido, duplicidade, limite excedido ou idempotency key inválida;
- `401`: sessão ausente/inválida;
- `403`: recurso local, mas papel/escopo insuficiente;
- `404`: célula, encontro ou pessoa invisível ao tenant, ou par cell/meeting incompatível;
- `409 ATTENDANCE_REVISION_CONFLICT`: edição concorrente real;
- `409 MEETING_ATTENDANCE_NOT_EDITABLE`: encontro cancelado;
- `409 PERSON_NOT_ELIGIBLE`: participante inelegível;
- `409 VISITOR_ALREADY_ELIGIBLE`: membro elegível enviado como visitante;
- `409 IDEMPOTENCY_KEY_REUSED`: chave reutilizada com payload diferente.

Erros terão código estável, mensagem segura e detalhes por campo quando aplicável.

### Permissões

| Ator | Consultar | Editar lote | Gerir visitante |
|---|---:|---:|---:|
| `ADMIN` / `PASTOR` | qualquer célula da igreja | sim | sim |
| `SUPERVISOR` | células supervisionadas | não | não |
| líder responsável | própria célula | sim | sim |
| trainee com `LEADER` | própria célula | não | não |
| papel não canônico | não | não | não |

A API validará sempre `Meeting -> Cell -> Church`, papel, vínculo hierárquico e estado. Será criada policy própria de attendance; a `MeetingEditPolicy` não será reutilizada.

### Auditoria

- um `AuditLog` agregado por lote, somente com participantes realmente alterados, IDs, status anterior/novo e contagens;
- limitar o payload agregado ao tamanho definido no ADR; se o diff exceder o limite, persistir contagens, hash determinístico e correlation ID, mantendo o detalhe nos logs operacionais protegidos e nunca incluindo PII;
- nunca registrar nomes, telefone ou outro contato;
- visitante gera evento separado com IDs e origem `existing_person | quick_create`;
- remoção registra os IDs afetados;
- no-op e rollback não geram auditoria;
- mutação, revision e auditoria ficam na mesma transação.

## 10. Etapas

### Milestone 1 — decisões e contratos

- registrar ADR de lote/revision/idempotência/visitante;
- criar contratos Zod e regras puras de status, resumo e elegibilidade;
- definir erros e OpenAPI.

### Milestone 2 — preflight e banco

- auditar sobreposições e inconsistências de memberships/attendance;
- preparar migrations aditivas separadas;
- validar plano de correção antes de aplicar constraints.

### Milestone 3 — elegibilidade e leitura

- implementar leitura histórica mínima de `CellMembership`;
- criar repositories e GET do snapshot;
- testar timezone, bordas e isolamento.

### Milestone 4 — lote

- implementar PUT atômico;
- tratar soft delete/restauração, no-op, revision e auditoria;
- estabilizar erros de concorrência e estado.

### Milestone 5 — visitantes

- criar `MeetingVisitor`;
- reutilizar busca/cadastro/deduplicação de people;
- implementar POST e DELETE idempotentes.

### Milestone 6 — API completa

- expor quatro endpoints, presenters, policy, guards e OpenAPI;
- cobrir matriz de autorização e cross-tenant.

### Milestone 7 — frontend

- criar feature, rota, cache, CTA e resumo;
- implementar editor mobile-first, dirty state, conflitos e visitantes;
- integrar estados de feedback e acessibilidade.

### Milestone 8 — validação e encerramento

- executar testes unitários, PostgreSQL, HTTP e Playwright;
- validar migrations e documentação;
- executar comandos raiz;
- mover o plano para `completed` somente após DoD real.

## 11. Critérios de aceitação

- [x] GET retorna somente participantes historicamente elegíveis e deduplicados.
- [x] Datas de entrada, saída e exclusão funcionam nas bordas do timezone da igreja.
- [x] Ausência de linha aparece como `UNMARKED`; `UNMARKED` nunca é persistido.
- [x] PUT valida no máximo 500 IDs únicos e é integralmente atômico.
- [x] Omissão remove logicamente marcação anterior e reenvio pode restaurá-la.
- [x] No-op não altera timestamps/revision nem cria auditoria.
- [x] Concorrência real retorna `409`; retry já aplicado retorna `200`.
- [x] Duas mutações com a mesma revision nunca confirmam: o compare-and-swap permite exatamente uma vencedora.
- [x] `SCHEDULED` e `COMPLETED` aceitam escrita autorizada; `CANCELED` é somente leitura.
- [x] Outro tenant nunca consegue inferir ou alterar frequência.
- [x] A matriz de papéis diferencia líder responsável, trainee e supervisor.
- [x] Visitante existente e cadastro rápido funcionam sem duplicar `Person`.
- [x] Membro elegível não pode ser visitante; visitante fica fora do denominador.
- [x] Remover visitante não apaga a pessoa.
- [x] Criar, restaurar ou remover visitante altera visitor, attendance, revision e auditoria de forma atômica.
- [x] Resumo e percentuais correspondem ao snapshot e tratam zero elegíveis.
- [x] UI possui loading, skeleton, vazio, erro/retry, 403, conflito, cancelado, salvando e sucesso.
- [x] UI é utilizável por teclado, sem gesto/cor exclusivos, com alvos de pelo menos 44 px.
- [x] Alterações não salvas são protegidas e erros preservam a edição local.
- [x] Fluxo E2E completo persiste, recarrega e reedita frequência e visitante.

## 12. Estratégia de testes

### Unitários

- elegibilidade em entrada/saída, timezone, soft delete e encontro histórico;
- saída e retorno à mesma célula por intervalos não sobrepostos, com encontros antes, entre e depois deles;
- pessoa inativa hoje, porém elegível no passado;
- enum, `UNMARKED`, ausência explícita, resumo e zero elegíveis;
- status de encontro e policy para todos os papéis;
- normalização do replace-set, no-op e conflito;
- retry com payload reordenado e estado canônico idêntico;
- regras de visitante.

### Integração

- repository PostgreSQL e consulta histórica de `CellMembership`;
- unique de attendance, restore após soft delete e constraints de membership;
- lote, omissão, rollback, revision e auditoria na mesma transação;
- duas transações com a mesma revision, comprovando uma única confirmação;
- múltiplos vínculos e isolamento por igreja;
- `MeetingVisitor`, FKs tenant-aware, deduplicação e remoção.
- restauração/remoção atômica de visitante e validação temporal do convidador.

### API

- GET, PUT, POST e DELETE;
- IDs duplicados/inexistentes/inelegíveis/de outro tenant;
- reenvio idempotente, replay e key reutilizada com outro payload;
- concorrência, estados do encontro e erros estáveis;
- encontro cancelado com snapshot histórico read-only e todas as mutações rejeitadas;
- matriz completa incluindo supervisor e trainee;
- payload acima do limite e campos desconhecidos.

### Frontend

- lista, busca local, controles e contadores;
- dirty state, salvar, retry, loading, erro, 401, 403 e 409;
- proteção em navegação interna e `beforeunload`, comparação/reaplicação em conflito e invalidação dos caches relacionados;
- diálogo de visitante, criação, duplicidade e remoção;
- teclado, leitor de tela e viewports móveis.

### E2E

Playwright deve cobrir: login -> célula -> encontro -> frequência -> marcar -> salvar -> recarregar -> confirmar -> alterar -> salvar novamente, incluindo ao menos um visitante. E2E HTTP deve validar isolamento e concorrência sem depender apenas da UI.

### Manual

- validar uso com uma mão em viewport móvel realista;
- simular duas abas editando a mesma frequência;
- inspecionar logs/auditoria para ausência de PII;
- conferir datas próximas à meia-noite e mudança de offset do timezone.

## 13. Segurança e privacidade

- derivar igreja da sessão e da cadeia `Meeting -> Cell -> Church`;
- nunca confiar em `churchId`, autor ou status de visitante enviados pelo cliente;
- filtrar queries no banco pelo tenant, não apenas após leitura;
- usar 404 para recurso externo/incompatível e 403 para escopo local negado;
- rejeitar pessoa/convidador de outra igreja;
- validar tamanho e conteúdo de observações e evitar PII em auditoria/logs;
- manter CSRF/origin, autenticação e rate limiting existentes;
- aplicar idempotência no cadastro rápido para evitar duplicação por retry;
- retornar apenas contatos necessários para o fluxo autorizado.

## 14. Migração de dados

1. Executar preflight somente leitura para memberships sobrepostos, combinações status/data inválidas, attendances duplicadas logicamente e órfãos.
2. Criar migration aditiva para `attendanceRevision`, `MeetingVisitor`, FKs, unique, checks e índices independentes dos dados problemáticos.
3. Produzir relatório dos memberships incompatíveis; não corrigi-los automaticamente sem regra auditável.
4. Após saneamento aprovado, criar migration separada para checks e partial unique de vínculo ativo.
5. Validar `migrate deploy` em cópia representativa e plano de lock/tempo.

Não alterar migration aplicada. Não é necessário converter o enum de attendance nem preencher `UNMARKED`. `attendanceRevision` inicia em zero. Seeds só serão ajustadas após o modelo estabilizar.

## 15. Observabilidade

- logs estruturados com request/correlation ID, endpoint, duração, contagens e resultado, sem nomes/contatos;
- métricas de latência e erro por endpoint, `409`, tamanho do lote, retries e rollback;
- alerta para crescimento anormal de conflitos, falhas de deduplicação ou tentativa cross-tenant;
- eventos de auditoria agregados para alteração de lote e eventos separados de visitante;
- monitorar tempo da consulta histórica e uso dos índices com `EXPLAIN ANALYZE` em dados representativos.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Data civil comparada incorretamente a timestamp | Média | Alto | limites UTC no timezone da igreja e testes de borda |
| Memberships atuais incompatíveis com constraints | Alta | Alto | preflight, relatório e migration separada |
| Vazamento cross-tenant | Baixa | Crítico | filtros tenant-aware, 404 e testes negativos |
| Trainee receber escrita pela policy antiga | Média | Alto | policy própria e matriz automatizada |
| Perda de atualização concorrente | Média | Alto | revision, transação e retry determinístico |
| Mudança de timezone alterar limites de encontro antigo | Baixa | Médio | timezone vigente explicitado, sem cache permanente e testes de borda |
| Replace-set apagar marcações por ambiguidade | Média | Alto | contrato explícito, confirmação UI e testes de omissão |
| Cadastro rápido duplicar `Person` | Média | Alto | reutilizar normalização, deduplicação e idempotência |
| Visitante entrar no denominador | Média | Médio | regra pura única e testes do resumo |
| Auditoria excessiva ou com PII | Média | Alto | evento agregado e allowlist de campos |
| Escopo crescer para gestão de membros/relatórios | Média | Médio | milestones e fora de escopo explícitos |
| E2E instável por infraestrutura existente | Média | Médio | separar HTTP/UI e corrigir ambiente antes do aceite |

## 17. Estratégia de reversão

- frontend: remover CTA/rota por feature flag ou rollback do deploy, mantendo API compatível;
- API: desabilitar mutações e preservar GET/read-only durante incidente;
- banco: migrations são aditivas; em rollback de aplicação, manter colunas/tabelas sem uso;
- não remover dados de attendance/visitor automaticamente;
- constraints novas podem ser revertidas por migration compensatória específica, nunca editando migrations aplicadas;
- restaurar backup somente em incidente de dados confirmado e com procedimento operacional aprovado.

## 18. Comandos

Comandos planejados para a futura execução, exclusivamente com npm/npm workspaces:

```bash
npm run db:migrate:create --workspace @mission-atos/database -- --name prepare_attendance_management
npm run db:migrate:create --workspace @mission-atos/database -- --name enforce_attendance_membership_invariants
npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/database
npm run test --workspace @mission-atos/api
npm run test:attendance:e2e --workspace @mission-atos/api
npm run test --workspace @mission-atos/web
npm run test:e2e --workspace @mission-atos/web -- attendance
npm run lint
npm run typecheck
npm test
npm run build
```

Scripts ainda inexistentes deverão ser criados no milestone correspondente, sem introduzir outro gerenciador de pacotes.

## 19. Definition of Done

- [x] ADR 007 registrada e contratos compartilhados implementados.
- [x] Preflight executado no banco de teste limpo, sem anomalias.
- [x] Migrations aditivas aplicadas com sucesso no PostgreSQL de teste.
- [x] Elegibilidade histórica e isolamento por igreja validados no PostgreSQL.
- [x] Quatro endpoints implementados, documentados e cobertos por testes automatizados.
- [x] Lote atômico, revision, idempotência e auditoria implementados.
- [x] Visitantes implementados sem duplicar fonte de verdade.
- [x] Policy própria e matriz de papéis cobertas por testes unitários.
- [x] Rota web, integração no encontro e experiência mobile-first implementadas.
- [x] Acessibilidade, responsividade e todos os estados de feedback validados.
- [x] Testes unitários, integração, API, frontend e E2E verdes.
- [x] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` verdes.
- [x] Documentação e OpenAPI atualizadas.
- [x] Nenhuma frequência, contato ou dado de outro tenant é exposto.
- [x] Plano movido para `completed` somente após evidência do DoD.

## 20. Registro de progresso

| Data | Status | Registro | Evidência |
|---|---|---|---|
| 2026-08-22 | Planejado | Repositório, PRD, arquitetura, template, planos concluídos, schema, domínio, contratos, API e frontend analisados; decisões de produto consolidadas | Este documento |
| 2026-08-22 | Revisado | Concorrência CAS, intervalos imutáveis de membership, snapshot cancelado, visitantes atômicos, auditoria limitada, frontend mobile-first e testes adicionais especificados | Revisão integral do Plano 009 |
| 2026-08-22 | Implementado | Domínio, contratos, schema/migrations, módulo API, policy, lote CAS, visitantes, auditoria, rota web e editor mobile-first implementados | Código e migrations do Plano 009 |
| 2026-08-22 | Validado parcialmente | Prisma format/validate/generate, lint, typecheck, testes unitários e build executados com sucesso | Saídas dos comandos npm no ambiente local |
| 2026-08-22 | Infraestrutura pendente | Migrations, integração PostgreSQL, E2E HTTP e Playwright não executaram porque TEST_DATABASE_URL não está configurada e o Docker Desktop não está disponível | Falhas de pré-condição dos comandos conectados; DoD permanece aberto |
| 2026-08-22 | Validado em PostgreSQL | As 15 migrations foram aplicadas no banco de teste; seed idempotente e integração de banco/API passaram | database: 8 testes; API integration: 26 testes |
| 2026-08-22 | E2E validado | Fluxo HTTP de attendance e fluxo Playwright mobile executados com persistência, edição e visitante | attendance HTTP: 3 testes; Playwright Chromium: 1 fluxo completo |
| 2026-08-22 | Cache corrigido | Cache gerado do Next foi removido após 404 espúrio do Turbopack; build e rota dinâmica foram recompilados | Build web e Playwright verdes |
| 2026-08-24 | Revisão final | Corrigidos o índice parcial redundante, a resposta `500` em conflito serializável e a navegação acessível do controle segmentado | Migration corretiva, E2E concorrente e Playwright mobile |
| 2026-08-24 | Concluído | Critérios de aceitação e DoD confirmados; nenhuma ocorrência Crítica, Alta ou Média permaneceu aberta | 16 migrations; PostgreSQL 8/8; integração API 26/26; API E2E 30/30; Playwright 30/30; comandos raiz verdes |

## 21. Encerramento oficial

### Resumo e decisões

O Plano 009 foi concluído em 2026-08-24. A solução mantém frequência como parte
do monólito modular, usa replace-set explícito, revisão otimista, transações
serializáveis, exclusão lógica, auditoria agregada e `Person` como fonte única de
identidade para participantes e visitantes. Não foi criado fechamento separado,
`UNMARKED` persistido, dashboard analítico, relatório global ou qualquer entrega
do Plano 010.

### Elegibilidade e CellMembership

- a elegibilidade usa a data civil do encontro e os limites UTC derivados do
  timezone IANA da igreja;
- `joinedAt < dayEnd`, `leftAt >= dayStart` e exclusões iguais ou posteriores ao
  início do dia preservam o histórico;
- vínculos futuros ou encerrados antes do encontro são excluídos;
- a leitura por `Person` deduplica intervalos elegíveis;
- `CellMembership` permanece sem CRUD novo e representa intervalos históricos;
- checks garantem datas/status coerentes e a unique parcial garante um único
  vínculo ativo aberto por pessoa e igreja.

### Domínio, contratos e aplicação

- domínio: status editáveis e cálculo do resumo, percentuais e visitantes fora
  do denominador;
- contratos Zod: parâmetros estritos, lote de até 500 IDs únicos, união
  discriminada de visitante e snapshot canônico;
- casos de uso no `AttendanceService`: consultar snapshot, salvar lote, adicionar
  visitante e remover visitante;
- persistência: o client PostgreSQL tenant-aware é injetado como porta de
  persistência do módulo; não foi criada uma interface de repository adicional
  porque existe um único adapter/consumidor nesta etapa;
- policy própria diferencia administrador/pastor, supervisor, líder responsável
  e trainee;
- erro serializável Prisma `P2034` relê o snapshot após rollback e resulta em
  retry idempotente `200` ou conflito estável `409`.

### Migrations e invariantes

- `20260822120000_prepare_attendance_management`: `attendanceRevision`,
  `MeetingVisitor`, FKs tenant-aware, uniques, checks e índices;
- `20260822121000_enforce_attendance_membership_invariants`: preflight, checks de
  intervalo/status, índice histórico e unique parcial ativa;
- `20260824190000_remove_redundant_membership_index`: remove o índice legado que
  permaneceu por divergência de nome, sem editar migrations aplicadas;
- 16 migrations estão aplicadas e sem pendências no PostgreSQL de teste;
- `(churchId, meetingId, personId)` é único em attendance e visitor, garantindo
  na prática uma linha por `meetingId + personId` dentro do tenant.

### API, auditoria e visitantes

- `GET /cells/:cellId/meetings/:meetingId/attendance`;
- `PUT /cells/:cellId/meetings/:meetingId/attendance`;
- `POST /cells/:cellId/meetings/:meetingId/attendance/visitors`;
- `DELETE /cells/:cellId/meetings/:meetingId/attendance/visitors/:personId`;
- lote, revision e auditoria confirmam atomicamente; no-op não incrementa nem
  audita; duas mudanças reais com a mesma revisão produzem uma vencedora;
- auditoria guarda IDs/diffs ou hash agregado, sem nome, telefone ou contato;
- visitante existente e cadastro rápido reutilizam `Person`, persistem presença
  `PRESENT`, ficam fora do denominador e são removidos sem apagar a pessoa;
- filtros por igreja existem em contexto, elegibilidade, attendance, visitor,
  pessoa, convidador, idempotência e auditoria; recursos externos retornam 404.

### Frontend e experiência mobile

- rota `/cells/[id]/meetings/[meetingId]/attendance` integrada ao detalhe do
  encontro;
- edição local explícita, busca, resumo, visitantes, dirty state, prevenção de
  navegação, estados de erro/403/409/read-only e cache atualizado;
- radiogroup com foco roving, setas, Home/End, rótulos textuais e foco visível;
- viewport 390x844 validada sem overflow e com alvos de toque de pelo menos 44px;
- diálogo preserva e restaura foco; não há autosave nem gesto obrigatório.

### Testes, E2E, comandos e resultados

- PostgreSQL: 8/8 testes de integração;
- integração da API: 26/26;
- E2E HTTP completo da API: 30/30; attendance dedicado: 5/5, incluindo bordas
  históricas, unique, lote concorrente, visitantes, trainee e cross-tenant;
- Playwright Chromium: 30/30, incluindo o fluxo mobile completo;
- testes unitários raiz: 286/286;
- `npm run lint`: 6/6 tarefas;
- `npm run typecheck`: 13/13 tarefas;
- `npm test`: 11/11 tarefas;
- `npm run build`: 7/7 tarefas, incluindo NestJS e rota Next.js de attendance.

Fluxo comprovado: login -> célula -> encontro -> frequência -> marcar -> salvar
-> recarregar -> alterar -> salvar, seguido de cadastro de visitante.

### Limitações, riscos aceitos e melhorias futuras

- somente o banco PostgreSQL de teste recebeu as migrations nesta validação;
- a execução visual automatizada usa Chromium e viewport móvel emulada, não um
  dispositivo físico;
- o timezone histórico usa a configuração vigente da igreja, sem snapshot por
  encontro; risco residual aceito e já documentado na ADR;
- o lote permanece limitado a 500 participantes e a UI carrega o snapshot
  completo, adequado ao MVP;
- métricas avançadas, relatórios globais, dashboard analítico, offline mobile e
  extração de repository dedicado ficam para planos futuros somente se houver
  necessidade comprovada;
- warnings não bloqueantes do Next sobre `scroll-behavior` e filesystem lento no
  ambiente de desenvolvimento não afetam corretude, build ou E2E.

### Progresso final

Revisão de código, segurança, banco, contratos, API, frontend e testes concluída.
Não restam problemas Críticos, Altos ou Médios conhecidos no escopo do Plano 009.
O produto está tecnicamente pronto para iniciar o planejamento do Plano 010,
sem que qualquer funcionalidade dele tenha sido antecipada.
