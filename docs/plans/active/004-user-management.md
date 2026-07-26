# Plano 004 — Gerenciamento administrativo de usuários

**Status:** planejado  
**Responsável:** a definir  
**Criado em:** 2026-07-25  
**Atualizado em:** 2026-07-25  
**PRD relacionado:** RF-003, RF-018, perfis de acesso, segurança e isolamento de dados  
**ADRs relacionadas:** `docs/decisions/003-token-transport.md`; criar ADR apenas se a matriz de administração de papéis exigir decisão transversal  
**Branch ou issue:** a definir

---

## 1. Objetivo

Implementar o gerenciamento administrativo de usuários da igreja na API NestJS, reutilizando a autenticação, autorização e os modelos `User`, `Role` e `UserRole` existentes.

Ao concluir este plano, um administrador autorizado deverá conseguir listar, consultar, criar, atualizar, ativar e desativar usuários da própria igreja, administrar papéis dentro de sua autoridade e redefinir senhas com revogação de sessões. O usuário autenticado deverá conseguir consultar e alterar o próprio perfil e reutilizar o fluxo seguro existente para alterar a própria senha.

O resultado deve ser verificável por contratos Zod, testes unitários, testes de integração com PostgreSQL e testes HTTP, sem expor campos de segurança e sem implementar front-end ou exclusão física.

## 2. Contexto

Os planos concluídos estabeleceram:

- plano 001: monorepo npm workspaces, NestJS, TypeScript estrito e comandos de qualidade;
- plano 002: PostgreSQL, Prisma e os modelos `Church`, `User`, `Role`, `UserRole`, `Session` e `AuditLog`;
- plano 003: login, alteração da própria senha, sessões revogáveis, principal autenticado com `churchId`, guards globais, roles, policies e hash Argon2id.

O PRD atribui ao administrador a gestão de usuários e papéis e exige autorização no servidor, isolamento de dados e auditoria de alterações críticas. A arquitetura reserva um módulo `users`, com controllers finos, casos de uso na aplicação, repositories na infraestrutura e contratos compartilhados.

Limitações herdadas relevantes:

- a nomenclatura oficial dos papéis e a matriz de papéis administráveis ainda não foram aprovadas;
- roles e policies do plano 003 não foram demonstradas de ponta a ponta;
- as suítes conectadas do plano 003 não concluíram por falta de PostgreSQL controlado;
- o schema atual possui unicidade `(churchId, email)`, mas não impõe no banco que o e-mail esteja normalizado;
- `UserStatus` possui somente `ACTIVE` e `BLOCKED`;
- não existe exclusão física na API e ela continuará proibida.

Antes da implementação, consultar integralmente `AGENTS.md`, o `AGENTS.md` da API, PRD, arquitetura, planos 001–003 e este plano.

## 3. Escopo

- Criar o módulo NestJS `users`.
- Listar usuários da igreja autenticada com paginação determinística.
- Buscar por nome e e-mail normalizados.
- Filtrar por `UserStatus` e papel.
- Consultar detalhes de um usuário da própria igreja.
- Criar administrativamente usuários com senha inicial segura.
- Atualizar `firstName`, `lastName` e `email`.
- Ativar e desativar usuários.
- Substituir atomicamente o conjunto de papéis administráveis de um usuário.
- Atribuir e remover papéis sem cruzar igrejas.
- Redefinir administrativamente senha e revogar sessões existentes.
- Consultar e alterar o próprio perfil.
- Reutilizar o fluxo seguro existente para alteração da própria senha.
- Normalizar e-mail antes da consulta, validação de unicidade e persistência.
- Proteger endpoints por autenticação, role e policy de recurso.
- Derivar `churchId` exclusivamente do principal autenticado.
- Registrar auditoria transacional de criação, atualização, status, papéis e reset de senha.
- Criar ou ajustar migration somente para invariantes de e-mail que o banco ainda não garante.
- Criar contratos, presenters, tratamento de erros e testes.
- Atualizar somente a documentação necessária ao módulo.

## 4. Fora de escopo

