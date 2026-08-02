# Plano 006 — Gerenciamento de pessoas

**Status:** Concluído  
**Responsável:** a definir  
**Criado em:** 2026-08-02  
**Atualizado em:** 2026-08-02  
**Concluído em:** 2026-08-02  
**PRD relacionado:** RF-006, RF-007, RF-018, US-003 e seção 7.4  
**ADRs relacionadas:** nenhuma nova ADR prevista  
**Branch ou issue:** a definir

---

## 1. Objetivo

Planejar a implementação do gerenciamento central de pessoas (`Person`) na API NestJS, estabelecendo a base reutilizável para membros, visitantes e futuros líderes sem implementar esses vínculos ou fluxos nesta etapa.

Ao final da implementação, usuários autenticados deverão conseguir listar, pesquisar e consultar pessoas da própria igreja. `ADMIN` e `PASTOR` poderão criar e atualizar pessoas; somente `ADMIN` poderá desativar e reativar registros. Todas as operações deverão derivar `churchId` do principal autenticado, validar e normalizar entradas, impedir duplicidades ativas, preservar exclusão lógica e gerar auditoria transacional nas mutações.

O resultado será verificável por contratos Zod, testes unitários, integração com PostgreSQL e testes HTTP, mantendo domínio, aplicação, infraestrutura e apresentação separados.

## 2. Contexto

O PRD exige cadastro central reutilizável, busca prévia de duplicidade e auditoria das alterações relevantes. O schema inicial do Plano 002 já contém `Person`, UUID, tenant, timestamps, exclusão lógica e índices básicos. Os Planos 003, 004 e 005 forneceram autenticação, principal com `churchId`, guards, roles, policies, unidade de trabalho transacional, auditoria atômica e presenters com allowlist.

Estado atual confirmado:

- `Person` possui `id`, `churchId`, `fullName`, `phone`, `email`, `birthDate`, `gender`, `createdAt`, `updatedAt` e `deletedAt`;
- não existe campo `observations` em `Person`;
- não existe módulo `people`, contrato HTTP, repository, controller ou teste específico;
- há índices B-tree em tenant + telefone, e-mail, nome + nascimento e exclusão lógica;
- `pg_trgm` já é habilitado pela migration de busca de usuários;
- a seed contém apenas igreja fictícia e não cria pessoas;
- os módulos `users` e `churches` são as referências obrigatórias de organização e transação.

Documentos obrigatórios para a implementação:

- `AGENTS.md` e `apps/api/AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/TEMPLATE.md`;
- todos os planos concluídos, especialmente 004 e 005;
- schema, migrations, seed, contratos, domínio, módulos e testes existentes.

### Rastreabilidade com o PRD vigente

- `RF-005` trata de células e permanece fora deste plano;
- `RF-006` é atendido pelo cadastro central de pessoa;
- `RF-007` é atendido pela normalização e verificação de duplicidade;
- `RF-008` trata de vínculo com célula e permanece fora deste plano, sem que o gerenciamento de pessoas apague ou altere vínculos existentes;
- `RN-001` é atendida por autorização no servidor, tenant e escopo hierárquico;
- `RN-006` é preservada pelo identificador único da pessoa, sem implementar indicadores;
- `RN-007` é atendida por exclusão lógica;
- `RN-008` é preservada pela proibição de delete físico, sem implementar transferência;
- `RN-009` orienta a restrição de dados sensíveis e exige decisão específica para observações;
- `RN-002` a `RN-005` e `RN-010` a `RN-012` tratam de células, encontros, visitantes, relatórios ou frequência e não geram etapas neste plano;
- a versão atual de `docs/product/PRD.md` contém `RN-001` a `RN-012` e registra o fora do MVP na seção 8, não `RN-013` a `RN-018` nem uma seção 17; nenhuma regra inexistente será presumida.

## 3. Escopo

- criar o módulo NestJS `people`;
- cadastrar pessoas com normalização e verificação de duplicidade;
- listar pessoas com paginação, pesquisa, filtros e ordenação determinística;
- consultar pessoa por UUID;
- atualizar parcialmente os dados permitidos;
- desativar e reativar por exclusão lógica;
- derivar `churchId` exclusivamente do principal autenticado;
- aplicar autenticação, roles, policies e revalidação transacional;
- registrar auditoria atômica de criação, atualização, desativação e reativação;
- criar DTOs/contratos Zod compartilhados;
- criar queries, commands, authorization, ports, types e erros próprios;
- criar repository Prisma e unidade de trabalho transacional;
- criar controller e presenter com allowlist;
- documentar endpoints no Swagger/OpenAPI e na documentação local;
- adicionar `observations` nullable ao modelo `Person`;
- adicionar índices coerentes com a pesquisa parcial prevista;
- criar migrations novas, aditivas e reproduzíveis;
- criar testes unitários, de integração e dos endpoints;
- manter compatibilidade com npm workspaces, TypeScript estrito e PowerShell.

## 4. Fora de escopo

- células e vínculos com células;
- reuniões, frequência e relatórios;
- dashboard e exportações;
- cadastro rápido de visitantes em células;
- classificação funcional como membro, visitante ou líder;
- histórico de vínculos ou presença;
- transferência de participantes;
- upload de arquivos, foto ou avatar;
- front-end web ou mobile;
- criação de aplicativo mobile;
- exclusão física de pessoas;
- importação de dados reais;
- deploy ou configuração de produção;
- qualquer item do Plano 007.

Nenhuma seção, etapa ou critério deste plano depende desses itens.

## 5. Suposições

