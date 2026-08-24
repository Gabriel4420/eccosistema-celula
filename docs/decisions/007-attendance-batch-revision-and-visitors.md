# ADR 007 — Lote, revisão e visitantes da frequência

**Status:** aceito para o plano 009
**Data:** 2026-08-22
**Relacionada a:** plano 009; ADR 006

---

## Contexto

A frequência precisa aceitar edição rápida de centenas de participantes sem
requisições por pessoa, preservar o histórico e impedir perda silenciosa quando
dois usuários salvam o mesmo encontro. Visitantes também precisam de retry
seguro sem criar uma segunda fonte de pessoas.

## Decisão

- O PUT de frequência usa semântica replace-set para participantes regulares,
  com no máximo 500 itens e expectedRevision.
- A ausência de uma pessoa no conjunto desejado significa UNMARKED e remove
  logicamente sua marcação anterior. UNMARKED não é persistido.
- A revisão é adquirida por compare-and-swap atômico no registro de Meeting.
  Attendance, revisão e auditoria confirmam ou revertem na mesma transação.
- Estado canônico já persistido é retry idempotente: devolve 200 sem alterar
  revisão, timestamps ou auditoria. Outro estado com revisão divergente devolve
  409 ATTENDANCE_REVISION_CONFLICT.
- Visitantes continuam sendo Person da igreja e recebem o vínculo
  MeetingVisitor; sua MeetingAttendance é sempre PRESENT.
- Cadastro/restauração/remoção de visitante atualizam vínculo, presença, revisão
  e auditoria atomicamente. Operação sem mudança real é no-op.
- O POST de visitante aplica a ADR 006: mesma chave e payload devolvem o mesmo
  status e snapshot canônico; a mesma chave com outro payload devolve 409.
- Não existe fechamento separado da frequência. Encontros SCHEDULED e
  COMPLETED são editáveis por usuários autorizados; CANCELED é histórico
  somente leitura.
- O frontend mantém edição local explícita, sem autosave.

## Alternativas consideradas

### Uma requisição por participante

Rejeitada por aumentar latência, volume de auditoria e risco de sucesso parcial.

### Last-write-wins sem revisão

Rejeitada porque sobrescreve silenciosamente a edição concorrente.

### Visitante fora de Person

Rejeitada por duplicar identidade e dificultar deduplicação e evolução futura.

### Fechamento próprio da frequência

Rejeitado nesta etapa porque o status do encontro já delimita a edição aprovada
e não existe requisito de produto para outro workflow.

## Consequências

- O contrato replace-set deve ser apresentado claramente na UI e na OpenAPI.
- Toda mutação real de frequência ou visitante incrementa uma única revisão.
- O banco precisa de índice único tenant-aware para attendance e visitante.
- A auditoria é agregada por lote e não contém nomes, telefones ou outros dados
  pessoais desnecessários.
- Clientes devem tratar 409 preservando a edição local e oferecendo recarga da
  base para comparação.
- A solução permanece limitada ao encontro atual; não cria dashboard, relatório
  global ou gestão geral de visitantes.