- Gerenciamento completo de `Church`.
- Organizações comerciais ou usuário pertencente a múltiplas igrejas.
- Supervisores, estrutura hierárquica, pessoas, membros, células, encontros, frequência, visitantes e relatórios.
- Dashboard, notificações e envio de e-mails.
- Convites por e-mail.
- Recuperação pública de senha.
- Front-end ou alterações em `apps/web`.
- Criação de aplicativo mobile.
- Exclusão física de usuários, papéis ou vínculos.
- CRUD completo de papéis ou editor de permissões.
- Sessões administrativas, impersonação ou login como outro usuário.
- Deploy e configuração de produção.
- Correções gerais do plano 003 que não sejam necessárias para proteger os endpoints deste plano.
- Plano 005.

## 5. Suposições

- O MVP continua atendendo uma única igreja configurada, mas toda operação usa o `churchId` do principal para preservar isolamento estrutural.
- O e-mail de login é único por igreja, persistido em minúsculas e sem espaços externos.
- `ACTIVE` representa usuário habilitado e `BLOCKED` representa usuário desativado.
- A listagem usa paginação por página, adequada ao volume administrativo inicial.
- `User`, `Role` e `UserRole` continuam sujeitos a exclusão lógica.
- Papéis removidos são inativados por `deletedAt`; papéis reatribuídos reativam o vínculo existente quando possível, evitando conflito com a unicidade atual.
- O reset administrativo não envia e-mail neste plano.
- Nenhuma nova dependência é necessária; Zod, Prisma, Argon2id, Jest e Supertest existentes são suficientes.
- Testes conectados exigem `TEST_DATABASE_URL` dedicado, com migrations aplicadas e diferente de `DATABASE_URL`.

## 6. Perguntas e decisões pendentes

- [ ] Confirmar a nomenclatura canônica dos papéis do MVP: administrador, pastor/coordenador, supervisor e líder.
- [ ] Aprovar qual papel ou capability identifica um administrador de usuários; não codificar a string `ADMIN` por suposição.
- [ ] Definir a matriz de papéis administráveis: quais papéis cada papel administrativo pode atribuir e remover.
- [ ] Definir quais papéis contam como “papel administrativo” para a regra do último administrador.
- [ ] Decidir se pastor/coordenador pode administrar usuários ou apenas consultar.
- [ ] Decidir o reset de senha: senha definida pelo administrador ou senha temporária gerada pelo servidor.
- [ ] Se houver senha temporária, definir canal seguro de entrega; retorno em JSON e envio por e-mail permanecem proibidos até decisão explícita.
- [ ] Decidir se o reset exigirá troca no próximo login. Se sim, aprovar novo estado/campo persistente e o comportamento restrito do token até a troca.
- [ ] Confirmar se o usuário pode alterar o próprio e-mail ou somente nome; por segurança, o plano assume inicialmente nome próprio editável e e-mail somente por administrador.
- [ ] Definir se a resposta de e-mail duplicado pode ser explícita no contexto administrativo autenticado; proposta: `USER_EMAIL_CONFLICT`, sem revelar dados do usuário existente.
- [ ] Confirmar limites de paginação propostos: `page` padrão 1 e `pageSize` padrão 20, máximo 100.

Decisões bloqueantes para implementar papéis e reset de senha devem ser resolvidas e registradas antes dessas etapas. Não implementar hipótese relevante.

## 7. Áreas afetadas

### Aplicação web

- Nenhuma alteração.

### API

- Novo `apps/api/src/modules/users/users.module.ts`.
- `presentation/users.controller.ts` para endpoints administrativos.
- `presentation/me.controller.ts` para perfil próprio.
- `presentation/presenters/user.presenter.ts` para respostas sem dados sensíveis.
- `application/use-cases/` com um caso de uso por operação.
- `application/ports/user-management.repository.ts`.
- `application/ports/password-administration.ts`, reutilizando o hasher e a revogação já existentes sem expor hashes.
- `domain/` somente para invariantes específicas do módulo que não pertençam a `packages/domain`.
- `infrastructure/prisma/prisma-user-management.repository.ts`.
- Policies de administração, tenant, papéis gerenciáveis e último administrador.
- Integração do `UsersModule` ao `AppModule`.
- Reutilização de `CurrentPrincipal`, guards globais e tratamento de erro existente, corrigindo apenas lacunas necessárias ao módulo.