- o MVP atende inicialmente uma igreja, mas o isolamento estrutural por `churchId` é obrigatório;
- `deletedAt = null` representa pessoa ativa e `deletedAt != null` representa pessoa inativa;
- `fullName` é obrigatório; telefone, e-mail, nascimento, gênero e observações são opcionais;
- `gender` permanece string livre `VarChar(50)`, sem enum;
- telefone, quando informado, será persistido em E.164;
- e-mail será persistido em lowercase após `trim`;
- datas civis serão transportadas como `YYYY-MM-DD` e persistidas como PostgreSQL `DATE`;
- observações serão texto simples nullable, sem HTML ou formatação rica;
- nenhuma dependência npm nova é necessária;
- a seed continuará sem pessoas para evitar dados pessoais, ainda que fictícios;
- testes conectados usarão `TEST_DATABASE_URL` dedicada e diferente de `DATABASE_URL`.

## 6. Perguntas e decisões pendentes

Decisões já encerradas e que não devem ser reabertas:

- `ADMIN` e `PASTOR` criam e atualizam; somente `ADMIN` desativa e reativa; `SUPERVISOR` e `LEADER` apenas consultam;
- `gender` é string livre `VarChar(50)`;
- paginação começa em 1, usa 20 por padrão e aceita no máximo 100;
- ordenação fixa por `fullName ASC, id ASC`;
- duplicidade considera telefone, e-mail e nome + nascimento somente entre pessoas ativas;
- alterações desses campos reexecutam a verificação, excluindo a própria pessoa;
- coleção usa `{ data, meta: { page, pageSize, totalItems, totalPages } }`.

Decisões de produto resolvidas em 2026-08-02:

- [x] `observations` usa texto simples de até 10.000 caracteres, sem conteúdo em logs/auditoria; `ADMIN` e `PASTOR` podem ler e escrever, enquanto `SUPERVISOR` e `LEADER` não recebem o campo.
- [x] `SUPERVISOR` e `LEADER` podem consultar pessoas ativas da própria igreja nesta etapa, sem acesso a inativos.
- [x] somente `ADMIN` pode listar pessoas inativas; detalhe cadastral continua restrito a ativos e a reativação ocorre pelo endpoint de status.
- [x] referência a `RN-013`–`RN-018` e à seção 17 encerrada como divergência documental da solicitação: o PRD vigente possui `RN-001`–`RN-012` e fora do MVP na seção 8; nenhuma regra inexistente foi presumida.

A divergência de numeração do PRD não bloqueia a implementação, pois nenhuma regra inexistente será presumida.

Não implemente uma hipótese relevante sem registrá-la.

## 7. Áreas afetadas

### Aplicação web

- não será alterada;
- não serão criadas páginas, componentes, hooks ou cliente para pessoas.

### API

- criar `apps/api/src/modules/people/` organizado por feature;
- adicionar `PeopleModule` ao `AppModule`;
- manter controllers limitados a parse, chamada da aplicação e apresentação;
- manter Prisma restrito à infraestrutura.

Estrutura prevista:

```text
apps/api/src/modules/people/
├── application/
│   ├── people-management.authorization.ts
│   ├── people-management.commands.ts
│   ├── people-management.error.ts
│   ├── people-management.port.ts
│   ├── people-management.queries.ts
│   ├── people-management.types.ts
│   └── people-management.application.spec.ts
├── domain/
│   ├── people-management.policy.ts
│   └── people-management.policy.spec.ts
├── infrastructure/
│   ├── prisma-people-management.repository.ts
│   └── prisma-people-management.integration-spec.ts
├── presentation/
│   ├── people.controller.ts
│   ├── people.presenter.ts
│   └── people.presenter.spec.ts
└── people.module.ts
```

### Banco de dados

- alterar somente o modelo `Person` no schema atual;
- criar migrations aditivas, sem editar migrations aplicadas;
- adicionar `observations TEXT NULL`;
- adicionar índices GIN trigram para os campos usados pela pesquisa parcial;
- preservar FKs compostas, `RESTRICT`, UUID, UTC e índices existentes;
- não adicionar unique constraint incompatível com a regra que ignora inativos.

### Contratos compartilhados

- criar `packages/contracts/src/people.ts`;
- exportar schemas e tipos por `packages/contracts/src/index.ts`;
- não exportar modelos Prisma, `churchId`, `deletedAt` ou tipos internos;
- reutilizar normalizadores existentes quando o comportamento for idêntico, sem acoplar aplicação a DTO HTTP.

### Infraestrutura

- reutilizar PostgreSQL, Prisma, Jest, Supertest, Swagger e Zod existentes;
- adicionar scripts npm específicos de integração/E2E de pessoas;
- não instalar dependências e não criar outro ORM ou banco.

### Documentação

- documentar rotas, permissões, filtros, paginação, normalização e erros no Swagger;
- atualizar a documentação operacional da API somente durante a implementação;
- registrar migrations, comandos, resultados e limitações neste plano.

## 8. Modelo e regras de negócio

### Entidade e campos

| Campo | Tipo persistido | Obrigatório | Regra |
| --- | --- | --- | --- |
| `id` | UUID | sim | gerado; nunca recebido no body |
| `churchId` | UUID | sim | exclusivamente do principal |
| `fullName` | `VarChar(200)` | sim | trim, espaços colapsados, 1–200 caracteres |
| `phone` | `VarChar(32)` | não | vazio vira `null`; normalizado e validado em E.164 |
| `email` | `VarChar(320)` | não | vazio vira `null`; trim, lowercase e formato válido |
| `birthDate` | `Date` | não | `YYYY-MM-DD`, data civil válida e não futura |
| `gender` | `VarChar(50)` | não | vazio vira `null`; trim; string livre até 50 caracteres |
| `observations` | `Text` | não | vazio vira `null`; trim; texto simples; limite técnico 10.000 |
| `createdAt` | `Timestamptz(3)` | sim | UTC, default do banco |
| `updatedAt` | `Timestamptz(3)` | sim | UTC, atualizado pelo Prisma |
| `deletedAt` | `Timestamptz(3)` | não | estado de exclusão lógica |

