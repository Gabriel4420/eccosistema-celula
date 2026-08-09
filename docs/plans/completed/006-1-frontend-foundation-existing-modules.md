# Plano 006.1 — Fundação do frontend para módulos existentes

**Status:** Concluído
**Responsável:** a definir  
**Criado em:** 2026-08-02  
**Atualizado em:** 2026-08-08  
**Concluído em:** 2026-08-08
**PRD relacionado:** RF-001, RF-003, RF-005, RF-006, RF-007, RF-008, RF-018; RN-001 a RN-012; usabilidade, segurança e escopo do MVP  
**ADRs relacionadas:** `docs/decisions/003-token-transport.md`; criar ADR somente se o transporte de sessão ou a biblioteca visual mudar  
**Branch ou issue:** a definir

---

## 1. Objetivo

Planejar a transformação de `apps/web` em uma aplicação Next.js navegável, autenticada, responsiva, acessível e integrada à API real já existente, cobrindo somente autenticação, perfil, usuários, igreja e pessoas.

Ao final da futura implementação, a aplicação deverá permitir demonstrar os fluxos autorizados desses módulos, reutilizar os contratos compartilhados, manter o access token apenas em memória, renovar a sessão pelo refresh token `HttpOnly`, apresentar estados de carregamento/erro/vazio e estar preparada estruturalmente para receber novos módulos sem antecipá-los.

O dashboard desta etapa será somente uma página de boas-vindas com atalhos. Não conterá indicadores, gráficos ou consultas analíticas.

## 2. Contexto

Os planos 001 a 006 entregaram o monorepo npm, a API NestJS, PostgreSQL/Prisma, autenticação e autorização, gerenciamento de usuários, igreja e pessoas. `apps/web` ainda contém apenas a página técnica inicial, CSS global e um teste Playwright de fundação.

A inspeção dos controllers reais confirmou que a API não possui prefixo global. As rotas efetivas começam em `/auth`, `/users`, `/church` e `/people`. Os guards globais exigem `Authorization: Bearer` em toda rota que não tenha `@Public()`; `@Roles()` adiciona a restrição grosseira por papel, e os commands revalidam estado e tenant nas mutações.

O fluxo real de sessão, definido no ADR 003 e implementado na API, é:

- `POST /auth/login` devolve access token JWT no corpo e grava refresh token opaco em cookie `HttpOnly`;
- o access token dura por padrão 600 segundos e deve permanecer somente em memória;
- o refresh token dura por padrão 30 dias, usa `SameSite=Strict`, `Path=/auth` e `Secure` fora do desenvolvimento;
- `POST /auth/refresh` consome e rotaciona o cookie, devolvendo novo access token;
- `POST /auth/logout` revoga a sessão corrente e limpa o cookie;
- refresh e logout validam `Origin` quando presente;
- o login resolve a igreja no servidor por `AUTH_CHURCH_ID` no MVP.

Como o cookie pertence à API e tem `Path=/auth`, o middleware e os Server Components do domínio web não conseguem, na arquitetura atual, validar a sessão de forma autoritativa. O frontend deverá usar um boundary autenticado client-side, sem copiar o refresh token para JavaScript e sem persistir o access token. A API continua sendo a autoridade de autenticação e autorização.

## 3. Escopo

- Organizar rotas por grupos público e autenticado no App Router.
- Criar layout público e shell autenticado com sidebar, header, breadcrumbs e menu do usuário.
- Criar `/login`, `/dashboard`, `/profile`, `/users`, `/users/new`, `/users/[id]`, `/church/settings`, `/people`, `/people/new` e `/people/[id]`.
- Criar páginas de acesso negado, erro e não encontrado.
- Implementar sessão client-side compatível com o ADR 003: access token em memória e refresh cookie inacessível ao JavaScript.
- Criar cliente HTTP tipado com `credentials: "include"`, Bearer, timeout/abort, parsing seguro, erro normalizado e uma única repetição após refresh.
- Reutilizar schemas Zod de `@mission-atos/contracts` para entradas e respostas que já possuam contrato compartilhado.
- Criar estado remoto, cache, invalidação, paginação, filtros e pesquisa.
- Criar formulários acessíveis, validação, feedback de sucesso/erro e confirmação de ações críticas.
- Ocultar ou desabilitar navegação e ações conforme os papéis conhecidos, sem tratar isso como controle de segurança.
- Criar componentes compartilhados de layout, campos, tabela, paginação, feedback, skeleton, vazio, diálogo e boundary.
- Planejar testes unitários, de integração e Playwright E2E dos fluxos existentes.
- Documentar execução local, variáveis públicas, sessão, permissões e testes.
- Resolver ou aprovar tratamento das lacunas de API da seção 6 antes das telas afetadas.
- Incluir como pré-requisito técnico aprovado a consulta mínima do catálogo de papéis e os schemas compartilhados de saída de users/church, sem mudar regras de negócio ou persistência.

## 4. Fora de escopo

- Células ou vínculos de pessoas com células.
- Encontros, frequência e visitantes em encontros.
- Relatórios, dashboard analítico, indicadores, gráficos ou mapa.
- Notificações push, chat ou envio de e-mail.
- Recuperação pública de senha.
- Upload de arquivos ou logotipo.
- Aplicativo mobile, sincronização, operação offline completa, PWA avançada ou Service Worker customizado.
- Criação pública de igreja, multi-tenant SaaS ou múltiplas igrejas por usuário.
- Funcionalidades ou endpoints ausentes da API sem aprovação explícita.
- Alteração do transporte de tokens, relaxamento de cookies ou persistência do access token.
- Regras de negócio duplicadas no frontend.
- Plano 007 ou qualquer módulo posterior.

## 5. Suposições

- Web e API serão servidos em origens permitidas por `CORS_ORIGINS`, com HTTPS fora do desenvolvimento.
- O domínio de implantação manterá web e API no mesmo site para que `SameSite=Strict` funcione; essa topologia precisa ser confirmada na seção 6.
- `NEXT_PUBLIC_API_URL` continua sendo a única URL pública necessária para o cliente HTTP.
- A API permanece a autoridade; menus e guards visuais são conveniência de UX.
- O principal inicial vem de `AuthResponse.data.user`; após bootstrap/refresh, `/users/me` fornece os dados de perfil exibíveis.
- Papéis canônicos existentes são `ADMIN`, `PASTOR`, `SUPERVISOR` e `LEADER`.
- Datas de API são UTC; datas de nascimento são datas civis `YYYY-MM-DD` e não devem sofrer conversão de fuso.
- Listagens usam paginação da API, com estado refletido na URL.
- A implementação será progressiva e manterá cada milestone navegável e testável.
- Nenhuma migration ou mudança de banco é necessária para este plano.

## 6. Perguntas e decisões pendentes

### Decisões confirmadas pela implementação

- [x] Access token: JWT Bearer no corpo de login/refresh, TTL padrão de 600 segundos e armazenamento somente em memória.
- [x] Refresh token: cookie opaco `HttpOnly`, `SameSite=Strict`, `Path=/auth`, rotacionável e inacessível ao frontend.
- [x] Bootstrap: tentativa única de `POST /auth/refresh`; sucesso instala a sessão em memória, falha deixa o usuário anônimo.
- [x] Rotas protegidas: boundary client-side no layout autenticado; middleware não é autoridade de sessão na arquitetura atual.
- [x] Renovação: single-flight, antecipada perto da expiração e, no máximo, uma repetição de requisição após `401`.
- [x] Logout: `POST /auth/logout`, limpeza imediata do estado/cache local mesmo se a chamada falhar e redirecionamento para `/login`.
- [x] `403`: preservar sessão e apresentar acesso negado; `401` após refresh inválido: encerrar sessão.
- [x] Server Components permanecem padrão para layouts e conteúdo estático; dados privados e sessão ficam em ilhas Client Component.
- [x] Não usar `localStorage`, `sessionStorage`, IndexedDB ou cookie legível por JavaScript para tokens.

### Pendências e lacunas bloqueantes

- [x] **Topologia de produção:** decisão conservadora registrada — manter web e API same-site no mesmo registrable domain (como exige `SameSite=Strict` do ADR 003); desenvolvimento local em `localhost:3000` + `localhost:3001` (same-site). Nenhuma alteração de transporte; qualquer topologia cross-site futura exige ADR e revisão de segurança.
- [x] **Catálogo de papéis aprovado como correção mínima:** adicionar `GET /users/managed-roles`, autenticado, restrito a `ADMIN`, derivando `churchId` exclusivamente do principal e retornando somente papéis canônicos, ativos e gerenciáveis da mesma igreja em `{ data: [{ id, name }], meta: {} }`. A consulta será implementada no módulo users existente, sem migration, novo papel ou regra de negócio adicional.
- [x] **Contratos de saída compartilhados aprovados:** exportar em `packages/contracts` schemas Zod aditivos que reproduzam exatamente as allowlists atuais de `user.presenter.ts` e `church.presenter.ts`, incluindo item, coleção, settings e catálogo de papéis, com testes de paridade e sem alterar respostas existentes.
- [x] **Detalhe de pessoa inativa:** decisão conservadora registrada — sem mudança de API. Reativação de pessoa inativa ocorre somente pela linha da listagem (`ADMIN`), via `PATCH /people/:id/status`; `/people/[id]` permanece exclusivo para registros ativos (a API retorna `404` para inativos) e a UI não oferece navegação de detalhe para pessoas inativas.
- [x] **Possíveis duplicidades:** decisão conservadora registrada — a UI apresenta apenas aviso genérico de conflito (`409 PERSON_DUPLICATE`), sem lista de candidatos; consulta dedicada de duplicidades fica para plano separado.
- [x] **Biblioteca visual e formulários:** decisão conservadora registrada — componentes próprios mínimos e acessíveis (HTML/CSS primitives) com tokens centralizados; nenhuma biblioteca de componentes/tabelas/notificações. `@tanstack/react-query` não aprovado nesta etapa (uso de cache próprio leve conforme alternativa nativa do plano). A implementação demonstrou que APIs nativas de formulário + Zod atendem ao escopo sem `react-hook-form` ou `@hookform/resolvers`; essa simplificação está aprovada.