Estrutura proposta:

```text
apps/api/src/modules/users/
├── application/
│   ├── ports/
│   └── use-cases/
├── domain/
├── infrastructure/
│   └── prisma/
├── presentation/
│   ├── presenters/
│   └── users.controller.ts
├── me.controller.ts
└── users.module.ts
```

### Banco de dados

- Reutilizar `User`, `Role`, `UserRole`, `Session` e `AuditLog`.
- Avaliar migration `normalize_user_emails` para:
  - detectar previamente colisões por `lower(trim(email))`;
  - interromper com diagnóstico seguro quando houver colisões;
  - normalizar registros existentes quando não houver conflito;
  - adicionar `CHECK (email = lower(btrim(email)))`;
  - preservar a constraint única `(church_id, email)`.
- Se a decisão de troca obrigatória for aprovada, criar migration separada e aditiva para o estado necessário.
- Não alterar migrations concluídas.
- Não alterar seed para incluir credenciais conhecidas ou usuário administrável.

### Contratos compartilhados

- Adicionar schemas Zod em `packages/contracts/src/users.ts`.
- Separar schemas de:
  - query da listagem;
  - criação;
  - atualização administrativa;
  - alteração de status;
  - substituição de papéis;
  - reset administrativo;
  - atualização do próprio perfil;
  - identificador de rota;
  - respostas de item e coleção.
- Exportar somente contratos HTTP; tipos Prisma e `passwordHash` não entram no pacote.

### Infraestrutura

- Nenhum serviço externo ou nova dependência.
- Reutilizar PostgreSQL de teste e scripts npm existentes.
- Adicionar scripts específicos apenas se necessários para distinguir integração/E2E do módulo.

### Documentação

- Atualizar README com endpoints, permissões, paginação, filtros e procedimento local de testes.
- Registrar decisão de papéis em ADR somente se ela afetar outros módulos.
- Atualizar o progresso deste plano durante a implementação.

## 8. Modelo e regras de negócio

### Entidades e estados

- `User`: identidade administrativa, sempre vinculada a uma igreja.
- `Role`: papel pertencente à mesma igreja do usuário.
- `UserRole`: vínculo lógico entre usuário e papel da mesma igreja.
- `Session`: sessões revogadas em reset de senha e desativação.
- `AuditLog`: trilha imutável das operações administrativas.
- `UserStatus`: somente `ACTIVE` e `BLOCKED`.

### Invariantes

1. Toda leitura e escrita recebe `churchId` do principal autenticado.
2. Nenhum DTO administrativo aceita `churchId`.
3. IDs de usuário e papel sempre são combinados com `churchId` no repository.
4. Usuário com `deletedAt` não aparece nem pode ser administrado pela operação comum.
5. E-mail é `trim().toLowerCase()` antes de uso e permanece único por igreja.
6. Criação persiste apenas hash Argon2id; senha pura existe somente durante a requisição.
7. Respostas nunca incluem `passwordHash`, token, hash de sessão, pepper ou objeto Prisma.
8. Alteração de status aceita somente `ACTIVE` ou `BLOCKED`.
9. Desativar usuário revoga todas as sessões ativas na mesma transação.
10. Reset de senha troca o hash e revoga todas as sessões na mesma transação.
11. Atribuição de papéis valida existência, `deletedAt`, igreja e autoridade do ator.
12. Substituição de papéis calcula diferenças no servidor; não confia em papel informado pelo cliente além dos IDs solicitados.
13. O último administrador ativo não pode ser desativado.
14. Uma alteração de papéis não pode deixar a igreja sem administrador ativo.
15. As regras de último administrador devem usar transação com isolamento serializável ou locking equivalente e retry limitado para impedir corrida.
16. Remover o próprio último papel administrativo é proibido quando isso deixa a igreja sem outro administrador ativo.
17. Exclusão física não possui endpoint, caso de uso ou método de repository.
18. Criação, atualização, status, papéis e reset geram `AuditLog` na mesma transação da mudança.
19. Auditoria registra ator, igreja, entidade, ação, campos permitidos antes/depois e data; nunca senha, hash ou token.
20. Atualização do próprio perfil não permite mudar status, igreja ou papéis.