### Invariantes

1. Nenhuma entrada aceita `churchId`, timestamps, `deletedAt` ou relações.
2. Toda leitura e escrita combina o identificador do recurso com `principal.churchId` e, quando aplicável, com o escopo hierárquico aprovado.
3. Recurso de outra igreja é indistinguível de inexistente e retorna `404`.
4. Pessoa inativa não aparece por padrão e não pode ser atualizada pelo endpoint cadastral.
5. O filtro `status=INACTIVE` exige `ADMIN`; reativação usa busca interna explícita que inclui inativos e continua exclusiva de `ADMIN`.
6. Desativação e reativação são idempotentes e não geram auditoria em no-op.
7. Atualização parcial preserva campos omitidos; `null` limpa somente campos opcionais.
8. Payload vazio ou mudança sem efeito não altera `updatedAt` nem cria auditoria.
9. Não existe exclusão física em port, repository, command ou controller.

### Duplicidade e concorrência

- verificar conflito ativo por telefone normalizado;
- verificar conflito ativo por e-mail normalizado;
- verificar conflito ativo por `fullName` normalizado + `birthDate` quando ambos estiverem disponíveis;
- em atualização, excluir o próprio `id`;
- ignorar `deletedAt != null`;
- retornar conflito genérico `PERSON_DUPLICATE`, com `details.fields` limitado aos campos conflitantes e sem expor dados da pessoa encontrada;
- executar verificação e escrita dentro da mesma unidade de trabalho;
- bloquear a linha da igreja e usar transação `Serializable` com retry limitado para impedir duas criações equivalentes concorrentes;
- não criar unicidade global de telefone/e-mail, pois dados podem ser ausentes, compartilhados e reutilizados após inativação.

### Pesquisa, filtros e paginação

- `page`: inteiro >= 1, padrão 1;
- `pageSize`: inteiro entre 1 e 100, padrão 20;
- `search`: trim, máximo 320 caracteres, busca case-insensitive por `fullName`, `email` e `phone`;
- tokenizar pesquisa textual por espaços e combinar tokens com `AND`, mantendo os três campos por `OR` em cada token;
- `status`: `ACTIVE` por padrão; `INACTIVE` somente após policy de visibilidade aprovada;
- `gender`: comparação exata case-insensitive após trim;
- filtros combinados por `AND`;
- ordenação fixa `fullName ASC, id ASC`;
- total e itens devem refletir o mesmo snapshot de leitura;
- selecionar somente campos necessários e evitar relações/N+1.

### Auditoria

| Operação | Ação |
| --- | --- |
| criação | `PERSON_CREATED` |
| atualização | `PERSON_UPDATED` |
| desativação | `PERSON_DEACTIVATED` |
| reativação | `PERSON_REACTIVATED` |

- alteração e `AuditLog` pertencem à mesma transação;
- registrar ator, igreja, entidade `Person`, `entityId`, ação e instante;
- `before`/`after` registram somente nomes dos campos alterados e metadados de status, sem copiar o DTO;
- nunca registrar valores de telefone, e-mail, nascimento, gênero ou observações;
- criação pode registrar `after: { status: "ACTIVE", changedFields: [...] }`;
- status registra apenas transição `ACTIVE`/`INACTIVE`;
- logs técnicos não substituem auditoria e não contêm payload ou PII.

## 9. Contratos

### Entradas

- `GET /people`: `page?`, `pageSize?`, `search?`, `status?`, `gender?`;
- `GET /people/:id`: parâmetro UUID;
- `POST /people`: `fullName`, `phone?`, `email?`, `birthDate?`, `gender?`, `observations?`;
- `PATCH /people/:id`: os mesmos campos, todos opcionais, exigindo ao menos uma propriedade;
- `PATCH /people/:id/status`: `{ status: "ACTIVE" | "INACTIVE" }`;
- todos os objetos Zod serão `.strict()`;
- body, params e query chegam como `unknown` ao controller e são validados antes do command/query.

### Saídas

- item: `{ data: PersonResponse, meta: {} }`;
- coleção: `{ data: PersonResponse[], meta: { page, pageSize, totalItems, totalPages } }`;
- `PersonResponse` contém somente `id`, `fullName`, `phone`, `email`, `birthDate`, `gender`, `status`, `createdAt` e `updatedAt`; `observations` só poderá ser incluído após decisão de visibilidade e policy aprovadas;
- `status` é derivado de `deletedAt` pelo presenter;
- `birthDate` é serializado explicitamente como `YYYY-MM-DD`;
- timestamps são ISO 8601 UTC;
- `churchId`, `deletedAt`, relações e modelos Prisma nunca são serializados.

### Erros esperados

| Situação | HTTP | Código |
| --- | ---: | --- |
| entrada inválida | 400 | `VALIDATION_ERROR` |
| autenticação ausente/inválida | 401 | `AUTH_UNAUTHENTICATED` |
| papel ou policy insuficiente | 403 | `AUTH_FORBIDDEN` |
| pessoa ausente, inativa ou de outro tenant | 404 | `PERSON_NOT_FOUND` |
| conflito de duplicidade | 409 | `PERSON_DUPLICATE` |

