# Plano 015 — Tradução para Libras com VLibras

**Status:** em andamento  
**Responsável:** OpenCode  
**Criado em:** 2026-09-08  
**Atualizado em:** 2026-09-08  
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
- CSP do Next.js liberando o domínio oficial `vlibras.gov.br`;
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
- [ ] validar manualmente o widget em produção.

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
3. O CSP permite apenas o domínio oficial do VLibras.
4. Nenhum dado de pessoa, igreja ou sessão é enviado ao VLibras.

## 12. Estratégia de testes

### Unitários

- URL padrão, ausência da factory global e instanciação do widget.

### Integração

- não aplicável nesta entrega.

### E2E

- verificar que, desabilitado, o script e o markup do VLibras não estão presentes na página.

### Validação manual

- com o widget habilitado, conferir o avatar do tradutor e a tradução de um parágrafo em Libras.

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
| CSP bloqueando o widget | baixa | média | domínio oficial já liberado e testes manuais |

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
- [ ] widget validado manualmente em produção;
- [ ] plano movido para `completed`.

## 20. Registro de progresso

### 2026-09-08

- realizado: ampliado o plano 014 para incluir Libras; criado módulo `vlibras` com configuração por env, provider assíncrono com markup oficial `vw`, integração no layout e liberação do domínio no CSP; documentadas variáveis no `.env.example`; removida a integração Hand Talk;
- testes: typecheck, lint, unitários e build web;
- decisões: VLibras é gratuito e não exige token; módulo inerte quando desabilitado;
- bloqueios: nenhum;
- próximo passo: habilitar `NEXT_PUBLIC_VLIBRAS_ENABLED=true` em produção e validar manualmente o tradutor.