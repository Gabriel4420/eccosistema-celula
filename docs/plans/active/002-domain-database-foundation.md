# Plano 002 — Fundação do domínio e banco de dados

**Status:** planejado  
**Responsável:** a definir  
**Criado em:** 2026-07-22  
**Atualizado em:** 2026-07-22  
**PRD relacionado:** `docs/product/PRD.md`, seções 10, 12 e 14, item 2 — banco e modelo inicial  
**ADRs relacionadas:** ADR sobre armazenamento de pedidos de oração, a criar antes da migration inicial  
**Branch ou issue:** a definir

---

## 1. Objetivo

Estabelecer a fundação persistente do produto com PostgreSQL e Prisma ORM, incluindo os pacotes `packages/domain` e `packages/database`, configuração tipada de ambiente, modelo relacional inicial, primeira migration versionada, estratégia de seeds e testes de integração das constraints.

Ao final desta etapa, o schema deve poder ser criado de forma reproduzível em um PostgreSQL vazio, gerar um Prisma Client consumível apenas no servidor e comprovar por testes as relações, o isolamento por igreja, as unicidades, os índices essenciais, os timestamps, a exclusão lógica e a imutabilidade da auditoria. Nenhuma autenticação, API de negócio ou regra comportamental será implementada.

## 2. Contexto

Este é o segundo item do roadmap do PRD e depende da fundação concluída no Plano 001. O repositório atual contém npm workspaces, Turborepo, Next.js, NestJS, configurações compartilhadas e validação de ambiente, mas ainda não possui `packages/domain`, `packages/database`, Prisma ou PostgreSQL configurado.

Documentos de referência obrigatórios:

- `AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/TEMPLATE.md`;
- `docs/plans/completed/001-project-foundation.md`.

Referências operacionais do Prisma a observar durante a implementação:

- `prisma.config.ts` será a fonte dos caminhos de schema, migrations, seed e datasource;
- `prisma migrate dev` será usado somente em desenvolvimento para criar migrations;
- `prisma migrate deploy` será usado para aplicar migrations já versionadas em ambientes controlados;
- `prisma db seed` será sempre explícito;
- o histórico completo de migrations e o schema serão versionados.

## 3. Escopo

- adicionar PostgreSQL somente para desenvolvimento e testes, sem configurar hospedagem ou deploy de produção;
- adicionar Prisma ORM e Prisma Client em versões compatíveis e fixadas pelo `package-lock.json`;
- criar `packages/domain` com tipos de entidade, identificadores e enums puros, sem dependência de Prisma, NestJS ou banco;
- criar `packages/database` como dono do schema Prisma, Prisma Client, configuração, migrations, seed e utilitários de teste;
- configurar `prisma.config.ts`, `schema.prisma`, geração do client e scripts npm do workspace;
- estender a configuração privada de ambiente com `DATABASE_URL` e `TEST_DATABASE_URL`, sem valores reais no repositório;
- fornecer em `compose.yaml` PostgreSQL 18.4 local/teste reproduzível, com serviços e dados isolados, sem uso em produção;
- modelar `Church`, `User`, `Role`, `UserRole`, `SupervisorAssignment`, `Cell`, `Person`, `CellMembership`, `Meeting`, `MeetingAttendance`, `MeetingReport` e `AuditLog`;
- adicionar campos estruturais de tenant, identidade, timestamps e exclusão lógica necessários às regras do repositório;
- definir relações, foreign keys, ações referenciais, índices e constraints de unicidade;
- criar e revisar a migration inicial antes de aplicá-la;
- definir seeds idempotentes, fictícios e seguros;
- criar testes unitários para tipos/utilitários próprios e testes de integração contra PostgreSQL real para schema, migrations e constraints;
- integrar `packages/domain` e `packages/database` ao grafo de lint, typecheck, test e build do Turborepo;
- atualizar `.env.example`, README e o registro deste plano.

## 4. Fora de escopo

- autenticação, autorização, JWT, cookies, sessões, refresh tokens ou recuperação de senha;
- hashing ou verificação de senha; `passwordHash` será apenas modelado como campo sensível;
- endpoints, controllers, Swagger de negócio ou alterações no health check existente;
- casos de uso, services, commands, queries ou regras comportamentais;
- repositories concretos de negócio ou um `BaseRepository` genérico;
- integração do Prisma com componentes Next.js ou acesso ao banco pela aplicação web;
- telas, formulários, dashboard, relatórios, exportações ou PWA;
- cálculo de frequência, envio de relatório, deduplicação de pessoas, transferência de participantes ou autorização hierárquica;
- escrita automática de auditoria; esta etapa cria somente a estrutura persistente de `AuditLog`;
- criptografia ou exibição de pedidos de oração antes da ADR correspondente;
- aplicativo mobile, SQLite ou sincronização offline;
- importação ou migração de dados reais;
- provedor gerenciado, backup, CI/CD ou deploy de produção;
- `packages/contracts` ou contratos HTTP.

## 5. Suposições