- usar envelope `{ error: { code, message, details } }`;
- não expor SQL, nome de constraint, stack, tenant externo ou registro conflitante;
- traduzir erros conhecidos no limite HTTP e deixar falhas inesperadas ao tratamento global.

### Permissões

| Operação | ADMIN | PASTOR | SUPERVISOR | LEADER |
| --- | --- | --- | --- | --- |
| listar/consultar ativos | permitir na igreja | permitir na igreja | permitir na igreja | permitir na igreja |
| criar/atualizar | permitir | permitir | negar | negar |
| desativar/reativar | permitir | negar | negar | negar |
| listar inativos | permitir | negar | negar | negar |
| ler/escrever observações | permitir | permitir | negar | negar |

- guards globais autenticam;
- `@Roles` faz o filtro inicial;
- policies negam por padrão e validam tenant, recurso e escopo hierárquico quando exigido;
- commands revalidam usuário ativo e papel corrente dentro da transação antes de qualquer efeito;
- nenhum dado enviado pelo cliente concede autoridade.

## 10. Etapas

### Etapa 1 — Congelar contratos e comportamento

- [x] registrar como definitivas as decisões fornecidas;
- [x] definir schemas, envelopes, códigos de erro e semântica omitido/null;
- [x] registrar a decisão de observações sem ampliar seu uso;
- [x] resolver escopo hierárquico, visibilidade de inativos e policy de observações antes dos respectivos endpoints/campos;
- [x] escrever os primeiros testes de contrato que falham.

### Etapa 2 — Criar contratos e regras puras

- [x] criar schemas Zod e tipos de transporte;
- [x] implementar normalizadores de pessoa sem duplicação;
- [x] criar policies puras e tipos de aplicação independentes de Prisma/NestJS;
- [x] testar limites, normalização, campos desconhecidos, policies e datas.

### Etapa 3 — Preparar schema e migrations

- [x] adicionar `observations` nullable ao schema;
- [x] criar migration aditiva da coluna;
- [x] criar migration aditiva dos índices de pesquisa;
- [x] revisar SQL, lock esperado, compatibilidade e reprodução desde banco vazio;
- [x] não alterar migrations anteriores nem seed.

### Etapa 4 — Definir portas e autorização

- [x] criar ports pequenos para queries e unidade de trabalho;
- [x] expor na transação estado atual, busca de conflito, persistência e auditoria;
- [x] criar autorização de leitura, gestão e status;
- [x] testar negação por tenant, recurso ausente, papel insuficiente e papel stale.

### Etapa 5 — Implementar queries

- [x] implementar listagem paginada em snapshot consistente;
- [x] implementar consulta por ID;
- [x] aplicar tenant, status, busca, filtros, selects e ordenação;
- [x] testar paginação, filtros, pesquisa, isolamento e ausência.

### Etapa 6 — Implementar criação

- [x] normalizar entrada e construir command próprio;
- [x] revalidar ator na unidade de trabalho;
- [x] verificar duplicidade ativa sob lock;
- [x] persistir pessoa e auditoria atomicamente;
- [x] testar sucesso, conflitos, concorrência e rollback.

### Etapa 7 — Implementar atualização

- [x] carregar estado atual no tenant dentro da transação;
- [x] combinar patch com estado atual sem apagar omitidos;
- [x] verificar duplicidade quando campos relevantes mudarem;
- [x] detectar no-op e produzir diff mínimo;
- [x] persistir mudança e auditoria atomicamente;
- [x] testar null, omitidos, conflito, no-op e rollback.

### Etapa 8 — Implementar desativação e reativação

- [x] implementar transições idempotentes por `deletedAt`;
- [x] restringir a `ADMIN` ativo revalidado na transação;
- [x] impedir qualquer delete físico;
- [x] auditar somente transições reais;
- [x] testar estados, tenant, permissão, idempotência e rollback.

### Etapa 9 — Criar controller, presenter e módulo

- [x] criar os cinco endpoints aprovados;
- [x] validar `unknown` com contratos Zod;
- [x] mapear DTOs para inputs próprios da aplicação;
- [x] aplicar roles e presenter com allowlist;
- [x] registrar providers/tokens sem dependência circular;
- [x] documentar sucesso e erros no Swagger.

### Etapa 10 — Validar integração e HTTP

- [x] testar repository e unidade de trabalho em PostgreSQL dedicado;
- [x] testar migrations desde banco vazio;
- [x] testar endpoints, envelopes e códigos HTTP;
- [x] testar duas igrejas, todas as roles, duplicidade e auditoria;
- [x] testar recursivamente ausência de campos internos.

### Etapa 11 — Validar e documentar

- [x] executar todos os comandos da seção 18 aplicáveis à validação final;
- [x] corrigir somente falhas dentro do escopo;
- [x] revisar diff, imports, dependências e Swagger;
- [x] atualizar documentação e progresso com resultados reais;
- [x] confirmar ausência de front-end e módulos fora do escopo.

## 11. Critérios de aceitação

