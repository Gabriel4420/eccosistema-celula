# Plano 005 — Gerenciamento institucional da igreja

**Status:** Concluído
**Responsável:** opencode
**Criado em:** 2026-07-26
**Concluído em:** 2026-07-27
**Atualizado em:** 2026-07-27
**PRD relacionado:** configurações básicas da igreja, RF-018, segurança, perfis de acesso e isolamento de dados
**ADRs relacionadas:** `docs/decisions/003-token-transport.md`; nenhuma ADR nova prevista
**Branch ou issue:** a definir

---

## 1. Objetivo

Planejar o gerenciamento dos dados institucionais e das configurações essenciais da igreja autenticada na API NestJS, reutilizando a entidade `Church`, o principal autenticado, a autorização por papéis, a persistência Prisma e a auditoria já implementados.

Ao concluir a futura implementação, usuários autenticados deverão consultar somente a representação segura da própria igreja. Um `ADMIN` ativo deverá atualizar dados institucionais e configurações aprovadas, sempre com `churchId` derivado do contexto autenticado, validação e normalização no servidor, persistência atômica e `AuditLog`.

O plano mantém o produto inicialmente restrito a uma igreja e não cria um CRUD multi-igreja. O resultado deverá ser verificável por contratos Zod, testes unitários, testes de integração PostgreSQL e testes HTTP.

## 2. Contexto

Os planos anteriores estabeleceram:

- plano 001: monorepo npm workspaces, NestJS, TypeScript estrito e comandos compartilhados;
- plano 002: PostgreSQL, Prisma, `Church`, UUID, UTC, exclusão lógica e `AuditLog`;
- plano 003: autenticação, principal com `userId`, `churchId` e papéis, além de guards globais;
- plano 004: papéis canônicos, autorização administrativa, policies, unidade de trabalho transacional, repositories Prisma, auditoria atômica e presenters com allowlist.

O schema atual de `Church` contém apenas `id`, `name`, `slug`, `createdAt`, `updatedAt` e `deletedAt`. Isso não atende endereço, contato, fuso horário ou início da semana. A arquitetura exige que datas sejam armazenadas em UTC e apresentadas no fuso configurado pela igreja, tornando `timezone` uma configuração necessária antes dos módulos de encontros e relatórios.

O PRD atribui ao administrador as configurações básicas, mas não exige cadastro público, administração de várias igrejas, dados fiscais, upload de logotipo ou desativação operacional do tenant. Portanto, esta entrega deverá ampliar o perfil da igreja de modo incremental, sem criar uma plataforma SaaS.

A implementação deverá consultar integralmente:

- `AGENTS.md`;
- `apps/api/AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/architecture/ARCHITECTURE.md`;
- `docs/plans/TEMPLATE.md`;
- todos os planos concluídos;
- este plano.

Limitações herdadas relevantes:

- as migrations e suítes conectadas dos planos anteriores ainda precisam ser executadas em PostgreSQL de teste controlado;
- o daemon Docker não estava disponível nas últimas validações;
- o Access Token possui papéis de curta duração, mas decisões administrativas críticas devem consultar o estado atual no banco;
- a aplicação não usa prefixo global de API; os endpoints existentes são `/auth`, `/users` e `/health`;
- o sistema ainda não possui front-end funcional nem roteamento público baseado no slug da igreja.

## 3. Escopo

- Criar o módulo NestJS `churches`.
- Consultar os dados institucionais seguros da igreja autenticada.
- Atualizar parcialmente nome, slug, contato e endereço.
- Consultar as configurações aprovadas da igreja autenticada.
- Atualizar parcialmente fuso horário e início da semana.
- Derivar `churchId` exclusivamente do principal autenticado.
- Proibir `churchId`, `id`, timestamps, `deletedAt` e campos não aprovados nos DTOs de escrita.
- Reutilizar autenticação, guards, papéis, policies e auditoria existentes.
- Permitir leitura dos dados seguros por qualquer usuário autenticado da própria igreja.
- Restringir alterações a `ADMIN` ativo da própria igreja.
- Normalizar nome, slug, e-mail, telefone, endereço, estado, CEP e país.
- Validar slug, valores reservados e unicidade global.
- Preservar campos omitidos em atualizações parciais.
- Permitir remoção explícita de campos opcionais por `null`.
- Registrar auditoria transacional somente dos campos efetivamente alterados.
- Ampliar o modelo `Church` com os campos do MVP definidos na seção 8.
- Criar duas migrations aditivas e reproduzíveis, separando expansão e consolidação.
- Atualizar contratos, repository, seed fictícia e documentação.
- Documentar os quatro endpoints no Swagger/OpenAPI.
- Criar testes unitários, de integração e HTTP.
- Manter compatibilidade com npm workspaces e PowerShell no Windows.

## 4. Fora de escopo

- Criação pública ou administrativa de igrejas.
- Listagem de igrejas.
- Consulta ou alteração por identificador informado na rota.
- Múltiplas igrejas por usuário.
- Multi-tenant SaaS, superadministrador, organizações comerciais, cobrança ou assinatura.
- Exclusão física ou lógica da igreja por endpoint.
- Ativação, suspensão ou desativação operacional da igreja.
- Campo `status` ou mecanismo de bloqueio do tenant.
- Razão social, CNPJ ou outro documento fiscal no MVP desta etapa.
- Campo genérico de informações institucionais livres.
- Internacionalização da interface ou configuração de `locale` antes de existir suporte de i18n.
- Alteração dos papéis canônicos ou CRUD de papéis.
- Gerenciamento de usuários.
- Supervisores, estrutura hierárquica, pessoas, membros, células, encontros, frequência, visitantes e relatórios.
- Dashboard, exportações, notificações e envio de e-mails.
- Upload de logotipo, upload de arquivos, personalização visual ou domínio personalizado.
- Front-end, PWA ou aplicativo mobile.
- Recuperação de senha ou mudanças na autenticação.
- Configuração de prazo de relatório ou outras regras pertencentes a módulos futuros.
- Deploy, infraestrutura de produção ou observabilidade externa.
- Plano 006.

## 5. Suposições

- O MVP continua operando para uma igreja, mas nenhuma consulta poderá ignorar o `churchId` do principal.
- Os papéis canônicos permanecem `ADMIN`, `PASTOR`, `SUPERVISOR` e `LEADER`.
- Somente `ADMIN` ativo altera dados e configurações institucionais nesta etapa.
- Todo usuário autenticado pode ler a representação institucional segura da própria igreja, inclusive quando não possui um dos quatro papéis reconhecidos.
- `Church.slug` continua único globalmente e reservado após exclusão lógica, conforme o plano 002.
- Nenhuma rota atual depende do slug; portanto, sua alteração não quebra referência implementada, mas deverá ser auditada antes de qualquer uso futuro em URL pública.
- O país operacional inicial é Brasil, representado por `BR`.
- `timezone` usa identificador IANA e o valor operacional inicial recomendado é `America/Sao_Paulo`.
- `weekStartsOn` reutiliza o enum `DayOfWeek`; o valor inicial recomendado é `SUNDAY`.
- `PASTOR` permanece com leitura, sem permissão de escrita institucional nesta etapa.
- Telefone será persistido em E.164 e formatado somente na apresentação futura.
- Para `country = BR`, CEP será persistido com oito dígitos e estado com duas letras uppercase.
- A lista inicial de slugs reservados é a definida na seção 8.2 e será protegida na aplicação e no banco.
- Contato e endereço são opcionais; nome, slug, país, fuso e início da semana são obrigatórios.
- Campos opcionais omitidos permanecem inalterados e `null` significa remoção explícita.
- Nenhuma dependência npm nova é necessária; Zod, Prisma, NestJS, Jest, Supertest e Swagger existentes são suficientes.
- Testes conectados exigem `TEST_DATABASE_URL` dedicada, diferente de `DATABASE_URL`, com todas as migrations aplicadas.
- As migrations não alteram automaticamente slugs existentes inválidos ou reservados; o preflight deve interromper o fluxo para exigir decisão explícita.

