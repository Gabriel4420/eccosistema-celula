# Arquitetura — Gestão de Células

**Status:** proposta inicial  
**Escopo:** MVP para uma igreja local  
**Estilo:** monólito modular com web responsiva e API

---

## 1. Objetivo

Definir uma arquitetura simples, testável e econômica para o MVP, sem impedir evolução futura.

A solução deve atender dois contextos principais:

- administração e relatórios em computador;
- frequência e relatório do encontro em celular.

Para reduzir custo e manutenção, o MVP utilizará uma aplicação web responsiva e instalável como PWA. Um aplicativo nativo não faz parte da arquitetura inicial.

---

## 2. Direcionadores

- equipe pequena ou desenvolvimento individual;
- baixo custo de infraestrutura;
- escopo para uma igreja;
- uso frequente pelo celular;
- segurança por papel e hierarquia;
- preservação de histórico;
- facilidade de implantação;
- capacidade de evoluir sem reescrever o produto;
- ausência de necessidade real de microsserviços.

---

## 3. Visão de contexto

```text
Líder ───────────────┐
Supervisor ──────────┼──> Aplicação web/PWA ───> API ───> PostgreSQL
Pastor ──────────────┤                              │
Administrador ───────┘                              ├──> E-mail
                                                    └──> Armazenamento/backup
```

A interface web nunca acessa diretamente o banco.

---

## 4. Componentes

### 4.1 Aplicação web

Responsabilidades:

- autenticação visual;
- dashboard;
- administração;
- cadastros;
- fluxo mobile de encontro e frequência;
- relatórios;
- exportações solicitadas à API;
- estados de carregamento e erro;
- instalação como PWA.

Tecnologias previstas:

- Next.js;
- App Router;
- TypeScript;
- componentes acessíveis;
- formulários validados com Zod;
- cliente de API tipado.

### 4.2 API

Responsabilidades:

- autenticação;
- autorização;
- regras de negócio;
- validação final;
- persistência;
- auditoria;
- geração de indicadores;
- exportações;
- envio de e-mails transacionais;
- documentação OpenAPI.

Tecnologias previstas:

- NestJS;
- TypeScript;
- Prisma;
- PostgreSQL;
- Jest.

### 4.3 Banco de dados

Responsabilidades:

- persistência transacional;
- relacionamentos;
- unicidade;
- histórico;
- exclusão lógica;
- índices;
- agregações para relatórios.

### 4.4 Serviços externos

Inicialmente:

- envio de e-mail para recuperação de senha;
- hospedagem;
- banco gerenciado ou PostgreSQL próprio;
- monitoramento de erros;
- backups.

Integrações adicionais exigem plano ou ADR.

---

## 5. Monorepo proposto

```text
apps/
  web/
  api/

packages/
  contracts/
  domain/
  database/
  config/
  eslint-config/
  typescript-config/
```

### Responsabilidades dos pacotes

#### `packages/contracts`

- DTOs compartilhados;
- schemas Zod;
- enums de transporte;
- tipos de resposta;
- contrato de erros.

Não deve conter dependência de framework visual.

#### `packages/domain`

- regras puras;
- value objects;
- cálculos de frequência;
- políticas sem dependência de banco;
- tipos de domínio.

#### `packages/database`

- schema Prisma;
- client;
- migrations;
- seeds fictícios;
- utilitários de teste do banco.

#### `packages/config`

- validação de variáveis de ambiente;
- configurações compartilhadas não secretas.

---

## 6. Módulos da API

### Identity

- login;
- logout;
- recuperação de senha;
- sessão;
- bloqueio;
- políticas de senha.

### Users

- usuários;
- papéis;
- vínculos;
- status.

### Structure

- supervisores;
- escopos hierárquicos;
- atribuições.

### Cells

- células;
- liderança;
- status;
- capacidade;
- agenda padrão.

### People

- cadastro central;
- busca de duplicidade;
- participantes;
- visitantes;
- contatos.

### Memberships

- vínculo com célula;
- transferência;
- histórico;
- vínculo principal.

### Meetings

- criação;
- cancelamento;
- validação de duplicidade;
- agenda.

### Attendance

- presentes;
- ausentes;
- justificados;
- visitantes presentes;
- cálculo de frequência.