1. Existem somente `GET /people`, `GET /people/:id`, `POST /people`, `PATCH /people/:id` e `PATCH /people/:id/status` como endpoints novos.
2. Nenhum DTO, rota, query ou header permite informar `churchId`.
3. Toda operação usa `principal.churchId` e o escopo hierárquico aprovado; recurso fora do alcance retorna `404` sem vazamento.
4. A matriz de permissões definida na seção 9, após resolução das pendências, é aplicada e demonstrada por testes HTTP.
5. Nome é obrigatório e normalizado; os campos opcionais aceitam `null` conforme contrato.
6. Telefone é E.164, e-mail é lowercase, nascimento é data válida não futura e gênero respeita 50 caracteres.
7. Payload vazio, propriedades desconhecidas, UUID inválido e limites excedidos retornam `400`.
8. Telefone, e-mail ou nome+nascimento duplicados entre ativos retornam `409` sem revelar a pessoa conflitante.
9. Inativos não bloqueiam duplicidade; atualização exclui o próprio registro da verificação.
10. Teste concorrente demonstra que duas criações equivalentes não são confirmadas.
11. Listagem usa paginação e envelope definidos, filtros combinados e ordenação determinística.
12. Item e total da página são obtidos em snapshot consistente.
13. Atualização preserva omitidos, limpa opcionais com `null` e não grava no-op.
14. Desativação e reativação usam `deletedAt`, são idempotentes e nunca fazem delete físico.
15. Pessoa inativa não é retornada no detalhe ativo nem atualizada pelo endpoint cadastral; consulta/listagem de inativos exige policy aprovada.
16. Toda mutação real e seu `AuditLog` confirmam ou revertem juntos.
17. Auditoria registra somente metadados aprovados, sem valores de PII ou observações.
18. Presenter não expõe `churchId`, `deletedAt`, relações ou objeto Prisma e só inclui `observations` quando a policy aprovada autorizar.
19. Controllers e aplicação não importam Prisma; regras não ficam no controller.
20. As migrations são novas, aditivas, reproduzíveis e o schema final corresponde ao banco.
21. Os índices de pesquisa possuem consultas correspondentes e são verificados por integração.
22. Nenhuma pessoa é adicionada à seed e nenhuma dependência npm é instalada.
23. Testes unitários, integração PostgreSQL e endpoints passam pelos scripts npm aprovados.
24. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.
25. Swagger descreve contratos, permissões e respostas sem dados reais.
26. Nenhum front-end ou funcionalidade fora do escopo é criado.

## 12. Estratégia de testes

### Unitários

- schemas: sucesso, limites, null, omitido, campos desconhecidos e coerção de query;
- normalizadores: espaços, caixa, máscara de telefone, vazios e datas;
- policies: quatro roles, tenant divergente, recurso ausente e negação padrão;
- queries: página, detalhe, ausência e isolamento;
- commands: sucesso, duplicidade, no-op, autorização corrente e rollback;
- auditoria: ações e metadados mínimos sem PII;
- presenter: allowlist, status e datas.

### Integração

- PostgreSQL real dedicado com migrations aplicadas do zero;
- coluna, defaults, tipos, FKs e índices;
- listagem, contagem, ordenação, pesquisa e filtros;
- consultas sempre combinadas com `churchId`;
- lock da igreja, `Serializable`, retry limitado e corrida de duplicidade;
- criação, atualização, status e auditoria atômicas;
- rollback quando persistência ou auditoria falhar;
- duas igrejas para testes negativos.
- escopo hierárquico de `SUPERVISOR` e `LEADER` conforme decisão aprovada.

### E2E

- Supertest contra NestJS e PostgreSQL isolado;
- cinco endpoints e todos os códigos HTTP previstos;
- `401`, matriz completa de `403`, isolamento e `404` opaco;
- acesso permitido e negado por escopo hierárquico, visibilidade de inativos e observações;
- criação, atualização parcial, duplicidade, desativação e reativação;
- paginação, pesquisa e filtros;
- tentativa de enviar `churchId` e campos desconhecidos;
- auditoria e ausência recursiva de campos internos.

### Validação manual

- inspecionar SQL de migrations antes de aplicar;
- conferir Swagger e ausência de endpoint `DELETE`;
- procurar imports de Prisma fora da infraestrutura;
- conferir plano de execução das pesquisas com volume representativo;
- inspecionar logs e auditoria sem PII;
- executar scripts em PowerShell e registrar qualquer limitação real.

## 13. Segurança e privacidade

- todos os endpoints são privados e protegidos pelos guards globais;
- autorização combina role, estado atual do ator, tenant e recurso;
- `churchId` vem somente do token validado/principal e nunca do cliente;
- repositories filtram tenant e exclusão lógica explicitamente;
- schemas estritos e mapeamento campo a campo evitam mass assignment;
- presenter usa allowlist e não serializa modelos Prisma;
- erros não revelam existência de pessoa em outro tenant nem dados do conflito;
- logs não contêm body, telefone, e-mail, nascimento, observações ou tokens;
- auditoria contém metadados mínimos e não duplica dados pessoais;
- observações são texto simples, sem HTML, e não recebem semântica sensível nesta etapa;
- não existem exportações;
- revisar minimização, finalidade e retenção sob LGPD antes de ampliar observações.

## 14. Migração de dados

Serão necessárias duas migrations aditivas:

1. `add_person_observations`: adiciona `observations TEXT NULL`, sem default e sem backfill;
2. `add_person_search_trigram_indexes`: reutiliza `pg_trgm` já habilitado e cria índices GIN para `full_name`, `phone` e `email` com `gin_trgm_ops`.

Regras:

- nunca editar migrations anteriores;
- confirmar `CREATE EXTENSION IF NOT EXISTS pg_trgm` de forma idempotente;
- usar nomes explícitos e estáveis: `people_full_name_trgm_idx`, `people_phone_trgm_idx`, `people_email_trgm_idx`;
- criar a primeira migration após adicionar somente `observations` ao schema; depois adicionar a representação Prisma dos índices GIN ou SQL explícito e criar a segunda migration, evitando que a primeira capture as duas mudanças;
- representar os índices no schema Prisma quando suportado pela versão adotada; se algum índice exigir SQL não representável, documentar a exceção e validar drift;
- validar desde banco vazio e sobre schema já migrado;
- medir tempo de criação/lock com volume representativo antes de produção;
- não usar `prisma db push`;
- não alterar seed;
- uma reversão destrutiva de coluna/índice exige nova migration, backup e confirmação de preservação dos dados.

