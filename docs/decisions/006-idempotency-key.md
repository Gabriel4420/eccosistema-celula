# ADR 006 — Idempotência transversal com Idempotency-Key

**Status:** aceito para o plano 007
**Data:** 2026-08-09
**Relacionada a:** plano 007; AGENTS.md (endpoints de sincronização idempotentes)

---

## Contexto

O Plano 007 cria células pela web. Retries de rede e dupla submissão podem
repetir um `POST /cells` e criar células duplicadas. O AGENTS.md exige que
operações idempotentes não produzam efeito duplicado, e a ADR 005 ratifica a
idempotência de estado para transições de status. Falta ratificar a estratégia
transversal de `Idempotency-Key` para criação.

## Decisão

- `POST /cells` exige o cabeçalho `Idempotency-Key` com valor UUID, válido em
  entropia e sem significado de autorização.
- Chave única por `churchId + actorId + operation + key` em tabela genérica
  `idempotency_requests`.
- A reserva da chave, a criação da célula e a auditoria acontecem na mesma
  transação serializável por igreja.
- Repetição idêntica (mesma chave e mesmo hash canônico do request) devolve o
  mesmo `201`, o mesmo envelope e o mesmo identificador da resposta original,
  sem criar novo recurso nem novo `AuditLog`.
- Mesma chave com hash diferente retorna `409 IDEMPOTENCY_KEY_CONFLICT`.
- Requisições concorrentes com a mesma chave e mesmo hash produzem uma única
  célula.
- Nenhum estado intermediário devolve sucesso parcial: a requisição seguinte
  aguarda o resultado confirmado ou recebe erro transitório estável.
- Falha transacional não deixa chave concluída sem recurso nem auditoria.
- Mutações `PATCH` usam semântica de estado desejado e são idempotentes por
  natureza; no-op não altera `updatedAt` nem gera auditoria. Podem aceitar a
  chave opcionalmente após a infraestrutura compartilhada existir, o que fica
  fora do escopo inicial do Plano 007.
- A tabela não armazena token, dados pessoais, payload integral, termos de
  busca ou endereço completo; persiste somente chave, ator, igreja, operação,
  hash canônico, status e referência ao recurso criado.
- Retenção e limpeza de chaves nunca removem a célula ou o `AuditLog`
  associados.

## Alternativas consideradas

### Alternativa A — Sem idempotência persistente (confiar em unique de código)

Desvantagens: retries com payload igual criam erro `CELL_CODE_CONFLICT` em vez
de devolver a resposta original, rompendo a idempotência observável; não cobre
cenários onde o código muda entre tentativas.

### Alternativa B — Idempotência por nome/código

Desvantagens: semântica frágil, sujeita a colisões legítimas e alterações
parciais entre tentativas.

### Alternativa C — Tabela genérica com hash canônico

Aceita: combina chave única por tenant/ator/operação, hash do request para
detectar divergência e referência ao recurso para replay determinístico.

## Consequências positivas

- Retries e dupla submissão são seguros e observáveis.
- Replay devolve a mesma resposta original.
- Auditoria e célula nunca são duplicadas por idempotência.
- Estratégia reutilizável para futuras criações do ecossistema.

## Consequências negativas e riscos

- Nova tabela e retenção de chaves a definir antes de produção.
- Custo de armazenamento mínimo; exige índices por igreja.
- Header obrigatório no frontend para `POST /cells`.

## Impacto

### Código

- Nova migration com a tabela `idempotency_requests`.
- Port/unidade de trabalho de células integra reserva de chave e replay.
- `POST /cells` lê e valida o cabeçalho.

### Banco de dados

- Tabela nova com unique por `(church_id, actor_id, operation, key)` e índices
  por igreja.

### Operação e infraestrutura

- Script/rotina de retenção de chaves a definir em produção.

### Segurança e privacidade

- Chave não é token de autorização; sem PII ou payload integral persistido.

### Produto

- Criação confiável de células pela web, alinhada ao critério 20 do plano.

## Estratégia de implementação

1. Ratificar esta ADR.
2. Criar a migration da tabela `idempotency_requests`.
3. Implementar reserva/replay no repositório de células.
4. Integrar ao `POST /cells` e ao formulário web com chave estável por tentativa.
5. Cobrir replay, conflito, concorrência e rollback em testes.

## Estratégia de reversão

Remover a tabela e a leitura do cabeçalho em nova migration, mantendo células e
auditoria; o endpoint volta a ser criativo apenas.

## Evidências e referências

- Plano: 007, seções 6.5, 9, 13, 14, 18, 19
- AGENTS.md: idempotência em sincronização
- ADR 005: idempotência de estado

## Revisão futura

Reavaliar retenção, chaves em outros recursos de escrita e aceite opcional da
chave em `PATCH` quando houver infraestrutura compartilhada.
