# Plano 003 — Autenticação e autorização

**Status:** planejado  
**Responsável:** a definir  
**Criado em:** 2026-07-23  
**Atualizado em:** 2026-07-23  
**PRD relacionado:** autenticação, perfis de acesso, multi-tenancy e requisitos de segurança descritos no PRD  
**ADRs relacionadas:** criar ADR para transporte e armazenamento dos tokens; consultar as ADRs vigentes antes da implementação  
**Branch ou issue:** a definir

---

## 1. Objetivo

Planejar a infraestrutura de autenticação e autorização da API NestJS para que usuários existentes possam entrar por e-mail e senha, renovar e encerrar sessões, alterar a própria senha e acessar somente rotas e recursos permitidos por papel, igreja e posição hierárquica.

Ao concluir a futura implementação deste plano, a API deverá:

- emitir Access Tokens JWT de curta duração;
- manter Refresh Tokens opacos, rotativos, revogáveis e armazenados apenas como hash;
- proteger rotas por padrão;
- aplicar autorização no servidor por roles e policies;
- limitar tentativas de login;
- preservar o isolamento entre igrejas;
- oferecer testes automatizados dos fluxos e das falhas de segurança.

Este documento não autoriza implementação nesta etapa.

## 2. Contexto

A fundação do monorepo foi definida no plano 001 e o domínio e o banco inicial foram definidos no plano 002. O schema atual já possui `User`, `Role` e `UserRole`, mas ainda não possui uma entidade de sessão revogável nem módulos de identidade e permissões na API.

A implementação deverá consultar, nesta ordem:

- `AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/completed/001-project-foundation.md`;
- `docs/plans/completed/002-domain-database-foundation.md`;
- este plano;
- ADRs aprovadas relacionadas à autenticação.

O projeto permanece um monólito modular. A autenticação será parte do módulo `identity`; a autorização reutilizável ficará em `permissions`. Repositories Prisma concretos permanecem na infraestrutura da API, enquanto `packages/database` expõe o acesso interno ao banco sem incorporar regras de aplicação.

Limitações registradas no plano 002 que afetem migrations ou testes PostgreSQL deverão ser resolvidas ou comprovadamente contornadas antes de considerar este plano concluído. Isso inclui execução reproduzível dos testes de integração, proteção contra uso acidental de banco não destinado a testes e carregamento consistente da `DATABASE_URL`.

## 3. Escopo

- Login por e-mail e senha para usuários previamente existentes.
- Normalização do e-mail antes da consulta.
- Resolução explícita da igreja do usuário no login.
- Hash e verificação de senha com Argon2id.
- Rehash oportunista após login quando os parâmetros armazenados estiverem obsoletos.
- Access Token JWT assinado e de curta duração.
- Refresh Token opaco, aleatório, rotativo, de uso único e revogável.
- Renovação de Access Token.
- Logout idempotente e revogação da sessão corrente.
- Detecção de reutilização de Refresh Token e revogação da família da sessão.
- Alteração de senha do usuário autenticado, com revogação de todas as suas sessões.
- Guards, decorators, roles e policies.
- Proteção global das rotas, com exceções públicas explícitas.
- Rate limit para login, sem bloqueio permanente de conta.
- Persistência das sessões no PostgreSQL por migration aditiva do Prisma.
- Contratos Zod compartilhados para entradas e saídas públicas de autenticação.
- Repositories, ports, casos de uso, serviços e adaptadores necessários.
- Auditoria persistente da alteração de senha, sem armazenar hashes ou outros segredos.
- Variáveis de ambiente e validação sem valores secretos no repositório.
- Testes unitários, de integração e E2E da API.
- Documentação operacional para configurar, testar e invalidar sessões.
- Planejamento da recuperação de senha, sem implementá-la.

## 4. Fora de escopo

- Cadastro, convite, importação, edição ou exclusão de usuários.
- Definição definitiva ou seed dos nomes de roles do produto.
- Autenticação social, SSO, MFA, biometria ou passkeys.
- JWT em cookies ou armazenamento de Access Token no front-end.
- Front-end, telas de login, dashboard ou qualquer alteração em `apps/web`.
- Aplicativo mobile.
- Células, reuniões, frequência, relatórios e notificações.
- Endpoints ou regras funcionais desses módulos.
- Envio de e-mail.
- Implementação de solicitação ou redefinição de senha.
- Criação de `PasswordResetToken` nesta migration.
- Redis ou outra infraestrutura distribuída de rate limit.
- Deploy ou configuração de produção.
- Auditoria de eventos funcionais além dos sinais de segurança estritamente necessários.
- Matriz funcional de autorização de células, pessoas, reuniões, frequência ou relatórios.

## 5. Suposições