## 15. Observabilidade

- logs estruturados por nome de operação, resultado, correlation ID e identificadores técnicos mínimos;
- registrar contagem e duração de listagens sem incluir filtros com PII em claro;
- sinalizar `401`, `403`, `404`, `409`, retry e rollback transacional;
- não registrar payload, query de pesquisa, telefone, e-mail, nascimento, gênero ou observações;
- `AuditLog` permanece a fonte de auditoria de negócio;
- métricas externas, APM e alertas ficam fora do escopo, sem bloquear logs internos seguros.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |
| vazamento entre igrejas | baixa | crítico | tenant do principal em toda consulta, policy fail-closed e testes negativos |
| duplicidade concorrente | média | alto | normalização, lock da igreja, Serializable, retry e teste concorrente |
| falso positivo de duplicidade | média | médio | critérios explícitos, retorno genérico e cobertura por campo |
| PII em logs/auditoria | baixa | alto | allowlist de metadados, testes e inspeção de logs |
| observações receberem conteúdo sensível | média | alto | texto simples, limite de 10.000, acesso por ADMIN/PASTOR e ausência em logs/auditoria |
| patch apagar campo omitido | média | alto | distinção omitido/null, composição com estado atual e testes |
| pesquisa degradar com volume | média | médio | índices trigram, paginação, `EXPLAIN ANALYZE` e selects mínimos |
| migration de índice bloquear escrita | baixa | médio | medir lock, janela controlada e rollback documentado |
| papel stale autorizar mutação | baixa | alto | revalidar usuário ativo e role dentro da transação |
| indisponibilidade do PostgreSQL de teste | média | alto | ambiente dedicado e registrar validações não executadas sem declarar sucesso |
| crescimento para vínculos/células | média | médio | fora de escopo explícito e revisão do diff |

## 17. Estratégia de reversão

- remover `PeopleModule` do `AppModule` e reverter controller, aplicação, domínio local, contratos e adapter como uma unidade;
- remover scripts e documentação junto com os endpoints;
- reverter primeiro o código e manter coluna/índices aditivos sem uso, opção mais segura para dados;
- para remover coluna ou índices já aplicados, criar nova migration explícita; nunca editar ou apagar histórico;
- fazer backup e verificar uso antes de qualquer remoção de `observations`;
- não apagar pessoas nem registros de auditoria durante rollback;
- nunca executar `prisma migrate reset` em ambiente com dados;
- registrar versão, motivo, comandos, impacto e validação posterior.

## 18. Comandos de validação

