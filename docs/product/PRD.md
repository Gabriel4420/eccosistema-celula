# PRD — Gestão de Células e Pequenos Grupos

**Versão:** 1.0  
**Status:** Base para planejamento técnico  
**Público:** igreja local  
**Plataforma inicial:** aplicação web responsiva e PWA

---

## 1. Resumo

O produto será uma aplicação para organizar células e pequenos grupos de uma igreja local.

O sistema deverá facilitar o trabalho operacional dos líderes no celular e oferecer ao pastor, administradores e supervisores uma visão consolidada das células, pessoas, encontros, frequência, visitantes e relatórios pendentes.

O MVP não pretende substituir todos os módulos de um sistema completo de gestão eclesiástica. Seu objetivo é entregar somente o fluxo de células que a igreja realmente utiliza, com uma experiência mais simples.

---

## 2. Problema

A igreja utiliza uma solução ampla, com muitos recursos que não fazem parte da rotina do ministério de células. Isso aumenta a complexidade de uso e mantém a equipe dependente de um produto subutilizado.

Os principais problemas que o novo sistema deve resolver são:

- excesso de telas e funcionalidades desnecessárias;
- dificuldade para registrar frequência no celular;
- relatórios enviados por meios dispersos;
- falta de acompanhamento claro dos relatórios pendentes;
- cadastros duplicados de participantes e visitantes;
- pouca clareza sobre a saúde das células;
- dependência de planilhas ou consolidações manuais;
- dificuldade para supervisores acompanharem apenas suas células.

---

## 3. Objetivo do produto

Criar uma ferramenta simples para que:

- líderes registrem encontros e frequência rapidamente;
- supervisores acompanhem suas células;
- a liderança consulte indicadores básicos;
- a igreja mantenha um cadastro central de pessoas;
- visitantes possam ser identificados e acompanhados;
- relatórios pendentes sejam encontrados sem consolidação manual.

---

## 4. Princípios

1. **Simplicidade:** as ações mais comuns devem exigir poucos passos.
2. **Uso pelo celular:** o fluxo do líder deve funcionar bem em telas pequenas.
3. **Escopo controlado:** funcionalidades fora do fluxo de células não entram no MVP.
4. **Segurança:** cada usuário acessa somente o necessário.
5. **Dados confiáveis:** o sistema deve reduzir duplicidades e preservar históricos.
6. **Evolução gradual:** novas funcionalidades entram apenas após validação do MVP.

---

## 5. Indicadores de sucesso

| Indicador | Meta inicial |
|---|---:|
| Relatórios enviados dentro do prazo | 80% ou mais |
| Tempo médio para registrar frequência | até 2 minutos |
| Líderes ativos semanalmente | 70% ou mais |
| Relatórios com campos obrigatórios incompletos | menos de 10% |
| Redução de cadastros duplicados | 50% ou mais |
| Disponibilidade mensal | 99,5% |
| Adoção no projeto-piloto | 80% dos líderes convidados |

As metas deverão ser revisadas após o piloto.

---

## 6. Perfis

### 6.1 Administrador

Responsável por:

- usuários;
- papéis;
- cadastros gerais;
- estrutura;
- células;
- correções administrativas;
- exportações;
- configurações básicas.

### 6.2 Pastor ou coordenador

Responsável por:

- visão geral;
- indicadores;
- acompanhamento de supervisões;
- consulta de células críticas;
- consulta de relatórios consolidados.

### 6.3 Supervisor

Responsável por:

- visualizar células subordinadas;
- acompanhar relatórios;
- consultar frequência;
- acompanhar líderes;
- identificar pendências.

### 6.4 Líder

Responsável por:

- visualizar sua célula;
- consultar participantes;
- registrar encontro;
- marcar frequência;
- cadastrar visitante;
- preencher e enviar relatório;
- consultar histórico da própria célula.

---

## 7. Escopo do MVP

### 7.1 Autenticação e acesso

- login com e-mail e senha;
- recuperação de senha;
- encerramento de sessão;
- usuários ativos e bloqueados;
- papéis: administrador, pastor, supervisor e líder;
- proteção de rotas;
- restrição por vínculo hierárquico.