- o banco inicial está vazio e não exige baseline de dados legados;
- PostgreSQL será o único banco relacional suportado pelo Prisma nesta etapa;
- todas as datas e instantes persistidos serão tratados em UTC; datas civis usarão `DATE`, horários locais recorrentes usarão `TIME` e instantes usarão `TIMESTAMPTZ`;
- todos os identificadores de entidade serão UUIDs gerados no banco ou pelo Prisma de forma consistente;
- `churchId` será gravado diretamente em todas as tabelas de negócio, inclusive associações, para permitir filtro, índice e constraint de tenant sem depender de joins indiretos;
- e-mails serão normalizados para lowercase antes da persistência por casos de uso futuros; a constraint inicial será composta por igreja e valor persistido;
- códigos de célula, slugs e nomes de papel permanecem reservados mesmo após exclusão lógica, preservando identidade e histórico;
- registros com `deletedAt` serão restaurados/atualizados, não recriados com a mesma chave única;
- nenhuma seed criará usuário, hash de senha ou dado pessoal nesta etapa;
- o Prisma Client será uma dependência exclusiva de código servidor e nunca será importado pela web;
- o pacote de banco exporá o client e fronteiras transacionais, mas não regras de negócio.
- o ambiente local canônico usará Docker Compose; uma instância externa PostgreSQL 18.x poderá substituí-lo desde que forneça `DATABASE_URL` e `TEST_DATABASE_URL` equivalentes.

## 6. Perguntas e decisões pendentes

- [ ] criar e aprovar uma ADR para armazenamento de `prayerRequests`, definindo necessidade, criptografia em repouso, retenção e acesso antes de criar a coluna na migration;
- [ ] confirmar a nomenclatura oficial dos papéis antes de adicionar qualquer Role à seed;
- [ ] confirmar o vocabulário permitido para `gender`; até a decisão, o campo permanecerá string opcional limitada em tamanho, sem enum prematuro;

Não implemente uma hipótese relevante sem registrá-la.

A ADR de `prayerRequests` bloqueia somente a criação dessa coluna. A modelagem e a migration das demais estruturas podem avançar; se necessário, a coluna será adicionada por uma nova migration deste mesmo plano, sem alterar uma migration já aplicada.

## 7. Áreas afetadas

### Aplicação web

- não será alterada;
- continuará sem Prisma, `DATABASE_URL` ou acesso direto ao banco.

### API

- não receberá endpoints, módulos de negócio, repositories ou casos de uso;
- poderá depender de `packages/database` somente em plano posterior, quando houver um consumidor real;
- o health check existente permanecerá sem consulta ao banco nesta etapa.

### Banco de dados

- novo PostgreSQL local/teste;
- schema Prisma e migration inicial;
- tabelas, enums, foreign keys, índices, unicidades e índices parciais descritos neste plano;
- dados fictícios mínimos e explícitos por seed.

### Contratos compartilhados

- `packages/domain` conterá tipos e enums puros de domínio, sem DTOs HTTP;
- `packages/contracts` não será criado nesta etapa;
- tipos gerados pelo Prisma não serão reexportados como tipos de domínio.

### Infraestrutura

- novo workspace `packages/database`;
- novo workspace `packages/domain`;
- scripts npm para validar, formatar, gerar, migrar, aplicar, semear e testar o banco;
- variáveis `DATABASE_URL` e `TEST_DATABASE_URL` apenas no entrypoint privado de configuração;
- ambiente PostgreSQL local/teste reproduzível e compatível com PowerShell.

Dependências permitidas e justificadas:

- `prisma`: CLI de schema, geração e migrations;
- `@prisma/client`: client tipado gerado;
- `@prisma/adapter-pg` e `pg`: conexão PostgreSQL exigida pela versão atual do Prisma;
- `dotenv`: carregamento explícito do `.env` pelo `prisma.config.ts`;
- `tsx`: execução TypeScript da seed e utilitários de teste;
- `@types/pg`: tipos de desenvolvimento do driver;
- nenhuma biblioteca de repository, migration paralela ou ORM adicional.

### Documentação

- README com preparação do PostgreSQL, variáveis, migrations, seed, testes e comandos Windows;
- `.env.example` com URLs locais fictícias, sem credenciais reais;
- este plano atualizado com decisões e resultados reais.

## 8. Modelo e regras de negócio

Esta etapa modela estrutura e invariantes de persistência, não comportamento de produto.

### 8.1 Convenções de nomenclatura e tipos

- modelos Prisma e tipos TypeScript em `PascalCase`;
- campos TypeScript/Prisma em `camelCase`;
- tabelas PostgreSQL no plural e `snake_case` por `@@map`;
- colunas PostgreSQL em `snake_case` por `@map`;
- primary keys chamadas `id` e foreign keys terminadas em `Id` no Prisma e `_id` no banco;
- constraints e índices com nomes explícitos, estáveis e descritivos em `snake_case`;
- UUID para todas as primary keys e foreign keys;
- `createdAt` com default do banco, `updatedAt` atualizado pelo Prisma e ambos como `TIMESTAMPTZ(3)`;
- `deletedAt` opcional como `TIMESTAMPTZ(3)`;
- `birthDate` e `meetingDate` como `DATE`;
- `meetingTime` como `TIME(0)`;
- `before` e `after` como `JSONB` opcional;
- e-mails com até 320 caracteres, hashes com até 255, telefones com até 32 e nomes/códigos com limites explícitos;
- nenhuma coluna de senha, pedido de oração ou auditoria poderá aparecer em logs ou mensagens de erro.

### 8.2 Estados iniciais