```bash
docker compose up -d postgres-dev postgres-test
docker compose ps

npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status

npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:people:e2e --workspace @mission-atos/api

npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Os comandos de criação, executados uma única vez durante o desenvolvimento de cada migration e não como validação final repetível, são:

```bash
npm run db:migrate:create --workspace @mission-atos/database -- --name add_person_observations
npm run db:migrate:create --workspace @mission-atos/database -- --name add_person_search_trigram_indexes
```

Revisar o SQL antes de aplicar. Todos os comandos devem usar npm/npm workspaces, funcionar em PowerShell, usar banco de teste dedicado e ter resultado real registrado. Não usar pnpm, `db push` ou instalar dependências.

## 19. Definition of Done

- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] decisões encerradas preservadas e decisões funcionais resolvidas antes das capacidades afetadas;
- [x] contratos Zod criados e exportados;
- [x] domínio, aplicação, infraestrutura e HTTP separados;
- [x] nenhum controller ou caso de uso acessa Prisma diretamente;
- [x] autorização e isolamento por igreja validados no servidor;
- [x] duplicidade e concorrência cobertas por testes;
- [x] exclusão lógica e reativação idempotentes;
- [x] auditoria transacional e sem PII;
- [x] migrations criadas, revisadas e reproduzidas;
- [x] testes unitários criados e executados;
- [x] testes de integração PostgreSQL criados e executados;
- [x] testes de endpoints criados e executados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes executados;
- [x] build executado;
- [x] documentação atualizada;
- [x] nenhuma dependência adicionada;
- [x] ausência de front-end e itens fora do escopo confirmada;
- [x] riscos e limitações informados;
- [x] plano movido para `completed`.

## 20. Registro de progresso

### 2026-08-02

- realizado: leitura dos documentos obrigatórios, planos 001–005 e análise da implementação atual; criado o planejamento do módulo de pessoas sem alteração de código;
- testes: não executados, pois esta entrega cria somente documentação de planejamento;
- decisões: matriz de permissões, gênero livre, paginação, ordenação, duplicidade de ativos, revalidação em update e envelope de coleção registrados como definitivos;
- migrations: previstas duas migrations aditivas para observações e índices de pesquisa;
- bloqueios: Docker Engine indisponível e ausência de `DATABASE_URL`/`TEST_DATABASE_URL` impediram migrations, integrações PostgreSQL e E2E; a divergência de referências do PRD permanece documental e não bloqueia;
- próximo passo: revisar e aprovar este plano antes de implementar; não criar o Plano 007.

### Resumo executivo

- **Decisões tomadas:** leitura para todos os quatro papéis no próprio tenant; criação/atualização por `ADMIN` e `PASTOR`; status apenas por `ADMIN`; gênero livre; paginação 1–100; ordenação por nome/id; duplicidade apenas entre ativos; auditoria sem valores de PII.
- **Migrations necessárias:** `add_person_observations` e `add_person_search_trigram_indexes`, ambas novas e aditivas.
- **Endpoints planejados:** `GET /people`, `GET /people/:id`, `POST /people`, `PATCH /people/:id` e `PATCH /people/:id/status`.
- **Critérios centrais:** isolamento por `churchId`, matriz de autorização, normalização, deduplicação concorrente, paginação determinística, soft delete idempotente, auditoria atômica, respostas com allowlist, migrations reproduzíveis e testes unitários/integração/HTTP aprovados.

### Revisão

#### Problemas encontrados e correções

- **Alto — escopo hierárquico presumido:** o plano permitia consulta church-wide a `SUPERVISOR` e `LEADER`, contrariando a autorização por hierarquia do PRD e da arquitetura. Corrigido para exigir escopo hierárquico aprovado, com decisão registrada como pendente e testes positivos/negativos obrigatórios.
- **Alto — exposição de observações sem policy:** o contrato retornava e aceitava `observations` para todos os papéis sem decisão de sensibilidade. Corrigido bloqueando leitura/escrita HTTP até definição de papéis, conteúdo e retenção; schema nullable continua planejado.
- **Alto — visibilidade de inativos não decidida:** o filtro `INACTIVE` estava disponível a qualquer papel de leitura. Corrigido para exigir policy específica e decisão de produto.
- **Médio — rastreabilidade incompatível com o PRD vigente:** a solicitação cita `RN-001` a `RN-018` e fora do MVP na seção 17, mas o arquivo atual possui `RN-001` a `RN-012` e fora do MVP na seção 8. Corrigido com matriz explícita de aderência e pendência de confirmação, sem inventar regras.
- **Médio — criação de migrations misturada à validação final:** comandos `migrate:create` não são repetíveis e poderiam gerar migrations extras. Corrigido separando criação única do conjunto de comandos finais de validação e definindo a sequência de alteração do schema.

#### Observações de baixa severidade

- **Baixo — referência textual a itens fora do escopo:** o plano cita células, vínculos e Plano 007 apenas para delimitar escopo e rastreabilidade; não há etapa, dependência futura ou critério que implemente essas funcionalidades. Mantido como observação, sem correção funcional.

#### Decisões pendentes encerradas

- a referência a `RN-013`–`RN-018` e à seção 17 foi tratada como divergência documental, pois esses itens não existem no PRD vigente; a implementação respeitou as regras e seções efetivamente publicadas, sem presumir requisito de produto.

### 2026-08-02 — implementação

- realizado: contratos Zod, normalizadores, campo `observations`, duas migrations aditivas, tipos, ports, policies, authorization, queries, commands, unidade de trabalho Prisma serializável, deduplicação, paginação, presenter, controller, módulo, Swagger, auditoria, scripts e documentação;
- decisões aplicadas: supervisor/líder consultam ativos da igreja; somente admin lista inativos e altera status; admin/pastor leem e escrevem observações; demais papéis não recebem esse campo;
- testes adicionados: contratos, policies, commands, presenter, repository PostgreSQL e fluxo HTTP de pessoas;
- comandos aprovados: `npm run db:format`, `npm run db:validate`, `npm run db:generate`, `npm run lint`, `npm run typecheck`, `npm test`, testes unitários de contracts/API e `npm run build`;
- resultados: schema Prisma válido; lint e typecheck aprovados; 68 testes unitários aprovados na raiz (14 contracts, 42 API, 3 domain, 4 database e 5 config); build completo aprovado;
- validações conectadas: Docker Desktop acessível; as 9 migrations foram aplicadas em PostgreSQL 18.4 descartável; status confirmou schema atualizado; integração do database, integração completa da API e E2E de People foram aprovados;
- resultados conectados: 8 testes de integração do database, 12 testes de integração da API e 2 testes E2E de People aprovados;
- correções durante a validação: `PeopleModule` passou a importar `IdentityModule` para receber `DATABASE_CLIENT`; teardowns de People usam SQL administrativo explícito para não violar a proteção de exclusão física do runtime client;
- limitação operacional: a porta local `5433` estava ocupada por outra instância PostgreSQL que rejeitou as credenciais do Compose; os testes foram executados em container descartável PostgreSQL 18.4 na porta `55433`, com URLs de desenvolvimento e teste distintas;
- dependências: nenhuma adicionada;
- próximo passo: revisão final da implementação; manter o plano em `active`.

### 2026-08-02 — revalidação conectada

- migrations aplicadas: `20260802120000_add_person_observations` e `20260802121000_add_person_search_trigram_indexes`, juntamente com as sete migrations anteriores, em banco descartável dedicado;
- `npm run db:migrate:status`: aprovado, schema atualizado;
- `npm run test:integration`: aprovado, 8/8 testes do package database;
- `npm run test:auth:integration`: aprovado, 12/12 testes em quatro suítes da API, incluindo People;
- `npm run test:people:e2e`: aprovado, 2/2 testes HTTP;
- revalidação após correções: lint, typecheck, 68 testes unitários e build aprovados;
- dependências adicionadas: nenhuma;
- pendências conectadas do Plano 006: nenhuma.

### 2026-08-02 — correções após revisão estática

- arquitetura: removida a dependência do domínio local sobre tipos da aplicação; policies de inativos e observações foram explicitadas e a decisão de observações passou a ter fonte única;
- contratos e API: adicionados schemas/tipos compartilhados de resposta e erro; Swagger passou a documentar envelopes, permissões e respostas `400`, `401`, `403`, `404` e `409`;
- observabilidade: repository registra operação, resultado, duração, retry e rollback sem filtros, payload ou PII;
- testes unitários: ampliados para queries, update, no-op, `null`, papel corrente, status idempotente, falha de auditoria, policies, envelopes e limites; `packages/contracts` aprovou 22 testes e `apps/api` aprovou 52 testes;
- testes de integração adicionados: duas igrejas, isolamento, paginação/filtros, rollback, concorrência e inspeção dos índices/coluna;
- testes E2E adicionados: cinco endpoints, quatro papéis, validação estrita, `401`, `403`, `404`, `409`, update, paginação, desativação, reativação, idempotência e ocultação de campos;
- validações aprovadas após as correções: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`;
- revalidação conectada das correções: banco PostgreSQL 18.4 descartável criado em `127.0.0.1:55433`; 9 migrations aplicadas desde banco vazio; integração do database aprovada com 8/8 testes; integração da API aprovada com 16/16 testes; E2E de People aprovado com 5/5 testes;
- limitação operacional: a porta canônica `5433` continua reservada por outra instância local, portanto a validação isolada utilizou `55433`; não há pendência funcional ou de teste conectado do Plano 006;
- dependências adicionadas: nenhuma; migrations e funcionalidades de produção não foram ampliadas.