### Paginação, busca e filtros

- `page`: inteiro a partir de 1, padrão 1.
- `pageSize`: inteiro de 1 a 100, padrão 20.
- Ordenação fixa: `lastName ASC`, `firstName ASC`, `id ASC`.
- `search`: trim, máximo definido no contrato; busca case-insensitive em nome completo e e-mail.
- `status`: enum `ACTIVE | BLOCKED`.
- `roleId`: UUID; o papel deve pertencer à igreja autenticada.
- Filtros são combinados por `AND`.
- Resposta inclui `page`, `pageSize`, `totalItems` e `totalPages`.
- Nenhum parâmetro permite ordenar por campo arbitrário nesta etapa.

### Auditoria

| Operação | Ação |
| --- | --- |
| Criar usuário | `USER_CREATED` |
| Atualizar usuário | `USER_UPDATED` |
| Ativar | `USER_ACTIVATED` |
| Desativar | `USER_DEACTIVATED` |
| Atribuir papel | `USER_ROLE_ASSIGNED` |
| Remover papel | `USER_ROLE_REMOVED` |
| Reset de senha | `USER_PASSWORD_RESET` |

Alteração da própria senha continua usando a auditoria segura do plano 003. Atualização do próprio perfil deve gerar `USER_PROFILE_UPDATED`.

## 9. Contratos

### Entradas

- `GET /users`
  - query: `page`, `pageSize`, `search?`, `status?`, `roleId?`;
  - `churchId` não é aceito.
- `GET /users/:id`
  - `id` UUID.
- `POST /users`
  - `{ firstName, lastName, email, initialPassword, roleIds }`;
  - a forma final de `initialPassword` depende da decisão de reset/entrega.
- `PATCH /users/:id`
  - `{ firstName?, lastName?, email? }`, ao menos um campo.
- `PATCH /users/:id/status`
  - `{ status: "ACTIVE" | "BLOCKED" }`.
- `PUT /users/:id/roles`
  - `{ roleIds: UUID[] }`, sem duplicatas;
  - sem `churchId`, nomes de role ou permissões enviadas pelo cliente.
- `POST /users/:id/reset-password`
  - contrato final depende da estratégia aprovada;
  - proposta sem geração: `{ newPassword }`, validada pela política existente.
- `GET /users/me`
  - sem entrada além do principal.
- `PATCH /users/me`
  - proposta inicial: `{ firstName?, lastName? }`.
- Alteração da própria senha:
  - reutilizar o caso de uso existente;
  - manter `POST /auth/change-password` como caminho canônico para evitar endpoint duplicado;
  - avaliar alias `PATCH /users/me/password` somente se houver estratégia documentada de compatibilidade.

### Saídas

- Envelope de item:

```json
{
  "data": {
    "id": "uuid",
    "firstName": "Nome",
    "lastName": "Sobrenome",
    "email": "usuario@example.com",
    "status": "ACTIVE",
    "roles": [{ "id": "uuid", "name": "papel" }],
    "createdAt": "date-time",
    "updatedAt": "date-time"
  },
  "meta": {}
}
```

- Envelope de coleção:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

- Criação retorna `201`.
- Atualizações podem retornar item atualizado com `200`.
- Operações sem representação retornam `204` de forma consistente.
- Presenter usa seleção explícita; nunca serializa diretamente um modelo Prisma.

### Erros esperados

