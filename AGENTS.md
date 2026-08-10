# AGENTS.md

## Produto

Este repositório contém um ecossistema de gestão de células e
pequenos grupos composto por:

- painel administrativo web;
- aplicativo mobile para líderes;
- API central;
- banco PostgreSQL;
- sincronização offline no mobile.

A fonte principal das regras de produto está em:

- docs/product/PRD.md
- docs/product/PRD-Ecossistema-Celulas.pdf

Antes de implementar uma funcionalidade, consulte o PRD e o plano
ativo correspondente em docs/plans/.

## Stack obrigatória

- TypeScript
- npm
- Turborepo
- Next.js com App Router para apps/web
- React Native com Expo para apps/mobile
- NestJS para apps/api
- PostgreSQL
- Prisma ORM
- Zod para contratos e validação
- SQLite para persistência offline mobile
- Jest para testes unitários
- Playwright para testes E2E web

## Organização esperada

- apps/web
- apps/mobile
- apps/api
- packages/domain
- packages/contracts
- packages/database
- packages/config
- packages/typescript-config
- packages/eslint-config

## Arquitetura

Começar como monólito modular.

Módulos iniciais:

- identity
- organizations
- churches
- users
- permissions
- structures
- cells
- people
- meetings
- attendance
- reports
- synchronization
- audit

Não criar microsserviços sem uma decisão arquitetural registrada.

## Multi-tenancy

Todos os dados de negócio devem estar relacionados a uma organização
ou igreja.

Nenhuma consulta pode retornar dados de outra igreja sem autorização
explícita.

As permissões devem considerar:

1. papel do usuário;
2. igreja;
3. posição na estrutura hierárquica.

## Regras de desenvolvimento

- Usar TypeScript estrito.
- Não utilizar `any` sem justificativa documentada.
- Não armazenar segredos no repositório.
- Criar `.env.example`.
- Não adicionar dependência de produção sem explicar a necessidade.
- Preferir funções pequenas e nomes descritivos.
- Separar domínio, aplicação e infraestrutura.
- Não colocar regras de negócio em componentes React.
- Não colocar regras críticas apenas no aplicativo mobile.
- Endpoints de sincronização devem ser idempotentes.
- Alterações de dados importantes devem produzir auditoria.

## Banco de dados

- Utilizar UUIDs.
- Armazenar datas em UTC.
- Respeitar o fuso horário configurado pela igreja na apresentação.
- Utilizar exclusão lógica para registros de negócio.
- Criar índices para organization_id, church_id e relacionamentos.
- Não alterar migrations já aplicadas; criar uma nova migration.

## Qualidade

Antes de considerar uma tarefa concluída, executar:

```bash
npm lint
npm typecheck
npm test
npm build
```