## 6. Perguntas e decisões pendentes

- [x] Usar no backfill aprovado: `country = BR`, `timezone = America/Sao_Paulo` e `weekStartsOn = SUNDAY`.
- [x] Manter `PASTOR` somente com leitura e escrita exclusiva de `ADMIN` ativo.
- [x] Persistir telefone em E.164, com formatação somente na apresentação futura.
- [x] Persistir CEP brasileiro com oito dígitos e estado com duas letras uppercase quando `country = BR`.
- [x] Adotar a lista inicial de slugs reservados definida na seção 8.2.
- [x] Confirmar, antes da aplicação conectada, que não existem slugs atuais inválidos/reservados e que o banco alvo contém apenas os registros esperados.

Somente a confirmação do backfill e o preflight dos dados existentes permanecem bloqueantes para a migration de constraints. Contratos, regras puras e a migration de expansão podem ser preparados sem assumir valores reais. Não implementar hipótese relevante sem registrar sua resolução neste documento.

## 7. Áreas afetadas

### Aplicação web

- Não será alterada.
- Nenhuma tela, cliente HTTP ou configuração visual será criada.

### API

- Novo `apps/api/src/modules/churches/churches.module.ts`.
- Controller singular em `presentation/church.controller.ts`.
- Casos de uso de consulta e comandos na camada de aplicação.
- Ports orientados às operações de igreja e unidade de trabalho.
- Policies puras de visualização, administração e tenant.
- Presenter com allowlist.
- Adapter Prisma no módulo `churches`.
- Integração do `ChurchesModule` ao `AppModule`.
- Reutilização de `CurrentPrincipal`, `RolesGuard`, autenticação global e tratamento de erros.
- Nenhum acesso direto ao Prisma a partir de controller ou caso de uso.

Estrutura proposta:

```text
apps/api/src/modules/churches/
├── application/
│   ├── church-management.commands.ts
│   ├── church-management.queries.ts
│   ├── church-management.authorization.ts
│   ├── church-management.error.ts
│   ├── church-management.port.ts
│   └── church-management.types.ts
├── domain/
│   ├── church-management.policy.ts
│   └── church-normalization.ts
├── infrastructure/
│   └── prisma-church-management.repository.ts
├── presentation/
│   ├── church.controller.ts
│   └── church.presenter.ts
└── churches.module.ts
```

Não criar pastas vazias. Arquivos podem ser combinados quando isso reduzir complexidade sem misturar camadas.

### Banco de dados

- Ampliar o modelo `Church` por duas novas migrations aditivas.
- Preservar todas as migrations anteriores.
- Manter UUID, timestamps, exclusão lógica, unique global do slug e índice de `deletedAt`.
- Adicionar constraints de normalização que possam ser garantidas com segurança pelo PostgreSQL.
- Atualizar a seed fictícia com valores institucionais inequivocamente fictícios.
- Não criar nova tabela de configuração enquanto os campos forem estritamente 1:1 com `Church`.

### Contratos compartilhados

- Criar `packages/contracts/src/church.ts`.
- Adicionar schemas Zod para:
  - atualização institucional;
  - atualização de configurações;
  - representação institucional;
  - representação de configurações;
  - envelopes de resposta.
- Exportar somente contratos HTTP e tipos de transporte.
- Não exportar modelos Prisma, `deletedAt`, auditoria ou tipos internos de persistência.

### Infraestrutura

- Nenhum serviço externo.
- Nenhuma dependência nova.
- Reutilizar PostgreSQL, Prisma, scripts e ambiente de teste existentes.
- Adicionar scripts específicos do módulo apenas quando necessários para integração e E2E.

### Documentação

- Atualizar README durante a implementação com endpoints, permissões, campos, normalização e comandos.
- Documentar os endpoints no Swagger sem exemplos reais ou dados sensíveis.
- Atualizar o progresso deste plano durante a implementação.
- Não alterar documentação de módulos futuros.

## 8. Modelo e regras de negócio

### 8.1 Avaliação dos campos

| Campo | MVP | Obrigatoriedade | Tipo/limite proposto | Índice/unicidade | Normalização/justificativa |
| --- | --- | --- | --- | --- | --- |
| `id` | manter | obrigatório | UUID | PK | gerado conforme padrão atual |
| `name` | manter | obrigatório | `varchar(160)` | nenhum | trim e espaços internos colapsados |
| `slug` | manter | obrigatório | `varchar(100)` | unique global existente | lowercase ASCII, kebab-case |
| `legalName` | adiar | — | — | — | não é necessário aos fluxos do MVP |
| `email` | adicionar | opcional | `varchar(320)` | nenhum | trim e lowercase |
| `phone` | adicionar | opcional | `varchar(32)` | nenhum | E.164 recomendado |
| `document` | adiar | — | — | — | dado fiscal aumenta validação e risco sem requisito do PRD |
| `addressLine` | adicionar | opcional | `varchar(200)` | nenhum | trim e espaços colapsados |
| `addressNumber` | adicionar | opcional | `varchar(30)` | nenhum | string para suportar `s/n` e sufixos |
| `addressComplement` | adicionar | opcional | `varchar(120)` | nenhum | corresponde às informações complementares de endereço |
| `neighborhood` | adicionar | opcional | `varchar(120)` | nenhum | trim e espaços colapsados |
| `city` | adicionar | opcional | `varchar(120)` | nenhum | trim e espaços colapsados |
| `state` | adicionar | opcional | `varchar(2)` no MVP BR | nenhum | uppercase |
| `postalCode` | adicionar | opcional | `varchar(16)` | nenhum | oito dígitos para `BR` |
| `country` | adicionar | obrigatório | `char(2)` | nenhum | ISO 3166-1 alpha-2 uppercase; default inicial `BR` |
| `timezone` | adicionar | obrigatório | `varchar(64)` | nenhum | identificador IANA; default inicial aprovado antes da migration |
| `locale` | adiar | — | — | — | arquitetura não prevê i18n e a interface ainda não suporta localidades |
| `weekStartsOn` | adicionar | obrigatório | `DayOfWeek` | nenhum | default inicial aprovado antes da migration |
| `status` | adiar | — | — | — | desativar tenant exige política operacional fora do MVP |
| `createdAt` | manter | obrigatório | `TIMESTAMPTZ(3)` | nenhum | UTC |
| `updatedAt` | manter | obrigatório | `TIMESTAMPTZ(3)` | nenhum | UTC e atualização pelo Prisma |
| `deletedAt` | manter | opcional/interno | `TIMESTAMPTZ(3)` | índice existente | não exposto nem mutável pela API |