- `400 VALIDATION_ERROR`: DTO, filtro, status ou transição inválida.
- `401 AUTH_UNAUTHENTICATED`: principal ausente ou token inválido.
- `403 AUTH_FORBIDDEN`: papel/policy insuficiente, papel não gerenciável ou tentativa entre igrejas.
- `404 USER_NOT_FOUND`: usuário não existe no tenant ou pertence a outra igreja; resposta idêntica nos dois casos.
- `404 ROLE_NOT_FOUND`: papel não existe no tenant ou pertence a outra igreja.
- `409 USER_EMAIL_CONFLICT`: e-mail normalizado já utilizado na mesma igreja.
- `409 LAST_ACTIVE_ADMIN`: operação deixaria a igreja sem administrador ativo.
- `409 USER_ROLE_CONFLICT`: conjunto de papéis viola a matriz aprovada.
- Erros de banco e segurança não expõem SQL, constraint, stack, hash ou tenant externo.

### Permissões

- Todos os endpoints são privados.
- Endpoints administrativos exigem capability/papel aprovado para gestão de usuários e policy de mesma igreja.
- `GET /users/me`, `PATCH /users/me` e alteração da própria senha exigem apenas principal válido e operam exclusivamente sobre `principal.userId` e `principal.churchId`.
- O ator não informa identidade ou igreja no corpo.
- Roles do JWT oferecem autorização grosseira; o caso de uso consulta estado atual quando a decisão depende de status, papéis ou contagem de administradores.
- A policy `ManageUserPolicy` valida tenant e autoridade administrativa.
- A policy `ManageRolePolicy` valida a matriz aprovada, papel alvo e igreja.
- A policy `PreserveLastAdministratorPolicy` é aplicada dentro da transação, não somente no guard.
- Controllers não tomam decisões de negócio.

## 10. Etapas

### Etapa 1 — Resolver decisões bloqueantes

- [ ] aprovar nomes e matriz de papéis;
- [ ] aprovar estratégia de reset e troca obrigatória;
- [ ] confirmar edição do próprio e-mail e paginação;
- [ ] registrar ADR quando necessário;
- [ ] atualizar este plano antes de código.

### Etapa 2 — Contratos e regras puras

- [ ] criar schemas Zod e tipos HTTP;
- [ ] criar tipos de paginação e erros;
- [ ] implementar normalização de e-mail e policies puras;
- [ ] testar schemas, matriz e último administrador;
- [ ] garantir ausência de `churchId` e campos sensíveis nos DTOs.

### Etapa 3 — Preparar invariantes do banco

- [ ] auditar colisões de e-mail normalizado;
- [ ] criar migration aditiva de normalização/check, se necessária;
- [ ] não alterar migrations anteriores;
- [ ] validar migration em banco vazio e snapshot do plano 003;
- [ ] documentar rollback sem perda de dados.

### Etapa 4 — Repository de consulta

- [ ] implementar listagem paginada, busca e filtros;
- [ ] implementar detalhe e perfil próprio;
- [ ] selecionar somente campos públicos;
- [ ] filtrar sempre por `churchId` e `deletedAt: null`;
- [ ] testar isolamento e paginação em PostgreSQL.

### Etapa 5 — Criação e atualização

- [ ] implementar criação com e-mail normalizado e hash seguro;
- [ ] implementar atualização administrativa;
- [ ] implementar atualização do próprio perfil;
- [ ] tratar conflito de e-mail sem revelar outro usuário;
- [ ] registrar auditoria transacional;
- [ ] criar testes unitários e de integração.

### Etapa 6 — Status e último administrador

- [ ] implementar ativação e desativação idempotentes;
- [ ] revogar sessões ao desativar;
- [ ] proteger último administrador com concorrência;
- [ ] registrar auditoria;
- [ ] testar transação, corrida e rollback.

### Etapa 7 — Papéis

- [ ] validar papéis por igreja e matriz gerenciável;
- [ ] substituir conjunto de papéis atomicamente;
- [ ] aplicar exclusão lógica/reativação em `UserRole`;
- [ ] impedir remoção do último administrador;
- [ ] registrar uma auditoria por diferença relevante;
- [ ] testar autorizações positivas e negativas.

### Etapa 8 — Reset e senha própria

- [ ] implementar estratégia administrativa aprovada;
- [ ] reutilizar Argon2id sem expor `passwordHash` à apresentação;
- [ ] trocar hash e revogar sessões atomicamente;
- [ ] implementar troca obrigatória somente se aprovada;
- [ ] reutilizar o caso de alteração da própria senha;
- [ ] testar revogação, auditoria e ausência de dados sensíveis.