- O MVP executa uma única instância da API e atende inicialmente uma igreja.
- Enquanto o produto não definir descoberta de tenant por domínio ou slug, `AUTH_CHURCH_ID` identifica a igreja do login por e-mail.
- O e-mail continua único por igreja, conforme o modelo do plano 002; não será promovido a único global.
- Usuários com status diferente de `ACTIVE` não podem autenticar.
- Roles já são atribuídas por dados existentes; este plano apenas as lê.
- O cliente envia o Access Token em `Authorization: Bearer <token>`.
- O Refresh Token é transportado em cookie `HttpOnly`, `Secure` em ambiente seguro, `SameSite=Strict` e limitado ao caminho `/auth`.
- O Access Token expira em 10 minutos e o Refresh Token em 30 dias, ambos configuráveis dentro de limites validados.
- Logout e alteração de senha não invalidam instantaneamente Access Tokens já emitidos; eles permanecem válidos por no máximo o TTL curto do JWT.
- Datas persistidas e comparadas usam UTC.
- O rate limit em memória é aceitável somente enquanto houver uma instância da API.
- Nenhum segredo ou token real será incluído em fixtures, seeds, logs ou `.env.example`.

## 6. Perguntas e decisões pendentes

- [ ] Aprovar ADR que formalize Access Token Bearer e Refresh Token em cookie seguro, incluindo proteção contra CSRF, CORS e comportamento no mobile futuro.
- [ ] Confirmar `AUTH_CHURCH_ID` como resolução temporária do tenant no login do MVP; antes de múltiplas igrejas, definir domínio, slug ou contexto equivalente.
- [ ] Confirmar nomes e semântica das roles do produto antes de criar qualquer matriz funcional de permissões.
- [ ] Confirmar se logout deve encerrar apenas a sessão corrente; este plano recomenda sessão corrente, deixando “encerrar todas” para uma entrega futura.
- [ ] Confirmar TTLs operacionais propostos: Access Token de 10 minutos e Refresh Token de 30 dias.
- [ ] Confirmar política de senha proposta: 12 a 128 caracteres, aceitando passphrases e sem regras arbitrárias de composição.
- [ ] Definir o provedor de e-mail e a experiência de recuperação de senha em plano futuro; isso não bloqueia login, refresh, logout ou alteração de senha.

Não implementar uma hipótese relevante sem registrá-la e resolver as cinco primeiras decisões aplicáveis antes da respectiva etapa.

## 7. Áreas afetadas

### Aplicação web

- Nenhuma alteração.
- A futura integração deverá manter o Access Token apenas em memória e depender do cookie `HttpOnly` para renovação; isso é orientação, não escopo de implementação deste plano.

### API

- Criar módulos `identity` e `permissions`.
- Criar controller apenas para login, refresh, logout e alteração de senha.
- Registrar proteção global e exceções públicas explícitas.
- Criar casos de uso, ports, services, adapters, guards, decorators e policies.
- Manter DTOs HTTP e mapeadores na apresentação, comandos/resultados na aplicação e modelos Prisma na infraestrutura.
- Manter o health check público.

### Banco de dados

- Acrescentar a entidade `Session` por nova migration.
- Não alterar migrations concluídas.
- Não alterar a semântica das entidades `User`, `Role` e `UserRole`, salvo nova migration corretiva justificada.

### Contratos compartilhados

- Organizar `packages/contracts` e adicionar schemas Zod exclusivos dos contratos de autenticação.
- Não exportar hashes, Refresh Tokens, detalhes internos de sessão ou o Prisma Client.
- Manter contratos de transporte independentes de NestJS, casos de uso e Prisma.

### Infraestrutura

- Acrescentar e validar variáveis de ambiente.
- Configurar cookies seguros, CORS com origens explícitas e confiança em proxy somente quando declarada.
- Não adicionar Redis, serviço externo ou configuração de deploy.

### Documentação

- Documentar variáveis, fluxos, limites, comandos, resposta a comprometimento e limitações.
- Registrar ADR de transporte dos tokens antes da implementação desse mecanismo.

## 8. Modelo e regras de negócio

### Entidades afetadas

#### User

- É a credencial existente.
- O login consulta `churchId + email` normalizado.
- `passwordHash` nunca sai da camada de infraestrutura.
- Somente `status = ACTIVE` permite autenticação.
- Alterar a senha atualiza `updatedAt` e revoga todas as sessões do usuário.
- Exclusão lógica ou bloqueio impede novos logins e novos refreshes.

#### Role e UserRole

- As roles efetivas são carregadas para o principal autenticado.
- A atribuição de roles permanece fora deste plano.
- Toda consulta deve respeitar `churchId`; uma role de outra igreja nunca é efetiva.

#### Session

Criar o modelo de persistência:

| Campo | Tipo/regra |
| --- | --- |
| `id` | UUID, chave primária |
| `churchId` | UUID, obrigatório |
| `userId` | UUID, obrigatório |
| `tokenHash` | string, obrigatório e único |
| `familyId` | UUID, obrigatório |
| `expiresAt` | timestamp UTC, obrigatório |
| `lastUsedAt` | timestamp UTC, opcional |
| `revokedAt` | timestamp UTC, opcional |
| `revokedReason` | enum/string controlada, opcional |
| `replacedBySessionId` | UUID, opcional |
| `createdAt` | timestamp UTC, obrigatório |
| `updatedAt` | timestamp UTC, obrigatório |

Regras:

- `Session` pertence obrigatoriamente a um `User` e a uma `Church`.
- As relações devem preservar o tenant, preferencialmente por chaves compostas já compatíveis com o schema.
- `tokenHash` é o HMAC-SHA-256 do token opaco usando pepper exclusivo; o token puro nunca é persistido.
- Um refresh bem-sucedido revoga a sessão usada e cria outra na mesma `familyId`, na mesma transação.
- `replacedBySessionId` referencia a sessão sucessora quando houver.
- `replacedBySessionId` possui self-FK opcional e unicidade para impedir que dois predecessores apontem para a mesma sucessora.
- Predecessora e sucessora devem pertencer à mesma `churchId`, ao mesmo `userId` e à mesma `familyId`; a rotação rejeita qualquer divergência.
- A self-FK usa `ON DELETE SET NULL`; as FKs de `Church` e `User` usam `RESTRICT/NO ACTION`.
- Token expirado, revogado, pertencente a usuário inativo ou igreja divergente é inválido.
- Reutilizar um token rotacionado revoga todas as sessões ativas da mesma família.
- `Session` não usa `deletedAt`: a revogação e a retenção do histórico são explícitas.
- Não usar cascade delete de `Church` ou `User` para sessões; preferir `Restrict/NoAction` e o ciclo de retenção explícito.
- Índices: `churchId`, `userId`, `familyId`, `expiresAt`, `(userId, revokedAt)` e `(churchId, userId)`.
- Unicidade: `tokenHash` e `replacedBySessionId` quando preenchido; relações compostas devem impedir associação entre tenants.

### Access Token

- JWT assinado com HS256 nesta fase do monólito.
- Claims mínimas: `sub`, `churchId`, `sid`, `roles`, `jti`, `iss`, `aud`, `iat` e `exp`.
- Não incluir e-mail, nome, hash, permissões de recurso nem outros dados pessoais.
- Validar algoritmo permitido, assinatura, issuer, audience e expiração.
- As roles do token dão apenas autorização grosseira. Policies dependentes de recurso devem consultar o estado atual no caso de uso.

### Senhas

- Usar Argon2id com salt aleatório e formato codificado pela biblioteca.
- Parâmetros mínimos iniciais: memória de 19 MiB, duas iterações e paralelismo 1; medir o ambiente e aumentar sem exceder o orçamento operacional aprovado.
- Aceitar entre 12 e 128 caracteres, inclusive espaços e passphrases; não truncar silenciosamente.
- Nunca registrar senha, hash ou motivos que revelem existência da conta.
- Para e-mail inexistente, executar verificação contra um hash Argon2id fixo de dummy para reduzir diferenças observáveis de tempo.
- Rehash oportunista somente após credencial válida e dentro da mesma igreja.

### Login e renovação

- Normalizar e-mail com trim e lowercase de forma idêntica ao cadastro existente.
- Responder genericamente a e-mail inexistente, senha inválida, usuário bloqueado ou excluído.
- Não criar lock permanente de conta por tentativas, evitando negação de serviço dirigida.
- Aplicar limites independentes por IP e por identificador derivado do e-mail normalizado, sem persistir o e-mail puro na chave.
- Limites iniciais propostos: 10 tentativas por IP e 5 por conta em 15 minutos; responder `429` quando excedidos.
- Em ambiente com mais de uma instância, substituir o storage em memória por storage distribuído antes de escalar.

### Logout e alteração de senha

- Logout é idempotente, revoga a sessão quando identificável e sempre limpa o cookie.
- Alteração de senha exige Access Token válido, senha atual válida e senha nova diferente.
- A atualização do hash e a revogação de todas as sessões ocorrem atomicamente.
- A mesma transação cria um `AuditLog` de alteração de senha contendo somente metadados seguros; `before` e `after` nunca contêm senha ou hash.
- Após alterar a senha, limpar o cookie e exigir novo login.

### Autorização

- `AccessTokenGuard` global protege todas as rotas por padrão.
- `@Public()` é permitido apenas em health check, login, refresh e logout.
- `@CurrentPrincipal()` fornece principal tipado sem expor o objeto Prisma.
- `@Roles(...)` e `RolesGuard` implementam RBAC grosseiro.
- `@CheckPolicies(...)` e `PoliciesGuard` avaliam handlers de policy tipados.
- Falta de autenticação produz `401`; autenticação válida sem permissão produz `403`.
- Ownership, igreja e hierarquia são validados no caso de uso depois que o recurso é carregado; decorators não substituem essa validação.
- Policies puras, o principal autenticado e contratos de autorização independentes de NestJS ficam em `packages/domain`; decorators e guards permanecem na apresentação da API.
- Não criar policies funcionais de células, reuniões, frequência ou relatórios neste plano.

### Recuperação de senha — planejamento futuro

Uma entrega futura deverá:

- responder de modo indistinguível para e-mails existentes e inexistentes;
- limitar solicitações por IP e conta;
- gerar token opaco criptograficamente aleatório, longo, de uso único e curta duração;
- persistir somente seu hash em uma entidade específica, criada por migration futura;
- enviar link por um port de notificação sem expor token em logs;
- invalidar o token após uso e revogar todas as sessões após redefinição;
- não usar perguntas de segurança;
- testar expiração, reutilização, enumeração e concorrência.