- `UserStatus`: `ACTIVE`, `BLOCKED`;
- `CellStatus`: `FORMING`, `ACTIVE`, `SUSPENDED`, `CLOSED`;
- `MembershipStatus`: `ACTIVE`, `INACTIVE`, `TRANSFERRED`;
- `MeetingStatus`: `SCHEDULED`, `COMPLETED`, `CANCELED`;
- `AttendanceStatus`: `PRESENT`, `ABSENT`, `EXCUSED`;
- `ReportStatus`: `NOT_STARTED`, `DRAFT`, `SUBMITTED`, `RETURNED`, `CANCELED`;
- `DayOfWeek`: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`;
- `gender` não terá enum até a decisão registrada na seção 6.

### 8.3 Entidades e campos

Campos marcados como estruturais são adicionados aos campos solicitados para cumprir UUID, tenant, histórico e exclusão lógica.

| Entidade | Campos e nulabilidade | Timestamps e exclusão |
| --- | --- | --- |
| `Church` | `id UUID`, `name`, `slug` | `createdAt`, `updatedAt`, `deletedAt?` |
| `User` | `id UUID`, `churchId UUID`, `firstName`, `lastName`, `email`, `passwordHash`, `status UserStatus` | `createdAt`, `updatedAt`, `deletedAt?` |
| `Role` | `id UUID`, `churchId UUID`, `name` | `createdAt`, `updatedAt`, `deletedAt?` |
| `UserRole` | `id UUID`, `churchId UUID` estrutural, `userId UUID`, `roleId UUID` | `createdAt`, `updatedAt`, `deletedAt?` |
| `SupervisorAssignment` | `id UUID` estrutural, `churchId UUID` estrutural, `supervisorId UUID`, `leaderId UUID` | `createdAt`, `updatedAt`, `deletedAt?` |
| `Cell` | `id UUID`, `churchId UUID`, `code`, `name`, `status CellStatus`, `leaderId UUID?`, `traineeLeaderId UUID?`, `meetingDay DayOfWeek`, `meetingTime TIME`, `address` | `createdAt`, `updatedAt`, `deletedAt?` |
| `Person` | `id UUID`, `churchId UUID`, `fullName`, `phone?`, `email?`, `birthDate? DATE`, `gender?` | `createdAt`, `updatedAt`, `deletedAt?` |
| `CellMembership` | `id UUID`, `churchId UUID` estrutural, `personId UUID`, `cellId UUID`, `status MembershipStatus`, `joinedAt TIMESTAMPTZ`, `leftAt? TIMESTAMPTZ` | `createdAt`, `updatedAt`, `deletedAt?` |
| `Meeting` | `id UUID`, `churchId UUID` estrutural, `cellId UUID`, `meetingDate DATE`, `status MeetingStatus` | `createdAt`, `updatedAt`, `deletedAt?` |
| `MeetingAttendance` | `id UUID`, `churchId UUID` estrutural, `meetingId UUID`, `personId UUID`, `attendanceStatus AttendanceStatus` | `createdAt`, `updatedAt`, `deletedAt?` |
| `MeetingReport` | `id UUID`, `churchId UUID` estrutural, `meetingId UUID`, `observations?`, `prayerRequests?`, `submittedBy UUID?`, `submittedAt? TIMESTAMPTZ`, `status ReportStatus` | `createdAt`, `updatedAt`, `deletedAt?` |
| `AuditLog` | `id UUID`, `churchId UUID`, `userId UUID?`, `entity`, `entityId UUID`, `action`, `before? JSONB`, `after? JSONB` | somente `createdAt`; sem `updatedAt` ou `deletedAt` |

Decisões de nulabilidade:

- `Cell.leaderId` será opcional para suportar formação, suspensão e exceção administrativa; a exigência de líder para célula ativa será validada em caso de uso futuro;
- `traineeLeaderId`, dados opcionais de pessoa, `leftAt`, campos de submissão e textos do relatório serão opcionais;
- `submittedBy` e `submittedAt` serão preenchidos somente quando o relatório for submetido por lógica futura;
- `AuditLog.userId` será opcional para eventos de sistema futuros e para preservar auditoria sem depender de exclusão física de usuário;
- `prayerRequests` só poderá entrar na migration após a ADR exigida na seção 6.

### 8.4 Relacionamentos

- `Church` 1:N `User`, `Role`, `Cell`, `Person`, `UserRole`, `SupervisorAssignment`, `CellMembership`, `Meeting`, `MeetingAttendance`, `MeetingReport` e `AuditLog`;
- `User` 1:N `UserRole` e `Role` 1:N `UserRole`; cada `UserRole` pertence obrigatoriamente a exatamente um usuário e um papel, formando o N:N;
- `User` 1:N `SupervisorAssignment` nos lados nomeados `supervisor` e `leader`; cada atribuição pertence obrigatoriamente a exatamente um supervisor e um líder, formando a autorrelação N:N;
- `User` 0:N `Cell` como líder e 0:N como líder em treinamento; cada célula possui 0..1 líder e 0..1 líder em treinamento, em relações nomeadas separadamente;
- `Person` 1:N `CellMembership` e `Cell` 1:N `CellMembership`; cada vínculo pertence obrigatoriamente a exatamente uma pessoa e uma célula, formando o N:N histórico;
- `Cell` 1:N `Meeting`; cada encontro pertence obrigatoriamente a exatamente uma célula;
- `Meeting` 1:N `MeetingAttendance` e `Person` 1:N `MeetingAttendance`; cada presença pertence obrigatoriamente a exatamente um encontro e uma pessoa, formando o N:N;
- `Meeting` 1:0..1 `MeetingReport`; cada relatório pertence obrigatoriamente a exatamente um encontro;
- `User` 0:N `MeetingReport` por `submittedBy`; cada relatório possui 0..1 usuário submetente;
- `User` 0:N `AuditLog`; cada registro de auditoria possui 0..1 usuário;
- todas as relações entre registros tenant-owned devem incluir `churchId` em foreign keys compostas ou possuir constraint equivalente que impeça referências entre igrejas;
- `User`, `Role`, `Cell`, `Person` e `Meeting` terão chaves candidatas técnicas únicas `(id, churchId)` para suportar essas foreign keys compostas; elas não substituem as primary keys em `id`;
- foreign keys de dados históricos usarão `RESTRICT` por padrão; não haverá cascade delete de registros de negócio;
- `AuditLog.userId` poderá usar `SET NULL` apenas se uma exclusão física excepcional for autorizada no futuro.

### 8.5 Unicidade e invariantes estruturais

- `Church.slug` único globalmente;
- `User(churchId, email)` único;
- `Role(churchId, name)` único;
- `UserRole(churchId, userId, roleId)` único;
- `SupervisorAssignment(churchId, supervisorId, leaderId)` único;
- `Cell(churchId, code)` único;
- `Meeting(churchId, cellId, meetingDate)` único para impedir encontro equivalente duplicado;
- `MeetingAttendance(churchId, meetingId, personId)` único para impedir dois status por pessoa no mesmo encontro;
- `MeetingReport(churchId, meetingId)` único para manter no máximo um relatório por encontro;
- somente um `CellMembership` principal aberto por pessoa e igreja: índice único parcial em `(church_id, person_id)` onde `left_at IS NULL` e `deleted_at IS NULL`, criado por SQL explícito na migration;
- `User(id, churchId)`, `Role(id, churchId)`, `Cell(id, churchId)`, `Person(id, churchId)` e `Meeting(id, churchId)` serão únicos como suporte técnico às foreign keys compostas;
- `leaderId` e `traineeLeaderId` não poderão apontar para o mesmo usuário por check constraint na migration;
- `supervisorId` e `leaderId` não poderão ser iguais por check constraint;
- `leftAt`, quando preenchido, não poderá ser anterior a `joinedAt`;
- `submittedAt` permanecerá opcional no banco; coerência com status será regra de aplicação em plano futuro;
- chaves únicas permanecerão reservadas após soft delete, exceto a unicidade parcial do vínculo ativo.

### 8.6 Índices

Além dos índices criados por primary keys e unicidades, criar:

| Entidade | Índices adicionais |
| --- | --- |
| `User` | `(churchId, status)`, `(churchId, deletedAt)`, `churchId` |
| `Role` | `(churchId, deletedAt)` |
| `UserRole` | `userId`, `roleId`, `(churchId, deletedAt)` |
| `SupervisorAssignment` | `supervisorId`, `leaderId`, `(churchId, deletedAt)` |
| `Cell` | `(churchId, status)`, `leaderId`, `traineeLeaderId`, `(churchId, deletedAt)` |
| `Person` | `(churchId, phone)`, `(churchId, email)`, `(churchId, fullName, birthDate)`, `(churchId, deletedAt)` |
| `CellMembership` | `(churchId, cellId, status)`, `(churchId, personId, status)`, `cellId`, `personId`, `(churchId, deletedAt)` |
| `Meeting` | `(churchId, cellId, meetingDate)`, `(churchId, status, meetingDate)`, `(churchId, deletedAt)` |
| `MeetingAttendance` | `(churchId, meetingId, attendanceStatus)`, `personId`, `(churchId, deletedAt)` |
| `MeetingReport` | `(churchId, status, submittedAt)`, `submittedBy`, `(churchId, deletedAt)` |
| `AuditLog` | `(churchId, createdAt)`, `(churchId, entity, entityId)`, `(churchId, userId, createdAt)` |

Índices redundantes com prefixos de constraints compostas devem ser removidos após inspeção do SQL gerado e do plano de consultas previsto. Busca fuzzy por pessoa e extensões como `pg_trgm` ficam fora deste plano.

### 8.7 Exclusão lógica e auditoria

- consultas futuras devem excluir `deletedAt IS NOT NULL` por padrão nos repositories, sem middleware global oculto nesta etapa;
- o client de runtime exportado por `packages/database` rejeitará `delete` e `deleteMany` nos modelos com exclusão lógica; um client administrativo separado, restrito a migrations, seed e testes controlados, não será exportado às aplicações;
- o client não injetará silenciosamente `deletedAt: null` em leituras: cada repository futuro deverá declarar esse filtro, tornando a inclusão de excluídos uma decisão explícita;
- soft delete não deve apagar históricos nem liberar chaves únicas, exceto onde o índice parcial declarar explicitamente;
- `AuditLog` será append-only no limite do client de runtime, que rejeitará `update`, `updateMany`, `delete` e `deleteMany` desse modelo; o schema não alegará impedir alterações feitas por SQL direto com credenciais administrativas;
- a tabela de auditoria armazenará somente JSON necessário, nunca `passwordHash`, `prayerRequests`, tokens ou outros segredos;
- geração de eventos de auditoria ficará para casos de uso futuros e deverá ocorrer na mesma transação da alteração importante;
- logs técnicos não substituem `AuditLog`.

### 8.8 Organização de packages e repositories

Estrutura planejada:

```text
packages/
  domain/
    src/
      entities/
      enums/
      index.ts
  database/
    prisma/
      migrations/
      schema.prisma
      seed.ts
    src/
      client/
        admin/
        runtime/
      generated/
      testing/
      index.ts
    prisma.config.ts