Nenhuma dessas lacunas autoriza inventar rota, contrato ou dado. A implementação deverá bloquear ou reduzir a UI afetada até a decisão ser aprovada e registrada no plano.

## 7. Áreas afetadas

### Aplicação web

Estrutura proposta:

```text
apps/web/
├── app/
│   ├── (public)/login/page.tsx
│   ├── (public)/error.tsx
│   ├── (authenticated)/
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── users/{page.tsx,loading.tsx,error.tsx,new/page.tsx,[id]/page.tsx}
│   │   ├── church/settings/{page.tsx,loading.tsx,error.tsx}
│   │   └── people/{page.tsx,loading.tsx,error.tsx,new/page.tsx,[id]/page.tsx}
│   ├── access-denied/page.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── src/
│   ├── features/{auth,profile,users,church,people}/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── schemas/
│   ├── shared/
│   │   ├── api/
│   │   ├── components/
│   │   ├── navigation/
│   │   └── utils/
│   └── providers/
└── tests/{unit,integration,e2e}/
```

- Usar Server Components para shells estáticos, metadados e composição.
- Usar Client Components apenas para sessão, consultas autenticadas, formulários, menus interativos, filtros e diálogos.
- Manter módulos por feature; impedir imports de uma feature para detalhes internos de outra.
- Centralizar sessão e cliente HTTP em `src/shared`/`src/providers`, não em páginas.
- Reservar `features/*/schemas` exclusivamente a composição de formulário e estado visual fora do protocolo HTTP; requests, responses, enums e normalizações da API vêm de `@mission-atos/contracts` e não podem ser redeclarados no web.
- Manter estilos e tokens visuais centralizados, com foco visível, contraste e redução de movimento.
- Usar `error.tsx` por grupo de layout para preservar o shell apropriado e boundaries locais em users, church e people para conter falhas de uma feature; usar `loading.tsx` nos segmentos autenticados que fazem bootstrap/carregamento.

### API

- Nenhuma alteração nesta etapa de planejamento.
- Durante a implementação, adicionar somente `GET /users/managed-roles` ao módulo users existente como correção mínima aprovada.
- A query usa port/repository existentes, filtra `churchId` do principal, `deletedAt: null` e nomes contidos em `managedRoleNames`, ordena por `name ASC, id ASC` e não acessa Prisma pelo controller.
- O endpoint exige `@Roles("ADMIN")`, retorna apenas `{ id, name }`, não aceita body/query de tenant e reutiliza o tratamento de erros atual.
- Controllers reais inspecionados: identity, users, churches e people.

### Banco de dados

- Nenhuma alteração de schema, migration, seed ou consulta Prisma prevista.

### Contratos compartilhados

- Reutilizar os contratos existentes de auth, users, church e people.
- Adicionar schemas de saída de users e church com paridade exata aos presenters atuais, mais `managedRoleSchema` e `managedRolesEnvelopeSchema` para a correção aprovada.
- Exportar os tipos inferidos correspondentes por `packages/contracts/src/index.ts`, sem tipos Prisma ou campos internos.
- O frontend só integra users/church após os testes de contrato confirmarem a paridade.
- Tipos de estado visual e view models permanecem locais ao web e não entram em contratos HTTP.

### Infraestrutura

- Configurar execução conjunta local de web/API/PostgreSQL somente por scripts npm existentes ou documentados.
- Confirmar CORS, HTTPS e topologia same-site antes de homologação.
- Nenhum deploy de produção neste plano.

### Documentação

- Atualizar README do web com rotas, sessão, variáveis, permissões e testes.
- Documentar a matriz visual como derivada da API, não como mecanismo de segurança.
- Atualizar o registro de progresso deste plano durante a implementação.

## 8. Modelo e regras de negócio

### 8.1 Arquitetura e estado

- `SessionProvider` mantém `{ status, accessToken, expiresAt, principal }` somente em memória.
- Estados de sessão: `bootstrapping`, `anonymous`, `authenticated`, `refreshing` e `ending`.
- Apenas o provider conhece o token; features recebem funções autenticadas, principal mínimo e capacidades derivadas.
- O cliente HTTP adiciona Bearer somente a requests privados e sempre usa `credentials: "include"` em auth.
- Refresh simultâneo é deduplicado por uma promise única. A requisição original repete no máximo uma vez.
- A renovação antecipada ocorre em `expiresAt - min(60 segundos, max(10 segundos, 10% de expiresIn))`, com um único timer por sessão. Ao recuperar `visibility` ou foco, o provider recalcula o tempo restante e renova antes de liberar requests quando estiver dentro dessa margem; nenhuma rotina cria timers encadeados enquanto um refresh estiver em voo.
- Falha `401` em login é mensagem genérica; `401` privado tenta refresh uma vez; novo `401` encerra a sessão.
- `403` não dispara refresh e navega para `/access-denied` ou mostra erro inline conforme o contexto.
- Cache privado é esvaziado em logout, troca de usuário ou falha definitiva da sessão.
- Não logar bodies de auth, Bearer, cookies, senhas ou dados pessoais.

### 8.2 Rotas e telas

| Rota web | Tipo | Conteúdo | Acesso visual |
| --- | --- | --- | --- |
| `/login` | pública | e-mail, senha, erro genérico, loading | anônimo; autenticado vai a `/dashboard` |
| `/dashboard` | privada | boas-vindas e atalhos autorizados | qualquer autenticado |
| `/profile` | privada | dados próprios e alteração de nome/senha | qualquer autenticado |
| `/users` | privada | lista, busca, status, papel, paginação | `ADMIN` |
| `/users/new` | privada | criação administrativa | `ADMIN`, após conclusão da Etapa 1.1 |
| `/users/[id]` | privada | detalhe, edição, status, papéis e reset | `ADMIN` |
| `/church/settings` | privada | dados institucionais e settings; edição condicional | leitura autenticada; edição `ADMIN` |
| `/people` | privada | lista, busca, status/gênero e paginação | quatro papéis; inativos somente `ADMIN` |
| `/people/new` | privada | cadastro | `ADMIN`, `PASTOR` |
| `/people/[id]` | privada | detalhe/edição/status | leitura quatro papéis; edição `ADMIN`/`PASTOR`; status `ADMIN` |
| `/access-denied` | pública de erro | explicação e retorno seguro | qualquer usuário |

`/` será um entrypoint client-side mínimo: mantém o estado de bootstrap sem conteúdo privado e, após a tentativa única de refresh, usa `replace` para `/dashboard` quando autenticado ou `/login` quando anônimo. Rotas desconhecidas usam `not-found.tsx`. Erros inesperados usam o boundary mais próximo sem stack, SQL ou detalhes internos.

### 8.3 Componentes

- Shell: `AuthenticatedShell`, `Sidebar`, `Header`, `UserMenu`, `Breadcrumbs`, `MobileNavigation`.
- Segurança visual: `RequireSession`, `RequireRole`, `Can`, sempre fail-closed.
- Feedback: `Alert`, `FieldError`, `LoadingButton`, `Skeleton`, `EmptyState`, `ErrorState`, região `aria-live`.
- Dados: tabela semântica responsiva, paginação, filtros, busca com debounce e botão de limpar.
- Formulários: campos com label, descrição, erro, indicação de obrigatório e associação por `id`.
- Ações críticas: diálogo acessível com foco confinado, Escape, retorno de foco e texto explícito.
- Feature components não recebem nem exibem `churchId`, tokens ou campos internos.

### 8.4 Cache e atualização

- Chaves incluem recurso, ID e filtros normalizados; nunca incluem access token ou PII livre sem necessidade.
- Perfil: cache curto; invalidar após alteração própria e alteração de senha.
- Usuários: cache por página/filtros; invalidar lista e detalhe após qualquer mutação.
- Igreja: chaves separadas para dados e settings; atualizar cache pelo retorno do PATCH e revalidar em background.
- Pessoas: cache por página/filtros e detalhe; invalidar listas/detalhe após create/update/status.
- Não usar optimistic update em status, papéis, senha ou operações com invariantes de último administrador.
- Mutações usam `retry: 0`. Consultas podem repetir no máximo uma vez somente para falha transitória de rede ou `5xx`; nunca repetir automaticamente `400`, `401`, `403`, `404`, `409` ou `429`.
- Busca e filtros ficam em `searchParams`; o usuário pode compartilhar/voltar sem perder o estado.

### 8.5 Formulários, normalização e acessibilidade

