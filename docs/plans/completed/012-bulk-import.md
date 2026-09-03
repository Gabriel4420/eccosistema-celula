# Plano 012 — Importação em massa (pessoas, células e usuários)

**Status:** concluído
**Responsável:** Time de Desenvolvimento
**Criado em:** 2026-09-02
**Atualizado em:** 2026-09-02
**PRD relacionado:** RF-005 (cadastro de célula), RF-006 (cadastro central de pessoa), RF-007 (duplicidade), RF-008 (vínculo pessoa-célula), RF-003 (usuários e papéis), RF-018 (auditoria)
**ADRs relacionadas:** 003, 004, 005, 006, 007
**Branch ou issue:** a definir

---

## 1. Objetivo

Padronizar a entrada de dados vindos de outro sistema permitindo o cadastro em massa de **pessoas**, **células** e **usuários** por upload de arquivos **Excel (.xlsx), CSV e JSON** em um único endpoint por domínio. O backend é o responsável por fazer o parse, detectar o formato, validar cada linha com as regras de negócio existentes e devolver um relatório de sucesso/erros por linha. A operação deve preservar a multi-tenancy (igreja do principal), a exclusão lógica, a auditoria e as validações de duplicidade/papéis/senha já existentes.

## 2. Contexto

Hoje o cadastro de pessoas, células e usuários é estritamente unitário (POST por recurso), com `churchId` derivado do token autenticado. Para migração a partir de outro sistema, cadastrar centenas de registros um a um é inviável. Não existe hoje nenhum suporte a upload de arquivos no projeto: o `http-client` do web só envia JSON, e a API não tem `FileInterceptor`/parsers. O `exceljs` já está disponível no backend (usado na exportação de relatórios no Plano 011) e é um caminho natural para leitura de XLSX. `@nestjs/platform-express` (com multer) já está instalado.

O PRD não detalha importação em massa; este plano formaliza a decisão de produto solicitada pelo cliente. Consultar `docs/product/PRD.md` (RF-005, RF-006, RF-007, RF-008, RF-003, RF-018) e os planos 006 (people), 007 (cells) e 004 (users).

## 3. Escopo

- Endpoint único por domínio para importação em massa: `people`, `cells`, `users`.
- Aceitar os formatos `.xlsx`, `.csv` e `.json` no mesmo endpoint.
- Detecção do formato por extensão e MIME; parse e normalização para um conjunto canônico de itens.
- Validação por linha usando os mesmos schemas/campos do cadastro unitário.
- Reutilização das regras de negócio (duplicidade de pessoa, conflito de código de célula e idempotência, papéis gerenciáveis de usuário, força de senha, auditoria, escopo e multi-tenancy).
- Vínculo **opcional** de pessoa → célula (RF-008) pela coluna de código da célula (`cellCode`), criando `CellMembership` com status `ACTIVE` quando a célula existe.
- Resolução de **nomes de papel** (ADMIN/PASTOR/SUPERVISOR/LEADER) para UUIDs na importação de usuários.
- Resposta com resumo: total processado, criados, falhas e erros por linha.
- Frontend: página/feature por domínio com upload de arquivo, template de exemplo, envio e apresentação do resultado por linha.
- Script de E2E e testes unitários/integração.

## 4. Fora de escopo

- Remoção/inativação em massa e seleção com checkbox (ficam para um plano posterior conforme prioridade do cliente).
- Atualização/upsert de registros existentes na importação (apenas criação; duplicidades são reportadas como erro).
- Resolução de líder/supervisor de célula por email (exige UUIDs já válidos no arquivo; precedência para dados já formatados).
- Agendamento de importação, arquivo assíncrono/jobs.
- Importação de comprovantes, fotos, ou campos sensíveis restritos além dos do cadastro.
- Exportações (já cobertas pelo Plano 011).

## 5. Suposições

- O arquivo enviado já chega com o cabeçalho/colunas no padrão documentado (gerado pelo template fornecido ou pelo sistema de origem).
- Células enviadas sem `leaderId`/`supervisorId` são criadas com `status FORMING` (não exigem líder). Células `ACTIVE` continuam exigindo líder e supervisor.
- Usuários: `initialPassword` é coluna obrigatória com os mesmos requisitos de força do cadastro unitário; `roles` aceita nomes de papel.
- Tamanho máximo por arquivo: 5 MB; máximo de 2.000 linhas por arquivo (limite defensivo).
- O padrão de erro por linha não derruba o lote; linhas válidas são persistidas, linhas inválidas são reportadas.
- Cada linha roda em transação na igreja do principal, permitindo sucesso parcial sem persistência incompleta dentro da linha; a operação gera auditoria agregada e individual.

