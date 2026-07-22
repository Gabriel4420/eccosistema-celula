# Plano 001 — Fundação do projeto

**Status:** concluído  
**Responsável:** a definir  
**Criado em:** 2026-07-22  
**Atualizado em:** 2026-07-22  
**PRD relacionado:** `docs/product/PRD.md`, seção 14, item 1 — fundação do monorepo  
**ADRs relacionadas:** nenhuma  
**Branch ou issue:** a definir

---

## 1. Objetivo

Estabelecer uma fundação mínima, reproduzível e verificável para o projeto em um monorepo npm com Turborepo, contendo uma aplicação web Next.js com App Router e uma API NestJS, ambas em TypeScript estrito.

Ao final desta etapa, uma instalação limpa deve permitir executar desenvolvimento, lint, verificação de tipos, testes e build de todo o workspace por comandos únicos na raiz, com configuração de ambiente documentada e sem qualquer funcionalidade de negócio.

## 2. Contexto

Esta é a primeira entrega do roadmap definido no PRD. Ela cria a infraestrutura de desenvolvimento necessária para que os módulos posteriores sejam implementados de forma consistente, sem antecipar decisões de autenticação, persistência ou domínio.

Documentos de referência:

- `AGENTS.md`;
- `docs/product/PRD.md`;
- `docs/archtecture/ARCHITECTURE.md` (arquivo arquitetural existente; a pasta do repositório está grafada como `archtecture`);
- `docs/plans/TEMPLATE.md`.

A arquitetura prevista para o MVP é um monólito modular composto por web responsiva/PWA e API. Esta etapa prepara apenas os limites técnicos dessas aplicações e dos pacotes compartilhados de configuração.

## 3. Escopo

- configurar o workspace npm e fixar versões suportadas de Node.js e npm;
- configurar o Turborepo e seu grafo de tarefas para desenvolvimento, lint, typecheck, testes e build;
- criar `apps/web` com Next.js, App Router e TypeScript estrito;
- criar `apps/api` com NestJS e TypeScript estrito;
- criar configurações compartilhadas em `packages/typescript-config` e `packages/eslint-config`;
- criar `packages/config` somente para schemas Zod e funções de leitura da configuração operacional, com entradas públicas e privadas separadas;
- definir scripts raiz consistentes para `lint`, `typecheck`, `test`, `test:e2e`, `build` e `dev`;
- configurar Jest para testes unitários mínimos da fundação;
- configurar Playwright para um teste E2E mínimo da aplicação web;
- adicionar uma página técnica mínima e um endpoint `GET /health` apenas para comprovar inicialização, sem regras ou dados de negócio;
- criar `.env.example` sem valores secretos e documentar o uso de variáveis locais;
- configurar arquivos essenciais de higiene do repositório, como `.gitignore` e documentação de inicialização;
- garantir que uma instalação limpa reproduza as validações do projeto.

## 4. Fora de escopo

- autenticação, autorização, usuários, papéis ou sessões;
- PostgreSQL, Prisma, schema, migrations, seeds ou qualquer persistência;
- entidades, regras, contratos, endpoints ou telas de negócio;
- implementação dos módulos `identity`, `organizations`, `churches`, `users`, `permissions`, `structures`, `cells`, `people`, `meetings`, `attendance`, `reports`, `synchronization` e `audit`;
- criação de `packages/database`, conteúdo de negócio em `packages/domain` ou contratos de negócio em `packages/contracts`;
- aplicativo React Native/Expo em `apps/mobile`;
- PWA, service worker, cache offline, SQLite ou sincronização;
- integração com e-mail, observabilidade externa, deploy ou infraestrutura de produção;
- escolha ou implementação de biblioteca de componentes;
- CI/CD, salvo documentação dos comandos que um pipeline futuro deverá executar.

## 5. Suposições