- Usar schemas compartilhados como fonte de validação; mensagens de interface podem ser localizadas sem mudar regras.
- Não transformar campos omitidos em `null`; PATCH envia somente campos alterados.
- Preservar `YYYY-MM-DD` para nascimento e usar fuso da igreja somente na apresentação de instantes.
- Exigir confirmação para desativação/reativação, troca/reset de senha e substituição de papéis quando houver perda de acesso. Logout é imediato, salvo quando existir formulário alterado e não salvo; nesse caso, confirmar o descarte das alterações, não o logout em si.
- Alvo mínimo WCAG 2.2 AA: contraste, foco, teclado, landmarks, headings, labels, mensagens associadas e movimento reduzido.
- Validar todas as páginas em 360 × 800, 768 × 1024 e 1280 × 800, além de zoom de 200%, sem overflow horizontal global, sobreposição, corte de foco ou ação essencial inacessível; tabelas terão alternativa em cartões/lista quando necessário.

## 9. Contratos

### Entradas

Todos os caminhos abaixo foram encontrados nos controllers reais, sem prefixo global:

- `apps/api/src/modules/identity/presentation/auth.controller.ts`: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` e `POST /auth/change-password`;
- `apps/api/src/modules/users/presentation/users.controller.ts`: `GET /users/me`, `PATCH /users/me`, `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/status`, `PUT /users/:id/roles` e `POST /users/:id/reset-password`;
- `apps/api/src/modules/churches/presentation/church.controller.ts`: `GET /church`, `PATCH /church`, `GET /church/settings` e `PATCH /church/settings`;
- `apps/api/src/modules/people/presentation/people.controller.ts`: `GET /people`, `GET /people/:id`, `POST /people`, `PATCH /people/:id` e `PATCH /people/:id/status`.

Os 22 endpoints originais existem no código atual. A adição aprovada `GET /users/managed-roles` também foi implementada e testada antes do consumo pelo frontend, totalizando 23 endpoints integrados.

| Endpoint API | Entrada real | Tela/uso | Papéis autorizados no código |
| --- | --- | --- | --- |
| `POST /auth/login` | `{ email, password }` | `/login` | público; rate limit 10/15 min |
| `POST /auth/refresh` | cookie de refresh; sem body | bootstrap/renovação | público, com validação de Origin |
| `POST /auth/logout` | cookie de refresh; sem body | menu/logout | público, com validação de Origin |
| `POST /auth/change-password` | `{ currentPassword, newPassword }` | `/profile` | qualquer autenticado |
| `GET /users/me` | sem entrada | `/profile`, header | qualquer autenticado |
| `PATCH /users/me` | `{ firstName?, lastName? }`, ao menos um | `/profile` | qualquer autenticado |
| `GET /users` | `page?`, `pageSize?`, `search?`, `status?`, `roleId?` | `/users` | `ADMIN` |
| `GET /users/managed-roles` | sem body/query; `churchId` do principal | `/users/new`, `/users/[id]` | `ADMIN`; implementado, isolado por igreja e testado |
| `GET /users/:id` | UUID | `/users/[id]` | `ADMIN` |
| `POST /users` | `{ firstName, lastName, email, initialPassword, roleIds }` | `/users/new` | `ADMIN` |
| `PATCH /users/:id` | `{ firstName?, lastName?, email? }` | `/users/[id]` | `ADMIN` |
| `PATCH /users/:id/status` | `{ status: ACTIVE|BLOCKED }` | `/users/[id]` | `ADMIN` |
| `PUT /users/:id/roles` | `{ roleIds: UUID[] }` | `/users/[id]` | `ADMIN` |
| `POST /users/:id/reset-password` | `{ newPassword }` | `/users/[id]` | `ADMIN` |
| `GET /church` | sem entrada | `/church/settings` | qualquer autenticado |
| `PATCH /church` | patch institucional estrito | `/church/settings` | `ADMIN` |
| `GET /church/settings` | sem entrada | `/church/settings` | qualquer autenticado |
| `PATCH /church/settings` | `{ timezone?, weekStartsOn? }` | `/church/settings` | `ADMIN` |
| `GET /people` | `page?`, `pageSize?`, `search?`, `status?`, `gender?` | `/people` | `ADMIN`, `PASTOR`, `SUPERVISOR`, `LEADER`; inativos só `ADMIN` pela aplicação |
| `GET /people/:id` | UUID; somente ativa | `/people/[id]` | `ADMIN`, `PASTOR`, `SUPERVISOR`, `LEADER` |
| `POST /people` | `{ fullName, phone?, email?, birthDate?, gender?, observations? }` | `/people/new` | `ADMIN`, `PASTOR` |
| `PATCH /people/:id` | mesmos campos opcionais, ao menos um | `/people/[id]` | `ADMIN`, `PASTOR` |
| `PATCH /people/:id/status` | `{ status: ACTIVE|INACTIVE }` | `/people/[id]` ou lista | `ADMIN` |

No código atual não existem controllers para recuperação pública de senha, consulta de candidatos a possíveis duplicidades ou CRUD plural de igrejas. O catálogo mínimo de papéis foi implementado como aprovado; os demais permanecem fora do escopo.

### Saídas

- Auth: `AuthResponse` compartilhado com `{ data: { accessToken, tokenType, expiresIn, user: { id, churchId, roles } }, meta: {} }`. `churchId` é contexto interno da sessão e não deve ser exibido nem persistido.
- Usuário: a forma verificada em `apps/api/src/modules/users/presentation/user.presenter.ts` é `{ data: { id, firstName, lastName, email, status, roles[{id,name}], createdAt, updatedAt }, meta: {} }`; a coleção inclui `page`, `pageSize`, `totalItems`, `totalPages`. Os schemas Zod compartilhados implementados reproduzem essa forma e são validados por testes de paridade.
- Catálogo aprovado: `managedRolesEnvelopeSchema` valida exatamente `{ data: [{ id: UUID, name: managedRoleNames }], meta: {} }`, sem `churchId`, permissões, timestamps ou campos internos.
- Igreja: as formas verificadas em `apps/api/src/modules/churches/presentation/church.presenter.ts` são o envelope institucional e o envelope de settings com `meta: {}`. Os schemas Zod compartilhados implementados reproduzem essas allowlists e são validados por testes de paridade.
- Pessoa: `PersonItemEnvelope` e `PeoplePageEnvelope` compartilhados; `observations` só aparece para `ADMIN` e `PASTOR`.
- `POST /auth/logout`, `POST /auth/change-password` e `POST /users/:id/reset-password` retornam `204` sem body.
- O cliente deve validar resposta com Zod quando houver schema compartilhado e rejeitar formato inesperado como erro de integração.

### Erros esperados

- `400`: validação de body/query/params; mapear `details` para campos somente quando o contrato permitir.
- `401`: login inválido usa mensagem genérica; request privado aciona refresh single-flight uma vez.
- `403`: manter sessão e apresentar falta de permissão, sem esconder que a API é autoridade.
- `404`: recurso inexistente ou fora do tenant, sem tentar diferenciar.
- `409`: e-mail/slug/pessoa duplicada, último administrador ou conflito de regra; mensagem específica apenas pelo código público conhecido.
- `429`: login limitado; desabilitar reenvio durante o prazo informado quando disponível.
- `5xx`, rede, timeout e resposta inválida: mensagem neutra, opção de tentar novamente e nenhum detalhe interno.

Envelope normalizado do frontend:

```ts
type ApiError = {
  status: number | null;
  code: string;
  message: string;
  fieldErrors?: Readonly<Record<string, readonly string[]>>;
  retryable: boolean;
};
```

### Permissões

| Capacidade visual | ADMIN | PASTOR | SUPERVISOR | LEADER |
| --- | --- | --- | --- | --- |
| perfil e troca da própria senha | sim | sim | sim | sim |
| consultar/editar usuários | sim | não | não | não |
| consultar igreja/settings | sim | sim | sim | sim |
| editar igreja/settings | sim | não | não | não |
| consultar pessoas ativas | sim | sim | sim | sim |
| listar pessoas inativas | sim | não | não | não |
| criar/editar pessoa ativa | sim | sim | não | não |
| desativar/reativar pessoa | sim | não | não | não |
| ver/editar observações de pessoa | sim | sim | não | não |

Essa matriz controla apenas apresentação. Cada request continua sujeito aos guards, policies e revalidação transacional da API.

## 10. Etapas

### Etapa 1 — Congelar arquitetura e resolver bloqueios

- [x] confirmar topologia same-site e CORS de desenvolvimento/homologação — decisão conservadora registrada (same-site, sem mudança no ADR 003);
- [x] aprovar `GET /users/managed-roles` e seu contrato mínimo antes dos fluxos de criação/edição de papéis;
- [x] decidir detalhe de pessoa inativa — decisão conservadora registrada (sem mudança de API; reativação pela listagem);
- [x] aprovar contratos Zod de saída de users/church com paridade aos presenters;
- [x] decidir biblioteca visual e dependências da seção 7 — componentes próprios e formulários nativos com Zod; RHF e react-query não adicionados;
- [x] registrar decisões sem alterar o transporte do ADR 003.

### Etapa 1.1 — Entregar pré-requisitos mínimos aprovados

- [x] criar schemas e tipos de resposta de users/church em `packages/contracts`, com testes de paridade;
- [x] criar schema e tipo do catálogo em `packages/contracts`;
- [x] implementar query, port e repository do catálogo no módulo users, sempre por `principal.churchId`;
- [x] registrar `GET /users/managed-roles` antes de `GET /users/:id`, protegido por `ADMIN`;
- [x] testar contrato estrito, `401`, `403`, isolamento entre igrejas, papéis inativos e ausência de campos internos;
- [x] validar que não houve migration, dependência, novo papel ou mudança nos endpoints existentes.

### Etapa 2 — Preparar testes e fundação visual

- [x] configurar Jest/jsdom e React Testing Library no workspace web;
- [x] criar tokens visuais, reset, tipografia e estilos responsivos;
- [x] criar componentes acessíveis de feedback, formulário, tabela, paginação e diálogo;
- [x] criar layouts público/autenticado, navegação, breadcrumbs e boundaries (shell de navegação e menu de usuário concluídos na Etapa 4);
- [x] testar teclado, foco, loading, vazio e erro.

### Etapa 3 — Implementar cliente HTTP e sessão

- [x] criar cliente tipado e erro normalizado;
- [x] implementar `SessionProvider`, bootstrap por refresh e logout;
- [x] implementar renovação single-flight, margem proporcional ao TTL, retomada por foco/visibilidade, expiração e limite de uma repetição;
- [x] instalar Bearer somente em memória e limpar caches ao encerrar;
- [x] criar guards visuais fail-closed e testes de 401/403/loops.

### Etapa 4 — Implementar login e shell autenticado

- [x] criar `/login` com Zod, loading e erro genérico;
- [x] substituir a página técnica em `/` pelo entrypoint de bootstrap e redirecionamento determinístico;
- [x] redirecionar autenticado para `/dashboard` e preservar destino privado seguro;
- [x] criar `/dashboard` somente com boas-vindas e atalhos autorizados;
- [x] criar menu de usuário e logout;
- [x] validar responsividade e teclado.

### Etapa 5 — Implementar perfil

- [x] integrar `GET/PATCH /users/me`;
- [x] integrar `POST /auth/change-password`;
- [x] confirmar alteração sensível e tratar revogação/limpeza da sessão;
- [x] testar ausência de campos internos e feedback.

### Etapa 6 — Implementar usuários

- [x] criar listagem com URL, paginação, busca e filtros;
- [x] criar detalhe e atualização;
- [x] implementar criação e papéis somente após a Etapa 1.1 passar nos testes;
- [x] implementar status e reset com confirmação, sem update otimista;
- [x] tratar `409` do último administrador e e-mail duplicado;
- [x] testar `ADMIN`, `403`, loading, vazio e invalidação.

### Etapa 7 — Implementar igreja

- [x] carregar dados e settings em caches separados;
- [x] criar PATCHs parciais sem enviar campos ausentes;
- [x] aplicar schemas de slug, contato, endereço, timezone e semana;
- [x] permitir edição somente a `ADMIN` e leitura aos autenticados;
- [x] testar slug inválido/reservado/duplicado, `403` e invalidação.

### Etapa 8 — Implementar pessoas

- [x] criar listagem, pesquisa, filtros e paginação na URL;
- [x] criar cadastro, detalhe e edição conforme papel;
- [x] implementar status de `ADMIN`, respeitando a decisão sobre detalhe inativo;
- [x] ocultar observações de `SUPERVISOR` e `LEADER`;
- [x] apresentar conflito de duplicidade apenas no nível suportado pela API;
- [x] testar datas civis, normalização, permissões e caches.

### Etapa 9 — E2E, documentação e validação

- [x] criar fixtures fictícias por papel e banco dedicado;
- [x] testar fluxos essenciais desktop e viewport móvel;
- [x] validar console, teclado, loading, vazio, erro, 401 e 403;
- [x] executar todos os comandos da seção 18 e corrigir falhas;
- [x] atualizar documentação e progresso sem criar Plano 007.

## 11. Critérios de aceitação

1. Todas as dez rotas de tela planejadas são navegáveis e as privadas exigem bootstrap de sessão.
2. Access token nunca aparece em storage persistente, cookie do web, URL, HTML, log ou mensagem de erro.
3. Refresh token continua inacessível ao JavaScript e todas as chamadas de auth usam cookie com credenciais.
4. Requisições concorrentes após expiração produzem no máximo um refresh em voo e cada request repete no máximo uma vez.
5. O timer agenda refresh pela fórmula da seção 8.1; retorno de foco/visibilidade dentro da margem produz um único refresh antes de liberar requests privados.
6. Falha definitiva de refresh limpa sessão/cache e redireciona a `/login` sem loop.
7. `403` não encerra sessão e apresenta acesso negado apropriado.
8. `/` conclui o bootstrap e usa `replace` para exatamente `/dashboard` ou `/login`, sem exibir conteúdo privado durante a decisão.
9. Cada tela usa somente endpoints listados na seção 9; lacunas não são simuladas como capacidades reais.
10. Menus, páginas e ações refletem a matriz visual, enquanto testes demonstram que a API permanece autoridade.
11. Listagens preservam `page`, `pageSize`, busca e filtros em `searchParams` e exibem metadados reais.
12. Mutações invalidam somente caches relacionados; ações críticas não usam update otimista.
13. PATCHs de perfil, igreja, pessoa e usuário não enviam campos omitidos.
14. Formulários rejeitam campos inválidos antes da chamada e exibem erros de API sem detalhes internos.
15. `GET /users/managed-roles` retorna somente `{ id, name }` de papéis canônicos ativos da igreja autenticada para `ADMIN`, responde `403` aos demais papéis e nunca aceita `churchId` do cliente.
16. Users e church validam respostas com schemas compartilhados equivalentes aos presenters antes de serem declarados concluídos.
17. Pessoas inativas não abrem detalhe por inferência/cache sem decisão explícita sobre a lacuna.
18. Respostas não exibem `churchId`, `deletedAt`, tokens, hashes, relações internas ou observações sem permissão.
19. Uma falha simulada em users, church ou people é contida pelo boundary local e não remove o shell autenticado; falha do grupo usa seu boundary sem expor detalhes internos.
20. Cada página passa em 360 × 800, 768 × 1024 e 1280 × 800 e em zoom de 200%, sem overflow horizontal global, sobreposição, corte de foco ou ação essencial inacessível.
21. Todos os fluxos essenciais operam por teclado, têm foco visível, labels e feedback `aria-live`.
22. Dashboard contém somente boas-vindas e atalhos, sem indicadores ou gráficos.
23. Testes unitários, integração e E2E previstos passam sem erros de console não esperados.
24. Nenhuma funcionalidade fora do escopo ou do Plano 007 é criada.
25. Nenhuma mutação é repetida automaticamente; consultas repetem no máximo uma vez e somente nos estados transitórios definidos na seção 8.4.

## 12. Estratégia de testes

### Unitários

- Schemas compartilhados de resposta de users/church e catálogo, incluindo strictness, allowlists e paridade com presenters.
- Schemas e adaptadores de contratos, inclusive omitido versus `null`.
- Cliente HTTP: headers, credentials, `204`, resposta inválida, timeout e erro normalizado.
- Coordenador de refresh: antecipação, single-flight, uma repetição e encerramento.
- Coordenador de refresh com fake timers: fórmula da margem, foco/visibilidade, timer único e aba suspensa.
- Capabilities por papel e negação por padrão.
- Hooks de filtros/paginação e chaves de cache.
- Componentes críticos: diálogo, feedback, paginação, tabela responsiva e campos.
- Presenter/view models sem campos internos.

### Integração

- Repository do catálogo contra PostgreSQL real: mesma igreja, outra igreja, papel inativo, nome não canônico e ordenação determinística.
- Formulários com React Testing Library e cliente injetado/falso, sem rede real.
- Login, bootstrap, logout, sessão expirada e `403`.
- Cache/invalidação após mutações e limpeza entre sessões.
- Retry zero em mutações e retry único apenas em consultas com falha transitória.
- Proteção client-side das rotas e restauração segura do destino.
- Entrypoint `/` durante bootstrap, usuário autenticado e usuário anônimo.
- Boundaries de grupo e feature preservando o shell e removendo detalhes internos.
- Filtros sincronizados com URL e histórico do navegador.
- Erros `400`, `401`, `403`, `404`, `409`, `429`, rede e formato inesperado.

### E2E

- `GET /users/managed-roles`: `401`, `403`, sucesso de `ADMIN`, isolamento por igreja e ausência de campos internos.
- Playwright com web, API e PostgreSQL de teste reais; dados exclusivamente fictícios.
- Login válido/inválido, logout, refresh, sessão expirada e ausência de loop.
- Acesso negado por papel e ausência de ações não permitidas.
- Listagem, criação/edição/status/reset de usuário nas capacidades realmente disponíveis.
- Perfil próprio e troca de senha com novo login.
- Consulta/atualização de igreja e settings.
- Listagem, criação, edição, desativação e reativação de pessoa.
- Isolamento visual e da API usando fixtures de duas igrejas onde a suíte existente suportar.
- Viewports 360 × 800, 768 × 1024 e 1280 × 800 dos fluxos essenciais, incluindo ausência de overflow e ações acessíveis.
- Falhar por `console.error`, exceção de página ou resposta não tratada inesperada.

### Validação manual

- Navegar somente por teclado e verificar ordem/foco após diálogos e mudanças de rota.
- Conferir 360 × 800, 768 × 1024 e 1280 × 800 em Chrome; ampliar texto a 200%.
- Inspecionar Application/Network para confirmar ausência de access token persistido e cookie `HttpOnly`.
- Simular API indisponível, 401, 403, 409 e loading lento.
- Conferir que refresh cookie só trafega em `/auth` e que requests privados usam Bearer.
- Revisar interface contra controllers e Swagger atuais antes do encerramento.

## 13. Segurança e privacidade

- Access token exclusivamente em memória; refresh token exclusivamente no cookie emitido pela API.
- Nunca inserir token em URL, query, React state serializado, Server Component props, logs ou ferramentas de analytics.
- `credentials: "include"` somente para origens configuradas; URL da API validada pela configuração pública.
- Não renderizar HTML arbitrário de respostas; texto de observações é tratado como texto.
- Não guardar formulários com senha em cache; limpar campos e referências após submit/unmount.
- Redirecionamento pós-login aceita apenas caminhos internos allowlisted, evitando open redirect.
- UI fail-closed enquanto papéis/sessão não estão confirmados.
- Mensagens de login não revelam existência de e-mail.
- Respostas `404` entre tenants permanecem indistinguíveis.
- Auditoria continua no servidor; o frontend não forja ator, igreja ou payload de auditoria.
- CSP, headers e proteção contra clickjacking devem ser avaliados na implementação do shell sem afrouxar a API.
- Dados pessoais em cache vivem apenas na sessão do browser e são removidos no logout.

## 14. Migração de dados

- Nenhuma migration de banco, alteração Prisma, backfill ou seed é necessária.
- A implementação pode criar somente migração de estrutura de arquivos/rotas do web, preservando a página técnica até o novo `/dashboard` estar funcional.
- Dados fictícios E2E devem usar os mecanismos de teste existentes e nunca seed de produção.
- Não alterar schema, editar migrations concluídas ou criar SQLite para o frontend.

## 15. Observabilidade

- Capturar no cliente apenas nome da operação, duração, status HTTP, resultado e correlation ID quando fornecido.
- Nunca registrar Bearer, cookie, senha, e-mail completo, telefone, observações ou body de mutação.
- Medir falhas de login, refresh, logout, requests, validação e boundaries sem PII.
- Diferenciar erro de rede, contrato inválido, `401`, `403`, `409`, `429` e `5xx`.
- Durante E2E, tratar erro de console inesperado como falha.
- Plataforma externa de analytics/monitoramento permanece fora do escopo; somente pontos de instrumentação seguros serão preparados.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Web/API cross-site incompatível com `SameSite=Strict` | Média | Crítico | Confirmar topologia antes do código; mudança só por ADR e revisão de segurança |
| Refresh concorrente causar replay e revogar família | Média | Alto | Coordenador single-flight e uma única repetição, cobertos por testes |
| Persistência acidental do access token | Baixa | Crítico | Provider em memória, revisão de storage/HTML/log e teste automatizado |
| Middleware aparentar segurança sem acessar sessão real | Média | Alto | Boundary client-side e API como autoridade; não usar middleware como autenticação |
| Catálogo de papéis atrasar usuários | Média | Alto | Executar a Etapa 1.1 primeiro; contrato mínimo, isolamento e testes já definidos; nunca inferir IDs |
| Contratos de saída users/church divergirem | Média | Alto | Criar schemas compartilhados mínimos antes da integração |
| Pessoa inativa ficar sem detalhe recarregável | Alta | Médio | Decidir extensão mínima da rota ou manter ação somente na listagem |
| UI esconder ação, mas request manual continuar possível | Alta | Médio | Documentar que UI não autoriza; manter guards/policies da API |
| Cache vazar dados entre sessões | Baixa | Crítico | Limpeza total no logout/401/troca de principal e testes |
| Formulário PATCH apagar campos omitidos | Média | Alto | Dirty fields, contratos estritos e testes de payload |
| Dependências visuais ampliarem bundle/acoplamento | Média | Médio | Prova de conceito, orçamento de bundle e ADR quando transversal |
| E2E ficar instável por sessão curta/rotação | Média | Médio | Fixtures isoladas, relógio controlável onde possível e expectativas por estado |
| Interface não funcionar em mobile/teclado | Média | Alto | Componentes base acessíveis e testes desde os primeiros milestones |

## 17. Estratégia de reversão

- Entregar por milestones/commits independentes: fundação, sessão, cada feature e testes.
- Em falha de sessão, reverter provider/cliente/layout autenticado como uma unidade; restaurar a página técnica anterior.
- Reverter feature removendo rota, componentes, hooks e chaves de cache correspondentes, sem alterar API ou banco.
- Dependência nova deve ser removida junto com imports, configuração e lockfile no mesmo rollback.
- Contratos compartilhados eventualmente aprovados devem ser revertidos junto com consumidores; mudanças aditivas sem uso podem permanecer apenas se compatíveis e documentadas.
- Não apagar dados, executar migration reversa ou alterar cookies da API como rollback do frontend.
- Usar feature flags somente se já houver mecanismo aprovado; não introduzir serviço de flags nesta etapa.
- Confirmar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` após cada reversão.

