# Plano 014 — Adaptações de acessibilidade web

**Status:** em andamento  
**Responsável:** OpenCode  
**Criado em:** 2026-09-08  
**Atualizado em:** 2026-09-08  
**PRD relacionado:** `docs/product/PRD.md`, seção 13  
**ADRs relacionadas:** nenhuma  
**Branch ou issue:** master

---

## 1. Objetivo

Permitir que cada pessoa configure e persista no painel web contraste, escala de texto, redução de movimento e foco reforçado, respeitando também as preferências do sistema operacional e mantendo conformidade WCAG 2.2 AA.

## 2. Contexto

O PRD exige teclado, contraste, rótulos claros, mensagens de erro e alvos adequados. O painel já possui landmarks, skip link, live regions e suporte parcial a `prefers-reduced-motion`; faltam controles explícitos e persistidos para adaptações visuais e motoras.

## 3. Escopo

- preferências de acessibilidade no recurso existente `/settings/me`;
- controles em `/settings` para contraste, texto, movimento e foco;
- atributos no elemento raiz e CSS global para aplicar as adaptações;
- respeito a `prefers-reduced-motion`, `prefers-contrast` e `forced-colors` quando a preferência estiver em modo sistema;
- atalhos de teclado documentados no painel para abrir configurações e voltar ao conteúdo principal;
- testes unitários, API e E2E web.

## 4. Fora de escopo

- inferir deficiência, surdez, fala ou cegueira por dispositivo, navegador ou hardware;
- gravação, reconhecimento de voz ou biometria;
- ~~tradução automática para Libras~~ → movida para o plano 015 (VLibras), a pedido do cliente;
- aplicativo mobile nesta etapa;
- substituir tecnologias assistivas nativas, como leitor de tela e teclado do sistema.

## 5. Suposições

- adaptações são preferências pessoais, sem efeito sobre cálculos ou dados de negócio;
- notificações do painel permanecem visuais e anunciadas por live region;
- a preferência `system` delega ao navegador/sistema, sem persistir sinais do dispositivo.

## 6. Decisões

- [x] usar terminologia inclusiva: pessoas surdas, com deficiência visual, de fala ou motora; evitar inferências e o termo "mudo" como rótulo de produto;
- [x] persistir quatro vocabulários fechados: `contrast` (`system|standard|high`), `textScale` (`standard|large|extra-large`), `motion` (`system|reduce`) e `focus` (`standard|enhanced`);
- [x] qualquer pessoa autenticada altera somente as próprias preferências.

## 7. Áreas afetadas

### Aplicação web

- provider de acessibilidade, layout raiz, CSS global, rota `/settings`, atalhos e testes.

### API

- módulo `user-preferences`, presenter e Swagger de `GET/PATCH /settings/me`.

### Banco de dados

- colunas aditivas em `user_preferences`, com defaults e backfill.

### Contratos compartilhados

- vocabulários e schemas Zod de preferências.

### Documentação

- README e este plano.

## 8. Modelo e regras de negócio

`UserPreferences` recebe quatro campos não nulos com defaults. PATCH parcial mantém no-op e auditoria atuais. Os valores não podem ser fornecidos em headers, query ou para outro usuário/igreja.

## 9. Contratos

### Entradas

`PATCH /settings/me` aceita os quatro campos opcionais de acessibilidade, em objeto Zod estrito.

### Saídas

`GET/PATCH /settings/me` devolvem as quatro preferências na allowlist existente.

### Erros esperados

`400` para vocabulário inválido, `401` sem sessão e `404` sem preferência acessível.

### Permissões

Somente o próprio usuário autenticado lê e altera suas preferências.

## 10. Etapas

### Etapa 1 — Contratos e persistência

- [x] ampliar contratos, Prisma e criar migration aditiva com backfill;
- [x] atualizar módulo de preferências, presenter e auditoria;
- [x] cobrir schema, command e presenter; endpoints e integração PostgreSQL pendentes.

### Etapa 2 — Painel adaptável

- [x] criar sincronização e atributos de acessibilidade na raiz;
- [x] aplicar CSS de contraste, escala, movimento e foco;
- [x] adicionar controles em `/settings`;
- [x] adicionar atalhos de teclado (contraste e escala de texto globalmente);
- [ ] testar teclado, leitor de tela e estados visuais.

### Etapa 3 — Validação e documentação