```

Regras de dependência:

- `packages/domain` não depende de Prisma, NestJS, React, banco ou SDK externo;
- `packages/database` pode depender de `packages/domain`, nunca o inverso;
- tipos Prisma gerados ficam encapsulados em `packages/database`;
- não criar interface genérica `Repository<T>` nem CRUD genérico;
- ports de repository orientados a casos de uso serão criados em `apps/api/src/<module>/application/ports` somente nos planos funcionais;
- adapters Prisma concretos ficarão em `apps/api/src/<module>/infrastructure/prisma` quando houver ports consumidores;
- `packages/database` fornece somente clients administrativo/runtime, transação, schema, migrations, seed e utilitários de teste nesta etapa; o client administrativo permanece em subpath privado e não integra a API pública do pacote.

## 9. Contratos

### Entradas

- `DATABASE_URL`: URL privada do PostgreSQL de desenvolvimento;
- `TEST_DATABASE_URL`: URL privada e isolada para testes de integração;
- schema Prisma e migrations versionadas;
- comando explícito de seed;
- dados fictícios definidos pela seed ou por factories de teste.

### Saídas

- Prisma Client gerado em caminho explícito dentro de `packages/database`;
- banco PostgreSQL criado a partir de zero pela migration inicial;
- tipos de domínio puros sem vazamento de tipos Prisma;
- seed idempotente com somente uma igreja fictícia, se não houver decisão de papel pendente;
- resultados verificáveis de validação do schema, status de migrations e testes de constraints.

### Erros esperados

- falha clara quando `DATABASE_URL` ou `TEST_DATABASE_URL` estiver ausente ou inválida no comando que a exige;
- falha de migration em schema drift, migration divergente ou banco indisponível;
- violação de foreign key para referências inexistentes ou entre igrejas;
- violação de unicidade para slug, e-mail, papel, código, encontro, presença, relatório ou associação duplicada;
- violação de check constraint para autoatribuição ou intervalo temporal inválido;
- falha de seed deve encerrar com código diferente de zero e fechar conexões sem imprimir a URL.

### Permissões

- não há autenticação ou autorização nesta etapa;
- credenciais do banco devem existir apenas em variáveis privadas e nunca no bundle web;
- usuário de migration e usuário de runtime separados são uma recomendação para ambientes futuros, não uma configuração de produção deste plano;
- testes e seed só podem operar em bancos explicitamente identificados como desenvolvimento/teste.

## 10. Etapas

### Etapa 1 — Fechar decisões e preparar PostgreSQL

- [ ] iniciar a ADR de `prayerRequests`; sua conclusão bloqueia somente a coluna correspondente;
- [ ] criar `compose.yaml` com `postgres-dev` e `postgres-test` usando a imagem fixada `postgres:18.4`;
- [ ] isolar nomes de banco, portas e volumes dos dois serviços e adicionar healthchecks;
- [ ] permitir PostgreSQL 18.x externo apenas como alternativa documentada que preserve os mesmos contratos de ambiente;
- [ ] adicionar URLs fictícias e seguras ao `.env.example`;
- [ ] documentar criação, inicialização, parada e remoção do banco local em PowerShell;
- [ ] confirmar que volumes, `.env` e dados locais estão ignorados.

### Etapa 2 — Criar `packages/domain`

- [ ] criar o workspace com TypeScript estrito, lint, test e build;
- [ ] definir IDs, tipos de entidade e enums listados na seção 8;
- [ ] manter tipos independentes de Prisma e infraestrutura;
- [ ] exportar somente a API pública necessária, evitando barrels circulares;
- [ ] testar os enums e estruturas próprias que possuam comportamento verificável;
- [ ] documentar que regras comportamentais ficam fora desta etapa.

### Etapa 3 — Criar `packages/database` e configurar Prisma

- [ ] criar o workspace com scripts de generate, validate, format, migrate, deploy, status, seed e testes;
- [ ] adicionar somente as dependências justificadas na seção 7;
- [ ] criar `prisma.config.ts` com caminhos explícitos para schema, migrations e seed;
- [ ] configurar datasource PostgreSQL por `DATABASE_URL` privada;
- [ ] configurar generator com output explícito dentro do pacote;
- [ ] criar client/factory servidor e encerramento seguro de conexões;
- [ ] separar o client administrativo privado do client de runtime e bloquear operações físicas proibidas conforme a seção 8.7;
- [ ] integrar geração e build ao Turborepo sem expor o client à web.

### Etapa 4 — Modelar tenants, usuários e estrutura

- [ ] modelar `Church`, `User`, `Role`, `UserRole` e `SupervisorAssignment`;
- [ ] modelar `Cell` e suas duas relações nomeadas de liderança;
- [ ] adicionar UUIDs, `churchId`, timestamps e `deletedAt` conforme a seção 8;
- [ ] adicionar enums, relações, actions referenciais, unicidades e índices;
- [ ] adicionar constraints contra autoatribuição e relações cross-tenant;
- [ ] adicionar as chaves candidatas `(id, churchId)` exigidas pelas foreign keys compostas;
- [ ] validar e formatar o schema.

### Etapa 5 — Modelar pessoas, encontros e auditoria

- [ ] modelar `Person` e `CellMembership`;
- [ ] modelar `Meeting`, `MeetingAttendance` e `MeetingReport`;
- [ ] modelar `AuditLog` append-only;
- [ ] adicionar relações, nulabilidade, tipos nativos, unicidades e índices;
- [ ] adicionar constraints temporais e o índice parcial de vínculo ativo por SQL explícito, sem preview feature;
- [ ] confirmar que campos sensíveis não entram em seed, logs ou snapshots.

### Etapa 6 — Gerar e revisar a migration inicial

- [ ] gerar a migration com nome descritivo e `--create-only` antes de aplicá-la;
- [ ] revisar todo o SQL gerado, tipos PostgreSQL, nomes, defaults, foreign keys e ações referenciais;
- [ ] adicionar/revisar SQL específico para checks e índice parcial;
- [ ] aplicar a migration em banco vazio de desenvolvimento;
- [ ] recriar um banco de teste vazio por `migrate deploy` para provar repetibilidade;
- [ ] versionar `schema.prisma`, `prisma.config.ts`, `migration_lock.toml` e o diretório completo da migration;
- [ ] não usar `prisma db push` nem editar a migration após compartilhada/aplicada.

### Etapa 7 — Implementar seed segura e idempotente

- [ ] criar seed TypeScript explícita e encerramento seguro de conexão;
- [ ] usar IDs/slug determinísticos e `upsert` para idempotência;
- [ ] criar somente uma `Church` inequivocamente fictícia;
- [ ] não criar User, senha, hash, prayer request ou dado pessoal;
- [ ] manter factories de integração separadas da seed de desenvolvimento;
- [ ] executar a seed duas vezes e provar ausência de duplicação;
- [ ] documentar como limpar exclusivamente dados locais/teste.

### Etapa 8 — Testar schema, migrations e isolamento

- [ ] criar setup de teste que recuse URLs não identificadas como teste;
- [ ] aplicar migrations em PostgreSQL de teste vazio;
- [ ] testar defaults UUID, timestamps e tipos nativos;
- [ ] testar todas as foreign keys e relações cross-tenant;
- [ ] testar unicidades, checks e índice parcial;
- [ ] testar JSONB, rejeição de exclusão física dos modelos com soft delete e rejeição de update/delete de `AuditLog` pelo client de runtime;
- [ ] testar seed idempotente sem dados sensíveis;
- [ ] garantir limpeza determinística entre testes sem operar banco de desenvolvimento/produção.

### Etapa 9 — Integrar, documentar e validar

- [ ] adicionar scripts raiz estritamente necessários para banco e testes de integração;
- [ ] atualizar o grafo do Turborepo com outputs de geração e dependências corretas;
- [ ] atualizar README e documentação de ambiente/migrations/seeds;
- [ ] executar instalação limpa pelo lockfile;
- [ ] executar lint, typecheck, testes unitários, testes de integração e build;
- [ ] executar validate, generate, migrate status e audit de dependências;
- [ ] revisar o diff contra as seções Escopo e Fora de escopo;
- [ ] atualizar o registro de progresso deste plano com resultados reais.

## 11. Critérios de aceitação

1. `packages/domain` compila em TypeScript estrito sem importar Prisma, NestJS, React ou código de infraestrutura.
2. `packages/database` é o único dono do Prisma schema, client gerado, migrations e seed.
3. `DATABASE_URL` e `TEST_DATABASE_URL` são validadas no servidor, documentadas com valores fictícios e não chegam à aplicação web.
4. Um PostgreSQL vazio recebe todas as tabelas, enums, constraints e índices por `prisma migrate deploy`, sem `db push`.
5. A migration inicial pode ser aplicada do zero em desenvolvimento e em um banco de teste independente sem schema drift.
6. Todas as entidades e campos solicitados existem, com as adições estruturais documentadas de `id`, `churchId`, timestamps e `deletedAt`; `prayerRequests` somente é persistido depois da ADR e, se necessário, entra por migration adicional deste plano.
7. Todos os identificadores e foreign keys usam UUID; instantes usam UTC/TIMESTAMPTZ, datas civis usam DATE e horário recorrente usa TIME.
8. Relações cross-tenant são rejeitadas por foreign key composta ou constraint equivalente.
9. As unicidades de slug, e-mail por igreja, papel por igreja, código de célula, encontro, presença, relatório e associações duplicadas são comprovadas por testes.
10. Somente um vínculo principal aberto por pessoa é permitido pelo índice parcial definido no plano.
11. Todas as foreign keys e filtros frequentes listados na seção 8 possuem índice não redundante confirmado no PostgreSQL.
12. Entidades mutáveis possuem `createdAt`, `updatedAt` e `deletedAt`; o client de runtime rejeita exclusão física dessas entidades e rejeita update/delete de `AuditLog`, que possui somente `createdAt`.
13. A seed pode ser executada duas vezes sem duplicar dados e não contém usuários, senhas, hashes, dados pessoais ou pedidos de oração.
14. Nenhum endpoint, controller, caso de uso, service, repository concreto, tela ou lógica de frequência/relatório foi criado.
15. A web continua sem dependência de Prisma e sem acesso a variáveis privadas de banco.
16. `npm run lint`, `npm run typecheck`, `npm test`, testes de integração do banco e `npm run build` passam na raiz.
17. `npm audit` não introduz vulnerabilidade conhecida sem justificativa e mitigação registradas.
18. `docker compose up -d postgres-dev postgres-test` disponibiliza bancos independentes e saudáveis no Windows, e os mesmos testes aceitam PostgreSQL 18.x externo por URLs equivalentes.

## 12. Estratégia de testes

### Unitários

- testar parsing seguro de `DATABASE_URL` e `TEST_DATABASE_URL`, incluindo ausência, protocolo inválido e valor válido;
- testar somente utilitários próprios do pacote de banco e tipos/enums com comportamento real;
- não testar código gerado pelo Prisma nem criar snapshots extensos do schema.

### Integração

- usar PostgreSQL real em banco isolado identificado por `TEST_DATABASE_URL`;
- aplicar migrations desde zero antes da suíte ou em setup global determinístico;
- inspecionar `pg_catalog`/`information_schema` quando necessário para comprovar índices, tipos e constraints;
- testar foreign keys, compound foreign keys, `RESTRICT`, unicidades, checks e índice parcial;
- testar criação e atualização dos timestamps sem depender de timezone local;
- testar JSONB de auditoria sem incluir dados sensíveis;
- testar as proteções do client de runtime contra exclusão física e mutação de auditoria, sem alegar proteção contra SQL administrativo direto;
- executar seed duas vezes e verificar contagem/identificadores estáveis;
- limpar dados em ordem transacional ou recriar o schema de teste, nunca usar banco de desenvolvimento.

### E2E

- não criar E2E HTTP ou Playwright nesta etapa;
- preservar e executar o smoke E2E existente apenas como regressão opcional da fundação, sem conectar a web ao banco.

### Validação manual

- subir PostgreSQL local/teste no Windows e verificar disponibilidade;
- executar `prisma validate`, `prisma format`, `prisma generate` e `prisma migrate status` pelo workspace;
- revisar manualmente todo `migration.sql` antes da aplicação;
- aplicar migrations em dois bancos vazios independentes e comparar o estado final;
- executar seed repetida e inspecionar ausência de dados sensíveis;
- confirmar que `db push` não aparece nos scripts;
- confirmar que a web não importa `packages/database`, `@prisma/client` ou `DATABASE_URL`.

## 13. Segurança e privacidade

- autorização permanece fora do escopo; isolamento estrutural por `churchId` será obrigatório em todas as tabelas de negócio;
- relações compostas devem impedir associações entre registros de igrejas diferentes;
- `passwordHash` será obrigatório no schema, mas nunca lido, gerado, semeado, registrado ou auditado nesta etapa;
- `prayerRequests` é dado sensível e depende de ADR antes da criação da coluna/migration;
- `AuditLog.before` e `after` devem excluir hashes, pedidos de oração, tokens e dados desnecessários;
- URLs de banco são segredos de servidor: somente exemplos fictícios podem ser versionados;
- erros, testes e logs não devem imprimir connection strings ou payloads sensíveis;
- seed e factories usam somente dados fictícios;
- sem exportações ou tratamento de dados reais nesta etapa;
- riscos LGPD concentram-se em minimização, isolamento por igreja, retenção e proteção futura dos campos pessoais/sensíveis.

## 14. Migração de dados

Não haverá migração de dados existentes. A entrega cria a primeira migration de um banco vazio.

Estratégia:

- diretório `packages/database/prisma/migrations/<timestamp>_initial_domain_schema/migration.sql`;
- gerar com `migrate dev --create-only`, revisar SQL e somente então aplicar;
- migrations são imutáveis depois de aplicadas ou compartilhadas;
- cada mudança posterior cria nova migration pequena e descritiva;
- `migrate dev` somente em desenvolvimento com shadow database;
- `migrate deploy` aplica histórico versionado em teste/homologação/produção futura;
- `db push` proibido para esta base versionada;
- custom SQL permitido apenas dentro da migration revisada para checks/índices não representáveis de forma estável no schema;
- data migrations futuras separadas de alterações estruturais quando o risco justificar;
- `migrate resolve` reservado a recuperação documentada de falha/baseline, nunca ao fluxo normal;
- antes de migrations destrutivas futuras: backup, estratégia expand/contract e rollback documentados.

Estratégia de seed:

- `packages/database/prisma/seed.ts`, configurado em `prisma.config.ts`;
- execução exclusiva por `prisma db seed`;
- idempotência por `upsert` e chaves determinísticas;
- seed inicial limitada a uma igreja fictícia, sem papéis ou outras referências;
- sem execução automática em migrate/reset;
- factories de teste separadas e descartáveis;
- nenhuma seed de produção nesta etapa.

## 15. Observabilidade

- scripts de migration e seed devem registrar apenas etapa, migration e resultado, nunca URLs ou payloads;
- `prisma migrate status` será o sinal verificável de migrations pendentes/divergentes;
- testes devem reportar claramente constraint e cenário que falhou;
- tempo de aplicação da migration inicial será registrado no progresso do plano;
- não adicionar APM, métricas externas, dashboard ou logging de queries nesta etapa;
- consultas Prisma não terão log de parâmetros sensíveis habilitado por padrão.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Relação entre registros de igrejas diferentes | média | crítico | `churchId` direto, foreign keys compostas e testes negativos cross-tenant |
| Migration inicial divergente do schema | baixa | alto | `--create-only`, revisão integral do SQL, aplicação em dois bancos vazios e `migrate status` |
| Soft delete permitir duplicidade ou esconder histórico | média | alto | política explícita de chaves reservadas, índice parcial somente para vínculo aberto e testes |
| Índices insuficientes ou redundantes | média | médio | mapear consultas previstas, inspecionar índices gerados e testar catálogo PostgreSQL |
| Seed criar credencial ou dado sensível reutilizável | baixa | crítico | nenhuma seed de User; dados fictícios, idempotentes e revisados |
| `prayerRequests` ser persistido sem proteção definida | média | crítico | ADR bloqueante antes da coluna/migration |
| Tipos Prisma vazarem para domínio ou web | média | alto | direção de dependências, exports restritos e inspeção de imports |
| Repository genérico cristalizar operações inadequadas | média | médio | não criar `BaseRepository`; ports surgem com casos de uso reais |
| SQL do índice parcial divergir do schema Prisma | baixa | alto | manter SQL explícito na migration, inspecionar `pg_catalog` e cobrir a constraint por teste de integração |
| Teste apontar para banco não descartável | baixa | crítico | `TEST_DATABASE_URL`, validação de nome/ambiente e recusa explícita de URL insegura |
| Versões incompatíveis de Prisma, driver e PostgreSQL | média | alto | fixar versões, gerar lockfile, testar migration/client e documentar matriz suportada |
| Migrations futuras exigirem lock longo | baixa | alto | migrations pequenas, análise manual e estratégia expand/contract quando houver dados |

## 17. Estratégia de reversão

Prisma Migrate não será tratado como ferramenta de down migration automática.

- antes de a migration inicial ser compartilhada: reverter os arquivos do pacote e recriar apenas os bancos locais/teste descartáveis;
- após a migration ser compartilhada/aplicada: não editar nem apagar a migration; criar uma migration corretiva para mudanças aditivas/reversíveis;
- em ambiente com dados, rollback destrutivo dependerá de backup/restauração e procedimento aprovado, não de `migrate reset`;
- `migrate reset` e remoção de volume são permitidos somente em desenvolvimento/teste confirmado;
- para descartar somente a infraestrutura local criada pelo plano, executar `docker compose down`; usar `docker compose down --volumes` apenas após confirmar que os volumes pertencem aos serviços locais descartáveis;
- reverter Prisma exige reverter juntos `package.json`, `package-lock.json`, scripts, `packages/domain`, `packages/database`, configuração de ambiente e documentação;
- seed deve ser reversível em ambiente local/teste por IDs determinísticos, sem apagar dados não pertencentes a ela;
- se custom SQL de índice/check falhar antes da aplicação compartilhada, corrigir a migration ainda não aplicada; depois de aplicada, criar migration nova;
- registrar no progresso qualquer limitação de reversão antes da conclusão.

## 18. Comandos de validação

Infraestrutura local, em comandos nativos e compatíveis com PowerShell:

```bash
docker compose up -d postgres-dev postgres-test
docker compose ps
```

Comandos raiz:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Comandos planejados para `packages/database`:

```bash
npm run db:format --workspace @mission-atos/database
npm run db:validate --workspace @mission-atos/database
npm run db:generate --workspace @mission-atos/database
npm run db:migrate:create --workspace @mission-atos/database -- --name initial_domain_schema
npm run db:migrate:deploy --workspace @mission-atos/database
npm run db:migrate:status --workspace @mission-atos/database
npm run db:seed --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/database
```

O script `test:integration` deverá validar `TEST_DATABASE_URL`, recusar nomes de banco que não indiquem teste, aplicar `db:migrate:deploy` nesse banco e executar a suíte sem depender de atribuição de variável em sintaxe Bash. Ao final:

```bash
docker compose down
```

Rollback destrutivo exclusivamente dos volumes locais descartáveis, após confirmação manual:

```bash
docker compose down --volumes
```

## 19. Definition of Done

- [ ] escopo implementado;
- [ ] critérios de aceitação atendidos;
- [ ] ADR de `prayerRequests` resolvida antes da criação da coluna, sem bloquear migrations independentes;
- [ ] isolamento por igreja validado no schema e nos testes;
- [ ] nenhuma autenticação, autorização, endpoint ou lógica de negócio criada;
- [ ] `packages/domain` permanece independente de infraestrutura;
- [ ] schema, migration inicial, seed e client pertencem a `packages/database`;
- [ ] migration inicial revisada e aplicada em bancos vazios independentes;
- [ ] seed idempotente e sem dados sensíveis;
- [ ] índices, unicidades, checks, UUIDs e timestamps validados;
- [ ] proteção do client de runtime contra exclusão física e mutação de auditoria validada;
- [ ] testes unitários e de integração criados ou atualizados;
- [ ] lint executado;
- [ ] typecheck executado;
- [ ] testes executados;
- [ ] build executado;
- [ ] `npm audit` executado;
- [ ] documentação e `.env.example` atualizados;
- [ ] riscos e limitações informados;
- [ ] registro de progresso atualizado;
- [ ] plano movido para `docs/plans/completed/` após a conclusão.

## 20. Registro de progresso

### 2026-07-22

- realizado: leitura integral dos documentos obrigatórios, análise da estrutura atual e criação do plano da fundação de domínio e banco;
- testes: não executados, pois esta entrega altera somente documentação e não implementa código;
- decisões: PostgreSQL + Prisma em `packages/database`; domínio puro em `packages/domain`; `churchId` direto em tabelas de negócio; UUID, UTC, snake_case no banco, soft delete em entidades mutáveis, `AuditLog` append-only, migrations imutáveis e seed explícita/idempotente sem usuários;
- revisão: comandos confirmados em npm, cardinalidades detalhadas, chaves candidatas para FKs compostas adicionadas, PostgreSQL 18.4/Compose e SQL explícito para índice parcial definidos, seed restringida a uma igreja fictícia e validação/rollback tornados executáveis;
- bloqueios: ADR de `prayerRequests` antes da coluna correspondente; vocabulário de `gender` e nomenclatura de papéis permanecem pendentes sem bloquear o restante da migration ou a seed mínima;
- próximo passo: revisar e aprovar este plano antes de implementar qualquer schema, dependência ou banco.
