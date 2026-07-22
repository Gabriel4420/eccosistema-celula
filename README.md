# Ecossistema de Células

Fundação técnica do ecossistema de gestão de células. Este marco contém somente o monorepo, a aplicação web mínima, a API com health check e as configurações compartilhadas. Não há autenticação, banco de dados, Prisma, módulos de negócio ou aplicativo mobile.

## Requisitos

- Node.js 24 LTS (o intervalo aceito pelo projeto é `>=24 <26`);
- npm 11 (a versão registrada é `11.16.0`);
- PowerShell no Windows, sem necessidade de WSL ou Bash.

No Windows com política de execução restritiva, use `npm.cmd` no lugar de `npm`. Os scripts são os mesmos.

## Instalação

```powershell
npm.cmd ci
```

Copie `.env.example` para `.env` somente se precisar sobrescrever os valores locais padrão. Nunca versione `.env` ou segredos.

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
```

`npm test` executa somente testes unitários. O smoke test web fica separado em `npm run test:e2e`.

## Workspaces

```text
apps/
  api/                 API NestJS mínima
  web/                 aplicação Next.js com App Router
packages/
  config/              validação de ambiente com Zod
  eslint-config/       regras compartilhadas de lint
  typescript-config/   configurações TypeScript estritas
```