Nenhum endpoint, entidade, migration, serviço de e-mail ou caso de uso de recuperação será criado neste plano.

## 9. Contratos

### Entradas

- `POST /auth/login`
  - body: `{ email: string, password: string }`;
  - validação por schema Zod compartilhado;
  - igreja obtida de `AUTH_CHURCH_ID`, não do body.
- `POST /auth/refresh`
  - sem token no body;
  - Refresh Token lido exclusivamente do cookie configurado.
- `POST /auth/logout`
  - sem dado obrigatório no body;
  - usa o cookie, quando presente, e sempre o remove.
- `POST /auth/change-password`
  - requer Bearer Access Token;
  - body: `{ currentPassword: string, newPassword: string }`.

DTOs de transporte devem ser derivados ou verificados pelos schemas Zod, sem duplicar regras divergentes. Limites de tamanho devem ser aplicados antes das operações criptográficas.

Separação obrigatória:

- schemas e tipos do protocolo HTTP ficam em `packages/contracts`;
- DTOs de entrada da apresentação validam o payload e o convertem em comandos da aplicação;
- casos de uso recebem comandos e devolvem resultados próprios, sem tipos HTTP, NestJS ou Prisma;
- controllers mapeiam resultados da aplicação para os envelopes HTTP;
- repositories recebem e devolvem modelos da aplicação/domínio, realizando o mapeamento Prisma somente na infraestrutura.

### Saídas

- Login e refresh bem-sucedidos:
  - status `200`;
  - body `{ data: { accessToken, tokenType: "Bearer", expiresIn, user: { id, churchId, roles } }, meta: {} }`;
  - novo Refresh Token somente no header `Set-Cookie`.
- Logout bem-sucedido:
  - status `204`;
  - cookie expirado, inclusive quando a sessão já não existe.
- Alteração de senha bem-sucedida:
  - status `204`;
  - todas as sessões revogadas e cookie expirado.
- Nenhuma resposta inclui `passwordHash`, Refresh Token no JSON, `tokenHash` ou objeto Prisma.

### Erros esperados

| Situação | HTTP | Código público |
| --- | --- | --- |
| Credencial, usuário ou tenant inválido | 401 | `AUTH_INVALID_CREDENTIALS` |
| Access Token ausente, inválido ou expirado | 401 | `AUTH_UNAUTHENTICATED` |
| Refresh Token ausente, inválido, expirado ou revogado | 401 | `AUTH_REFRESH_INVALID` |
| Reutilização detectada | 401 | `AUTH_REFRESH_INVALID` |
| Permissão insuficiente | 403 | `AUTH_FORBIDDEN` |
| Limite de tentativas excedido | 429 | `AUTH_RATE_LIMITED` |
| Entrada inválida | 400 | `VALIDATION_ERROR` |

As respostas públicas não diferenciam conta inexistente, senha errada, usuário bloqueado ou reutilização de token. A causa detalhada pode gerar métrica interna sem dado pessoal.

Erros seguem o envelope arquitetural `{ error: { code, message, details } }`, sem detalhes técnicos ou diferenças que permitam enumeração.

### Permissões

- Login, refresh e logout são públicos no sentido do Access Token, mas continuam sujeitos às validações próprias.
- Alteração de senha exige o próprio usuário autenticado.
- Rotas novas são privadas por padrão.
- Roles são avaliadas dentro da mesma igreja.
- Policies de recurso devem receber principal e recurso tipados e negar por padrão.
- Não há permissão administrativa para cadastrar ou alterar usuários neste plano.

## 10. Etapas

### Etapa 1 — Resolver decisões e registrar arquitetura

- [ ] validar pendências da seção 6;
- [ ] criar ADR de transporte, armazenamento, rotação e revogação dos tokens;
- [ ] definir limites validados das variáveis de ambiente;
- [ ] documentar o modelo de ameaça mínimo;
- [ ] não iniciar código dependente de decisão ainda aberta.

### Etapa 2 — Preparar contratos e configuração

- [ ] organizar `packages/contracts` sem dependências de NestJS ou Prisma;
- [ ] criar schemas de login, resposta, refresh e alteração de senha;
- [ ] criar tipos de principal e códigos públicos de erro;
- [ ] definir DTOs da apresentação, comandos/resultados da aplicação e mapeadores sem dependência reversa;
- [ ] adicionar validação das variáveis de autenticação;
- [ ] atualizar `.env.example` somente com placeholders seguros;
- [ ] testar schemas e falhas de configuração.

### Etapa 3 — Criar a persistência de sessões

- [ ] adicionar `Session` e enum de motivo de revogação ao schema Prisma;
- [ ] definir relações, índices, unicidade e política de exclusão;
- [ ] definir self-FK de sucessão, unicidade e validação de mesma igreja, usuário e família;
- [ ] gerar nova migration `add_auth_sessions`, sem editar migrations anteriores;
- [ ] revisar SQL gerado para cascatas, locks e compatibilidade PostgreSQL;
- [ ] validar migration em banco vazio e banco no estado do plano 002;
- [ ] não adicionar credenciais ou sessões ao seed.

