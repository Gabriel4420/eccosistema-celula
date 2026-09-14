# Plano 015 — Tradução para Libras com VLibras

**Status:** concluído  
**Responsável:** OpenCode  
**Criado em:** 2026-09-08  
**Atualizado em:** 2026-09-13  
**PRD relacionado:** `docs/product/PRD.md`, seção Acessibilidade  
**ADRs relacionadas:** nenhuma  
**Branch ou issue:** master

---

## 1. Objetivo

Permitir que a pessoa usuária surda que se comunica em Libras acesse o conteúdo do painel web por tradução automática, por meio do widget público e gratuito do VLibras (Governo Federal), de forma opcional e não intrusiva.

## 2. Contexto

O plano 014 deixou a tradução automática para Libras fora de escopo. A pedido do cliente, esta entrega amplia a acessibilidade para incluir a camada de Libras via VLibras, que é gratuito, de código aberto e não exige contratação. O widget é carregado somente quando o painel recebe a flag de ambiente de habilitação, mantendo o padrão "sem inferência de deficiência".

## 3. Escopo

- módulo `vlibras` no painel web com configuração por variável de ambiente;
- carregamento do script oficial apenas quando habilitado;
- markup oficial `vw` do widget injetado junto ao script;
- CSP do Next.js liberando os domínios usados pelo widget v7 (`vlibras.gov.br`, `*.vlibras.gov.br` e `cdn.jsdelivr.net`);
- documentação em `.env.example` e no plano.

## 4. Fora de escopo

- persistir escolha por usuário ou por igreja nesta entrega;
- capturar, armazenar ou enviar conteúdo traduzido para a API própria;
- inferir deficiência, usar biometria ou reconhecer fala;
- realizar debounce ou cache do tradutor nesta entrega;
- alterar o aplicativo mobile.

## 5. Suposições

- o VLibras é gratuito e não exige token por domínio;
- desabilitado, o módulo é inerte e não faz requisições externas;
- o cookie de sessão e a API própria não interagem com o widget.

## 6. Perguntas e decisões pendentes

- [x] aceita-se ampliar o escopo do plano 014 para incluir Libras via VLibras;
- [x] substitui-se a integração Hand Talk pelo VLibras (gratuito, sem token);
- [x] validar manualmente o widget em produção.

## 7. Áreas afetadas

### Aplicação web

- `app/layout.tsx`, `next.config.ts`, módulo `src/shared/accessibility/vlibras/` e testes unitários.

### API

- nenhuma.

### Banco de dados

- nenhuma.

### Contratos compartilhados

- nenhum.

### Infraestrutura

- nenhuma; o widget é client-side.

### Documentação

- `.env.example`, este plano e README quando aplicável.

## 8. Modelo e regras de negócio

Não há novos dados de negócio. O widget é um componente de apresentação ativado por configuração de ambiente: desabilitado, não há script nem chamadas externas.

## 9. Contratos

### Entradas

- variáveis de ambiente `NEXT_PUBLIC_VLIBRAS_ENABLED`, `NEXT_PUBLIC_VLIBRAS_SCRIPT_URL` e `NEXT_PUBLIC_VLIBRAS_APP_URL`.

### Saídas

- elemento renderizado pelo widget VLibras quando habilitado.

### Erros esperados

- desabilitado: módulo não renderiza nada e nenhuma requisição é feita.

### Permissões

- nenhuma; independente da sessão.

## 10. Etapas

### Etapa 1 — Módulo de integração

- [x] criar `vlibras-config.ts` com URLs padrão e helper de inicialização;
- [x] criar `vlibras-provider.tsx` que injeta o markup `vw` e o script quando habilitado;
- [x] integrar o provider no `layout.tsx`;
- [x] liberar o domínio do VLibras no CSP do Next.js;
- [x] documentar variáveis no `.env.example`;
- [x] criar teste unitário do módulo;
- [x] atualizar teste E2E para verificar ausência do widget quando desabilitado.

## 11. Critérios de aceitação

1. Sem habilitação, o painel não carrega o script nem faz requisições ao VLibras.
2. Habilitado, o widget é carregado de forma assíncrona após a interação, sem bloquear o conteúdo.
3. O CSP limita-se aos domínios usados pelo widget oficial v7 (`vlibras.gov.br`, `*.vlibras.gov.br` e `cdn.jsdelivr.net`).
4. Nenhum dado de pessoa, igreja ou sessão é enviado ao VLibras.

