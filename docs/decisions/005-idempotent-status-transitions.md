# ADR 005 — Transições de status idempotentes

**Status:** aceito para o plano 007
**Data:** 2026-08-09
**Relacionada a:** plano 007; PRD RN-001, RN-002

---

## Contexto

O Plano 007 permite ativar, suspender e encerrar células. As regras de
produto definem transições de status (FORMING → ACTIVE → SUSPENDED → ACTIVE →
CLOSED, com CLOSED terminal) e o plano exige que repetir o mesmo status não
gere erro nem registre auditoria redundante.

As etapas dependentes (status e liderança, Etapa 7) exigiam uma decisão
registrada sobre idempotência antes da implementação.

## Decisão

- Repetir a transição para o status corrente é idempotente: não gera erro e
  não produz novo registro de auditoria.
- Transições permitidas por status de origem:
  - `FORMING` → `ACTIVE`, `SUSPENDED`, `CLOSED`;
  - `ACTIVE` → `SUSPENDED`, `CLOSED`;
  - `SUSPENDED` → `ACTIVE`, `CLOSED`;
  - `CLOSED` é terminal: nenhuma transição de saída é permitida.
- Transição inválida retorna `CELL_STATUS_INVALID` (409), preservando o estado.
- A auditoria `CELL_STATUS_CHANGE` é registrada apenas quando o status muda.

## Alternativas consideradas

### Alternativa A — Repetir status gera erro

Desvantagens: quebra de idempotência para retries de rede e dupla submissão
no frontend; contrário à orientação de sincronização idempotente do AGENTS.md.

### Alternativa B — Sem máquina de estados (aceitar qualquer status)

Desvantagens: permitiria saltos inválidos (ex.: reabrir célula encerrada),
comprometendo RN-001 e o histórico de ciclo de vida.

### Alternativa C — Transição dupla somente com movimento

Aceita: aplicar o mesmo status é permitido sem efeito; mover para status
inválido a partir de `CLOSED` é bloqueado. É a decisão registrada.

## Consequências positivas

- Retries e dupla submissão são seguros.
- Histórico de auditoria reflete apenas mudanças reais.
- `CLOSED` permanece terminal.

## Consequências negativas e riscos

- Necessário validar transições na camada de aplicação e no repositório.
- Testes devem cobrir a matriz completa de transições e a idempotência.

## Impacto

### Código

- Regras puras de transição em `packages/domain/src/cells.ts`.
- Validação no use case de status em `apps/api/src/modules/cells`.
- Contrato `updateCellStatusRequestSchema`.

### Banco de dados

- Nenhuma alteração estrutural.

### Operação e infraestrutura

- Nenhuma.

### Segurança e privacidade

- Nenhuma.

### Produto

- Alinhado ao PRD RN-001 (célula ativa com líder) e à operação de
  ativar/suspender do plano 007.

## Estratégia de implementação

1. Ratificar esta ADR.
2. Implementar a máquina de estados pura em `packages/domain`.
3. Aplicar no use case de status e cobrir com testes unitários e E2E.

## Estratégia de reversão

Substituir por nova ADR caso o produto defina transições adicionais
(ex.: reabrir célula encerrada por administração).

## Evidências e referências

- PRD: RN-001, RN-002
- Plano: 007, seções 5.2, 6, 9.5, 19
- AGENTS.md: endpoints de sincronização idempotentes

## Revisão futura

Reavaliar quando o Plano 008 (encontros e frequência) definir o ciclo de vida
completo de células.