### Etapa 4 — Criar ports e adapters

- [ ] criar `UserCredentialsRepository`, `SessionRepository`, `SecurityAuditRepository` e unidade transacional necessária;
- [ ] criar ports `PasswordHasher`, `AccessTokenService`, `RefreshTokenGenerator` e `Clock`;
- [ ] implementar adapters Argon2id, JWT, geração aleatória e Prisma;
- [ ] manter Prisma Client e modelos de persistência fora das interfaces de aplicação;
- [ ] testar isolamento por igreja, transações e mapeamentos.

### Etapa 5 — Implementar login

- [ ] implementar `LoginUseCase`;
- [ ] aplicar normalização, consulta por tenant, dummy hash e status do usuário;
- [ ] carregar roles válidas da mesma igreja;
- [ ] criar sessão e emitir tokens;
- [ ] aplicar rate limit por IP e conta derivada;
- [ ] testar sucesso, falhas indistinguíveis, limites e concorrência.

### Etapa 6 — Implementar refresh e logout

- [ ] implementar `RefreshSessionUseCase` com rotação transacional;
- [ ] implementar detecção de reutilização e revogação da família;
- [ ] implementar `LogoutUseCase` idempotente;
- [ ] centralizar criação e remoção segura do cookie;
- [ ] validar Origin/Referer nos endpoints baseados em cookie;
- [ ] testar expiração, replay, corrida de refresh e limpeza do cookie.

### Etapa 7 — Implementar alteração de senha

- [ ] implementar `ChangePasswordUseCase`;
- [ ] verificar senha atual e política da nova senha;
- [ ] atualizar hash e revogar todas as sessões atomicamente;
- [ ] registrar `AuditLog` seguro na mesma transação, sem senha, hash ou token em `before`/`after`;
- [ ] limpar cookie e não emitir novo token;
- [ ] testar falha, sucesso, rollback transacional e rehash.

### Etapa 8 — Implementar autorização

- [ ] criar `AccessTokenGuard` global e validação completa do JWT;
- [ ] criar `@Public()` e `@CurrentPrincipal()`;
- [ ] criar `RolesGuard`, `@Roles()` e negação por padrão;
- [ ] criar `PoliciesGuard`, `@CheckPolicies()` e handlers tipados;
- [ ] marcar somente health, login, refresh e logout como públicos;
- [ ] testar `401`, `403`, tenant divergente e metadados combinados.

### Etapa 9 — Integrar módulos e endpoints

- [ ] criar a estrutura modular abaixo;
- [ ] registrar `IdentityModule` e `PermissionsModule` no monólito;
- [ ] criar somente os quatro endpoints desta entrega;
- [ ] configurar CORS, cookies e proxy de modo validado por ambiente;
- [ ] garantir que respostas e logs não exponham segredos;
- [ ] executar testes E2E das rotas protegidas e públicas.

Estrutura proposta:

```text
apps/api/src/modules/
├── identity/
│   ├── identity.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   ├── errors/
│   │   └── value-objects/
│   ├── application/
│   │   ├── ports/
│   │   └── use-cases/
│   ├── infrastructure/
│   │   ├── crypto/
│   │   ├── jwt/
│   │   └── prisma/
│   └── presentation/
│       ├── auth.controller.ts
│       ├── dto/
│       ├── mappers/
│       └── cookies/
└── permissions/
    ├── permissions.module.ts
    ├── application/
    └── presentation/
        ├── decorators/
        └── guards/

packages/contracts/src/auth/
packages/domain/src/permissions/
packages/database/prisma/migrations/<timestamp>_add_auth_sessions/
```

### Etapa 10 — Validar, documentar e encerrar

- [ ] executar toda a estratégia de testes;
- [ ] executar lint, typecheck, test e build na raiz;
- [ ] executar comandos específicos do banco;
- [ ] documentar operação local, variáveis e revogação emergencial;
- [ ] registrar comandos, resultados, limitações e decisões no progresso;
- [ ] mover o plano para `completed` somente após todos os critérios.

Dependências previstas e justificadas:

- `@nestjs/jwt`: assinatura e verificação integrada de JWT;
- `@nestjs/throttler`: rate limit no NestJS;
- `argon2`: hash Argon2id;
- `cookie-parser` e seus tipos: leitura controlada do cookie de refresh;
- `zod` em `packages/contracts`: contratos já exigidos pela arquitetura;
- `supertest` e seus tipos como dependências de desenvolvimento da API: E2E HTTP.

Não adicionar Passport, CASL, Redis, cliente de e-mail ou outro framework enquanto a necessidade não existir.

## 11. Critérios de aceitação