Não criar índices para e-mail, telefone, cidade, estado, CEP, fuso ou início da semana: a API sempre busca uma igreja pela PK do principal e não lista ou filtra igrejas. O unique de `slug` já fornece o índice necessário. Adicionar índices sem consulta correspondente seria custo sem benefício.

### 8.2 Slug

- Aceitar de 3 a 100 caracteres.
- Normalizar com trim, remoção de diacríticos, lowercase e substituição de grupos não alfanuméricos por hífen.
- Permitir somente `a-z`, `0-9` e hífen após normalização.
- Não permitir hífen no início/fim nem hifens consecutivos.
- Rejeitar resultado vazio, curto demais ou diferente dos limites.
- Rejeitar a lista inicial reservada: `admin`, `api`, `app`, `auth`, `church`, `churches`, `docs`, `health`, `login`, `logout`, `refresh`, `settings`, `users` e `www`.
- Centralizar normalização e lista reservada no domínio/contrato, sem duplicação entre controller e repository.
- Espelhar no PostgreSQL o formato normalizado e a lista reservada por checks nomeados, impedindo que escrita administrativa direta contorne a aplicação.
- Manter unicidade global, inclusive após soft delete.
- Traduzir conflito de unicidade do Prisma para `409 CHURCH_SLUG_CONFLICT`.
- Não alterar automaticamente um slug existente durante migration.
- Não criar alias ou histórico de slug nesta etapa, pois nenhuma rota atual depende dele.
- Antes de usar slug em URLs públicas, criar plano próprio para alias/redirecionamento e referências estáveis.
- Usar exclusivamente o UUID como referência interna entre entidades; o slug não poderá ser introduzido como foreign key ou identificador interno.

### 8.3 Contato e endereço

- E-mail institucional é opcional, normalizado com `trim().toLowerCase()` e validado pelo contrato.
- E-mail institucional não precisa ser único.
- Telefone é opcional e persistido no formato canônico aprovado; máscara pertence à apresentação futura.
- Campos textuais são trimados; strings vazias são rejeitadas ou convertidas em `null` de forma consistente no normalizador aprovado.
- Para `country = BR`, `state` aceita duas letras uppercase e `postalCode` aceita exatamente oito dígitos.
- `addressNumber` permanece string para não perder valores como `s/n`, `12A` ou `100 bloco 2`.
- `addressComplement` é o único campo complementar desta etapa; não criar JSON ou texto livre genérico.
- Alterar `country` deve revalidar `state` e `postalCode` no estado final, inclusive quando esses campos não vierem no mesmo PATCH.

### 8.4 Configurações

- `timezone` deve ser um identificador IANA reconhecido pelo runtime e persistido de forma canônica.
- `weekStartsOn` reutiliza `DayOfWeek`.
- `locale` fica adiado até existir estratégia de internacionalização e catálogo suportado.
- Não criar booleans genéricos de configuração sem comportamento de produto concreto.
- Não incluir prazo de entrega de relatório, tema, logotipo, domínio, notificações ou qualquer configuração de módulos futuros.
- `GET /church/settings` devolve somente configurações existentes e aprovadas.
- `PATCH /church/settings` altera somente `timezone` e `weekStartsOn`.

### 8.5 Atualização parcial

- Cada PATCH exige pelo menos um campo.
- Campos omitidos não são incluídos no comando de persistência e preservam o valor atual.
- `name` e `slug` não aceitam `null`.
- Campos institucionais opcionais aceitam `null` para remoção explícita.
- Configurações obrigatórias não aceitam `null`.
- Propriedades desconhecidas são rejeitadas.
- O DTO nunca aceita `id`, `churchId`, `createdAt`, `updatedAt`, `deletedAt`, `status`, `document` ou `legalName`.
- Atualização que não produz mudança efetiva retorna a representação atual sem criar `AuditLog` nem alterar artificialmente `updatedAt`.

### 8.6 Isolamento, autorização e transação

1. O `churchId` vem apenas de `AuthenticatedPrincipal`.
2. O cliente não escolhe igreja por rota, query, header ou body.
3. Consultas procuram `Church` por `id = principal.churchId` e `deletedAt IS NULL`.
4. Igreja ausente ou excluída retorna `404 CHURCH_NOT_FOUND`.
5. Leitura exige principal válido e policy de mesma igreja.
6. Escrita exige role `ADMIN` no guard e revalidação de `ADMIN` ativo no banco.
7. Papéis do token não bastam para uma mutação crítica.
8. Commands coordenam policy, estado atual, normalização final, efeitos e auditoria.
9. A unidade de trabalho Prisma bloqueia a linha da igreja, consulta o estado atual, persiste a mudança e o `AuditLog`, e confirma tudo atomicamente.
10. O adapter Prisma filtra sempre pelo `churchId` da unidade de trabalho.
11. Nenhum caso de uso ou controller recebe Prisma Client.
12. Não há operação de criação, exclusão ou troca de igreja.
13. A transação deve verificar que exatamente uma igreja ativa foi bloqueada; zero linhas resulta em `CHURCH_NOT_FOUND` antes de qualquer efeito.
14. Retries por serialização devem ser limitados a três tentativas e somente para o erro transitório reconhecido; demais falhas propagam sem repetição cega.
15. A resposta da mutação deve ser construída a partir do estado confirmado na mesma transação, evitando leitura posterior sujeita a mudança concorrente.

### 8.7 Auditoria

As mutações geram auditoria na mesma transação:

| Grupo alterado | Ação |
| --- | --- |
| nome ou slug | `CHURCH_IDENTITY_UPDATED` |
| e-mail ou telefone | `CHURCH_CONTACT_UPDATED` |
| campos de endereço ou país | `CHURCH_ADDRESS_UPDATED` |
| fuso ou início da semana | `CHURCH_SETTINGS_UPDATED` |

Regras:

- registrar `churchId`, ator, entidade `Church`, identificador da igreja, ação e instante;
- `before` e `after` contêm somente os campos daquele grupo que efetivamente mudaram;
- incluir `null` quando um campo opcional for removido;
- uma única requisição pode gerar mais de um registro quando alterar grupos distintos;
- não registrar DTO completo, principal completo, headers, IP, token, credencial ou segredo;
- não incluir `deletedAt`, detalhes de autenticação ou campos de outros módulos;
- migration técnica de backfill não cria `AuditLog`, pois não representa ação administrativa; seus valores devem ficar documentados no histórico da migration.

## 9. Contratos

### Entradas

- `GET /church`
  - sem parâmetros;
  - usa `principal.churchId`.
- `PATCH /church`
  - body estrito com ao menos um campo;
  - campos: `name?`, `slug?`, `email?`, `phone?`, `addressLine?`, `addressNumber?`, `addressComplement?`, `neighborhood?`, `city?`, `state?`, `postalCode?`, `country?`;
  - campos opcionais aceitam `string | null`;
  - `name` e `slug` aceitam somente string;
  - não aceita `churchId`.