### Etapa 9 — Controllers, presenters e proteção

- [ ] criar endpoints e documentação Swagger;
- [ ] aplicar roles e policies;
- [ ] mapear erros para o envelope arquitetural;
- [ ] demonstrar guards e policies de ponta a ponta;
- [ ] testar todos os endpoints com Supertest;
- [ ] confirmar inexistência de endpoint `DELETE`.

### Etapa 10 — Validação e documentação

- [ ] executar migrations e testes conectados;
- [ ] executar lint, typecheck, testes e build;
- [ ] atualizar README e progresso;
- [ ] revisar dependências sem adicionar pacotes;
- [ ] revisar segurança e escopo;
- [ ] registrar limitações reais.

## 11. Critérios de aceitação

1. Toda consulta e mutação usa `churchId` e `userId` derivados do principal quando aplicável.
2. Um usuário de outra igreja recebe `404` ou `403` conforme o contrato, sem confirmação de existência.
3. Listagem pagina de forma determinística e retorna metadados corretos.
4. Busca encontra nome e e-mail sem diferenciar caixa após normalização.
5. Filtros por status e papel podem ser combinados e nunca cruzam tenant.
6. Criação persiste e-mail normalizado, hash Argon2id e papéis válidos da mesma igreja.
7. Duas representações equivalentes do mesmo e-mail não podem coexistir na mesma igreja.
8. Nenhuma resposta contém `passwordHash`, refresh token, token hash, segredo ou objeto Prisma.
9. Atualização administrativa não modifica igreja, status, papéis ou senha pelo endpoint genérico.
10. Perfil próprio só altera campos aprovados do usuário autenticado.
11. Status aceita somente estados do domínio.
12. Desativação revoga sessões e gera auditoria na mesma transação.
13. O último administrador ativo não pode ser desativado, inclusive sob requisições concorrentes.
14. O conjunto de papéis é substituído atomicamente e somente com papéis gerenciáveis da mesma igreja.
15. Nenhuma operação pode deixar a igreja sem administrador ativo.
16. O usuário não remove o próprio último papel administrativo quando isso deixa a igreja sem administrador.
17. Reset administrativo gera hash seguro, revoga sessões e nunca retorna senha ou hash.
18. A troca obrigatória ocorre no próximo login somente se a estratégia for aprovada e testada.
19. Criação, atualização, status, papéis e reset geram auditoria sem campos sensíveis.
20. Todos os endpoints administrativos retornam `401` sem autenticação e `403` sem permissão.
21. Roles e policies são avaliadas no servidor; IDs ou papéis enviados pelo cliente não concedem autoridade.
22. Não existe endpoint, caso de uso ou repository para exclusão física.
23. Não há alteração de front-end, envio de e-mail, recuperação pública ou módulo funcional fora do escopo.
24. Testes unitários, integração e HTTP passam em Windows via npm workspaces.
25. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz.

## 12. Estratégia de testes

### Unitários

- Schemas Zod: normalização, limites, UUIDs, enums, arrays sem duplicatas e rejeição de campos extras.
- Casos de uso: sucesso e cada erro esperado.
- Policies: tenant, autoridade administrativa, matriz de papéis e negação por padrão.
- Último administrador: desativação, remoção própria, remoção por terceiro e existência de substituto ativo.
- Presenter: seleção explícita e ausência de campos sensíveis.
- Normalização e conflito de e-mail.
- Reset: hash, revogação e auditoria.
- Perfil próprio e reutilização da alteração de senha.

### Integração

- PostgreSQL real dedicado a testes, com migrations do zero.
- Repository de listagem: paginação, ordenação, busca e filtros combinados.
- Todas as consultas negativas entre duas igrejas.
- Constraint de e-mail normalizado e tradução de conflito.
- Transações de criação, status, papéis, reset e auditoria.
- Soft delete e reativação de `UserRole`.
- Concorrência na proteção do último administrador.
- Papéis de outra igreja e papéis excluídos.
- Revogação de todas as sessões após desativação e reset.
- Falha intermediária não deixa dados ou auditoria parciais.