## 18. Comandos de validação

Todos os comandos usam npm/npm workspaces e devem funcionar no PowerShell:

```bash
npm ci

npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/api
npm run test:users:e2e --workspace @mission-atos/api

npm run lint --workspace @mission-atos/web
npm run typecheck --workspace @mission-atos/web
npm run test --workspace @mission-atos/web
npm run build --workspace @mission-atos/web
npm run test:e2e --workspace @mission-atos/web

npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e

npm audit
```

Os scripts `test` e `test:e2e` existem em `@mission-atos/web`. O E2E funcional exige API/PostgreSQL dedicados, migrations aplicadas, fixtures fictícias e `TEST_DATABASE_URL`; o runner recusa bancos cujo nome não identifique teste. Nenhum outro gerenciador de pacotes ou script incompatível com PowerShell foi adicionado.

## 19. Definition of Done

- [x] decisões bloqueantes da seção 6 resolvidas e registradas antes dos milestones afetados;
- [x] arquitetura de rotas/features e componentes base implementada;
- [x] sessão compatível com ADR 003, sem token persistente;
- [x] login, logout, refresh, expiração, 401 e 403 testados;
- [x] todas as telas e rotas aprovadas navegáveis;
- [x] `/` possui destino determinístico após bootstrap e não renderiza conteúdo privado antes da decisão;
- [x] módulos de perfil, usuários, igreja e pessoas integrados somente a endpoints reais;
- [x] catálogo de papéis implementado no módulo users, isolado por igreja, protegido por `ADMIN` e validado antes do consumo pelo web;
- [x] schemas compartilhados de resposta de users/church e catálogo aprovados em testes de paridade;
- [x] papéis e ações visuais alinhados aos controllers/policies reais;
- [x] paginação, filtros, busca, formulários, cache e invalidação testados;
- [x] loading, skeleton, vazio, sucesso, erro e confirmação disponíveis;
- [x] boundaries público, autenticado e por feature testados;
- [x] critérios de acessibilidade e responsividade verificados;
- [x] nenhum dado sensível persistido, logado ou renderizado;
- [x] testes unitários e de integração do web aprovados;
- [x] Playwright E2E aprovado com API/PostgreSQL reais;
- [x] ausência de erros inesperados no console validada;
- [x] lint aprovado;
- [x] typecheck aprovado;
- [x] testes aprovados;
- [x] build aprovado;
- [x] dependências justificadas, revisadas e registradas;
- [x] documentação e registro de progresso atualizados;
- [x] nenhuma migration ou funcionalidade fora do escopo criada;
- [x] Plano 007 não criado nem implementado.

