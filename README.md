# Ecossistema de Células

Fundação técnica do ecossistema de gestão de células. O repositório contém o monorepo, a aplicação web mínima, a API, a persistência PostgreSQL/Prisma e a infraestrutura de autenticação e autorização. Ainda não há cadastro administrativo, recuperação de senha, telas de autenticação, módulos funcionais ou aplicativo mobile.

## Requisitos

- Node.js 24 LTS (o intervalo aceito pelo projeto é `>=24 <26`);
- npm 11 (a versão registrada é `11.16.0`);
- Docker Desktop com Docker Compose para o PostgreSQL local, ou PostgreSQL 18.x externo equivalente;
- PowerShell no Windows, sem necessidade de WSL ou Bash.

No Windows com política de execução restritiva, use `npm.cmd` no lugar de `npm`. Os scripts são os mesmos.

## Instalação

```powershell
npm.cmd ci
```

Copie `.env.example` para `.env` somente se precisar sobrescrever os valores locais padrão. Nunca versione `.env` ou segredos.

## Banco de dados local

Os dois serviços são isolados: desenvolvimento usa a porta `5432` e testes usam `5433`. As credenciais do Compose são deliberadamente locais e fictícias.

```powershell
docker compose up -d postgres-dev postgres-test
docker compose ps
```

Configure `DATABASE_URL` e `TEST_DATABASE_URL` a partir do `.env.example`. No PowerShell, também é possível defini-las apenas para a sessão atual:

```powershell
$env:DATABASE_URL="postgresql://mission_atos_dev:local_dev_only@localhost:5432/mission_atos_dev?schema=public"
$env:TEST_DATABASE_URL="postgresql://mission_atos_test:local_test_only@localhost:5433/mission_atos_test?schema=public"
```

Valide, gere o client, aplique o histórico e execute a seed fictícia explicitamente:

```powershell
npm.cmd run db:format
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
npm.cmd run db:migrate:status
npm.cmd run db:seed
npm.cmd run test:integration
```

Para criar uma migration futura em desenvolvimento, use `npm.cmd run db:migrate:create --workspace @mission-atos/database -- --name nome_descritivo`, revise integralmente o SQL criado e só então aplique-o. Não use `prisma db push` e nunca altere uma migration já compartilhada ou aplicada.

Pare os serviços sem remover dados:

```powershell
docker compose down
```

Somente para descartar volumes locais confirmados como descartáveis:

```powershell
docker compose down --volumes
```

## Desenvolvimento

```powershell
npm.cmd run dev
```

- web: <http://localhost:3000>
- API: <http://localhost:3001>
- health check: <http://localhost:3001/health>

## Autenticação

A API oferece somente:

- `POST /auth/login`;
- `POST /auth/refresh`;
- `POST /auth/logout`;
- `POST /auth/change-password`.

### Gerenciamento de usuários

Os endpoints administrativos exigem Access Token com papel `ADMIN` ativo na
mesma igreja:

- `GET /users` — paginação (`page`, `pageSize`), busca (`search`) e filtros
  (`status`, `roleId`);
- `GET /users/:id`;
- `POST /users`;
- `PATCH /users/:id`;
- `PATCH /users/:id/status`;
- `PUT /users/:id/roles`;
- `POST /users/:id/reset-password`;
- `GET /users/me`;
- `PATCH /users/me`.

O `churchId` é sempre obtido do Access Token e não é aceito nos DTOs. E-mails
são normalizados em minúsculas, respostas usam uma lista explícita de campos e
nunca incluem hashes, senhas ou tokens. Desativação e reset administrativo
revogam sessões; operações administrativas produzem auditoria. A alteração da
própria senha permanece em `POST /auth/change-password`.

O login usa `AUTH_CHURCH_ID` para resolver a igreja do MVP. Usuários e papéis devem existir previamente; nenhuma seed cria credenciais.

### Gerenciamento da igreja

Os endpoints operam exclusivamente sobre o `churchId` do Access Token e não
aceitam identificador de igreja na rota, query ou body:

- `GET /church`;
- `PATCH /church`;
- `GET /church/settings`;
- `PATCH /church/settings`.

Qualquer usuário autenticado pode consultar os dados institucionais seguros e
as configurações da própria igreja. Somente um `ADMIN` atualmente ativo no
banco pode alterar dados ou configurações. Nome, slug, contatos e endereço são
normalizados no servidor; telefone usa E.164, CEP brasileiro usa oito dígitos e
o slug é globalmente único e protegido contra valores reservados.

Os PATCH são parciais: campo omitido é preservado e `null` remove somente um
campo institucional opcional. Alterações produzem auditoria transacional por
grupo, sem tokens, credenciais ou campos internos. Fuso horário usa
identificador IANA e o início da semana usa o enum `DayOfWeek`.

Configure valores reais apenas em ambiente local ou em um provedor seguro:

- `AUTH_CHURCH_ID`: UUID da igreja do MVP;
- `JWT_ACCESS_SECRET`: segredo exclusivo com ao menos 32 caracteres;
- `JWT_ISSUER` e `JWT_AUDIENCE`: emissor e audiência esperados;
- `JWT_ACCESS_TTL_SECONDS`: padrão de 600 segundos, máximo de 900;
- `REFRESH_TOKEN_PEPPER`: segredo distinto usado no HMAC do refresh;
- `REFRESH_TOKEN_TTL_SECONDS`: padrão de 30 dias;
- `AUTH_COOKIE_SECURE`: `true` sob HTTPS;
- `CORS_ORIGINS`: origens permitidas separadas por vírgula.

O Access Token é enviado como Bearer e tem duração curta. O Refresh Token é opaco, rotativo, armazenado somente como HMAC e entregue em cookie `HttpOnly`, `SameSite=Strict`, com caminho `/auth`. Logout revoga a sessão corrente; troca de senha revoga todas as sessões e cria auditoria sem hashes ou tokens.

Em suspeita de comprometimento, revogue as sessões afetadas no banco e rotacione os segredos por procedimento controlado. Rotacionar `JWT_ACCESS_SECRET` invalida todos os Access Tokens; rotacionar `REFRESH_TOKEN_PEPPER` invalida todos os Refresh Tokens.

## Validação

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd exec playwright install chromium
npm.cmd run test:e2e
npm.cmd run test:integration
npm.cmd run test:auth:integration
npm.cmd run test:auth:e2e
npm.cmd run test:churches:e2e
```

`npm test` executa somente testes unitários. O smoke test web fica separado em `npm run test:e2e`.

## Workspaces

```text
apps/
  api/                 API NestJS mínima
  web/                 aplicação Next.js com App Router
packages/
  contracts/           schemas Zod e contratos HTTP de autenticação
  database/            Prisma Client, schema, migrations, seed e testes PostgreSQL
  domain/              tipos e enums puros, sem dependência de infraestrutura
  config/              validação de ambiente com Zod
  eslint-config/       regras compartilhadas de lint
  typescript-config/   configurações TypeScript estritas
```

## Gerenciamento de pessoas

A API disponibiliza `GET /people`, `GET /people/:id`, `POST /people`,
`PATCH /people/:id` e `PATCH /people/:id/status`. Todas as rotas derivam a
igreja do principal autenticado. `ADMIN` e `PASTOR` criam e atualizam;
somente `ADMIN` altera status e lista inativos; `SUPERVISOR` e `LEADER`
consultam ativos. Observações são visíveis somente para `ADMIN` e `PASTOR`.

O teste HTTP específico é executado com
`npm run test:people:e2e --workspace @mission-atos/api`.