### E2E

- Supertest contra NestJS com cookie/JWT fictícios e PostgreSQL isolado.
- Cobrir todos os endpoints finais.
- `401`, `403`, `404`, `409` e envelopes.
- Listagem paginada e filtros.
- Fluxo criar, consultar, atualizar, alterar status e papéis.
- Perfil próprio.
- Último administrador.
- E-mail duplicado normalizado.
- Reset e invalidação das sessões.
- Ausência de campos sensíveis por inspeção recursiva do JSON.
- Não criar testes Playwright, pois não há front-end.

### Validação manual

- Inspecionar Swagger sem exemplos de senha, token ou hash.
- Inspecionar SQL e plano de execução da listagem/filtros.
- Confirmar que nenhum DTO aceita `churchId`.
- Confirmar que não existe rota `DELETE /users`.
- Confirmar que logs e auditoria não contêm senha, hash, token ou e-mail desnecessário.
- Executar comandos em PowerShell e registrar resultados.

## 13. Segurança e privacidade

- Autorização: guards para coarse-grained access e policies/casos de uso para recurso e estado atual.
- Isolamento: `churchId` vem do principal e integra toda chave/consulta relevante.
- Credenciais: senha pura não é persistida, retornada, auditada ou registrada.
- Respostas: presenter com allowlist de campos.
- Enumeração: usuário de outro tenant é indistinguível de ausente.
- Mass assignment: DTOs estritos e mapeamento campo a campo.
- Concorrência: último administrador protegido dentro da transação.
- Sessões: desativação e reset revogam sessões; Access Tokens existentes mantêm a limitação de TTL curto registrada no plano 003.
- Logs: IDs técnicos e ações, sem senha, hash, token, cookie ou payload completo.
- Auditoria: antes/depois minimizados; mudança de senha registra apenas fato e revogação.
- LGPD: listagem limitada ao tenant, paginação e mínima exposição de dados pessoais.
- Exportações: inexistentes neste plano.

## 14. Migração de dados

- Não modificar migrations aplicadas.
- Fazer preflight de colisões por `lower(trim(email))`.
- Se houver colisão, bloquear migration e produzir relatório operacional sem escolher automaticamente qual conta preservar.
- Sem colisões, normalizar e-mails e adicionar check de persistência normalizada em nova migration.
- Validar a migration em banco vazio e cópia compatível com o plano 003.
- Não criar usuário, senha ou papel no seed.
- Campo de troca obrigatória exige migration separada, somente após decisão aprovada.
- Deploy futuro aplica migration antes do código que depende da nova invariant.

## 15. Observabilidade

- Logs estruturados: operação, resultado, correlation ID, ator, usuário alvo e igreja quando estritamente necessários.
- Nunca registrar DTO completo, e-mail bruto, senha, hash, tokens ou cookies.
- Métricas: listagens, criações, conflitos de e-mail, mudanças de status, mudanças de papel, resets, `401`, `403`, `404` e `409`.
- Sinalizar tentativas entre tenants e bloqueios de último administrador sem expor o tenant alvo.
- Alertas e plataforma externa permanecem fora do escopo; documentar sinais para infraestrutura futura.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |
| Matriz de papéis ambígua | Alta | Alto | Resolver decisão antes de implementar atribuição |
| Último administrador removido por corrida | Média | Crítico | Transação serializável/locking e teste concorrente |
| Vazamento entre igrejas | Baixa | Crítico | Tenant do principal, filtros compostos e testes negativos |
| E-mail equivalente duplicado | Média | Alto | Normalização, preflight, check e unique no banco |
| Reset expor senha temporária | Média | Alto | Aprovar canal; nunca retornar ou registrar segredo |
| Sessões permanecerem após desativação/reset | Média | Alto | Revogação transacional e testes conectados |
| Roles stale no JWT | Média | Médio | Estado crítico consultado no caso de uso e TTL curto |
| Presenter vazar `passwordHash` | Baixa | Crítico | Select/allowlist explícita e teste recursivo |
| Migration encontrar e-mails conflitantes | Média | Alto | Preflight e bloqueio sem merge automático |
| PostgreSQL de teste indisponível | Média | Alto | Ambiente descartável obrigatório antes do DoD |
| Escopo crescer para CRUD de papéis | Média | Médio | Limitar a atribuição de papéis existentes |
| Auditoria armazenar dado sensível | Baixa | Alto | Payload mínimo e testes de conteúdo |