### 7.2 Estrutura

Estrutura inicial fixa:

```text
Pastor ou coordenador
└── Supervisor
    └── Líder
        └── Célula
```

O MVP não precisa de um construtor genérico de níveis hierárquicos.

### 7.3 Células

Cada célula deve possuir:

- nome;
- código;
- status;
- supervisor;
- líder;
- líder em treinamento, opcional;
- dia da semana;
- horário;
- endereço;
- capacidade recomendada;
- data de início;
- observações administrativas.

Status iniciais:

- ativa;
- em formação;
- suspensa;
- encerrada.

### 7.4 Pessoas

Cadastro central com:

- nome completo;
- data de nascimento, opcional;
- telefone;
- e-mail, opcional;
- sexo, quando informado;
- status;
- vínculo atual com uma célula;
- histórico de vínculos;
- classificação como participante ou visitante.

### 7.5 Participantes

- listar participantes ativos da célula;
- adicionar pessoa existente;
- cadastrar nova pessoa;
- inativar vínculo sem apagar a pessoa;
- consultar histórico básico de presença;
- transferir pessoa entre células com preservação do histórico.

### 7.6 Visitantes

Cadastro rápido durante o encontro:

- nome obrigatório;
- telefone opcional;
- pessoa que convidou, opcional;
- observação;
- sinalização de cadastro incompleto.

O sistema deve buscar registros semelhantes antes de criar uma nova pessoa.

### 7.7 Encontros

- criar encontro manualmente;
- sugerir data e horário padrão da célula;
- registrar encontro realizado;
- cancelar encontro com justificativa;
- impedir encontro equivalente duplicado para a mesma célula e data.

### 7.8 Frequência

Status iniciais:

- presente;
- ausente;
- justificado.

Requisitos:

- carregar participantes ativos;
- permitir marcação rápida no celular;
- incluir visitantes;
- impedir mais de um status por pessoa no mesmo encontro;
- salvar rascunho antes do envio.

### 7.9 Relatório do encontro

Campos iniciais:

- data;
- presentes;
- ausentes;
- visitantes;
- quantidade de crianças;
- tema ou estudo, opcional;
- pedidos de oração, opcional e com acesso restrito;
- observações;
- motivo do cancelamento;
- responsável pelo preenchimento;
- data de envio.

Status:

- não iniciado;
- rascunho;
- enviado;
- devolvido;
- cancelado.

A aprovação formal pode ser adicionada após o piloto.

### 7.10 Dashboard

Indicadores iniciais:

- total de células ativas;
- total de participantes ativos;
- visitantes no período;
- frequência média;
- relatórios pendentes;
- células sem líder em treinamento;
- células com frequência abaixo do limite;
- encontros realizados e cancelados.

Filtros:

- período;
- supervisor;
- célula;
- status.

### 7.11 Relatórios e exportações

- lista de relatórios pendentes;
- frequência por célula;
- visitantes por período;
- encontros realizados;
- exportação CSV de células, pessoas e frequência.

---

## 8. Fora do MVP

- aplicativo mobile nativo;
- publicação em lojas;
- funcionamento integral sem internet;
- sincronização complexa entre dispositivos;
- multi-igreja comercial;
- cobrança, planos e assinaturas;
- mapa;
- geolocalização;
- notificações push;
- integração com WhatsApp;
- chat;
- módulo financeiro;
- gestão de cursos;
- gestão de eventos;
- gestão completa de membresia;
- relatórios personalizados;
- inteligência artificial;
- gamificação;
- QR Code;
- aplicativo para participantes.

---

## 9. Requisitos funcionais

### RF-001 — Login

O usuário ativo deve conseguir entrar com e-mail e senha.

### RF-002 — Recuperação de senha

O usuário deve conseguir solicitar uma redefinição por e-mail.

### RF-003 — Usuários e papéis

O administrador deve criar, editar, bloquear e atribuir papéis.

### RF-004 — Restrição hierárquica