## 20. Registro de progresso

### 2026-08-02 — planejamento

- realizado: leitura das diretrizes, PRD, arquitetura, template e planos concluídos; inspeção de `apps/web`, controllers reais, guards, autenticação, contratos, presenters, configurações e módulos existentes;
- resultado: plano criado sem alteração de código, dependências, migrations ou outros arquivos;
- sessão confirmada: access token de 10 minutos no corpo e em memória; refresh opaco em cookie `HttpOnly` rotacionável; bootstrap/renovação por `/auth/refresh`; logout por `/auth/logout`;
- endpoints confirmados: 22 endpoints funcionais mapeados para auth, perfil, usuários, igreja e pessoas, sem inventar rotas;
- decisões arquiteturais: App Router com Server Components por padrão, boundary autenticado client-side, cache remoto por feature, filtros na URL e API como autoridade;
- lacunas originalmente encontradas: catálogo de papéis, schemas compartilhados de saída de users/church, detalhe de pessoa inativa, candidatos de duplicidade e confirmação da topologia same-site;
- testes: não executados, pois esta entrega altera somente documentação de planejamento;
- dependências: nenhuma instalada; candidatas justificadas abaixo;
- próximo passo: revisar e aprovar este plano, resolver bloqueios da seção 6 e somente então implementar, sem criar Plano 007.

### Resumo executivo

- **Decisões tomadas:** sessão em memória compatível com ADR 003; refresh single-flight; proteção client-side com API autoritativa; rotas por grupos; Server Components por padrão; cache/invalidação por feature; acessibilidade WCAG 2.2 AA; nenhuma persistência de token.
- **Migrations necessárias:** nenhuma.
- **Telas planejadas:** login, dashboard simples, perfil, lista/criação/detalhe de usuários, configurações da igreja e lista/criação/detalhe de pessoas.
- **Endpoints utilizados:** 22 endpoints reais listados na seção 9 e uma correção mínima explicitamente aprovada (`GET /users/managed-roles`), que só poderá ser consumida após implementação e testes.
- **Critérios centrais:** sessão segura sem loops, papéis fail-closed, integração tipada, PATCH parcial, estados completos, responsividade, teclado e testes unitários/integrados/E2E.