### 2026-08-02 — encerramento oficial

- **Status e conclusão:** Plano 006 concluído em 2026-08-02; todas as etapas, critérios de aceitação e correções Críticas, Altas e Médias foram conferidos, sem pendência nessas severidades.
- **Resumo da implementação:** entregue gerenciamento central de pessoas com criação, listagem paginada, pesquisa, filtros, detalhe, atualização parcial, desativação lógica, reativação, isolamento por igreja, deduplicação, auditoria atômica, documentação OpenAPI e observabilidade segura.
- **Decisões tomadas:** `ADMIN` e `PASTOR` criam/atualizam; somente `ADMIN` desativa, reativa e consulta inativos; `SUPERVISOR` e `LEADER` consultam ativos da igreja; observações são texto simples de até 10.000 caracteres, acessível somente a `ADMIN` e `PASTOR`; gênero permanece string livre de até 50 caracteres; paginação usa página iniciada em 1, padrão 20 e máximo 100; ordenação é `fullName ASC, id ASC`.
- **Arquivos e áreas principais:** `apps/api/src/modules/people/`, `apps/api/test/people.e2e-spec.ts`, `apps/api/src/app.module.ts`, `apps/api/src/modules/identity/presentation/auth-exception.filter.ts`, `packages/contracts/src/people.ts`, `packages/contracts/src/index.ts`, `packages/database/prisma/schema.prisma`, `packages/domain/src/entities.ts`, scripts npm e `README.md`.
- **Banco:** `Person.observations` adicionado como `TEXT NULL`; preservados UUID, timestamps UTC, `deletedAt`, FKs compostas e índices B-tree; adicionados índices GIN trigram para nome, telefone e e-mail.
- **Migrations:** `20260802120000_add_person_observations` e `20260802121000_add_person_search_trigram_indexes`; ambas aditivas, aplicadas com as sete migrations anteriores desde banco vazio em PostgreSQL 18.4 e confirmadas por `migrate status`.
- **Endpoints:** `GET /people`, `GET /people/:id`, `POST /people`, `PATCH /people/:id` e `PATCH /people/:id/status`.
- **Casos de uso:** queries de listagem e detalhe; commands de criação, atualização e alteração idempotente de status; detecção de no-op, duplicidade ativa e revalidação transacional do ator.
- **Repository:** `PrismaPeopleManagementRepository` implementa consultas tenant-aware, snapshot `RepeatableRead`, unidade de trabalho `Serializable`, lock da igreja, retry limitado, persistência, soft delete e auditoria na mesma transação.
- **DTOs e contratos:** schemas Zod estritos para params, query, criação, atualização e status; schemas/tipos públicos para item, coleção paginada e erro; nenhum contrato aceita `churchId` ou campos internos.
- **Policies e guards:** policies explícitas para leitura, gestão, status, inativos e observações; guards globais de access token, roles e policies foram reutilizados; nenhum novo guard específico foi necessário.
- **Auditoria:** `PERSON_CREATED`, `PERSON_UPDATED`, `PERSON_DEACTIVATED` e `PERSON_REACTIVATED` são gravados atomicamente, com nomes de campos/status e sem telefone, e-mail, nascimento, observações, tokens ou outros dados sensíveis.
- **Testes unitários:** raiz aprovada com 86 testes — 22 contracts, 52 API, 3 domain, 4 database e 5 config.
- **Testes conectados:** 8/8 no package database, 16/16 em quatro suítes de integração da API e 5/5 E2E de People; cobertos migrations do zero, duas igrejas, isolamento, rollback, concorrência, índices, cinco endpoints, quatro papéis, envelopes e transições de status.
- **Validações finais:** `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` executados novamente e aprovados em 2026-08-02.
- **Dependências:** nenhuma dependência npm adicionada; `package-lock.json` preservado e nenhum `pnpm-lock.yaml` criado.
- **Limitações conhecidas:** a porta local canônica `5433` está ocupada por outra instância PostgreSQL; testes isolados usaram container descartável em `127.0.0.1:55433`, removido após a execução. Não há limitação funcional aceita para o escopo.
- **Melhorias futuras:** avaliar volume real com `EXPLAIN ANALYZE`, política de retenção/minimização de observações e evolução de escopo hierárquico somente em plano futuro aprovado; nenhuma dessas melhorias bloqueia o Plano 006.
- **Escopo:** nenhuma funcionalidade de células, vínculos, reuniões, frequência, dashboard, front-end ou Plano 007 foi implementada.
- **Pendências:** nenhuma pendência Crítica, Alta ou Média; nenhuma validação obrigatória pendente.