- o repositório está intencionalmente vazio de código e será inicializado sem necessidade de preservar uma configuração anterior;
- o MVP inicial é web responsivo com API, conforme o PRD e o documento de arquitetura; o aplicativo nativo permanece para uma etapa futura;
- a versão LTS de Node.js escolhida antes do primeiro incremento será registrada em `package.json#engines`; a versão exata do npm será a definida em `package.json#packageManager`, sem arquivos redundantes de versionamento;
- versões de Next.js, NestJS, TypeScript, Turborepo, Jest e Playwright serão fixadas no lockfile e compatíveis entre si na data da implementação;
- nenhuma variável de banco de dados ou autenticação será adicionada nesta etapa;
- Zod será a única dependência de produção de `packages/config`, justificada pela validação em runtime das variáveis operacionais; o pacote não conterá configuração ou contratos de negócio;
- a web usará a porta `3000` e a API a porta `3001` no ambiente local;
- `packages/config` terá entrypoints distintos para servidor e navegador; o entrypoint público aceitará somente variáveis explicitamente públicas;
- `npm test` executará testes unitários com Jest, enquanto `npm test:e2e` executará separadamente o teste de fumaça com Playwright;
- o Playwright validará a aplicação web após `npm build`, usando o servidor de produção iniciado pela própria configuração do teste;
- scripts do workspace deverão funcionar em PowerShell no Windows e não poderão depender de Bash, comandos POSIX ou separadores de caminho montados manualmente;
- os testes iniciais serão testes de fumaça da fundação, não uma simulação prematura das funcionalidades do MVP.

## 6. Perguntas e decisões pendentes

- [x] definir e registrar as versões exatas de Node.js e npm suportadas;
- [x] definir as versões compatíveis dos frameworks e ferramentas antes de gerar o lockfile;
- [x] registrar no progresso do plano as versões escolhidas e a verificação de compatibilidade antes de instalar as dependências.

Não implementar uma hipótese relevante sem registrá-la.

## 7. Áreas afetadas

### Aplicação web

- estrutura mínima de `apps/web` com App Router;
- página inicial técnica sem conteúdo de negócio;
- configuração estrita de TypeScript e lint;
- Playwright configurado somente para o teste E2E de fumaça;
- leitura segura apenas de variáveis públicas explicitamente permitidas.

### API

- estrutura mínima de `apps/api` com módulo raiz NestJS;
- endpoint `GET /health` estático e sem dados internos, usado somente para verificação técnica da API;
- configuração estrita de TypeScript, lint e Jest;
- leitura e validação de configuração operacional.

### Banco de dados

- não afetado;
- nenhum pacote, driver, schema, migration ou variável de conexão será criado.

### Contratos compartilhados

- nenhum contrato de negócio será criado;
- não criar `packages/contracts` apenas para deixá-lo vazio.

### Infraestrutura

- workspace npm;
- pipeline de tarefas do Turborepo;
- versões de runtime e gerenciador de pacotes;
- configurações compartilhadas de TypeScript e ESLint;
- Jest e Playwright;
- arquivos de ambiente de exemplo e comandos raiz.

Dependências permitidas nesta etapa:

- produção da web: Next.js, React e React DOM;
- produção da API: dependências mínimas exigidas pelo NestJS para inicialização HTTP;
- produção de `packages/config`: Zod para validação em runtime;
- desenvolvimento: TypeScript, Turborepo, ESLint e plugins estritamente necessários, Jest e Playwright;
- qualquer dependência fora dessa lista exige justificativa registrada no progresso do plano antes da instalação.

### Documentação

- instruções para instalação, configuração local, desenvolvimento e validação;
- registro das versões mínimas ou exatas exigidas;
- explicação das variáveis de ambiente operacionais;
- atualização deste plano durante a execução.

## 8. Modelo e regras de negócio

Nenhuma entidade, estado, transição, invariante ou política de negócio será implementada nesta etapa.

As únicas regras técnicas são:

- todo código TypeScript deve compilar com `strict` habilitado;
- `any` não deve ser utilizado sem justificativa documentada e localizada;
- aplicações e pacotes devem declarar limites de importação compatíveis com o workspace;
- segredos não podem ser versionados;
- configuração pública do frontend deve ser separada da configuração privada do servidor;
- tarefas do Turborepo devem declarar corretamente dependências e artefatos de saída;
- a fundação deve permanecer sem dependência de banco de dados, autenticação ou domínio.

## 9. Contratos

### Entradas

- variáveis operacionais locais documentadas no `.env.example`, como ambiente de execução, portas e URL pública da API, caso necessárias;
- comandos executados na raiz do workspace.

### Saídas

- página técnica da aplicação web disponível no ambiente local;
- resposta técnica mínima da API para confirmar que o processo iniciou;
- resultados determinísticos dos comandos de lint, typecheck, testes e build;
- artefatos de build produzidos e tratados como saídas/cache do Turborepo.

### Erros esperados