1. Uma migration nova e reproduzível cria `Session` com UUIDs, relações de tenant, índices, unicidade e sem cascatas destrutivas.
2. Aplicar todas as migrations em PostgreSQL vazio e em banco no estado do plano 002 produz o mesmo schema esperado.
3. Usuário `ACTIVE` com igreja, e-mail e senha válidos recebe Access Token e cookie de refresh; nenhum segredo aparece no log ou JSON indevido.
4. E-mail inexistente, senha inválida, usuário inativo e tenant inválido retornam o mesmo status e código público.
5. Senhas são verificadas e geradas com Argon2id nos parâmetros aprovados, e hashes obsoletos são atualizados após login válido.
6. O JWT rejeita assinatura, algoritmo, issuer, audience ou expiração inválidos.
7. O JWT contém apenas as claims mínimas definidas e expira no TTL configurado.
8. Refresh válido é aceito uma vez, revoga a sessão anterior e cria sucessora na mesma família de forma atômica.
9. Reutilizar Refresh Token rotacionado falha e revoga as sessões ativas da família.
10. Logout repetido retorna `204`, revoga quando aplicável e sempre remove o cookie.
11. Alteração de senha exige autenticação e senha atual, muda o hash e revoga todas as sessões de modo atômico.
12. O rate limit bloqueia os limites aprovados por IP e por conta sem registrar e-mail puro.
13. Todas as rotas são privadas por padrão, exceto health, login, refresh e logout.
14. Falta de autenticação retorna `401`; falta de role ou policy retorna `403`.
15. Roles de outra igreja nunca autorizam o principal.
16. Uma policy de teste demonstra negação por padrão e avaliação tipada de principal e recurso.
17. Nenhuma API pública expõe Prisma Client, `passwordHash`, token de refresh ou hash de sessão.
18. Não existem endpoints de cadastro, recuperação de senha ou módulos funcionais fora do escopo.
19. Testes unitários, de integração e E2E passam em Windows com npm workspaces.
20. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.
21. A documentação descreve configuração local, cookies, TTLs, limitações e procedimento para revogar sessões comprometidas.
22. O inventário de dependências contém somente as dependências justificadas neste plano.
23. Login e refresh retornam o envelope `{ data, meta }`, e erros retornam `{ error }`, conforme o contrato arquitetural.
24. Testes comprovam que a sucessora de uma rotação é única e pertence à mesma igreja, usuário e família da predecessora.
25. Alterar a senha cria `AuditLog` na mesma transação, sem senha, hash ou token em `before` ou `after`.
26. Inspeção de imports comprova que DTOs HTTP, comandos/resultados dos casos de uso e modelos Prisma permanecem separados.

## 12. Estratégia de testes

### Unitários

- Schemas Zod: normalização, limites e rejeição de campos inválidos.
- Mapeadores: contrato HTTP para comando e resultado da aplicação para envelope HTTP.
- `LoginUseCase`: sucesso, conta ausente, senha inválida, status, tenant, dummy hash e roles.
- `RefreshSessionUseCase`: sucesso, expiração, revogação, replay e família comprometida.
- `LogoutUseCase`: sessão existente, ausente e já revogada.
- `ChangePasswordUseCase`: senha atual, política, igualdade, revogação e erro transacional.
- Argon2id: hash, verify, parâmetros e necessidade de rehash.
- JWT: claims e falhas de algoritmo, assinatura, issuer, audience e tempo.
- Guards/decorators/policies: público, `401`, `403`, roles combinadas e negação padrão.
- Chaves de rate limit: IP e digest do e-mail sem exposição do valor.
- Cookies: flags, path, expiração e diferença validada entre ambientes.

### Integração

- Executar contra PostgreSQL real dedicado a testes.
- Provar a proteção que recusa banco sem marcador explícito de teste.
- Aplicar migrations do zero antes da suíte.
- Testar repositories Prisma e relações compostas por igreja.
- Testar self-FK, unicidade da sucessora e rejeição de sucessão entre igrejas, usuários ou famílias distintas.
- Testar rotação concorrente: somente uma tentativa pode consumir o token.
- Testar revogação de família e de todas as sessões do usuário.
- Testar atomicidade entre troca de senha e revogação.
- Testar atomicidade do `AuditLog` da troca de senha e ausência de dados sensíveis no registro.
- Testar que falhas não deixam sessão ou hash parcialmente atualizados.
- Não depender de ordem ou dados do seed de desenvolvimento.

### E2E

- Iniciar NestJS em modo de teste e usar Supertest.
- Cobrir os quatro endpoints com cookies e headers reais.
- Verificar login válido e falhas públicas indistinguíveis.
- Verificar envelopes de sucesso e erro definidos pela arquitetura.
- Verificar refresh rotativo, replay, logout idempotente e cookie removido.
- Verificar alteração de senha e necessidade de novo login.
- Verificar proteção global, exceções públicas, `401`, `403`, roles e policy de teste.
- Verificar `429` nos dois eixos de rate limit.
- Verificar CORS/Origin nos endpoints que consomem cookie.
- Não criar testes Playwright nem front-end.

### Validação manual

- Inspecionar SQL da migration e plano de execução dos índices relevantes.
- Inspecionar headers `Set-Cookie` sem copiar tokens para documentação.
- Decodificar apenas token fictício local e confirmar claims mínimas e TTL.
- Confirmar ausência de senhas, hashes e tokens nos logs.
- Confirmar que Swagger, se habilitado futuramente, não publica segredos de exemplo.
- Executar os comandos da seção 18 em PowerShell e registrar resultados.