## 6. Perguntas e decisões pendentes

- [x] Transporte: backend recebe o arquivo multipart (formato detectado por extensão/MIME). Frontend ganha método `uploadFile`.
- [x] Identificação de célula/pessoa: dados já vêm formatados no arquivo; célula aceita UUIDs opcionais; vínculo opcional de pessoa por `cellCode`.
- [x] Papéis de usuário por nome (resolvidos no backend).
- [x] Escopo desta entrega: apenas importação em massa (não incluir seleção/remoção em massa nesta entrega).

## 7. Áreas afetadas

### Aplicação web

- `apps/web/src/shared/api/http-client.ts` (suporte a multipart/FormData).
- `apps/web/src/shared/api/api-client.ts` (método `uploadFile`).
- Novo feature `apps/web/src/features/bulk-import/` (api client + componentes).
- Rotas por domínio: páginas `(...)/import`.
- Templates `.xlsx` e guias de colunas compartilhadas.
- Chaves de query em `query-keys.ts` (invalidação após importação).

### API

- Novo módulo `bulk-import` (controller + commands + port + infraestrutura).
- `FileInterceptor` para upload (multipart).
- Parser unificado xlsx (exceljs) / csv (`csv-parse`) / json.
- Resolução de papéis de usuário por nome e de `cellCode` para vínculo de pessoa.
- Swagger dos novos endpoints.

### Banco de dados

- Nenhuma migration nova (reutiliza `people`, `cells`, `users`, `user_role`, `cell_memberships`, `audit_logs`).

### Contratos compartilhados

- `packages/contracts/src/bulk-import.ts` (+ barrel `index.ts`): schemas de itens canônicos, envelope de resultado e erros por linha.

### Infraestrutura

- Adicionar dependência `csv-parse` ao `apps/api`.
- `@nestjs/platform-express`/multer (já presentes) registrados.

### Documentação

- `docs/plans/active/012-bulk-import.md` → `docs/plans/completed/`.

## 8. Modelo e regras de negócio

Entidades reutilizadas: `Person`, `Cell`, `User`, `Role`, `UserRole`, `CellMembership`, `AuditLog`. Nenhum novo modelo.

Regras aplicadas por domínio:

**Pessoas**
- Campos: `fullName` (obrigatório), `phone`, `email`, `birthDate`, `gender`, `observations`, `cellCode` (opcional).
- Duplicidade via RF-007 (telefone, e-mail, nome+data) — mesmo `findDuplicates`.
- Vínculo: se `cellCode` informado e a célula existir (mesma igreja), cria `CellMembership` com `status ACTIVE`. Se a célula não existir, a linha deve ser marcada como erro (ou registrada sem vínculo, conforme decisão abaixo).

**Células**
- Campos: `code`, `name`, `meetingDay`, `meetingTime`, `address` (obrigatórios no caso de célula); `status` (padrão FORMING), `leaderId`, `supervisorId`, `traineeLeaderId` (opcionais).
- Confirma a regra do create unitário: `ACTIVE` exige líder e supervisor.
- Conflito de `code` entre linhas do próprio lote e com células existentes → erro por linha.

**Usuários**
- Campos: `firstName`, `lastName`, `email`, `initialPassword`, `roles` (nomes).
- Papéis resolvidos para UUIDs; apenas papéis gerenciáveis; `roleIds` únicos, máx 4.
- Força de senha pelo mesmo `evaluatePasswordStrength`.
- Duplicidade de e-mail; não permitir criar admin sem preservar o último administrador ativo (reuso da política).

Todas as operações respeitam `churchId` derivado do principal; nenhuma consulta atravessa igrejas.

## 9. Contratos

### Entradas

- Multipart: campo `file` (`.xlsx` | `.csv` | `.json`). Opcional campo `mode` para fins de compatibilidade futura (não usado nesta entrega).

### Saídas

```
{ data: {
    domain: "people" | "cells" | "users",
    fileName: string,
    format: "xlsx" | "csv" | "json",
    processed: number,
    created: number,
    failed: number,
    resultsPerRow: [{ row, status: "created" | "error", message?, errors? }]
  }, meta: {} }
```

### Erros esperados