- instalação interrompida quando a versão de Node.js ou npm não for suportada;
- inicialização interrompida com mensagem clara quando uma variável obrigatória estiver ausente ou inválida;
- lint, typecheck, testes ou build retornando código diferente de zero quando houver falha;
- Playwright retornando falha quando a aplicação web não iniciar ou a página técnica não responder como esperado.

### Permissões

- não aplicável nesta etapa;
- o endpoint e a página técnicos não podem ser apresentados como mecanismo futuro de autorização ou health check de produção.

## 10. Etapas

### Etapa 1 — Fixar runtime e inicializar o workspace

- [x] definir e registrar versões compatíveis de Node.js e npm;
- [x] criar o `package.json` raiz como workspace privado, com `packageManager`, `engines` e scripts comuns;
- [x] declarar os workspaces `apps/*` e `packages/*` no `package.json` raiz;
- [x] registrar Node.js em `package.json#engines` e npm em `package.json#packageManager`, que serão as fontes canônicas de versão;
- [x] configurar `.gitignore` para dependências, builds, caches, cobertura, relatórios de testes e arquivos de ambiente locais;
- [x] gerar e versionar um único `package-lock.json` na raiz;
- [x] documentar os pré-requisitos de instalação.

### Etapa 2 — Configurar Turborepo e convenções compartilhadas

- [x] adicionar o Turborepo como ferramenta de desenvolvimento da raiz;
- [x] configurar `turbo.json` com tarefas `dev`, `lint`, `typecheck`, `test`, `test:e2e` e `build`;
- [x] declarar dependências entre tarefas, entradas, saídas, cache e tarefas persistentes de desenvolvimento;
- [x] criar `packages/typescript-config` com bases estritas apropriadas para Node.js, Next.js e bibliotecas compartilhadas;
- [x] criar `packages/eslint-config` com configurações reutilizáveis para TypeScript, Next.js e NestJS/Node.js;
- [x] garantir que os pacotes de configuração exponham apenas os arquivos necessários;
- [x] validar o grafo de tarefas sem introduzir dependências circulares.

### Etapa 3 — Criar a aplicação web mínima

- [x] criar `apps/web` com Next.js e App Router;
- [x] estender a configuração TypeScript compartilhada mantendo `strict` habilitado;
- [x] criar layout e página inicial técnicos e acessíveis, sem componentes ou conteúdo de negócio;
- [x] configurar scripts locais de desenvolvimento, lint, typecheck, teste e build;
- [x] evitar `use client` quando a página técnica puder permanecer como Server Component;
- [x] confirmar que nenhuma variável privada é exposta no bundle do navegador.

### Etapa 4 — Criar a API mínima

- [x] criar `apps/api` com NestJS e módulo raiz mínimo;
- [x] estender a configuração TypeScript compartilhada mantendo `strict` habilitado;
- [x] adicionar somente uma resposta estática em `GET /health`, sem expor metadados internos;
- [x] configurar scripts locais de desenvolvimento, lint, typecheck, teste e build;
- [x] configurar Jest para testar o componente técnico mínimo sem banco ou autenticação;
- [x] garantir encerramento correto do processo durante testes e desenvolvimento;
- [x] não criar antecipadamente pastas de módulos de negócio vazias.

### Etapa 5 — Configurar e testar o ambiente operacional

- [x] criar `packages/config` com entrypoints distintos para configuração privada do servidor e configuração pública do navegador;
- [x] adicionar Zod como única dependência de produção do pacote, para validar valores em runtime;
- [x] validar valores externos como `unknown` antes de disponibilizá-los de forma tipada;
- [x] criar `.env.example` somente com chaves operacionais e valores seguros de exemplo;
- [x] documentar precedência, obrigatoriedade e finalidade de cada variável;
- [x] confirmar que `.env`, `.env.local` e equivalentes com valores reais estão ignorados;
- [x] testar falha explícita para configuração obrigatória inválida, caso haja variável obrigatória nesta etapa.

### Etapa 6 — Configurar o teste E2E de fumaça

- [x] configurar Playwright em `apps/web` para usar somente Chromium;
- [x] configurar o `webServer` do Playwright para iniciar o build de produção da web sem comandos específicos de Bash;
- [x] criar um único cenário que confirme carregamento da rota inicial e conteúdo técnico esperado;
- [x] documentar a instalação local do Chromium com `npm exec playwright install chromium`;
- [x] garantir que relatórios, screenshots e traces gerados estejam ignorados pelo Git.

### Etapa 7 — Integrar e validar a fundação