O supervisor deve visualizar somente as células sob sua responsabilidade. O líder deve visualizar somente sua célula.

### RF-005 — Cadastro de célula

Usuários autorizados devem criar e editar células.

### RF-006 — Cadastro central de pessoa

O sistema deve manter uma única pessoa reutilizável em diferentes vínculos e encontros.

### RF-007 — Verificação de duplicidade

Antes de criar uma pessoa, o sistema deve procurar por telefone, e-mail e combinação de nome com data de nascimento.

### RF-008 — Vínculo com célula

Uma pessoa pode possuir histórico em várias células, mas somente um vínculo principal ativo.

### RF-009 — Cadastro rápido de visitante

O líder deve cadastrar um visitante com apenas o nome obrigatório.

### RF-010 — Criação de encontro

O líder deve criar o encontro da própria célula.

### RF-011 — Cancelamento

Um encontro cancelado deve exigir justificativa e não reduzir a frequência.

### RF-012 — Registro de presença

O líder deve marcar o status de cada participante.

### RF-013 — Rascunho

O relatório deve poder ser salvo sem envio.

### RF-014 — Envio

O sistema deve validar campos obrigatórios e registrar data e responsável.

### RF-015 — Relatórios pendentes

O painel deve listar encontros passados sem relatório enviado.

### RF-016 — Dashboard

Indicadores devem respeitar período, papel e hierarquia.

### RF-017 — Exportação

A exportação deve ser restrita a usuários autorizados.

### RF-018 — Auditoria básica

O sistema deve registrar ações administrativas e alterações críticas.

---

## 10. Regras de negócio

### RN-001 — Escopo de acesso

Nenhum usuário pode consultar uma célula fora do seu escopo autorizado.

### RN-002 — Célula ativa

Uma célula ativa deve possuir líder responsável, salvo exceção administrativa temporária.

### RN-003 — Relatório único

Uma célula não pode possuir dois relatórios ativos para o mesmo encontro.

### RN-004 — Encontro cancelado

Encontros cancelados não entram no cálculo de frequência.

### RN-005 — Visitantes

Visitantes contam no total presente, mas não no total esperado de participantes.

### RN-006 — Participantes únicos

Uma pessoa deve ser contada uma única vez nos indicadores de pessoas únicas do período.

### RN-007 — Exclusão lógica

Células, pessoas, vínculos e encontros não devem ser apagados permanentemente pela operação comum.

### RN-008 — Transferência

Transferir um participante não apaga sua frequência anterior.

### RN-009 — Dados sensíveis

Pedidos de oração e observações pastorais devem possuir acesso mais restrito que o relatório operacional.

### RN-010 — Prazo de relatório

A igreja pode configurar o prazo padrão para envio. A configuração inicial será de 48 horas após o encontro.

### RN-011 — Frequência

```text
frequência = presenças de participantes ativos ÷ presenças esperadas × 100
```

Visitantes devem ser exibidos separadamente.

### RN-012 — Faixas iniciais

- saudável: 80% ou mais;
- atenção: de 51% a 79%;
- crítica: 50% ou menos.

Os limites poderão se tornar configuráveis depois do piloto.

---

## 11. Histórias prioritárias

### US-001 — Entrar no sistema

Como usuário ativo, quero entrar com e-mail e senha para acessar os recursos do meu papel.

Critérios:

- credenciais válidas autenticam;
- usuário bloqueado é rejeitado;
- mensagem de falha não revela se o e-mail existe;
- sessão expira com segurança.

### US-002 — Cadastrar célula

Como administrador, quero cadastrar uma célula para vinculá-la a um supervisor e líder.

Critérios:

- nome, código, supervisor, líder, dia e horário são obrigatórios;
- código é único;
- ação gera auditoria.

### US-003 — Cadastrar pessoa

Como usuário autorizado, quero cadastrar uma pessoa para vinculá-la a uma célula.

Critérios:

- nome é obrigatório;
- sistema procura duplicidades;
- vínculos anteriores são preservados.

### US-004 — Registrar encontro