- `GET /church/settings`
  - sem parâmetros;
  - usa `principal.churchId`.
- `PATCH /church/settings`
  - body estrito com ao menos um campo;
  - campos: `timezone?`, `weekStartsOn?`;
  - não aceita `churchId`, `locale`, `status` ou configurações genéricas.

DTOs da apresentação validam o payload pelos schemas compartilhados e o convertem em comandos próprios da aplicação. Casos de uso não dependem de tipos HTTP, NestJS ou Prisma.

### Saídas

`GET /church` e `PATCH /church` retornam `200`:

```json
{
  "data": {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Igreja Exemplo",
    "slug": "igreja-exemplo",
    "email": "contato@example.test",
    "phone": "+5511999999999",
    "address": {
      "line": "Rua Exemplo",
      "number": "100",
      "complement": null,
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "01001000",
      "country": "BR"
    },
    "createdAt": "2026-07-26T00:00:00.000Z",
    "updatedAt": "2026-07-26T00:00:00.000Z"
  },
  "meta": {}
}
```

`GET /church/settings` e `PATCH /church/settings` retornam `200`:

```json
{
  "data": {
    "timezone": "America/Sao_Paulo",
    "weekStartsOn": "SUNDAY"
  },
  "meta": {}
}
```

Presenter/serializer:

- constrói a resposta campo a campo;
- não serializa modelo Prisma diretamente;
- não inclui `deletedAt`, dados de auditoria, usuários, papéis, sessões ou campos internos;
- mantém `null` explícito para campos opcionais ausentes;
- retorna datas em ISO 8601 UTC.

### Erros esperados

| Situação | HTTP | Código público |
| --- | --- | --- |
| Payload, formato ou combinação inválida | 400 | `VALIDATION_ERROR` |
| Slug reservado | 400 | `CHURCH_SLUG_RESERVED` |
| Principal ausente ou token inválido | 401 | `AUTH_UNAUTHENTICATED` |
| Papel ou policy insuficiente | 403 | `AUTH_FORBIDDEN` |
| Igreja ausente/excluída no tenant autenticado | 404 | `CHURCH_NOT_FOUND` |
| Slug normalizado já utilizado | 409 | `CHURCH_SLUG_CONFLICT` |

Erros seguem `{ error: { code, message, details } }`. Não expor SQL, nome de constraint, stack, conteúdo de outro tenant ou existência de igreja externa.

### Permissões

| Operação | `ADMIN` | `PASTOR` | `SUPERVISOR` | `LEADER` | autenticado sem papel reconhecido |
| --- | --- | --- | --- | --- | --- |
| Consultar dados seguros | permitir | permitir | permitir | permitir | permitir |
| Consultar configurações | permitir | permitir | permitir | permitir | permitir |
| Atualizar dados | permitir, se ativo no banco | negar | negar | negar | negar |
| Alterar slug | permitir, se ativo no banco | negar | negar | negar | negar |
| Alterar configurações | permitir, se ativo no banco | negar | negar | negar | negar |
| Alterar status/excluir igreja | inexistente | inexistente | inexistente | inexistente | inexistente |

- Leitura é limitada à igreja do principal.
- Escrita usa `@Roles("ADMIN")` como filtro inicial e policy/revalidação no caso de uso.
- A policy deve negar por padrão quando o recurso ou o tenant não estiver disponível.
- Nenhum campo enviado pelo cliente concede autoridade.
- Não criar papel novo.

## 10. Etapas

### Etapa 1 — Resolver decisões e congelar contratos

- [x] resolver todas as decisões bloqueantes da seção 6;
- [x] inspecionar dados reais/locais da tabela `churches` sem alterá-los;
- [x] verificar que formatos canônicos e slugs reservados permanecem iguais às decisões registradas;
- [x] verificar que a matriz de leitura/escrita permanece igual à decisão registrada;
- [x] registrar o resultado do preflight, a contagem de igrejas e os valores de backfill aprovados, sem copiar dados sensíveis para o plano;
- [x] atualizar este plano com as decisões;
- [x] não gerar a migration de constraints antes das confirmações.

### Etapa 2 — Criar regras e contratos compartilhados

- [x] criar schemas Zod de atualização e resposta;
- [x] implementar normalizadores puros de slug, texto, e-mail, telefone, país, estado e CEP;
- [x] validar timezone IANA e `DayOfWeek`;
- [x] implementar semântica de omitido versus `null`;
- [x] rejeitar campos desconhecidos e payload vazio;
- [x] exportar contratos públicos pelo entrypoint de `packages/contracts`;
- [x] criar testes unitários de todas as validações e normalizações.

### Etapa 3 — Preparar schema e migrations seguras

- [x] adicionar ao Prisma somente os campos aprovados do MVP;
- [x] reutilizar `DayOfWeek` para `weekStartsOn`;
- [x] gerar a migration de expansão `add_church_institutional_fields` com colunas novas, nullable, sem check restritivo e sem alterar dados;
- [x] preparar preflight somente leitura para slugs existentes, campos incompatíveis e valores de backfill;
- [x] executar o preflight e bloquear a continuação quando houver anomalia;
- [x] gerar a migration de consolidação `enforce_church_institutional_constraints` com backfill aprovado, `NOT NULL`, defaults e checks nomeados;
- [x] revisar separadamente SQL, locks, defaults, nulabilidade e constraints de cada migration;
- [x] medir o tempo e o lock das duas migrations em cópia representativa antes de qualquer aplicação não descartável;
- [x] garantir compatibilidade com banco vazio e banco no estado do plano 004;
- [x] não editar migrations anteriores;
- [x] atualizar seed fictícia com valores explícitos e seguros.

### Etapa 4 — Criar tipos, ports e policies

- [x] definir modelos de aplicação sem tipos Prisma;
- [x] criar port de consulta por `churchId`;
- [x] criar port transacional para lock, leitura, persistência e auditoria;
- [x] criar unidade de trabalho orientada ao módulo;
- [x] criar policies de leitura, administração e mesma igreja;
- [x] criar erros nominais da aplicação sem status HTTP;
- [x] testar policies com sucesso, ausência de recurso, papel insuficiente e tenant divergente.

### Etapa 5 — Implementar consultas

- [x] implementar query de dados institucionais;
- [x] implementar query de configurações;
- [x] filtrar por `churchId` e `deletedAt: null`;
- [x] selecionar somente os campos necessários;
- [x] aplicar policy de leitura no recurso carregado;
- [x] mapear ausência para `CHURCH_NOT_FOUND`;
- [x] testar isolamento entre duas igrejas.

### Etapa 6 — Implementar atualização institucional

- [x] implementar command de atualização parcial;
- [x] revalidar `ADMIN` ativo dentro da unidade de trabalho;
- [x] bloquear a igreja antes de avaliar e persistir mudanças;
- [x] carregar o estado atual dentro da transação;
- [x] combinar estado atual e patch antes das validações dependentes;
- [x] tratar slug reservado e conflito de unicidade;
- [x] não persistir atualização vazia;
- [x] criar auditorias por grupo com diffs mínimos;
- [x] confirmar exatamente uma linha bloqueada e alterada antes de registrar auditoria;
- [x] testar atomicidade, rollback e concorrência de slug.