- [x] executar instalação limpa com lockfile congelado;
- [x] executar lint de todo o workspace pela raiz;
- [x] executar typecheck de todo o workspace pela raiz;
- [x] executar testes unitários de todo o workspace pela raiz;
- [x] executar build de todo o workspace pela raiz;
- [x] instalar o Chromium do Playwright e executar o teste E2E de fumaça contra o build da web;
- [x] iniciar web e API simultaneamente em desenvolvimento e validar portas e recarregamento;
- [x] executar os scripts raiz em PowerShell no Windows, sem WSL ou Bash;
- [x] revisar dependências e justificar qualquer dependência de produção adicionada;
- [x] atualizar a documentação e o registro de progresso deste plano com resultados reais.

## 11. Critérios de aceitação

1. Uma pessoa com as versões documentadas de Node.js e npm consegue executar `npm ci` a partir de um clone limpo.
2. `npm run typecheck` e `npm run build` resolvem `apps/web`, `apps/api`, `packages/typescript-config`, `packages/eslint-config` e `packages/config` sem referências ou imports quebrados.
3. `npm run dev` inicia a web em `http://localhost:3000` e a API em `http://localhost:3001` pelo Turborepo.
4. A aplicação web utiliza Next.js com App Router e entrega uma página técnica mínima sem funcionalidade de negócio.
5. A API utiliza NestJS e `GET /health` entrega uma resposta técnica mínima sem banco de dados, autenticação ou funcionalidade de negócio.
6. Todos os projetos TypeScript usam configuração estrita, sem `any` não justificado.
7. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam na raiz e abrangem todos os workspaces aplicáveis.
8. Após `npm run build` e `npm exec playwright install chromium`, o cenário de fumaça do Playwright passa por `npm run test:e2e` contra o servidor de produção da web.
9. O `.env.example` contém apenas variáveis operacionais necessárias, sem segredo real, variável de banco ou configuração de autenticação.
10. Arquivos locais de ambiente, caches, coberturas, relatórios e artefatos de build não são versionados.
11. O lockfile é único, está na raiz e permite instalação reproduzível.
12. Nenhum pacote de banco, autenticação, aplicação mobile ou módulo de negócio foi implementado.
13. Todos os scripts raiz executam em PowerShell no Windows sem WSL, Bash, sintaxe POSIX de variáveis de ambiente ou manipulação manual de separadores de caminho.
14. As dependências de produção estão limitadas às listadas na seção 7, e qualquer exceção possui justificativa registrada.

## 12. Estratégia de testes

### Unitários

- usar Jest somente onde existir comportamento próprio testável nesta etapa: API e validação de configuração;
- testar o comportamento técnico mínimo da API sem acessar rede ou banco;
- testar qualquer função própria de validação/normalização de configuração;
- manter os testes rápidos e independentes de ordem ou estado externo;
- não adicionar biblioteca de teste unitário à web nem criar teste artificial para a página estática.

### Integração

- validar que cada aplicação consome corretamente as configurações compartilhadas de TypeScript e ESLint;
- validar que os scripts raiz alcançam os workspaces previstos pelo grafo do Turborepo;
- não realizar integração com banco, autenticação ou serviços externos.

### E2E

- usar Playwright para iniciar a aplicação web compilada em modo de produção;
- verificar que a rota inicial carrega, possui título ou conteúdo técnico esperado e não apresenta erro de console relevante;
- manter apenas o cenário de fumaça necessário para provar a configuração E2E.

### Validação manual

- clonar ou simular um estado limpo, instalar com lockfile congelado e executar os comandos raiz;
- iniciar `npm run dev` e acessar web e `GET /health` da API;
- alterar temporariamente uma variável validada para confirmar uma falha clara, quando aplicável;
- inspecionar o bundle/configuração para confirmar que variáveis privadas não são expostas;
- conferir que não há arquivos de ambiente reais ou segredos no diff.
- executar os comandos de validação em PowerShell no Windows e confirmar que nenhum script depende de utilitário Unix.

## 13. Segurança e privacidade

- nenhuma autenticação ou autorização será implementada;
- nenhum dado pessoal ou dado de igreja será processado;
- segredos reais não serão adicionados ao repositório ou aos valores de exemplo;
- apenas variáveis explicitamente públicas poderão ser usadas pela aplicação web;
- mensagens de erro de configuração devem indicar a chave inválida sem imprimir seu valor;
- o endpoint `GET /health` não deve retornar detalhes internos, variáveis de ambiente ou informações sensíveis;
- nenhuma exportação ou risco LGPD de dados de negócio existe nesta etapa.