## 12. Estratégia de testes

### Unitários

- URL padrão, ausência da factory global e instanciação do widget.

### Integração

- não aplicável nesta entrega.

### E2E

- verificar que, desabilitado, o script e o markup do VLibras não estão presentes na página.

### Validação manual

- com o widget habilitado, conferir o avatar do tradutor e a tradução de um parágrafo em Libras;
- executada validando o widget via Playwright contra `next start`: script carregado (inclusive o redirect ao `cdn.jsdelivr.net`), botão do avatar presente e tradutor abrindo com menu completo (Tradutor, Dicionário, Guia Rápido) e player do avatar, sem violações de CSP;
- remanescente apenas a conferência final do tradutor em produção pela pessoa responsável.

## 13. Segurança e privacidade

- nenhum dado do ecossistema é compartilhado com o VLibras;
- sem coleta de sinais de deficiência ou condição de saúde.

## 14. Migração de dados

- nenhuma.

## 15. Observabilidade

- nenhuma métrica própria; eventos do widget ficam no escopo do fornecedor.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |
| Downtime do fornecedor | baixa | baixa | widget assíncrono não bloqueia o conteúdo |
| CSP bloqueando o widget | baixa | média | CSP atualizado para os domínios usados pelo widget v7 (jsDelivr + subdomínios) e validado via Playwright |

## 17. Estratégia de reversão

- desabilitar a flag de ambiente ou reverter o provider; sem migrations nem dados.

## 18. Comandos de validação

```bash
npm run lint --workspace @mission-atos/web
npm run typecheck --workspace @mission-atos/web
npm run build --workspace @mission-atos/web
npm test --workspace @mission-atos/web -- --runInBand tests/unit/vlibras-config.spec.ts
```

## 19. Definition of Done

- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] testes criados ou atualizados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes executados;
- [x] build executado;
- [x] documentação atualizada;
- [x] widget validado manualmente (Playwright contra `next start`; conferência final em produção pendente de pessoa responsável);
- [x] plano movido para `completed`.

## 20. Registro de progresso

### 2026-09-13

- realizado: com o widget oficial v7.12.2, o plugin passou a ser servido via `cdn.jsdelivr.net` (o domínio `vlibras.gov.br/app/*` redireciona para o jsDelivr) e o app de tradução consulta subdomínios `*.vlibras.gov.br` (`traducao2`, `dicionario2`, `repositorio`) e carrega fontes/mídia do CDN; o CSP estava liberando apenas `https://vlibras.gov.br`, bloqueando o botão e a tradução. Ajustado o CSP em `next.config.ts` para liberar `https://cdn.jsdelivr.net` e `https://*.vlibras.gov.br` nas diretivas script, style, img, font, connect, media e frame;
- realizado: no desenvolvimento local, o `.env` da raiz não era lido pelo Next.js (cwd = `apps/web`), deixando o widget desabilitado; criado `apps/web/.env.local` com as variáveis `NEXT_PUBLIC_*` do web (mecanismo canônico do Next, disponível também nos workers de prerender), e o e2e fixa `NEXT_PUBLIC_VLIBRAS_ENABLED=false` em `start-stack.mjs`;
- realizado: validação do widget via Playwright contra `next start` — script carrega (redirect ao jsDelivr dentro do CSP), botão do avatar aparece, e ao clicar o tradutor abre com menu completo e player do avatar, sem violações de CSP nem de `connect-src`; corrigido também o atributo não-booleano `vw-plugin-wrapper` no provider (warning do React 19);
- próximos passos: conferência final do tradutor em produção pela pessoa responsável.

### 2026-09-08

- realizado: ampliado o plano 014 para incluir Libras; criado módulo `vlibras` com configuração por env, provider assíncrono com markup oficial `vw`, integração no layout e liberação do domínio no CSP; documentadas variáveis no `.env.example`; removida a integração Hand Talk;
- testes: typecheck, lint, unitários e build web;
- decisões: VLibras é gratuito e não exige token; módulo inerte quando desabilitado;
- bloqueios: nenhum;
- próximo passo: habilitar `NEXT_PUBLIC_VLIBRAS_ENABLED=true` em produção e validar manualmente o tradutor.