## 13. Segurança e privacidade

- Autorização: proteger globalmente e negar por padrão; autorização de recurso ocorre também no caso de uso.
- Isolamento de dados: todas as consultas de credenciais, roles e sessões incluem `churchId`; relações não cruzam tenant.
- Auditoria: alteração de senha gera `AuditLog` transacional com ação e identificadores, sem senha, hash, token ou payload sensível.
- Dados sensíveis: senhas, hashes, peppers e tokens nunca são retornados, persistidos em claro ou registrados.
- Secrets: `JWT_ACCESS_SECRET` e `REFRESH_TOKEN_PEPPER` são distintos, fortes, obrigatórios e fornecidos fora do repositório.
- Cookies: `HttpOnly`, `SameSite=Strict`, `Path=/auth`, `Secure` fora de desenvolvimento local e duração alinhada ao refresh.
- CSRF: validar `Origin/Referer` nos endpoints baseados em cookie e manter CORS com allowlist explícita.
- JWT: aceitar somente o algoritmo configurado e validar issuer/audience/expiração.
- Enumeração: resposta de login e futura recuperação não revela existência ou status da conta.
- DoS: limitar tamanho dos campos antes de Argon2id e aplicar rate limit sem bloqueio permanente.
- Logs: usar identificadores técnicos/correlation ID; não registrar e-mail puro, senha, authorization header, cookie ou token.
- Exportações: não há exportação neste plano.
- LGPD: minimizar claims e retenção; definir em documentação prazo operacional para limpeza de sessões expiradas antes de produção.
- Dependências: executar auditoria e verificar pacotes nativos de Argon2 no Windows e no ambiente alvo.
- Comprometimento: suportar revogação de todas as sessões; rotação de secrets exige procedimento documentado.

## 14. Migração de dados

- Criar uma nova migration Prisma chamada `add_auth_sessions`.
- Nunca alterar a migration inicial do plano 002.
- A migration é aditiva: cria enum, tabela, FKs, índices e constraints de `Session`.
- A migration inclui a self-FK opcional de sucessão, unicidade de `replacedBySessionId` e constraints necessárias para preservar tenant e cadeia de rotação.
- Revisar explicitamente `ON DELETE` para impedir remoção em cascata de histórico de sessão.
- Validar primeiro em banco descartável vazio e depois sobre snapshot compatível com o estado do plano 002.
- A implantação futura deverá aplicar migration antes do código que passa a gravar sessões.
- Não há backfill: usuários existentes não recebem sessão até novo login.
- O seed existente não deve ganhar usuário autenticável, senha, hash conhecido, sessão ou token.
- Testes criam credenciais exclusivamente por factories e banco isolado, usando valores fictícios.
- Limpeza de sessões expiradas será documentada; job recorrente fica para plano de infraestrutura posterior.
- Recuperação de senha exigirá entidade e migration próprias em entrega futura.
- Rollback não deve editar migration aplicada nem executar automaticamente `migrate reset`.

## 15. Observabilidade

- Logs estruturados com evento, resultado, correlation ID e IDs internos estritamente necessários.
- Eventos: tentativa de login, login concluído, rate limit, refresh concluído, replay detectado, logout, senha alterada e autorização negada.
- Causas internas devem ser categóricas e não conter credencial ou token.
- Métricas:
  - logins por resultado;
  - respostas `429`;
  - refreshes válidos e inválidos;
  - reutilizações detectadas;
  - sessões revogadas;
  - latência de Argon2id e dos endpoints;
  - `401` e `403` por rota normalizada.
- Alertas futuros: aumento abrupto de falhas, replay ou latência criptográfica; configuração efetiva do alerta fica fora deste plano.
- Nunca usar e-mail, senha, token, cookie ou authorization header como label de métrica.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |
| Login por e-mail ambíguo entre igrejas | Média | Alto | Usar `AUTH_CHURCH_ID` no MVP e definir descoberta de tenant antes de multi-igreja |
| Roubo de Refresh Token | Média | Crítico | Cookie seguro, hash com pepper, rotação, uso único e detecção de replay |
| CSRF nos endpoints de cookie | Média | Alto | `SameSite=Strict`, Origin/Referer, CORS explícito e ADR |
| Access Token continuar válido após logout | Alta | Médio | TTL de 10 minutos e documentação clara; denylist fica fora desta fase |
| Corrida permite dois refreshes | Média | Alto | Consumo transacional/atômico e teste concorrente |
| Enumeração ou ataque de força bruta | Média | Alto | Erro genérico, dummy hash e limites por IP e conta |
| Rate limit em memória divergir com múltiplas instâncias | Alta ao escalar | Alto | Limitar implantação a uma instância e migrar storage antes de escalar |
| Argon2id causar latência ou incompatibilidade nativa | Média | Médio | Benchmark, parâmetros validados e teste em Windows/CI |
| Role stale dentro do JWT | Média | Médio | TTL curto; policies críticas consultam estado atual no caso de uso |
| Cruzamento de tenant em repository ou role | Baixa | Crítico | FKs compostas, filtros obrigatórios e testes negativos |
| Secret fraco ou reutilizado | Baixa | Crítico | Validação de entropia/tamanho, secrets distintos e sem defaults |
| Migration bloquear ou apagar dados | Baixa | Alto | Migration aditiva, revisão SQL e ensaio nos dois estados de banco |
| Limitações herdadas do plano 002 invalidarem testes | Média | Alto | Resolver runner, proteção do banco de teste e ambiente antes do DoD |
| Recuperação de senha ser antecipada sem provedor definido | Média | Médio | Manter apenas planejamento e criar plano/migration futuros |