## 14. Migração de dados

Não aplicável. Esta etapa não cria banco, Prisma, migrations, seeds ou dados persistentes.

## 15. Observabilidade

- durante desenvolvimento, web e API devem produzir logs de inicialização suficientes para identificar processo, ambiente e porta;
- os logs não devem exibir valores de variáveis potencialmente sensíveis;
- falhas de configuração e inicialização devem terminar com código de erro;
- integração com monitoramento, métricas, alertas e health check de produção fica fora do escopo.

## 16. Riscos

| Risco                                                                        | Probabilidade | Impacto | Mitigação                                                                                         |
| ---------------------------------------------------------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------- |
| Versões incompatíveis entre Node.js, npm, Next.js, NestJS, Jest e TypeScript | média         | alto    | validar compatibilidade antes de fixar versões e confirmar instalação limpa, testes e builds      |
| Configurações compartilhadas excessivamente abstratas                        | média         | médio   | criar somente bases consumidas de imediato por web, API e pacotes existentes                      |
| Grafo do Turborepo omitir uma validação ou reutilizar cache incorreto        | média         | alto    | declarar entradas/saídas explicitamente e validar execução limpa e repetida                       |
| Configuração de ambiente privada ser importada pelo frontend                 | baixa         | alto    | separar entradas públicas e privadas e testar os limites de importação                            |
| Testes de fumaça frágeis ou lentos                                           | média         | médio   | manter cenários mínimos, determinísticos e sem serviços externos                                  |
| Fundação antecipar banco, autenticação ou domínio                            | média         | médio   | revisar o diff contra a seção “Fora de escopo” antes da conclusão                                 |
| Divergência entre `AGENTS.md` e a arquitetura atual sobre aplicativo mobile  | média         | médio   | seguir o escopo explícito deste plano e do MVP web; planejar mobile separadamente quando aprovado |
| Scripts funcionarem apenas em ambientes Unix                                 | média         | alto    | usar CLIs multiplataforma e APIs Node.js; validar todos os scripts raiz em PowerShell sem WSL     |

## 17. Estratégia de reversão

Como a entrega não altera dados nem serviços externos, a reversão consiste em reverter os arquivos introduzidos pela fundação em um commit próprio.

- não haverá migration ou dado para restaurar;
- mudanças de versão devem ser revertidas junto com `package.json` e `package-lock.json`;
- configurações de Turborepo, TypeScript, ESLint, Jest e Playwright devem ser revertidas como uma unidade coerente;
- antes da integração, manter a entrega isolada para evitar que planos posteriores dependam parcialmente de uma fundação incompleta.

## 18. Comandos de validação

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm exec playwright install chromium
npm run test:e2e
```

Validação de desenvolvimento:

```bash
npm run dev
```

## 19. Definition of Done

- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] ausência intencional de autenticação e autorização confirmada;
- [x] ausência de banco de dados e dados de negócio confirmada;
- [x] testes criados ou atualizados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes unitários executados;
- [x] teste E2E de fumaça executado;
- [x] build executado;
- [x] instalação limpa com lockfile congelado validada;
- [x] comandos raiz validados em PowerShell no Windows;
- [x] documentação atualizada;
- [x] dependências de produção justificadas;
- [x] riscos e limitações informados;
- [x] plano movido para `docs/plans/completed/` após a conclusão da implementação.

## 20. Registro de progresso

### 2026-07-22

- realizado: monorepo npm com Turborepo; web Next.js 16.2.11; API NestJS 11.1.28; pacotes compartilhados de TypeScript, ESLint e configuração; health check; README; ambiente; Jest e Playwright;
- testes: `npm ci`, lint, typecheck, 3 testes Jest, build, smoke E2E Chromium, execução simultânea de web/API e consulta manual de `/health` concluídos com sucesso;
- decisões: Node `>=24 <26`, npm 11.16.0, TypeScript 5.9.3, portas `3000`/`3001`, configuração pública/privada separada, Jest e Playwright em comandos distintos e E2E contra o build; PostCSS 8.5.22 e Sharp 0.35.3 fixados na raiz e referenciados por overrides para corrigir vulnerabilidades transitivas do Next;
- bloqueios: nenhum; `npm audit` reportou zero vulnerabilidades;
- próximo passo: nenhum neste plano; não iniciar o plano seguinte sem solicitação explícita.