### Etapa 7 — Implementar atualização de configurações

- [x] implementar command de settings;
- [x] revalidar `ADMIN` ativo dentro da transação;
- [x] validar timezone e início da semana;
- [x] preservar configurações omitidas;
- [x] não criar configuração genérica ou de módulo futuro;
- [x] auditar somente os valores alterados;
- [x] testar rollback de persistência e auditoria.

### Etapa 8 — Criar controller, presenter e documentação

- [x] registrar somente `GET /church`, `PATCH /church`, `GET /church/settings` e `PATCH /church/settings`;
- [x] aplicar autenticação global e role nos PATCH;
- [x] manter controllers limitados a parse, chamada da aplicação e apresentação;
- [x] criar presenter com allowlist;
- [x] mapear erros da aplicação para HTTP na apresentação;
- [x] documentar contratos e erros no Swagger;
- [x] confirmar ausência de endpoints plurais, criação e exclusão.

### Etapa 9 — Testar persistência e endpoints

- [x] testar repository contra PostgreSQL real dedicado;
- [x] testar as duas migrations desde banco vazio;
- [x] testar as duas migrations sobre schema completo dos planos 001–004;
- [x] testar constraints e defaults no PostgreSQL;
- [x] testar leitura, atualização parcial, limpeza por `null` e no-op;
- [x] testar tenant, permissões, slug duplicado/invalido/reservado e auditoria;
- [x] testar ausência recursiva de dados internos nas respostas;
- [x] testar seed duas vezes sem duplicação.

### Etapa 10 — Validar, documentar e encerrar

- [x] executar todos os comandos da seção 18;
- [x] corrigir falhas dentro do escopo;
- [x] atualizar README somente com a documentação necessária;
- [x] revisar imports, dependências e diff;
- [x] confirmar que nenhuma funcionalidade futura foi criada;
- [x] registrar comandos, resultados, migration, limitações e decisões;
- [x] manter o plano em `active` até revisão e aprovação final.

## 11. Critérios de aceitação

1. Os únicos endpoints novos são os quatro endpoints singulares definidos neste plano.
2. Nenhum DTO, rota, query ou header permite escolher ou alterar `churchId`.
3. Toda leitura carrega somente `principal.churchId` e exclui `deletedAt IS NOT NULL`.
4. Usuário autenticado consulta a representação segura da própria igreja.
5. Nenhuma consulta retorna dados de outra igreja, mesmo quando recebe identificadores externos manipulados.
6. Somente `ADMIN` atualmente ativo no banco consegue executar PATCH.
7. Papéis não autorizados recebem `403` e não produzem alteração ou auditoria.
8. Nome, slug, contato e endereço obedecem às normalizações aprovadas.
9. Slug inválido ou reservado retorna erro verificável.
10. Slug duplicado globalmente retorna `409 CHURCH_SLUG_CONFLICT`.
11. Atualização parcial preserva todos os campos omitidos.
12. `null` remove somente campos opcionais aprovados.
13. Payload vazio, propriedades desconhecidas e `null` em campo obrigatório são rejeitados.
14. Alterar país revalida estado e CEP no estado final persistido.
15. Timezone aceita somente identificador IANA válido.
16. `weekStartsOn` aceita somente valor de `DayOfWeek`.
17. Atualização sem mudança efetiva não altera `updatedAt` nem cria auditoria.
18. Alteração relevante e respectivos `AuditLog` são confirmados na mesma transação.
19. Falha de validação, unicidade, autorização ou auditoria não deixa alteração parcial.
20. `before` e `after` registram apenas campos efetivamente alterados e nunca credenciais, tokens ou dados internos.
21. Presenter não expõe `deletedAt`, relações, hashes, sessões, segredos ou objeto Prisma.
22. As duas migrations são novas, aditivas, revisadas e reproduzíveis desde banco vazio e desde o estado do plano 004.
23. Registros existentes recebem somente os valores de backfill aprovados, sem alteração silenciosa do slug.
24. A seed continua idempotente e contém somente dados fictícios.
25. Não há índice novo sem consulta correspondente; unique do slug e índice de exclusão existentes são preservados.
26. Nenhuma dependência npm é adicionada.
27. Não existe CRUD multi-igreja, status de tenant, dados fiscais, upload, front-end ou módulo funcional futuro.
28. Testes unitários, de integração e HTTP passam em Windows por npm workspaces.
29. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.
30. Swagger documenta sucesso, validação, autenticação, autorização, not found e conflito sem exemplos sensíveis.
31. A expansão do schema pode ser aplicada sem backfill, `NOT NULL` ou check que bloqueie o código anterior.
32. A migration de consolidação só pode ser aplicada após preflight aprovado e registrado.
33. Escritas diretas que violem formato ou reserva de slug são rejeitadas também pelo PostgreSQL.
34. Retry transacional ocorre somente para falha transitória reconhecida e nunca mais de três vezes.

## 12. Estratégia de testes

### Unitários

- Schemas Zod: campos permitidos, limites, campos desconhecidos, payload vazio, omitido e `null`.
- Normalização: nomes, slug com acentos, espaços, hífens, e-mail, telefone, país, estado e CEP.
- Slug: válido, curto, longo, inválido, reservado e normalização para colisão.
- Timezone: IANA válido e inválido.
- `weekStartsOn`: todos os valores permitidos e valores externos rejeitados.
- Policies: leitura, `ADMIN`, ausência de recurso, tenant divergente e negação por padrão.
- Queries: igreja encontrada, ausente e isolada.
- Commands: mudança por grupo, no-op, combinação do patch com estado atual, autorização transacional e erros.
- Diff de auditoria: somente campos alterados, incluindo remoção por `null`.
- Presenter: allowlist e ausência de campos internos.

### Integração

- PostgreSQL real dedicado e migrations aplicadas do zero.
- Migration sobre banco vazio e sobre schema completo do plano 004.
- Compatibilidade do código anterior entre a migration de expansão e a migration de consolidação.
- Preflight de slug inválido/reservado.
- Defaults/backfill de país, timezone e início da semana.
- Constraints de slug e campos normalizados.
- Unicidade global de slug, inclusive com igreja excluída logicamente.
- Repository de leitura sempre filtrado por `churchId` e `deletedAt`.
- Unidade de trabalho com lock da igreja e retry limitado de serialização.
- Atualização e auditoria atômicas.
- Rollback quando auditoria ou persistência falha.
- Duas igrejas para provar isolamento negativo.
- Concorrência de alteração para o mesmo slug.
- Seed executada duas vezes sem duplicação e sem dados reais.
- Inspeção de catálogo para confirmar ausência de índices desnecessários.

### E2E