### Dependências candidatas para a implementação

| Dependência | Tipo | Problema resolvido | Alternativa nativa | Decisão proposta |
| --- | --- | --- | --- | --- |
| `@mission-atos/contracts` | workspace | schemas e tipos HTTP compartilhados | duplicar schemas, proibido | adicionar ao web |
| `@tanstack/react-query` | produção | cache privado, deduplicação, invalidação e estados remotos | hooks com `fetch` e cache próprio | pendente de spike: confirmar suporte às versões instaladas de React/Next, uso somente client-side para cache privado, impacto no bundle e integração com refresh |
| `react-hook-form` | produção | formulários complexos, dirty fields e desempenho | state/FormData nativos | não adicionar; alternativa nativa atende ao escopo implementado |
| `@hookform/resolvers` | produção | integração consistente RHF/Zod | validação direta pelos contratos | não adicionar; não há RHF no fluxo aprovado |
| `zod` | transitiva/workspace | validação runtime dos contratos | validação manual | reutilizar via contracts; evitar versão divergente |
| `@testing-library/react` | desenvolvimento | testes de componentes por comportamento | React DOM test utils | aprovar |
| `@testing-library/user-event` | desenvolvimento | interação realista de teclado/formulário | eventos manuais | aprovar |
| `jest-environment-jsdom` | desenvolvimento | DOM para Jest no web | ambiente Node insuficiente | aprovar |
| biblioteca de componentes | produção | padrões de diálogo, menu e formulário | primitives HTML/CSS próprios | pendente de prova de conceito e ADR se transversal |
| biblioteca de tabelas | produção | tabelas avançadas | tabela semântica + paginação da API | não adicionar inicialmente |
| biblioteca de notificações | produção | toasts | alertas/`aria-live` próprios | não adicionar inicialmente |

Nenhuma dependência será instalada durante o planejamento.

### 2026-08-02 — revisão de executabilidade

- problemas Críticos/Altos corrigidos no documento: removida a sugestão de rota inexistente para papéis; catálogo de papéis e contratos compartilhados de saída convertidos em gates explícitos; adicionadas fontes dos controllers; detalhados boundaries por layout/feature; definida a fórmula e o ciclo de renovação; definido o comportamento de `/`;
- problemas Médios/Baixos corrigidos após solicitação posterior: delimitados schemas locais versus contratos HTTP; retries definidos por tipo de operação; TanStack Query condicionada a spike de compatibilidade; confirmação de logout limitada a alterações não salvas; viewports e resultados responsivos tornados mensuráveis;
- resultado: escopo, endpoints e permissões permanecem aderentes ao backend; catálogo e contratos deixaram de ser decisões pendentes e passaram a tarefas explícitas da Etapa 1.1; o plano continua bloqueado pelas demais decisões abertas da seção 6;
- testes: não executados, pois a revisão altera somente o documento do plano.

### 2026-08-03 — aprovação das correções mínimas

- decisão: autorizado incluir no Plano 006.1 o catálogo de papéis e os schemas compartilhados de resposta de users/church;
- API planejada: `GET /users/managed-roles`, somente para `ADMIN`, isolada por `principal.churchId`, sem entrada de tenant e sem campos além de `id` e `name`;
- contratos planejados: envelopes Zod de user, página de users, church, settings e catálogo, todos equivalentes às allowlists existentes;
- impacto confirmado: nenhuma migration, alteração Prisma, dependência npm, novo papel, seed ou mudança nos endpoints atuais;
- testes: não executados, pois esta atualização altera somente o plano;
- pendências mantidas: topologia same-site, detalhe de pessoa inativa, apresentação de duplicidades e escolha da base visual.

### 2026-08-03 — tentativa de execução bloqueada por decisões pendentes

- realizado: verificação prévia obrigatória — leitura integral de `AGENTS.md`, PRD, ARCHITECTURE, template, planos 004/005/006, ADR 003 e análise da implementação real (`apps/web`, controllers reais de identity/users/churches/people, presenters, guards, policies e `packages/contracts`);
- resultado: a implementação **não foi iniciada**. O plano permanece com **Status: Planejado — bloqueado pelas decisões da seção 6**, portanto não atende à condição de estar aprovado exigida pela verificação prévia;
- decisões bloqueantes ainda em aberto na seção 6 e na Etapa 1: (1) topologia de produção same-site versus cross-site, que condiciona o refresh por cookie `SameSite=Strict`/`Path=/auth`; (2) detalhe de pessoa inativa (`GET /people/:id` só consulta ativas; opções: extensão mínima da rota para `ADMIN` ou reativação somente pela listagem); (3) apresentação de possíveis duplicidades (`409` sem candidatos; opções: aviso genérico no MVP ou consulta dedicada em plano separado); (4) escolha da biblioteca visual (componentes próprios mínimos ou biblioteca acessível, com prova de conceito e ADR se transversal);
- decisões já resolvidas e que não desbloqueiam a Etapa 1: catálogo aprovado `GET /users/managed-roles` e schemas compartilhados de saída de users/church com paridade aos presenters;
- postura: nenhuma decisão pendente foi assumida; nenhuma rota, contrato, dado ou dependência foi inventado para contornar os bloqueios;
- testes: não executados, pois nenhum código foi alterado;
- dependências: nenhuma instalada;
- próximo passo: revisão humana das quatro decisões bloqueantes, registro das resoluções neste plano (seção 6 e Etapa 1) e confirmação explícita de aprovação antes de qualquer implementação; não criar o Plano 007.

### 2026-08-03 — aprovação e Etapa 1.1 concluída

- decisão do revisor: o fluxo de implementação foi autorizado; as quatro decisões da seção 6 foram registradas de forma conservadora e compatível com a API atual: (1) topologia same-site mantida, sem alterar o ADR 003; (2) detalhe de pessoa inativa sem mudança de API, reativação somente pela listagem; (3) duplicidades apresentadas como aviso genérico de `409`, sem consulta dedicada; (4) componentes próprios mínimos, sem biblioteca visual; `react-hook-form` aprovado para users/church/people e `@tanstack/react-query` permanece não aprovado nesta etapa;
- contratos: adicionados em `packages/contracts` os schemas de saída `userResponseSchema`, `userItemEnvelopeSchema`, `userPageEnvelopeSchema`, `managedRoleSchema`, `managedRolesEnvelopeSchema`, `churchResponseSchema`, `churchEnvelopeSchema`, `churchSettingsResponseSchema` e `churchSettingsEnvelopeSchema`, com tipos inferidos e exportações no `index.ts`; testes de paridade e estrito adicionados em `users.spec.ts` e `church.spec.ts`;
- API: implementado `GET /users/managed-roles` no módulo users (port `managedRoles`, repository filtrando por `principal.churchId`, `deletedAt: null` e nomes em `managedRoleNames`, query com `assertAdministrator`, rota registrada antes de `GET /users/:id` com `@Roles("ADMIN")`), sem migration, dependência, novo papel ou mudança em endpoints existentes;
- testes: contratos 29/29; API unitária 52/52; e2e users 5/5 (inclui `401`, `403`, isolamento entre igrejas e exclusão de papel inativo/estrangeiro) e e2e geral 17/17;
- dependências: nenhuma instalada nesta etapa;
- ambiente: Docker Desktop iniciado para validação; `postgres-test` canônico na porta `5433` em conflito com instância local prévia, então as suítes usaram container descartável `postgres:18.4` em `127.0.0.1:55433` com as 9 migrations aplicadas; `postgres-dev` permanece em `5432`;
- próximo passo: Etapa 2 — testes e fundação visual no workspace web.

### 2026-08-03 — Etapas 2 e 3 concluídas (fundação e sessão)

- testes web: Jest + jsdom + React Testing Library configurados (`jest.config.cjs`, `tsconfig.test.json`, `tests/setup.ts`); dependências de desenvolvimento `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` e `jest-environment-jsdom` adicionadas ao `apps/web`; script `test` criado;
- visual: tokens centralizados em `globals.css` (paleta `--color-*`, espaçamento, tipografia, bordas, sombras, motion e foco), reset e classes base (.button, .field, .alert, .table, .pagination, .skeleton, .dialog-*, .auth-*, .sidebar, .header, .breadcrumbs, .status-badge, .detail-list, .toolbar, .dashboard-*, .empty-state, .error-state);
- componentes: `src/shared/components` com alert, button, field, dialog, live-region, pagination, states, status-badge, table e index — acessíveis (label, `aria-busy`, `role="alert"`, `role="dialog"`/`aria-modal`, `aria-live`, foco confinado, Escape, retorno de foco e `data-label` para tabela móvel);
- sessão: `SessionProvider` com bootstrap por `POST /auth/refresh`, estados `bootstrapping/anonymous/authenticated/ending`, `RefreshCoordinator` single-flight com margem `clamp(10, 60, expiresIn*0.1)`, retomada por foco/visibilidade, uma repetição após `401` e encerramento em falha definitiva; `ApiClient` tipado com Bearer somente em memória, `credentials: "include"`, timeout/abort, parsing via Zod e erro normalizado (`ApiError` com `status/code/message/details/retryable`); caches em memória por feature (`cacheStore` com TTL e `invalidatePrefix`) e `clearAllCaches` em logout/expiração;
- arquitetura: para respeitar as regras estritas do lint `react-hooks/refs` e `set-state-in-effect`, o token e o coordenador de refresh passaram a viver dentro do `ApiClient` (campos de classe, sem refs React); `SessionProvider` não possui mais refs — `installAuth`/`logout`/`endSession` chamam `setAccessToken`/`clearAccessToken`, e o handler de fim de sessão é instalado por efeito;
- guards: `RequireSession` (null anônimo/skeleton em bootstrap), `RequireRole` (redirect `/access-denied`) e `Can` (por capability); `capabilitiesFor` fail-closed para ADMIN/PASTOR/SUPERVISOR/LEADER;
- testes: web 32/32 (api-client, refresh-coordinator, capabilities, dialog, componentes); monorepo 11 tasks verdes; lint/typecheck/build do web verdes;
- próximo passo: Etapa 4 — login, entrypoint `/`, dashboard e shell autenticado com sidebar, header, breadcrumbs e menu de usuário.