### Reports

- rascunho;
- envio;
- devolução;
- pendências;
- campos sensíveis.

### Dashboard

- indicadores;
- filtros;
- agregações.

### Exports

- CSV;
- autorização;
- registro de auditoria.

### Audit

- ações administrativas;
- alterações críticas;
- origem e usuário.

---

## 7. Camadas da API

Cada módulo deve separar, quando fizer sentido:

```text
presentation/
  controllers
  dto

application/
  use-cases
  ports

domain/
  entities
  policies
  errors

infrastructure/
  prisma
  repositories
  external-services
```

Não é necessário criar pastas vazias apenas para seguir um desenho. A separação deve acompanhar a complexidade real do módulo.

---

## 8. Fluxo de uma operação

Exemplo: envio de frequência.

```text
Web/PWA
  │
  ├── validação de experiência
  │
  ▼
Controller
  │
  ├── autentica
  ├── valida contrato
  ▼
Use case
  │
  ├── verifica acesso à célula
  ├── verifica estado do encontro
  ├── aplica regras
  ▼
Repository
  │
  ├── transação
  ├── persistência
  └── auditoria
  ▼
Resposta tipada
```

A validação do frontend melhora a experiência, mas não substitui a validação da API.

---

## 9. Autenticação

Proposta inicial:

- e-mail e senha;
- senha com hash forte;
- access token de curta duração;
- refresh token rotativo ou sessão segura em cookie;
- recuperação por token temporário;
- bloqueio de usuário;
- revogação de sessão;
- limitação de tentativas.

A escolha entre cookies e tokens armazenados pelo cliente deve ser registrada em ADR antes da implementação.

---

## 10. Autorização

A autorização combina:

1. papel;
2. igreja;
3. escopo hierárquico;
4. vínculo com a célula;
5. sensibilidade do dado.

Exemplos:

- administrador acessa toda a igreja;
- pastor acessa indicadores gerais;
- supervisor acessa células atribuídas;
- líder acessa apenas a própria célula;
- observações pastorais podem exigir permissão adicional.

A API deve resolver o escopo. Filtros no frontend não são controle de segurança.

---

## 11. Preparação para evolução

Mesmo atendendo uma igreja, registros centrais devem utilizar `churchId` quando isso não aumentar significativamente a complexidade.

Isso permite:

- separar dados corretamente;
- reduzir retrabalho;
- preparar uma possível evolução multi-igreja.

Não devem ser implementados no MVP:

- painel de superadministrador;
- planos;
- cobrança;
- customização avançada por igreja;
- isolamento comercial completo.

---

## 12. Modelo de dados inicial

Entidades previstas:

```text
Church
User
Role
UserRole
SupervisorAssignment
Cell
CellLeadership
Person
CellMembership
Meeting
MeetingAttendance
MeetingReport
AuditLog
PasswordResetToken
Session
```

Regras estruturais:

- UUID como identificador;
- timestamps de criação e atualização;
- `deletedAt` quando houver exclusão lógica;
- índices em chaves estrangeiras e filtros frequentes;
- unicidade de código de célula dentro da igreja;
- unicidade de presença por encontro e pessoa;
- unicidade de relatório por encontro;
- histórico de vínculo com datas de início e fim.

O schema final deve ser planejado em documento próprio antes da primeira migration.

---

## 13. Contratos da API

Padrão inicial:

```json
{
  "data": {},
  "meta": {}
}
```

Erro:

```json
{
  "error": {
    "code": "CELL_ACCESS_DENIED",
    "message": "Você não possui acesso a esta célula.",
    "details": {}
  }
}
```

Diretrizes:

- códigos de erro estáveis;
- mensagens claras;
- detalhes técnicos não expostos;
- paginação consistente;
- filtros explícitos;
- documentação OpenAPI;
- schemas compartilhados quando apropriado.

---

## 14. Idempotência

Mesmo sem sincronização offline avançada, operações suscetíveis a repetição devem considerar idempotência.

Prioridades:

- envio de relatório;
- registro em lote de frequência;
- importações;
- exportações assíncronas futuras.

Uma chave de idempotência pode ser aceita no cabeçalho ou no contrato da operação. A estratégia final deve ser definida no plano da funcionalidade.

---

## 15. PWA e conectividade