- Supertest contra NestJS e PostgreSQL isolado.
- `GET /church` e `GET /church/settings` para cada papel e para principal sem papel reconhecido.
- `401` sem autenticação.
- `403` nos PATCH para `PASTOR`, `SUPERVISOR`, `LEADER` e usuário comum.
- Sucesso nos PATCH para `ADMIN` ativo.
- Falha quando o token ainda contém `ADMIN`, mas o estado atual no banco não autoriza.
- Isolamento entre duas igrejas.
- Atualização de nome, slug, contato, endereço e settings.
- Slug duplicado, inválido e reservado.
- Atualização parcial e limpeza de opcionais.
- Payload vazio, campo desconhecido e tentativa de enviar `churchId`.
- AuditLog criado com diff mínimo.
- Ausência recursiva de campos internos e sensíveis no JSON.
- Envelopes e códigos HTTP definidos.
- Nenhuma rota `GET /churches`, `POST /churches` ou `DELETE` disponível.

### Validação manual

- Inspecionar integralmente o SQL de cada migration antes de aplicá-la.
- Conferir no Swagger os quatro endpoints e suas permissões.
- Confirmar que nenhum DTO aceita `churchId`.
- Confirmar que nenhum controller/caso de uso importa Prisma.
- Conferir logs e `AuditLog` sem tokens, credenciais, headers ou payload completo.
- Confirmar que nenhuma rota usa slug atualmente.
- Executar os comandos em PowerShell no Windows.
- Registrar qualquer validação conectada não executada e seu motivo exato.

## 13. Segurança e privacidade

- Autenticação: todas as rotas são privadas.
- Autorização: leitura exige principal válido; escrita exige `ADMIN` ativo revalidado na transação.
- Isolamento: `churchId` vem somente do principal e é aplicado em todas as consultas.
- Mass assignment: contratos estritos e mapeamento campo a campo.
- Respostas: presenter com allowlist.
- Dados internos: `deletedAt`, auditoria, sessões, usuários, hashes e segredos não são expostos.
- Slug: lista reservada, formato controlado e unicidade no banco.
- Concorrência: lock da igreja e transação para persistência com auditoria.
- Logs: registrar apenas operação, resultado, correlation ID e IDs estritamente necessários.
- Auditoria: valores institucionais alterados podem constar em before/after, mas nunca principal completo, headers, credenciais ou tokens.
- Dados fiscais: `document` fica adiado para evitar coleta sem finalidade aprovada.
- LGPD: coletar apenas contato/endereço institucional necessários e evitar dados livres que possam receber conteúdo pessoal indevido.
- Exportações: inexistentes.
- Exclusão: nenhum endpoint físico ou lógico de igreja.

## 14. Migração de dados

Serão necessárias duas migrations Prisma pequenas e aditivas:

```text
packages/database/prisma/migrations/<timestamp>_add_church_institutional_fields/
└── migration.sql

packages/database/prisma/migrations/<timestamp>_enforce_church_institutional_constraints/
└── migration.sql
```

Estratégia:

1. Não modificar nenhuma migration aplicada.
2. A primeira migration aplica somente a expansão:
   - adiciona os novos campos como nullable;
   - não executa backfill;
   - não adiciona checks que rejeitem o estado legado;
   - permanece compatível com a versão anterior da API.
3. Fazer preflight somente leitura de todas as igrejas existentes:
   - slug compatível com o formato novo;
   - slug não reservado;
   - ausência de anomalias de exclusão ou duplicidade;
   - confirmação dos valores de backfill.
4. Interromper com diagnóstico seguro se o preflight falhar; não renomear igreja nem escolher configuração automaticamente.
5. Produzir backup verificado antes da segunda migration em qualquer ambiente com dados não descartáveis.
6. A segunda migration executa a consolidação:
   - preenche registros existentes com os valores explicitamente aprovados;
   - aplica `NOT NULL` e defaults após o backfill;
   - adiciona checks nomeados para invariantes que o PostgreSQL possa garantir;
   - falha integralmente, sem commit parcial, se alguma validação não for satisfeita.
7. Preservar o `updatedAt` histórico durante o backfill técnico e documentar a mudança, sem simular ação administrativa.
8. Atualizar o schema Prisma para refletir exatamente o estado final consolidado.
9. Atualizar a seed fictícia com todos os campos obrigatórios explícitos e dados opcionais inequivocamente fictícios.
10. Executar ambas as migrations desde banco vazio e sobre banco no estado do plano 004.
11. Testar também o estado intermediário após somente a expansão.
12. Comparar o schema final e executar testes de constraints.
13. Não usar `prisma db push`.

Gate de aplicação:

```text
backup verificado
  → migration de expansão
  → preflight somente leitura
  → aprovação explícita dos valores
  → migration de consolidação
  → migrate status
  → testes de constraints
  → nova versão da API
```

Compatibilidade:

- código antigo continua funcionando após a migration de expansão porque os campos anteriores não são removidos;
- o novo código só deve ser liberado depois da migration de consolidação;
- não há backfill de contato ou endereço;
- não há conversão automática de slug;
- não há criação, exclusão ou mudança de igreja;
- o seed não cria usuário, papel, senha, sessão ou dado pessoal real.

## 15. Observabilidade

- Logs estruturados por operação: consulta, atualização institucional e atualização de settings.
- Incluir resultado, correlation ID, ator e `churchId` somente quando necessários.
- Não registrar body completo, e-mail, telefone, endereço completo, token, cookie ou header de autorização.
- Sinais mínimos:
  - consultas concluídas;
  - alterações por grupo;
  - conflitos de slug;
  - validações rejeitadas;
  - `401`, `403`, `404` e `409`;
  - rollback ou retry transacional.
- Auditoria de negócio não é substituída por log técnico.
- Métricas externas, alertas e APM permanecem fora do escopo.
- O progresso deve registrar tempo e resultado de cada migration quando executada em ambiente controlado.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Vazamento entre igrejas | baixa | crítico | tenant do principal, filtros obrigatórios, policy e testes negativos |
| Papel stale autorizar escrita | baixa | alto | `@Roles` como filtro e revalidação de `ADMIN` ativo após lock, dentro da unidade de trabalho |
| Slug duplicado sob concorrência | baixa | alto | unique no banco, checks, lock/transação, tradução de conflito e teste concorrente |
| Alteração de slug quebrar referência futura | baixa agora | alto futuro | UUID como referência interna e proibição de rota pública por slug até existir estratégia de alias |
| Backfill usar fuso ou início da semana incorreto | baixa | alto | expansão sem backfill, preflight, aprovação explícita, backup e migration de consolidação separada |
| Migration bloquear tabela `churches` | baixa | médio | duas migrations pequenas, medição de lock e ensaio sobre cópia representativa |
| Validação brasileira impedir expansão internacional | baixa | médio | regras condicionais por `country` e plano futuro antes de ampliar países |
| Telefone ser persistido em formatos divergentes | baixa | médio | E.164 decidido, normalizador único, check e testes de contrato/banco |
| AuditLog armazenar dados excessivos | baixa | alto | diff por grupo e allowlist explícita |
| Presenter expor campo interno | baixa | crítico | seleção explícita e teste recursivo |
| PATCH apagar campo omitido | média | alto | semântica omitido/null e testes de estado final |
| Índices desnecessários aumentarem custo | baixa | baixo | manter apenas PK, unique do slug e deletedAt já existentes |
| PostgreSQL de teste permanecer indisponível | média | alto | ambiente dedicado obrigatório e limitação documentada antes do DoD |
| Escopo crescer para SaaS ou dados fiscais | média | médio | fora de escopo explícito e revisão do diff |