- [x] executar lint, typecheck, testes, build e E2E;
- [ ] revisão manual com leitor de tela e forced colors;
- [ ] atualizar README e mover plano para `completed`.

## 11. Critérios de aceitação

1. Preferências são persistidas por usuário e isoladas por igreja.
2. O painel aplica imediatamente contraste, texto, movimento e foco após salvar.
3. Modos sistema respeitam media queries sem coletar características do dispositivo.
4. Toda funcionalidade permanece navegável por teclado e anunciada a leitor de tela.
5. Nenhuma informação de deficiência ou biometria é armazenada.

## 12. Estratégia de testes

### Unitários

- vocabulários, provider, atributos raiz e atalhos.

### Integração

- migration, defaults, no-op, auditoria e isolamento de `user_preferences`.

### E2E

- salvar preferências, verificar atributos/CSS e navegação por teclado.

### Validação manual

- Chrome/Edge com zoom 200%, leitor de tela e forced colors quando disponíveis.

## 13. Segurança e privacidade

- self-scope no servidor;
- sem coleta de sinais de hardware, biometria ou condição de saúde;
- preferências não contêm PII sensível;
- auditoria registra somente campos efetivamente alterados.

## 14. Migração de dados

Nova migration aditiva para `user_preferences`, com defaults seguros e backfill idempotente. Nenhuma migration aplicada será alterada.

## 15. Observabilidade

Usar auditoria de atualização existente; não registrar preferências de sistema detectadas nem eventos de tecnologias assistivas.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |
| CSS adaptado reduzir contraste de componente isolado | média | alta | tokens globais, revisão visual e testes E2E |
| API de fala indisponível entre navegadores | alta | média | fora de escopo; não depender dela |
| identificação indevida de deficiência | baixa | alta | não inferir características pessoais |

## 17. Estratégia de reversão

Reverter o deploy do provider/CSS; os campos aditivos permanecem inofensivos com defaults. Uma reversão de schema, se necessária, ocorrerá em migration nova.

## 18. Comandos de validação

```bash
npm lint
npm typecheck
npm test
npm build
npm run test:e2e --workspace @mission-atos/web -- accessibility
```

## 19. Definition of Done

- [ ] escopo implementado;
- [ ] contratos, migration e API validados;
- [ ] teclado, leitor de tela e preferências de sistema verificados;
- [ ] testes criados ou atualizados;
- [ ] lint, typecheck, testes e build executados;
- [ ] documentação atualizada;
- [ ] plano movido para `completed`.

## 20. Registro de progresso

### 2026-09-08

- realizado: consultados PRD, plano de fundação web e implementação existente de acessibilidade;
- decisões: web primeiro, preferências explícitas persistidas, sem inferência de deficiência ou reconhecimento de voz;
- testes: pendentes;
- bloqueios: nenhum;
- próximo passo: contratos e migration aditiva.

### 2026-09-08 (implementação parcial)

- realizado: adicionados os campos `accessibilityContrast`, `accessibilityTextScale`, `accessibilityMotion` e `accessibilityFocus` ao contrato, schema Prisma, migration e módulo `user-preferences`; o painel aplica atributos raiz, preferências de sistema, alto contraste, escala de texto, movimento reduzido e foco reforçado; os controles foram incluídos em `/settings`;
- testes: typecheck de contracts, API e web; testes unitários de contratos (5/5), API (6/6) e i18n web (7/7) aprovados;
- bloqueios: nenhum;
- próximo passo: cobrir provider/controles por testes, E2E e revisão manual com leitor de tela, teclado e forced colors.

### 2026-09-08 (validação completa)

- realizado: atalhos de teclado globais (contraste com `Ctrl/Cmd+Shift+C`; escala de texto com `Ctrl/Cmd+Shift+` e `Ctrl/Cmd+Shift-`), com toast de confirmação acessível; migration aplicada no test DB (21) e build da API;
- testes: lint de web/contracts/api aprovado; typecheck web/contracts/api aprovado; unitários web (101/101), contracts (137/137) e API (196/196) aprovados; build web aprovado; E2E `settings.spec.ts` 7/7 aprovado (inclui persistência e atributos raiz de acessibilidade);
- bloqueios: nenhum;
- próximo passo: revisão manual com leitor de tela e forced colors, atualizar README e mover plano para `completed`.