- `BULK_INVALID_FILE_TYPE` (400): extensão não suportada.
- `BULK_EMPTY_FILE` (400): arquivo sem linhas de dados.
- `BULK_TOO_MANY_ROWS` (400 ou 413): acima do limite de linhas/tamanho.
- `BULK_INVALID_FORMAT` (400): parse falhou.
- `BULK_ROLE_NOT_FOUND` (por linha, não fecha o lote).
- `BULK_CELL_NOT_FOUND` (por linha, vínculo opcional).
- `AUTH_FORBIDDEN` (403): papel sem permissão.
- Reaproveitamento de códigos de domínio (ex.: `PERSON_DUPLICATE`, `CELL_CODE_CONFLICT`) dentro de `resultsPerRow`.

### Permissões

- Pessoas: ADMIN e PASTOR (igual ao create unitário).
- Células: ADMIN e PASTOR (igual ao create unitário).
- Usuários: ADMIN (igual ao create unitário).
- Igreja derivada do principal; escopo hierárquico aplicado por domínio.

## 10. Etapas

### Etapa 1 — Contratos compartilhados

- [x] planejar `packages/contracts/src/bulk-import.ts`.
- [x] schemas de itens canônicos por domínio.
- [x] envelope de resultado e erro por linha.
- [x] exportar no barrel `index.ts`.
- [x] testes unitários dos schemas.

### Etapa 2 — Base de upload no web

- [x] planear `http-client.ts` para suportar multipart.
- [x] planear método `uploadFile` em `api-client`.
- [x] implementar ambos.
- [x] testes unitários.

### Etapa 3 — Parser unificado (API)

- [x] definir interface `FileParser` + `parseFile(file, mimeType): ParsedRows`.
- [x] planear implementações: `xlsx` (exceljs), `csv` (`csv-parse`), `json`.
- [x] planear normalização de cabeçalhos (primeira linha).
- [x] implementar `xlsx.parser.ts`, `csv.parser.ts`, `json.parser.ts`.
- [x] testes unitários dos formatos, detecção, BOM e formatos inválidos.

### Etapa 4 — Comandos de importação por domínio (API)

- [x] planear `BulkImportPeople`, `BulkImportCells`, `BulkImportUsers` reutilizando UoW existentes.
- [x] planear resolução de papéis por nome e de `cellCode`.
- [x] planear captura de erro por linha sem fechar o lote.
- [x] implementar os três fluxos de caso de uso.
- [x] testes unitários; integração preparada, não executada sem `TEST_DATABASE_URL`.

### Etapa 5 — Controller, módulo e Swagger (API)

- [x] planear `BulkImportController` com `POST /import/{domain}`.
- [x] planear `FileInterceptor` e validação de extensão/tamanho.
- [x] planear registros no `bulk-import.module` e `AppModule`.
- [x] implementar.
- [x] módulo, DI, Swagger e limites validados por lint/typecheck/build; E2E de banco não executado sem `TEST_DATABASE_URL`.

### Etapa 6 — Frontend

- [x] planear feature `bulk-import`.
- [x] planear páginas de upload por domínio com template.
- [x] planear apresentação de resultado por linha.
- [x] implementar.
- [x] teste E2E web criado; execução bloqueada pela ausência da stack/banco de teste.

### Etapa 7 — Validar e documentar

- [x] comandos da seção 18;
- [x] mover plano para `completed`.

## 11. Critérios de aceitação

1. POST `/import/people`, `/import/cells`, `/import/users` aceitam arquivos `.xlsx`, `.csv` e `.json` (mesmo endpoint por domínio).
2. Formato detectado por extensão/MIME; arquivo não suportado retorna 400.
3. Cada linha inválida é reportada com erro por linha sem impedir a criação das válidas.
4. Regras de negócio existentes (duplicidade, conflito de código, senha, papéis) valem para linhas do lote.
5. `churchId` deriva do principal; nenhum registro é criado fora da igreja.
6. Vínculo opcional pessoa→célula por `cellCode` gera `CellMembership ACTIVE`.
7. Usuários importados por nome de papel são resolvidos para UUIDs e respeitam papéis gerenciáveis (máx 4).
8. A resposta traz `processed`, `created`, `failed` e `resultsPerRow`.
9. Auditoria registra as importações (agregada e por recurso) com as novas ações `*_BULK_IMPORT`.
10. Frontend expõe upload + resultado por linha para cada domínio.
11. Lint, typecheck, testes e build aprovados.

## 12. Estratégia de testes

### Unitários
- Parser xlsx/csv/json (cabeçalhos, aspas, BOM, injeção CSV).
- Schemas `bulk-import` (itens válidos/inválidos).
- Comandos de importação por domínio (duplicidade, conflito de código, resolução de papéis, erro por linha, vínculo opcional).