## 17. Estratégia de reversão

- Código: reverter o módulo e seus registros no `AppModule`, restaurando a versão anterior da API; health check permanece funcional.
- Migration: por ser aditiva, reverter primeiro o código e manter tabela/enum sem uso. Remoção posterior exige nova migration explícita, backup e confirmação de que não há sessões necessárias.
- Nunca editar migration aplicada, apagar diretórios de migration ou executar `prisma migrate reset` em ambiente com dados.
- Configuração: restaurar variáveis anteriores somente depois que o código antigo estiver ativo; remover secrets não mais usados do provedor seguro.
- Sessões: em incidente, revogar todas as sessões no banco e rotacionar o pepper; isso força novo login.
- JWT secret: rotação simples invalida todos os Access Tokens. Se continuidade for necessária, planejar suporte temporário a chave anterior em ADR antes da operação.
- Rate limit/cookie: uma configuração inválida deve ser revertida junto com a versão da API, preservando a proteção de rotas.
- Deploy não faz parte deste plano; os passos acima devem ser convertidos em runbook antes de produção.
- Registrar motivo, comandos, versão e impacto de qualquer reversão.

## 18. Comandos de validação

Os scripts específicos deverão existir nos `package.json` apropriados e funcionar via npm workspaces. Nomes podem ser ajustados somente antes da implementação e registrados no progresso.

```bash
npm ci

npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:create --workspace @mission-atos/database -- --name add_auth_sessions
npm run db:migrate:deploy
npm run db:migrate:status

npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:auth:e2e --workspace @mission-atos/api

npm run lint
npm run typecheck
npm test
npm run build

npm audit
```

Regras de execução:

- executar migrations de integração e suites conectadas somente com `TEST_DATABASE_URL` de banco descartável, explicitamente marcado para testes e comprovadamente diferente de `DATABASE_URL`;
- registrar comando, resultado e motivo de qualquer comando não executado;
- usar somente scripts npm compatíveis com PowerShell, sem comandos Unix específicos ou expansão de variável de shell;
- não executar `db:seed` como requisito de autenticação;
- executar `db:migrate:create` uma única vez para gerar a migration e depois validar seu conteúdo versionado.

## 19. Definition of Done

- [ ] escopo implementado;
- [ ] decisões bloqueantes resolvidas e ADR aprovada;
- [ ] critérios de aceitação atendidos;
- [ ] autorização validada no servidor;
- [ ] isolamento por igreja coberto por testes negativos;
- [ ] migration nova revisada e reproduzível;
- [ ] nenhum dado sensível adicionado a seed, fixture versionada, log ou exemplo;
- [ ] alteração de senha auditada sem senha, hash ou token;
- [ ] DTOs, comandos/resultados e modelos de persistência separados;
- [ ] testes unitários criados ou atualizados;
- [ ] testes de integração executados em PostgreSQL isolado;
- [ ] testes E2E da API executados;
- [ ] lint executado;
- [ ] typecheck executado;
- [ ] testes executados;
- [ ] build executado;
- [ ] auditoria de dependências revisada;
- [ ] documentação e `.env.example` atualizados sem segredos;
- [ ] comandos e resultados registrados;
- [ ] riscos e limitações informados;
- [ ] ausência de cadastro, recuperação implementada, front-end e módulos funcionais confirmada;
- [ ] plano movido para `completed`.

## 20. Registro de progresso

### 2026-07-23

- realizado: leitura integral da documentação obrigatória, inspeção da estrutura atual e criação do plano;
- testes: não executados, pois esta etapa altera somente documentação;
- decisões: módulos `identity` e `permissions`; Argon2id; JWT Bearer curto; Refresh Token opaco em cookie seguro, rotativo e armazenado como hash; sessão persistida; proteção global; repositories Prisma na infraestrutura da API;
- revisão: removida a referência ao gerenciador não adotado; contratos alinhados ao envelope arquitetural; DTOs, aplicação e Prisma separados; testes de integração da API explicitados; `TEST_DATABASE_URL` corrigida; sucessão de sessões restringida; auditoria segura da alteração de senha adicionada; policies puras direcionadas a `packages/domain`;
- bloqueios: ADR de tokens, confirmação da resolução temporária do tenant, TTLs, política de senha, roles e semântica do logout;
- próximo passo: revisar e aprovar o plano e suas decisões antes de qualquer implementação.
