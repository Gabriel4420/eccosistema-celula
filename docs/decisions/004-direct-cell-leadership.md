# ADR 004 — Liderança direta de células por usuário

**Status:** aceito para o plano 007
**Data:** 2026-08-09
**Relacionada a:** plano 007; PRD RF-004, RF-005, US-002

---

## Contexto

O Plano 007 exige cadastrar e editar células e administrar a liderança de
células pela aplicação web. O domínio `people` representa pessoas do
cadastro (membros e visitantes), enquanto o domínio `users` representa
contas de acesso ao sistema com papéis e credenciais.

O modelo de dados atual já relaciona liderança de células a `users`
(`Cell.leaderId` e `Cell.traineeLeaderId` apontam para `users.id`), e não a
`people`. Era necessário ratificar formalmente essa decisão antes das etapas
de criação, edição e liderança (Etapas 5–7 do plano), porque afeta contratos,
endpoints e a seleção remota de líderes.

## Decisão

- A liderança de células (líder e líder em treinamento) é representada por
  `User` (conta de acesso), e não por `Person`.
- A fonte canônica para selecionar líderes é o domínio `users`
  (endpoint `GET /users/cell-assignment-options`), e não `people`.
- Líder e líder em treinamento devem pertencer à mesma igreja da célula,
  estar com status `ACTIVE` e não excluídos logicamente.
- Um mesmo usuário não pode ser líder e líder em treinamento na mesma célula.

## Alternativas consideradas

### Alternativa A — Liderança por `Person`

Vantagens: separaria a identidade cadastral da conta de acesso. Desvantagens:
contraria o schema existente, exigiria migration de renomeação, introduziria
dependência do domínio `people` que ainda não possui o vínculo com contas e
duplicaria a fonte de verdade da liderança.

### Alternativa B — Liderança por `User` com seleção em `people`

Vantagens: reutilizaria o endpoint de pessoas. Desvantagens: `Person` não
possui vínculo confiável com `User`, geraria seleção incorreta de líderes e
violaria a regra de fonte única.

## Consequências positivas

- Fonte única de liderança: `users`.
- Nenhuma migration de renomeação; o schema atual já está correto.
- Isolamento por igreja garantido pela validação de `churchId` do usuário.

## Consequências negativas e riscos

- Um líder de célula precisa possuir conta de acesso com status `ACTIVE`.
- A seleção remota depende do módulo `users`, que será exposto também a
  `ADMIN` e `PASTOR` para o plano 007.

## Impacto

### Código

- Contratos de células (`packages/contracts/src/cells.ts`) usam `leaderId` e
  `traineeLeaderId` referenciando usuários.
- Novo endpoint `GET /users/cell-assignment-options`.

### Banco de dados

- Sem alteração estrutural; FKs já existentes (`cells_leader_id_fkey` e
  `cells_trainee_leader_id_fkey`).

### Operação e infraestrutura

- Nenhuma.

### Segurança e privacidade

- A seleção de liderança expõe somente identificador, nome e e-mail de
  usuários ativos da própria igreja.

### Produto

- Alinhado ao PRD (US-002 exige líder obrigatório) e ao schema atual.

## Estratégia de implementação

1. Ratificar esta ADR.
2. Implementar contrato de células e regras de domínio com base em `User`.
3. Implementar `GET /users/cell-assignment-options` no módulo `users`.
4. Implementar validação de liderança no use case de células.

## Estratégia de reversão

Caso a liderança por `Person` se torne necessária, criar uma nova ADR e uma
migration que adicione o vínculo `Person` antes de descontinuar o vínculo com
`User`.

## Evidências e referências

- PRD: US-002, RF-004, RF-005
- Plano: 007, seções 2, 5.1, 6, 7.6, 9.7
- Schema: `Cell.leaderId`, `Cell.traineeLeaderId` em
  `packages/database/prisma/schema.prisma`

## Revisão futura

Reavaliar quando o módulo mobile de líderes (fora do escopo 007) definir o
fluxo de indicação de liderança.