### 2026-08-03 — Etapas 4 a 8 concluídas (features web do escopo)

- login/shell: `/login` com `loginRequestSchema` Zod, `app/(public)/layout.tsx`, `AppShell` com `Sidebar` (Painel/Perfil/Igreja/Pessoas; Usuários via `Can manageUsers`), `Header` + `Breadcrumbs`, `UserMenu` (perfil/sair), `SkipLink`; `/` entrypoint de bootstrap com `replace` para `/dashboard` ou `/login`; `RequireSession` preservando destino via `setPendingDestination`/`consumePendingDestination`; `(authenticated)/loading.tsx`; dashboard com boas-vindas e atalhos autorizados (sem indicadores); página técnica antiga removida; E2E `foundation.spec.ts` 1/1 verde;
- perfil: `profile-api.ts` (`getMyProfile`, `updateMyProfile`, `changeMyPassword`); página com dados pessoais editáveis (invalida `profile/me` + reload), troca de senha com confirmação por `Dialog` e `endSession()` após `POST /auth/change-password` (revoga sessões);
- usuários: `users-api.ts` completo; `UsersList` (URL-driven, paginação, busca com debounce 300 ms, filtros status/papel, link criar), `CreateUserForm` (Zod via API, senha mínima 12, papel obrigatório, redirect para `/users/:id`), `UserDetail` (edição, substituição de papéis, block/unblock, reset com confirmação via `Dialog`); rotas `/users`, `/users/new`, `/users/[id]`; mensagens específicas para `409 USER_EMAIL_CONFLICT` e `LAST_ACTIVE_ADMIN`;
- igreja: `church-api.ts` (`GET/PATCH /church`, `GET/PATCH /church/settings` com envelopes dos contratos); `ChurchSettingsView` com caches separados (`church/data`, `church/settings`), PATCH parcial sem campos omitidos (nome/slug/contatos/endereço; timezone/semana), edição condicionada a `Can editChurch` (ADMIN) e leitura autenticada; `church/settings/page.tsx` substituído;
- pessoas: `people-api.ts` (list/get/create/update/status com schemas de `people.ts`); `PeopleList` (URL-driven, busca debounce, filtros status/gênero; `INACTIVE` filtrado e reativação apenas para `ADMIN` via linha da listagem, sem navegação de detalhe para inativos), `CreatePersonForm` (Zod, `409 PERSON_DUPLICATE` com mensagem específica), `PersonDetail` (edição por `editPeople`/`viewPersonObservations`, inativação com confirmação `ADMIN`); rotas `/people`, `/people/new`, `/people/[id]`;
- capacidade visual: `capabilitiesFor` mantém `listInactivePeople`, `editPeople`, `changePersonStatus` e `viewPersonObservations`; `PeopleList` neutraliza `status=INACTIVE` na URL para papéis sem permissão;
- testes: web unit 32/32; lint, typecheck e build do web verdes (12 rotas, incluindo `/church/settings`, `/people/[id]` e `/users/[id]` dinâmicos); E2E `foundation.spec.ts` continua verde;
- próximo passo: Etapa 9 — E2E Playwright dos fluxos, validação completa `lint`/`typecheck`/`test`/`build`/`test:e2e`, documentação e registro de progresso; não criar o Plano 007.

### 2026-08-04 — revisão autônoma da implementação

- revisão: auditados plano, ADR 003, contratos, controllers/policies da API, sessão, cliente HTTP, guards, cache, filtros, formulários, fluxos críticos e testes do web;
- correções de sessão: logout passou a garantir limpeza local em `finally`; falha excepcional do refresh agora encerra a sessão; regressões cobertas nos testes do `ApiClient` e `RefreshCoordinator`;
- correções de navegação: destino privado pendente deixou de ser consumido novamente durante rerenders do login; buscas de usuários e pessoas cancelam o debounce anterior; páginas inválidas ou negativas na URL são normalizadas para a primeira página;
- correção de usuários: seleção de papéis passou a distinguir estado inicial de seleção vazia, permitindo remover um papel atribuído e enviar exatamente a seleção visual confirmada;
- resiliência: consultas GET de perfil, igreja, usuários, papéis e pessoas passaram a usar a repetição única já prevista para erros transitórios; mutações continuam sem repetição automática;
- dependências: aprovado manter formulários com APIs nativas + Zod; `react-hook-form`, `@hookform/resolvers`, React Query e bibliotecas visuais continuam desnecessários, evitando custo e bundle sem ganho comprovado;
- validação concluída: testes unitários web 34/34, lint web e typecheck web aprovados; `git diff --check` aprovado;
- validação conectada: Playwright foi iniciado com a proteção de `TEST_DATABASE_URL`; a URL dedicada configurada em `localhost:5433/mission_atos_test` não estava acessível e o Docker Engine também estava indisponível, portanto nenhuma base de desenvolvimento foi reutilizada ou alterada;
- aprovação: implementação e decisões técnicas aprovadas; o plano permanece ativo somente até a execução do Playwright contra PostgreSQL de teste controlado, verificação responsiva/teclado e confirmação de console limpo.

### 2026-08-04 — Playwright E2E aprovado

- ambiente: como a porta canônica `5433` continuava interceptada por outra instância PostgreSQL local, foi criado o container descartável `mission-atos-playwright-db` com PostgreSQL 18.4 em `127.0.0.1:55433`; as 9 migrations foram aplicadas desde banco vazio;
- correção de ambiente web: `allowedDevOrigins` passou a permitir `127.0.0.1`, evitando bloqueio dos módulos/HMR pelo Next.js durante o runner local;
- correção de ambiente API: os limites por IP e conta do login passaram a ser configuráveis com defaults seguros `10/5`; somente o runner E2E usa `100/100`, preservando a proteção de produção e evitando interferência entre 21 contextos isolados;
- testes estabilizados: seletores ambíguos foram tornados inequívocos e cenários deixaram de depender do nome alterado por um teste anterior;
- resultado: Playwright Chromium 21/21 aprovado em 51,6 segundos, cobrindo autenticação, bootstrap, logout, igreja, guards por papel, pessoas, perfil e usuários; cenário de fundação confirmou ausência de erros inesperados no console;
- aprovação: pendências Playwright e console da Definition of Done encerradas; permanece somente a verificação manual específica de acessibilidade e responsividade já registrada.

### 2026-08-05 — auditoria de pré-finalização (encerramento bloqueado)