Como líder, quero iniciar um encontro para registrar frequência e relatório.

Critérios:

- somente a própria célula pode ser selecionada;
- não cria encontro duplicado;
- data e horário padrão são sugeridos.

### US-005 — Marcar frequência

Como líder, quero marcar presentes e ausentes para registrar a participação.

Critérios:

- lista mostra participantes ativos;
- cada pessoa recebe somente um status;
- visitantes podem ser adicionados;
- alterações podem ser salvas como rascunho.

### US-006 — Enviar relatório

Como líder, quero enviar o relatório para disponibilizá-lo à supervisão.

Critérios:

- campos obrigatórios são validados;
- data e responsável são registrados;
- envio duplicado é impedido;
- usuário recebe confirmação.

### US-007 — Consultar pendências

Como supervisor, quero visualizar relatórios pendentes para cobrar ou apoiar os líderes.

Critérios:

- lista respeita a hierarquia;
- apresenta célula, líder, data e atraso;
- permite abrir detalhes.

### US-008 — Visualizar indicadores

Como pastor, quero consultar indicadores para acompanhar a saúde das células.

Critérios:

- possui filtro por período;
- valores respeitam o escopo;
- cálculos seguem as regras do PRD.

---

## 12. Modelo de domínio inicial

Entidades principais:

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
```

Relacionamentos essenciais:

- uma igreja possui usuários e células;
- um supervisor acompanha várias células;
- uma célula possui um líder;
- uma pessoa pode ter vários vínculos históricos;
- uma célula possui encontros;
- um encontro possui presenças e um relatório;
- alterações críticas geram auditoria.

---

## 13. Requisitos não funcionais

### Segurança

- HTTPS;
- hash seguro de senha;
- proteção contra força bruta;
- autorização no servidor;
- segredo fora do código;
- auditoria básica;
- princípio do menor privilégio.

### Desempenho

- páginas principais em até 3 segundos em condições normais;
- listas paginadas;
- dashboard com consultas agregadas eficientes;
- feedback imediato ao salvar frequência.

### Disponibilidade e dados

- backups automáticos;
- procedimento de restauração documentado;
- monitoramento de erros;
- dados armazenados em UTC;
- exportações controladas.

### Acessibilidade

- navegação por teclado;
- contraste adequado;
- rótulos em campos;
- mensagens de erro claras;
- áreas de toque adequadas no celular.

### Compatibilidade

- navegadores modernos;
- layout responsivo;
- instalação como PWA quando suportada;
- prioridade para Android e navegadores usados pela igreja.

---

## 14. Roadmap sugerido

1. fundação do monorepo;
2. banco e modelo inicial;
3. autenticação e papéis;
4. células e estrutura;
5. pessoas e vínculos;
6. encontros e frequência;
7. relatórios e pendências;
8. dashboard;
9. exportações;
10. piloto com poucas células;
11. ajustes e lançamento.

---

## 15. Definition of Done do MVP

O MVP estará pronto quando:

- usuários entrarem com segurança;
- cada papel visualizar apenas o escopo permitido;
- células, pessoas e vínculos puderem ser administrados;
- líderes registrarem frequência pelo celular;
- visitantes puderem ser adicionados;
- relatórios puderem ser enviados;
- supervisores visualizarem pendências;
- o dashboard exibir os indicadores definidos;
- exportações básicas funcionarem;
- ações críticas forem auditadas;
- testes dos fluxos principais passarem;
- o piloto for concluído sem perda de dados.

---

## 16. Perguntas pendentes

Antes de implementar módulos relacionados, confirmar:

- qual é a nomenclatura oficial dos papéis;
- quantos supervisores e líderes usarão o sistema;
- quais campos do relatório atual são realmente utilizados;
- se pedidos de oração ficarão no MVP;
- quem pode editar um relatório enviado;
- qual prazo oficial de envio;
- quais dados existentes serão migrados;
- se a igreja exige aprovação do relatório;
- quais exportações são indispensáveis;
- onde a aplicação será hospedada;
- quais dispositivos e navegadores serão usados no piloto.