### Integração
- Importação persistida dentro da igreja; isolamento entre igrejas.
- Auditoria gerada; `CellMembership` criada para vínculo.
- Importação de usuários com papéis por nome.

### E2E
- API: upload de `.xlsx`/`.csv`/`.json` por domínio (guarda por `TEST_DATABASE_URL`).
- Web: Playwright com upload e apresentação do resultado.

### Validação manual
- Enviar arquivos com linhas válidas e inválidas; conferir resumo e auditoria.

## 13. Segurança e privacidade

- Autorização por papel (ADMIN/PASTOR por domínio) validada no servidor.
- Isolamento por igreja em todas as consultas.
- Dados sensíveis (observações) restritos conforme política de pessoas.
- CSV: leitura com parser robusto; conteúdo do arquivo não é executado.
- Logs não registram senhas nem conteúdo de arquivo; apenas resumos e ids.
- Limite de tamanho/linhas para evitar abuso de upload.

## 14. Migração de dados

- Nenhuma migration nova. Reutiliza modelos existentes. Não há seed.
- Arquivos enviados não são retidos no servidor (apenas processamento em memória).

## 15. Observabilidade

- Logar por operação: domínio, formato, processado/criados/falhas, id do principal e igreja.
- Não logar linhas nem senhas.

## 16. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| ----- | ------------- | ------- | --------- |
| Arquivos grandes/abuso | Média | Alto | Limite de 5 MB e 2.000 linhas; validação antes do parse. |
| Linha malformada derrubar o lote | Média | Médio | Erro por linha capturado; lote preserva as válidas. |
| Parse inconsistente entre formatos | Média | Médio | Normalização para itens canônicos + testes por formato. |
| Importação parcial com auditoria | Baixa | Médio | Transação por igreja; auditoria agregada e individual. |

## 17. Estratégia de reversão

- Reversão de código: reverter o módulo `bulk-import` e as mudanças de web; nenhuma migration a reverter.
- Reversão de dados: registros criados podem ser inativados (exclusão lógica) via endpoints existentes; usar auditoria para auditar o lote em caso de erro crítico.

## 18. Comandos de validação

```bash
npm lint
npm typecheck
npm test
npm build
```

Específicos: `npx jest src/modules/bulk-import` (API), `npx jest` (web), E2E quando houver `TEST_DATABASE_URL`.

## 19. Definition of Done

- [x] escopo implementado;
- [x] critérios de aceitação atendidos;
- [x] autorização validada no servidor;
- [x] testes criados ou atualizados;
- [x] lint executado;
- [x] typecheck executado;
- [x] testes executados;
- [x] build executado;
- [x] documentação atualizada;
- [x] riscos e limitações informados;
- [x] plano movido para `completed`.

## 20. Registro de progresso

### 2026-09-02

- realizado: análise de domínio e decisões de produto; plano criado.
- realizado: contratos Zod, upload multipart, parsers XLSX/CSV/JSON, comandos por domínio, vínculo pessoa-célula atômico por linha, resolução de papéis, auditoria agregada/individual, endpoints protegidos, páginas web e modelos CSV.
- realizado: mensagens inesperadas de infraestrutura são ocultadas; erros públicos retornam código por linha; upload não repete automaticamente mutações e usa timeout específico de 10 minutos.
- testes: `npm run lint` (6 tarefas), `npm run typecheck` (13 tarefas), `npm test` (11 tarefas; contracts 132, API 186, web 87) e `npm run build` (7 tarefas) aprovados.
- testes específicos: bulk import API 25 testes de comandos/parsers; people transaction 2 novos cenários; cliente multipart/web com cobertura unitária; E2E web criado.
- decisões: backend recebe arquivo multipart; formatos xlsx/csv/json; papéis de usuário por nome; vínculo opcional pessoa→célula por `cellCode`; escopo = importação em massa (sem remoção/checkbox nesta entrega).
- decisões: sucesso parcial usa uma transação serializável por linha, pois atomicidade de lote conflita com a exigência de persistir linhas válidas e reportar inválidas.
- limitações: `TEST_DATABASE_URL` não está configurada e a stack E2E não foi iniciada; integração real com PostgreSQL e Playwright não pôde ser executada neste ambiente. XLSX é carregado em memória pelo ExcelJS após o limite comprimido de 5 MB aplicado pelo Multer.
- próximo passo: executar os E2E em ambiente com banco de teste e stack web/API disponíveis.