## 17. Estratégia de reversão

- Código: remover `UsersModule` do `AppModule` e restaurar a versão anterior da API.
- Endpoints: reverter controllers e contratos juntos para não deixar contratos sem implementação.
- Migration de e-mail: reverter primeiro o código; não desfazer normalização automaticamente. Remover check/índice exige nova migration explícita após backup e análise.
- Campo de troca obrigatória: manter coluna aditiva sem uso ao reverter código; remoção posterior exige nova migration.
- Dados criados durante uso não devem ser apagados no rollback.
- Papéis e status alterados exigem correção administrativa auditada, não rollback destrutivo automático.
- Nunca editar migration aplicada, apagar diretório de migration ou executar `prisma migrate reset` em ambiente com dados.
- Registrar versão, motivo, comandos e impacto da reversão.

## 18. Comandos de validação

```bash
npm ci

npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate:create --workspace @mission-atos/database -- --name normalize_user_emails
npm run db:migrate:deploy
npm run db:migrate:status

npm run test --workspace @mission-atos/contracts
npm run test --workspace @mission-atos/domain
npm run test --workspace @mission-atos/api
npm run test:integration --workspace @mission-atos/database
npm run test:integration --workspace @mission-atos/api
npm run test:users:e2e --workspace @mission-atos/api

npm run lint
npm run typecheck
npm test
npm run build

npm audit
```

Regras:

- todos os scripts novos devem funcionar com npm workspaces e PowerShell;
- nenhuma referência ou artefato de outro gerenciador;
- criar migration somente se a etapa de dados for aprovada;
- executar integração apenas com `TEST_DATABASE_URL` explicitamente dedicado;
- registrar resultado e justificativa de comando não executado;
- não executar seed como requisito do módulo;
- não instalar dependência nova sem revisão e alteração explícita do plano.

## 19. Definition of Done

- [ ] decisões bloqueantes resolvidas;
- [ ] escopo implementado;
- [ ] critérios de aceitação atendidos;
- [ ] autorização validada no servidor;
- [ ] isolamento por igreja comprovado por testes negativos;
- [ ] último administrador protegido, inclusive sob concorrência;
- [ ] e-mail normalizado e unicidade comprovada;
- [ ] sessões revogadas após desativação e reset;
- [ ] auditoria segura e transacional;
- [ ] nenhuma exclusão física implementada;
- [ ] nenhuma resposta expõe campos sensíveis;
- [ ] testes unitários criados ou atualizados;
- [ ] testes de integração executados em PostgreSQL isolado;
- [ ] testes HTTP executados;
- [ ] lint executado;
- [ ] typecheck executado;
- [ ] testes executados;
- [ ] build executado;
- [ ] auditoria de dependências revisada;
- [ ] documentação atualizada;
- [ ] riscos e limitações informados;
- [ ] ausência de front-end e módulos fora do escopo confirmada;
- [ ] plano movido para `completed`.

## 20. Registro de progresso

### 2026-07-25

- realizado: leitura da documentação obrigatória, dos planos concluídos e da implementação atual; criado o plano de gerenciamento administrativo de usuários;
- testes: não executados, pois esta etapa altera somente documentação;
- decisões: módulo `users`; paginação por página; ordenação determinística; e-mail normalizado; presenter com allowlist; operações transacionais; desativação e reset revogam sessões; alteração da própria senha reutiliza o fluxo existente; nenhuma dependência nova;
- bloqueios: catálogo e matriz de papéis, definição de administrador, estratégia de reset, eventual troca obrigatória e edição do próprio e-mail;
- próximo passo: revisar e aprovar este plano e resolver as decisões bloqueantes antes de qualquer implementação.