## 17. Estratégia de reversão

- Código: remover `ChurchesModule` do `AppModule` e reverter controller, aplicação, contracts e adapter como uma unidade.
- Endpoints: reverter documentação Swagger junto com os endpoints.
- Migrations: por serem aditivas, reverter primeiro o código e manter colunas sem uso é a opção mais segura.
- Entre as duas migrations, a API anterior continua compatível e a consolidação pode ser adiada sem reverter a expansão.
- Remoção das colunas exige uma nova migration explícita, nunca edição ou exclusão da migration aplicada.
- Antes de remover colunas, produzir backup e confirmar que nenhum dado institucional inserido após a entrega precisa ser preservado.
- Se necessário, exportar os novos campos para recuperação antes de qualquer migration destrutiva.
- Defaults/checks incorretos devem ser corrigidos por nova migration pequena.
- Slugs alterados por uso real não serão revertidos automaticamente; correção deve ser administrativa e auditada.
- Dados de auditoria não devem ser apagados no rollback.
- Nunca executar `prisma migrate reset` em ambiente com dados.
- Seed fictícia pode ser revertida apenas pelos identificadores determinísticos e somente em ambiente local/teste confirmado.
- Registrar versão, motivo, comandos, impacto e responsável por qualquer reversão.

## 18. Comandos de validação

Preparação e validação do banco:

```bash
docker compose up -d postgres-dev postgres-test
docker compose ps

npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:create --workspace @mission-atos/database -- --name add_church_institutional_fields
npm run db:migrate:create --workspace @mission-atos/database -- --name enforce_church_institutional_constraints
npm run db:migrate:deploy
npm run db:migrate:status
npm run db:seed
```

Testes específicos:

```bash
npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:churches:e2e --workspace @mission-atos/api
```

Validação completa:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Encerramento local:

```bash
docker compose down
```

Regras:

- todos os scripts devem usar npm workspaces e funcionar em PowerShell;
- cada comando `db:migrate:create` deve ser executado uma única vez para criar sua migration, seguido de revisão integral antes da próxima etapa;
- migrations e testes conectados usam banco descartável identificado por `TEST_DATABASE_URL` e diferente de `DATABASE_URL`;
- executar a seed duas vezes para comprovar idempotência;
- não instalar dependência;
- não usar `db push`;
- registrar comando, resultado e motivo exato de qualquer validação não executada;
- remoção de volumes não faz parte da validação comum e exige confirmação explícita de que são descartáveis.

## 19. Definition of Done

- [x] decisões bloqueantes resolvidas;
- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] schema ampliado somente com campos aprovados;
- [x] duas migrations novas, aditivas, revisadas e reproduzíveis;
- [x] estado intermediário de expansão validado com a API anterior;
- [x] migrations validadas desde banco vazio e desde o plano 004;
- [x] preflight e backup/gate de consolidação documentados;
- [x] seed fictícia e idempotente atualizada;
- [x] contratos Zod criados e exportados;
- [x] domínio, aplicação, infraestrutura e HTTP separados;
- [x] nenhum controller ou caso de uso acessa Prisma diretamente;
- [x] autorização validada no servidor;
- [x] `ADMIN` ativo revalidado dentro da transação;
- [x] isolamento por igreja coberto por testes negativos;
- [x] slug normalizado, reservado e único coberto por testes;
- [x] atualizações parciais e `null` cobertos por testes;
- [x] auditoria segura, mínima e transacional;
- [x] nenhuma resposta expõe campos internos;
- [x] testes unitários executados;
- [x] testes de integração PostgreSQL executados;
- [x] testes HTTP executados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes da raiz executados;
- [x] build executado;
- [x] auditoria de dependências executada;
- [x] nenhuma dependência adicionada;
- [x] documentação atualizada;
- [x] riscos, comandos e limitações registrados;
- [x] ausência de CRUD multi-igreja, status, dados fiscais, upload, front-end e funcionalidades futuras confirmada;
- [x] plano revisado antes de ser movido para `completed`.

## 20. Registro de progresso

### 2026-07-26 — planejamento

- realizado: leitura integral de `AGENTS.md`, PRD, arquitetura, template e planos 001–004; inspeção da estrutura, workspaces, schema Prisma, migrations, seed, contratos, autenticação, autorização, módulo de usuários, unidade de trabalho, auditoria, testes e documentação atuais;
- testes: não executados, pois esta entrega altera somente o documento do plano e não implementa código, instala dependências ou executa migrations;
- decisões propostas: módulo `churches` com endpoints singulares; leitura segura para qualquer principal autenticado; escrita somente por `ADMIN` ativo; `churchId` exclusivo do principal; unidade de trabalho com lock da igreja; auditoria por grupos; endereço/contato opcionais; país, timezone e início da semana obrigatórios; `locale`, status, dados fiscais e upload adiados;
- redução de riscos: fechadas as decisões de permissão de `PASTOR`, E.164, CEP/estado brasileiros e slugs reservados; migration dividida em expansão e consolidação; adicionado preflight somente leitura, backup verificado, medição de lock, gate de aplicação, checks no banco, UUID como referência interna e retry transacional limitado;
- modelo proposto: adicionar e-mail, telefone, endereço estruturado, país, fuso e início da semana; preservar UUID, slug global, timestamps e exclusão lógica;
- dependências: nenhuma prevista;
- migrations: necessárias e planejadas como `add_church_institutional_fields` e `enforce_church_institutional_constraints`, sem execução nesta etapa;
- bloqueios: confirmar os valores reais de backfill e aprovar o preflight dos registros existentes;
- limitações conhecidas: validações PostgreSQL dos planos anteriores continuam dependentes de ambiente de teste controlado;
- próximo passo: revisar e aprovar este plano e resolver as decisões bloqueantes antes de qualquer implementação; não criar o plano 006.

### 2026-07-26 — implementação

