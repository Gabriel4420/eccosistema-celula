# Ecossistema de Células

Fundação técnica do ecossistema de gestão de células. O repositório contém o monorepo, a aplicação web mínima, a API com health check e a fundação de domínio e persistência PostgreSQL/Prisma. Ainda não há autenticação, endpoints de negócio, módulos funcionais ou aplicativo mobile.

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

## Validação

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd exec playwright install chromium
npm.cmd run test:e2e
npm.cmd run test:integration
```

`npm test` executa somente testes unitários. O smoke test web fica separado em `npm run test:e2e`.

## Workspaces

```text
apps/
  api/                 API NestJS mínima
  web/                 aplicação Next.js com App Router
packages/
  database/            Prisma Client, schema, migrations, seed e testes PostgreSQL
  domain/              tipos e enums puros, sem dependência de infraestrutura
  config/              validação de ambiente com Zod
  eslint-config/       regras compartilhadas de lint
  typescript-config/   configurações TypeScript estritas
```