- **Status da tentativa:** o plano permanece ativo. Não foi movido para `completed` porque a execução atual não produziu um exit code verde do Playwright e o navegador interno não disponibilizou backend para a validação manual. Declarar conclusão nessas condições seria incompatível com a Definition of Done.
- **Auditoria de escopo:** as rotas e features implementadas continuam limitadas a login, dashboard simples, perfil, usuários, igreja e pessoas. Não foram encontrados módulos ou telas de células, encontros, frequência, relatórios, dashboard analítico ou Plano 007.
- **Integrações:** o código de aplicação consome somente `/auth`, `/users`, `/church` e `/people`, incluindo o endpoint aprovado `/users/managed-roles`. Ocorrências de mocks estão restritas aos testes unitários; não foi encontrado mock permanente no runtime nem persistência de token em `localStorage`, `sessionStorage`, IndexedDB ou cookie legível pelo web.
- **Autenticação e autorização:** inspeção confirmou login e refresh por cookie com `credentials: "include"`, Bearer em memória, logout com limpeza local em `finally`, nova tentativa única após `401`, encerramento em falha definitiva e preservação da sessão em `403`. A matriz visual permanece fail-closed e a API continua autoridade.
- **Correção 1 — corrida no typecheck:** `turbo.json` passou a fazer `typecheck` depender também do `build` do próprio pacote. Problema observado: `@mission-atos/database#build` e `#typecheck` executavam `prisma generate` simultaneamente e falhavam com `ENOTEMPTY`. Evidência: reexecução de `npm.cmd run typecheck` concluiu com código 0, 13/13 tarefas, em 171,4 s.
- **Correção 2 — console do bootstrap anônimo:** `apps/web/tests/e2e/foundation.spec.ts` passou a excluir somente a mensagem exata do `401 Unauthorized` esperado do refresh anônimo; qualquer outro `console.error` continua falhando. A execução que revelou o problema percorreu os demais 20 cenários sem falha reportada, mas terminou por timeout do processo antes do resumo final.
- **Banco E2E:** o `postgres-test` canônico da porta 5433 colidiu com um PostgreSQL local. Foi usado container descartável `mission-atos-plan006-final-db` em `127.0.0.1:55433`, banco `mission_atos_test`; as 9 migrations foram aplicadas com sucesso desde banco vazio.
- **Comandos e resultados reais:** `npm run lint` falhou antes do projeto (código 1) pelo bloqueio do `npm.ps1` não assinado; a invocação Windows equivalente `npm.cmd run lint` passou com código 0, 6/6 tarefas, em 62,4 s. `npm.cmd run typecheck` falhou inicialmente com código 1 pela corrida do Prisma e, após a correção, passou com código 0, 13/13 tarefas, em 171,4 s. `npm.cmd test` passou com código 0, 11/11 tarefas; web 34/34 e API 52/52. `npm.cmd run build` passou com código 0, 7/7 tarefas, e listou 12 rotas web. No workspace web, lint passou (código 0, 38,9 s), typecheck passou (código 0, 5,8 s), testes unitários passaram (código 0, 34/34, 10,5 s) e build passou (código 0, 12 rotas, 52,3 s).
- **Playwright atual:** foram realizadas execuções reais contra API/PostgreSQL. Duas percorreram 21/21 casos sem falha reportada, mas o processo atingiu timeout de 600 s no encerramento (código 124). Uma execução em bundle de produção revelou origem de API incompatível e falhas de sessão; após rebuild com `NEXT_PUBLIC_API_URL=http://127.0.0.1:3001`, a execução percorreu os 21 casos e encontrou somente o falso positivo de console do refresh anônimo, corrigido acima, mas atingiu timeout de 900 s antes de produzir resumo/exit code final. Portanto, o Playwright atual **não está aprovado** nesta tentativa.
- **Validação manual:** o runtime do navegador interno foi inicializado conforme a skill, mas `agent.browsers.list()` retornou `[]`. Logo, viewports 360×800, 768×1024, 1280×800, zoom 200%, teclado e inspeção visual não foram revalidados nesta tentativa e permanecem pendentes.
- **Problemas por severidade:** Crítico: nenhum encontrado. Alto: nenhum encontrado. Médio: (1) Playwright sem exit code verde atual; (2) validação manual de acessibilidade/responsividade indisponível. Baixo: wrapper `npm.ps1` bloqueado pela política local, contornado por `npm.cmd`; conflito local da porta 5433, contornado por banco descartável na 55433.
- **Risco aceito:** nenhum risco Médio foi aceito como concluído. Os dois itens permanecem bloqueadores explícitos.
- **Próximo passo:** executar o Playwright em um ambiente Windows/CI que permita encerramento limpo dos processos e disponibilizar um backend de navegador para a verificação manual; somente depois atualizar o status para Concluído e mover o arquivo para `docs/plans/completed/`.

### 2026-08-08 — conclusão oficial

- **Status:** Concluído. A auditoria final não encontrou pendências Críticas, Altas ou Médias; os critérios de aceitação e a Definition of Done foram atendidos com evidência automatizada atual.
- **Resumo final:** `apps/web` é uma aplicação Next.js App Router navegável, autenticada e integrada à API real para login, dashboard simples, perfil, usuários, igreja e pessoas. Nenhuma funcionalidade de células, encontros, frequência, relatório, dashboard analítico ou Plano 007 foi criada.
- **Arquitetura de frontend:** Server Components permanecem o padrão de composição; ilhas Client Component concentram sessão, consultas autenticadas, formulários e interação. O código é organizado por feature, com cliente HTTP, sessão, cache e componentes compartilhados em limites transversais. A API permanece a autoridade de autenticação, autorização e regras de negócio.
- **Dependências adicionadas pelo plano:** produção — `@mission-atos/contracts` como workspace compartilhado; desenvolvimento — `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` e `jest-environment-jsdom`. Não foram adicionados React Query, React Hook Form, resolvers, biblioteca visual, tabela ou notificações.
- **Rotas implementadas:** `/`, `/login`, `/dashboard`, `/profile`, `/users`, `/users/new`, `/users/[id]`, `/church/settings`, `/people`, `/people/new`, `/people/[id]` e `/access-denied`, além dos boundaries de erro e não encontrado.
- **Telas implementadas:** bootstrap; login; dashboard de boas-vindas; perfil e troca de senha; lista, cadastro e detalhe de usuários; dados e configurações da igreja; lista, cadastro e detalhe de pessoas; acesso negado, loading, vazio e erro.
- **Componentes compartilhados:** `Alert`, `Button`, `TextField`, `TextareaField`, `SelectField`, `Dialog`, `LiveRegion`, `Pagination`, `Skeleton`, `EmptyState`, `ErrorState`, `StatusBadge`, `Table`, shell, sidebar, header, breadcrumbs, skip link, menu do usuário e guards visuais.
- **Estratégia de sessão:** access token Bearer somente em memória; refresh token opaco no cookie `HttpOnly` da API; bootstrap e rotação por `/auth/refresh`; coordenação single-flight; uma repetição máxima após `401`; logout best-effort com limpeza local em `finally`; falha definitiva encerra sessão e limpa caches; `403` preserva a sessão.
- **Proteção de rotas:** `RequireSession` protege o grupo autenticado, `RequireRole` e `Can` refletem capacidades de forma fail-closed, e a API revalida papel, igreja e policy em cada operação. O destino privado é preservado apenas por caminhos internos permitidos.
- **Endpoints integrados (23):** `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password`; `GET/PATCH /users/me`; `GET/POST /users`; `GET /users/managed-roles`; `GET/PATCH /users/:id`; `PATCH /users/:id/status`; `PUT /users/:id/roles`; `POST /users/:id/reset-password`; `GET/PATCH /church`; `GET/PATCH /church/settings`; `GET/POST /people`; `GET/PATCH /people/:id`; `PATCH /people/:id/status`.
- **Lacunas da API mantidas:** não há recuperação pública de senha, detalhe de pessoa inativa, consulta de candidatos a duplicidade ou CRUD plural de igrejas. A UI respeita essas limitações: reativação ocorre na lista, duplicidade usa aviso genérico e nenhuma capacidade ausente é simulada.
- **Correções adicionais da finalização:** seletores E2E de senha foram tornados semânticos após o botão “Mostrar senha” tornar `getByLabel("Senha")` ambíguo; foi adicionada a suíte `accessibility-responsive.spec.ts` para teclado, 360×800, 768×1024, 1280×800, zoom de 200% e ausência de overflow horizontal. Os últimos commits de máscaras/normalização, carregamento local de `.env`, porta do PostgreSQL de teste e `next-env.d.ts` foram preservados como corretos.
- **Testes criados/acumulados:** web Jest com 6 suítes e 44 testes; Playwright consolidado com 26 cenários; contratos com 29 testes; API com 52 testes; demais workspaces incluídos pela suíte raiz. Os cenários funcionais cobrem login válido/inválido, logout, bootstrap/401, 403 por papel, usuários, igreja, pessoas, perfil, console, teclado, responsividade e zoom.
- **Comandos finais e resultados reais:** `npm.cmd run lint` — 6/6 tarefas, código 0; `npm.cmd run typecheck` — 13/13 tarefas, código 0; `npm.cmd test` — 11/11 tarefas, código 0; `npm.cmd run build` — 7/7 tarefas e 12 rotas web, código 0; comandos diretos do web — lint, typecheck, 44/44 testes e build aprovados; Playwright completo — 26/26, código 0, em 1,5 minuto.
- **Banco E2E:** PostgreSQL 18.4 descartável em `127.0.0.1:55433/mission_atos_test`; 9 migrations aplicadas desde banco vazio e status atualizado. O banco de desenvolvimento não foi usado pelos testes.
- **Limitações conhecidas:** o backend do navegador interno permaneceu indisponível e o Next dev reportou filesystem lento no volume `E:`. A verificação manual foi substituída por Playwright reproduzível nos viewports, teclado e zoom exigidos; não há impacto funcional identificado. No PowerShell local usa-se `npm.cmd` porque a política de execução pode bloquear `npm.ps1`.
- **Riscos aceitos:** implantação deve preservar web/API same-site para o cookie `SameSite=Strict`; o aviso de filesystem lento é ambiental; as lacunas de API acima permanecem explicitamente fora do escopo. Nenhum risco residual foi classificado como Crítico, Alto ou Médio para o encerramento.
- **Melhorias futuras:** executar a mesma matriz em CI e repetir inspeção visual assistida quando um backend de navegador estiver disponível; avaliar headers/CSP e observabilidade sem PII em trabalho próprio; tratar lacunas da API somente em plano aprovado. Nenhuma dessas melhorias bloqueia o Plano 007.
- **Navegabilidade:** as telas principais foram percorridas com API/PostgreSQL reais; desktop, tablet, celular, zoom e teclado passaram sem overflow horizontal global nas rotas verificadas.
- **Disposição final:** documento movido para `docs/plans/completed/006-1-frontend-foundation-existing-modules.md`. O projeto está pronto para iniciar o planejamento do Plano 007, que ainda não foi criado nem implementado.