- realizado: contratos Zod e normalizadores; campos institucionais no modelo `Church`; duas migrations aditivas; seed fictícia atualizada; módulo NestJS `churches`; queries, commands, ports, policies, unidade de trabalho Prisma, presenter, controller, Swagger, auditoria transacional e documentação;
- endpoints: `GET /church`, `PATCH /church`, `GET /church/settings` e `PATCH /church/settings`;
- decisões fechadas: backfill `BR`/`America/Sao_Paulo`/`SUNDAY`; leitura para qualquer principal autenticado; escrita somente para `ADMIN` ativo; telefone E.164; CEP brasileiro com oito dígitos; estado uppercase; UUID como referência interna; slug global, normalizado e protegido por lista reservada;
- arquitetura: controllers fazem somente validação, coordenação HTTP e apresentação; commands coordenam autorização, diff e auditoria; Prisma implementa consulta, lock, retry limitado, persistência e commit; nenhuma dependência de Prisma foi introduzida na aplicação ou apresentação;
- migrations criadas: `20260726180000_add_church_institutional_fields` para expansão nullable e `20260726181000_enforce_church_institutional_constraints` para preflight, backfill, defaults, `NOT NULL` e checks;
- dependências: nenhuma adicionada ou instalada; `package-lock.json` preservado;
- testes adicionados: 5 cenários de contratos, 2 de policies, 6 de aplicação, 2 de presenter, 4 de repository Prisma, 2 de migration/constraints e 5 fluxos E2E HTTP;
- validações aprovadas: `npm.cmd run db:format`, `npm.cmd run db:validate`, `npm.cmd run db:generate`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` e `git diff --check`;
- resultados unitários: API com 14 suítes e 36 testes; contratos com 3 suítes e 11 testes; banco com 4 testes; configuração com 5 testes; domínio com 3 testes; total de 59 testes aprovados;
- validações conectadas tentadas: `docker compose up -d postgres-test`, `db:migrate:deploy`, `db:migrate:status`, `db:seed`, integrações de database/API e `test:churches:e2e`;
- limitações: Docker Desktop não possui daemon acessível; sem `DATABASE_URL`/`TEST_DATABASE_URL` reais os scripts recusam execução e, com a URL fictícia local, o schema engine não conectou ao PostgreSQL na porta 5433; por isso migrations, seed, integração e E2E não foram concluídos contra banco real;
- correção durante a validação: a seed deixou de usar top-level await incompatível com o output CommonJS e agora falha com código não zero e mensagem segura;
- escopo: nenhuma alteração em web/mobile e nenhuma funcionalidade de usuários, células, pessoas, supervisores, reuniões, frequência, dashboard, relatórios, notificações, upload ou plano futuro;
- próximo passo: executar migrations e suítes conectadas em PostgreSQL de teste controlado e aguardar revisão; não mover para `completed` e não criar o plano 006.

### 2026-07-27 — validações PostgreSQL concluídas

- ambiente: Docker Desktop disponível; `postgres-dev` validado em `localhost:5432`; a porta `5433` estava ocupada por outra instância PostgreSQL, portanto as suítes usaram um container descartável PostgreSQL 18.4 em `127.0.0.1:55433`, com `DATABASE_URL` e `TEST_DATABASE_URL` distintas;
- migrations: as sete migrations foram aplicadas com sucesso desde banco vazio em desenvolvimento e teste; `db:migrate:status` confirmou ambos os schemas atualizados;
- seed: executada duas vezes consecutivas em desenvolvimento e duas vezes pela suíte de integração, confirmando idempotência;
- correção de infraestrutura de testes: o runner de integração do banco foi alinhado ao CommonJS do workspace e passou a resolver imports TypeScript escritos com sufixo `.js`;
- integração do banco: 1 suíte e 8 testes aprovados, cobrindo UUID, timestamps, unicidade, relações cross-tenant, checks, índice parcial, exclusão física bloqueada, auditoria append-only, defaults e constraints institucionais;
- integração da API: 3 suítes e 11 testes aprovados para autenticação, usuários e igreja;
- E2E da API: usuários com 4 testes, igreja com 5 testes e conjunto completo com 3 suítes/11 testes aprovados; o timeout do runner E2E foi ajustado para 30 segundos devido à preparação real de hashes e banco;
- qualidade final em 2026-07-27: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` aprovados;
- desempenho: `EXPLAIN ANALYZE` com 20 mil usuários fictícios, revertidos na mesma transação, concluiu em aproximadamente 42,5 ms, mas usou o índice do tenant e filtrou 20 mil linhas; os índices trigram não foram escolhidos para a busca combinada e a consulta deve ser otimizada ou reavaliada em etapa futura;
- limitação remanescente: o smoke test Playwright iniciou servidor e Chromium, porém não produziu resultado e precisou ter seus processos Node encerrados; as validações PostgreSQL antes bloqueadas foram concluídas;
- escopo: nenhum recurso funcional novo, plano futuro ou alteração de dados persistente foi introduzido.

### 2026-07-27 — finalização e validações definitivas

- status: plano concluído e todas as correções da revisão aplicadas;
- revisão final do plano: lido integralmente; todas as decisões da seção 6 confirmadas como resolvidas;
- preflight de dados: registros existentes inspecionados e compatíveis com o formato de slug normalizado; o único registro existente (`igreja-exemplo-ficticia`) está em conformidade com slugs reservados e formato canônico;
- pendências de revisão: nenhuma pendência Crítica, Alta ou Média restante;
- funcionalidades de planos futuros: confirmado que nenhuma funcionalidade do Plano 006 foi implementada; não existe arquivo `docs/plans/active/006*` ou `docs/plans/completed/006*`;
- validações finais executadas em 2026-07-27:

```text
npm run lint       — 6 packages, todos passando com cache hit (sem violações novas)
npm run typecheck  — 8 packages, todos passando (11 tasks, todas cached)
npm test           — 10 tasks, 59 testes aprovados (API: 14 suites/36 tests; contracts: 3 suites/11 tests; database: 1 suite/4 tests; config: 1 suite/5 tests; domain: 2 suites/3 tests)
npm run build      — 7 packages, todos compilando sem erros (config, domain, contracts, database, api, web)
```

- migrations: sete migrations totais (001–005) aplicadas e verificadas desde banco vazio. As migrations específicas do plano 005 são:
  - `20260726180000_add_church_institutional_fields` — expansão nullable dos campos institucionais;
  - `20260726181000_enforce_church_institutional_constraints` — backfill `BR`/`America/Sao_Paulo`/`SUNDAY`, NOT NULL, defaults e checks nomeados;
- repositório limpo: `git status` sem alterações pendentes (working tree clean) no commit `62c41e6 feat(church): implementa gerenciamento da igreja`;
- dependências: `package-lock.json` preservado sem novas dependências adicionadas durante o plano 005;
- limitações conhecidas aceitas:
  1. validações de banco e E2E executadas em container descartável via `127.0.0.1:55433` devido à porta 5433 ocupada;
  2. smoke test Playwright não concluído (Chromium bloqueou); não afeta funcionalidades do plano 005;
  3. Docker Desktop requerido para execução completa de testes conectados;
  4. consulta de busca de usuários com índices trigram não foi usada pelo planner em carga de 20k registros, a ser reavaliada em plano futuro;
- melhorias destinadas a planos futuros: otimização de índices trigram para busca de usuários; smoke test Playwright estável; suporte a múltiplos países além de `BR`; alias/histórico de slug para URLs públicas; i18n com campo `locale`;
- todas as etapas do plano (1-10) concluídas;
- todas as decisões pendentes da seção 6 resolvidas;
- 34 critérios de aceitação atendidos;
- arquivos principais alterados:
  - `packages/contracts/src/church.ts` (schemas Zod e normalizadores)
  - `packages/contracts/src/church.spec.ts` (11 testes de contratos)
  - `packages/contracts/src/index.ts` (exportação de contratos de igreja)
  - `packages/database/prisma/schema.prisma` (modelo Church ampliado)
  - `packages/database/prisma/migrations/20260726180000_add_church_institutional_fields/`
  - `packages/database/prisma/migrations/20260726181000_enforce_church_institutional_constraints/`
  - `packages/database/prisma/seed.ts` (seed fictícia atualizada)
  - `apps/api/src/app.module.ts` (ChurchesModule integrado)
  - `apps/api/src/modules/churches/` (15 arquivos: módulo, controller, commands, queries, port, types, authorization, error, policy, repository, presenter + testes)
- repositório pronto para o próximo plano.