O MVP deve:

- funcionar bem no navegador móvel;
- permitir instalação como PWA quando suportado;
- manter assets básicos em cache;
- indicar perda de conexão;
- evitar perda de formulário por navegação acidental;
- salvar rascunho no servidor sempre que houver conexão.

Opcional para o piloto:

- rascunho local em IndexedDB;
- reenvio manual após retorno da conexão.

Não faz parte do MVP:

- banco local completo;
- sincronização bidirecional;
- resolução automática de conflitos;
- operação integral offline.

---

## 16. Auditoria

A auditoria básica deve registrar:

- usuário;
- ação;
- entidade;
- identificador;
- data;
- igreja;
- origem;
- dados anteriores e posteriores quando necessário.

Ações prioritárias:

- criação e bloqueio de usuário;
- alteração de papel;
- criação e encerramento de célula;
- transferência de participante;
- alteração de liderança;
- envio ou alteração de relatório;
- exportação de dados.

Logs de aplicação não substituem auditoria de negócio.

---

## 17. Desempenho

Práticas iniciais:

- paginação;
- seleção apenas dos campos necessários;
- índices;
- evitar consultas N+1;
- cache apenas após medição;
- agregações controladas;
- evitar recalcular o dashboard a cada componente;
- limites de exportação;
- processamento assíncrono somente quando necessário.

Não introduzir Redis no MVP sem evidência de necessidade.

---

## 18. Observabilidade

Mínimo esperado:

- logs estruturados;
- correlação por request;
- monitoramento de erros;
- health check;
- métricas básicas de disponibilidade;
- alertas de falha de backup;
- ambiente separado de produção e homologação.

Nunca registrar senha, token completo ou observação pastoral em logs.

---

## 19. Testes

### Unitários

- regras de frequência;
- políticas de autorização;
- regras de vínculo;
- estados de encontro e relatório.

### Integração

- repositórios;
- constraints do banco;
- autenticação;
- autorização;
- transações.

### E2E

Fluxos prioritários:

1. login;
2. administrador cria célula;
3. líder registra encontro;
4. líder marca frequência;
5. líder envia relatório;
6. supervisor consulta pendência;
7. pastor abre dashboard.

---

## 20. Implantação

Ambientes:

- desenvolvimento;
- homologação;
- produção.

Pipeline esperado:

```text
install
  ↓
lint
  ↓
typecheck
  ↓
test
  ↓
build
  ↓
migration controlada
  ↓
deploy
  ↓
health check
```

Requisitos:

- variáveis de ambiente separadas;
- migrations revisadas;
- backup antes de alterações críticas;
- rollback documentado;
- domínio e HTTPS;
- monitoramento após deploy.

---

## 21. Decisões que exigem ADR

Criar uma ADR antes de decidir:

- cookie de sessão ou bearer token;
- provedor de hospedagem;
- PostgreSQL gerenciado ou próprio;
- biblioteca de componentes;
- estratégia de envio de e-mail;
- rascunho local com IndexedDB;
- aplicativo nativo;
- multi-igreja comercial;
- introdução de filas, Redis ou microsserviços;
- armazenamento de pedidos de oração.

---

## 22. Riscos

### Escopo crescente

Mitigação: plano ativo, fora de escopo explícito e aprovação de mudança.

### Permissão incorreta

Mitigação: políticas centralizadas, testes por papel e filtros no servidor.

### Duplicidade de pessoas

Mitigação: busca por telefone, e-mail, nome e nascimento antes do cadastro.

### Relatório complexo

Mitigação: confirmar os campos realmente utilizados e começar com formulário curto.

### Baixa adesão

Mitigação: piloto com poucos líderes, fluxo mobile em até dois minutos e treinamento.

### Dados sensíveis

Mitigação: menor privilégio, auditoria, restrição de campos e revisão LGPD.

---

## 23. Critério arquitetural de sucesso

A arquitetura será considerada adequada quando:

- o fluxo principal funcionar bem no celular;
- módulos puderem evoluir sem acoplamento excessivo;
- a API garantir autorização;
- o banco preservar históricos;
- o dashboard responder dentro do esperado;
- o deploy for repetível;
- o sistema puder receber um aplicativo nativo futuramente sem reescrever as regras de negócio.
