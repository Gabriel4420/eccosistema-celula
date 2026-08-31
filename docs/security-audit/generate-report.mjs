import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "relatorio-auditoria-seguranca.pdf");
const HTML = join(__dirname, ".report.html");

const COLORS = {
  critica: "#B91C1C",
  alta: "#EA580C",
  media: "#D97706",
  baixa: "#2563EB",
  pontoForte: "#059669"
};

const SEVERITY_ORDER = ["critica", "alta", "media", "baixa", "info"];
const SEVERITY_LABEL = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  info: "Informativa"
};

const CATEGORIES = [
  { id: "1", name: "Banco sem tranca (isolamento de inquilino)" },
  { id: "2", name: "Permissão definida no navegador" },
  { id: "3", name: "IDOR" },
  { id: "4", name: "Chaves expostas (hardcode)" },
  { id: "5", name: "Inputs sem tratamento (XSS)" }
];

const findings = [
  {
    id: "4.1",
    severity: "alta",
    category: "4",
    file: "packages/config/src/server.ts:12,17,31-36,69-77",
    title: "Validação de startup não rejeita segredos padrão públicos (JWT_ACCESS_SECRET / REFRESH_TOKEN_PEPPER)",
    description:
      "<code>parseAuthenticationEnvironment</code> (server.ts:69-77) exige que os dois segredos tenham &ge;32 caracteres e sejam distintos, mas <b>não rejeita os valores placeholder do <code>.env.example</code></b>. Tanto <code>replace-with-at-least-32-random-characters</code> (37 chars) quanto <code>replace-with-a-different-32-character-secret</code> (46 chars) passam na validação. Um deploy que copie o <code>.env.example</code> para produção sobe a API com segredos de assinatura <b>publicamente conhecidos</b>.",
    exploitable:
      "Atacante pode assinar tokens JWT de acesso (claims <code>sub</code>, <code>churchId</code>, <code>roles[]</code> — inclusive <code>ADMIN</code>) e derivar refresh tokens usando a pepper conhecida, obtendo acesso total a todos os dados, células, pessoas e usuários da igreja.",
    impact: "Comprometimento total da autenticação e autorização (account takeover de qualquer usuário).",
    fix: "Rejeitar na validação de ambiente os valores placeholder conhecidos, exigir uma entropia mínima (ex.: base64 ≥ 32 bytes aleatórios) e bloquear inicialização em produção se <code>NODE_ENV=production</code> com segredo padrão."
  },
  {
    id: "4.2",
    severity: "media",
    category: "4",
    file: "packages/config/src/server.ts:24-27 · .env:20 · apps/api/src/modules/identity/presentation/cookies/refresh-cookie.service.ts:44-52",
    title: "AUTH_COOKIE_SECURE default false e nenhuma guarda de startup obriga Secure em produção",
    description:
      "<code>AUTH_COOKIE_SECURE</code> tem default <code>false</code> (server.ts:24-27) e o <code>.env</code> local define <code>false</code> (.env:20). O cookie de refresh é emitido sem a flag <code>Secure</code> (refresh-cookie.service.ts:46-47) quando <code>false</code>. Não há validação de startup que force <code>Secure=true</code> quando <code>NODE_ENV=production</code>.",
    exploitable:
      "Em produção (Render/Vercel, HTTPS), se <code>AUTH_COOKIE_SECURE</code> não for sobrescrito para <code>true</code>, o cookie httpOnly de refresh viaja sem <code>Secure</code>. Qualquer downgrade a HTTP ou interceptação (ex.: rede corporativa, proxy, MITM em HTTP) permite captura do token de refresh e sequestro de sessão. A flag também muda o <code>path</code> do cookie (/auth vs /api/auth), acoplando a configuração e o roteamento.",
    impact: "Sequestro de sessão por captura do cookie de refresh em conexões não criptografadas.",
    fix: "Forçar <code>AUTH_COOKIE_SECURE=true</code> quando <code>NODE_ENV=production</code> (rejeitar <code>false</code> em produção) e manter um único <code>path</code> estável (/api/auth) independente do ambiente."
  },
  {
    id: "1.1",
    severity: "media",
    category: "1",
    file: "packages/database/prisma/schema.prisma · apps/api/src/main.ts (sem RLS)",
    title: "Isolamento de inquilino feito apenas na camada de aplicação — sem Row-Level Security no PostgreSQL",
    description:
      "O isolamento entre igrejas (tenant) é implementado exclusivamente filtrando <code>churchId</code> (derivado de <code>principal.churchId</code>) em cada repository Prisma. Não há <b>Row-Level Security (RLS)</b> no banco nem políticas por papel. O esquema é explicitamente multi-inquilino (church_id em toda tabela de negócio), mas a tranca do dado depende de cada query de aplicação lembrar de filtrar.",
    exploitable:
      "Um único caminho de consulta (listagem, busca, agregação, relatório futuro, exportação ou raw query) que omita o filtro <code>churchId</code> vaza dados de outra igreja. Hoje o deploy é single-tenant (<code>AUTH_CHURCH_ID</code> fixo), o que reduz a exposição prática, mas o modelo é multi-tenant e a defesa em profundidade no banco está ausente.",
    impact: "Vazamento de dados entre igrejas se qualquer consulta esquecer o filtro; sem defesa em profundidade no banco.",
    fix: "Configurar RLS no PostgreSQL com política por <code>church_id</code> e <code>session.church_id</code> setado por sessão autenticada, mantendo o filtro de aplicação como segunda camada."
  },
  {
    id: "2.1",
    severity: "baixa",
    category: "2",
    file: "apps/web/src/shared/auth/guards.tsx:41-74 · app/(authenticated)/layout.tsx (sem middleware.ts)",
    title: "Autorização do frontend é 100% client-side — sem proteção no servidor (Next.js middleware / Server Components)",
    description:
      "As checagens <code>RequireRole</code> (guards.tsx:41-61) e <code>Can</code> (guards.tsx:63-74) são componentes client (<code>\"use client\"</code>) e apenas <b>escondem a UI</b> com base em <code>principal.roles</code>. Não há <code>middleware.ts</code> nem roteamento protegido no servidor; as páginas são entregues ao navegador antes que o JS do cliente redirecione.",
    exploitable:
      "Não há escalonamento de privilégio real, pois a API <b>valida</b> todas as rotas sensíveis no servidor (ver Pontos Fortes). Porém é uma falha de defesa em profundidade: conteúdo/UI de admin é transferido a usuários sem permissão, e o sistema depende da correção da API como única barreira. Qualquer rota sensível futura adicionada sem <code>@Roles</code>/política seria exposta.",
    impact: "Exposição de UI e marcação de papéis no cliente; depende de defesa única na API para segurança real.",
    fix: "Adicionar <code>middleware.ts</code>/Server Components para autenticar e autorizar no servidor e não servir conteúdo restrito a não autorizados."
  },
  {
    id: "4.3",
    severity: "baixa",
    category: "4",
    file: "apps/web/next.config.ts:8",
    title: "API_PROXY_TARGET aponta por padrão para endpoint de produção",
    description:
      "<code>next.config.ts:8</code> usa <code>process.env.API_PROXY_TARGET ?? \"https://eccosistema-celula.onrender.com\"</code> — um endpoint real de produção como padrão. Um build/dev local sem a variável redireciona tráfego autenticado para a API de produção.",
    exploitable:
      "Sessões e requisições de um ambiente de desenvolvimento/palco são roteadas para a API de produção, gerando efeitos colaterais em dados reais ou exposição cruzada de ambiente. Não é um segredo, mas é config de produção embutida como default.",
    impact: "Roteamento acidental de tráfego para produção e risco de operações sobre dados reais em ambientes de dev/teste.",
    fix: "Remover o default de produção (obrigar a variável <code>API_PROXY_TARGET</code> por ambiente) ou torná-lo vazio/inválido por padrão."
  },
  {
    id: "5.1",
    severity: "baixa",
    category: "5",
    file: "apps/web/app/layout.tsx:32 · apps/web/next.config.ts (sem headers CSP)",
    title: "dangerouslySetInnerHTML presente e nenhuma Content-Security-Policy configurada",
    description:
      "<code>app/layout.tsx:32</code> injeta via <code>dangerouslySetInnerHTML</code> o script de inicialização de tema. O conteúdo é uma constante estática (não controlada por usuário), então hoje não há injeção. Contudo, <code>next.config.ts</code> não define nenhum header de segurança — não há Content-Security-Policy (<code>script-src</code>, <code>img-src</code>), nem <code>X-Frame-Options</code>/HSTS.",
    exploitable:
      "Sem CSP, qualquer futura imagem <code>data:</code> ou sink de HTML não sanitizado (e o próprio <code>dangerouslySetInnerHTML</code> se um dia receber dado dinâmico) pode executar script. A ausência de CSP é o vetor habilitador para XSS no painel.",
    impact: "Sem CSP, o risco de XSS futuro não é mitigado pelo navegador.",
    fix: "Adicionar Headers de CSP estrita em <code>next.config.ts</code> (ex.: <code>script-src 'self'; img-src 'self' data: https:; object-src 'none'</code>) e, idealmente, substituir o script inline por um arquivo estático."
  },
  {
    id: "1.2",
    severity: "info",
    category: "1",
    file: "apps/api/src/modules/cells/infrastructure/prisma-cells-management.repository.ts:287-291",
    title: "findCellByCode não filtra deletedAt (célula excluída logicamente pode bloquear o código)",
    description:
      "<code>findCellByCode</code> filtra por <code>code</code> e <code>churchId</code>, mas não por <code>deletedAt</code>. Já as demais queries de listagem filtram <code>deletedAt: null</code>. Código scoped por igreja (sem vazamento cross-tenant), porém uma célula soft-deleted pode continuar 'ocupando' o código na checagem de unicidade.",
    exploitable:
      "Sem impacto multi-inquilino; trata-se de inconsistência lógica intra-igreja que pode impedir reutilização de código de célula após exclusão lógica.",
    impact: "Bloqueio acidental de código de célula; baixíssimo risco de segurança.",
    fix: "Adicionar <code>deletedAt: null</code> ao <code>where</code> de <code>findCellByCode</code> para consistência com as demais consultas."
  },
  {
    id: "4.4",
    severity: "info",
    category: "4",
    file: ".env:9,13,14,18 (arquivo local gitignored)",
    title: ".env local contém segredos aparentemente reais (Neon DB, JWT secret, pepper) — histórico git limpo",
    description:
      "O <code>.env</code> do workspace contém valores de alta entropia que parecem credenciais reais de produção (<code>DATABASE_URL</code> da Neon com senha, <code>JWT_ACCESS_SECRET</code>, <code>REFRESH_TOKEN_PEPPER</code>, <code>AUTH_CHURCH_ID</code>). O arquivo é corretamente gitignored e <b>não</b> está no histórico do git (verificado: histórico limpo), então não vazou pelo repositório.",
    exploitable:
      "Mesmo sem commit, segredos reais de produção armazenados em .env local podem vazar por backup, máquina compartilhada, screenshot, logs ou compartilhamento acidental do arquivo. Recomenda-se confirmar se não são credenciais de produção e rotacioná-las.",
    impact: "Caso sejam credenciais de produção reais, vazamento local comprometeria o banco e os tokens.",
    fix: "Verificar/rotacionar as credenciais, nunca commitá-las, e usar cofre de segredos (secret manager da plataforma de deploy) em vez de .env local em produção."
  }
];

const strengths = [
  {
    title: "Isolamento por igreja na camada de aplicação (Categoria 1 e 3)",
    body: "Revisão sistemática de todos os 8 controllers (health, auth, users, people, church, cells, meetings, attendance) e de todos os repositories: toda query filtra por <code>churchId</code> derivado de <code>principal.churchId</code>, e toda escrita usa chaves compostas que embutem <code>churchId</code> (<code>id_churchId</code>, <code>churchId_meetingId_personId</code>). Não foi encontrado IDOR cross-tenant."
  },
  {
    title: "Autorização de servidor em toda rota sensível (Categoria 2)",
    body: "Todas as rotas de escrita e gestão carregam <code>@Roles(...)</code> + políticas de aplicação (<code>assertAdministrator</code>, <code>assertManager</code>, <code>ManageUserPolicy</code>, <code>ViewPersonPolicy</code>, <code>CellViewPolicy</code>, <code>MeetingEditPolicy</code>, <code>AttendancePolicy</code>). Nenhum gate de papel do frontend depende de verificação no navegador — a API valida o privilégio em toda rota sensível (ex.: users.controller.ts:105,141,158,172,186,202,229,248)."
  },
  {
    title: "Tratamento de XSS no frontend (Categoria 5)",
    body: "React escapa todo texto interpolado; não há <code>innerHTML</code>, <code>eval</code> ou <code>new Function</code>; não há href/src controlados por usuário (links internos de UUID + link WhatsApp estático); não há renderização de markdown/HTML vindo da API. O access token vive apenas em memória (não em localStorage/cookie), robustecendo contra XSS."
  },
  {
    title: "Higiene de segredos no git (Categoria 4)",
    body: "<code>.env</code> está corretamente no <code>.gitignore</code> e nunca foi commitado. O histórico do git está limpo: nenhum segredo real de produção foi encontrado (apenas placeholders e valores locais <code>local_dev_only</code>/<code>replace-with-*</code>)."
  },
  {
    title: "Criptografia da sessão e rate limiting",
    body: "Senhas com Argon2id; refresh token opaco com pepper e rotação de sessão (com detecção de reuso de token por família); cookie httpOnly + sameSite strict; rate limiting de login por IP e conta; CORS com allowlist de origens."
  }
];

const recommendations = [
  {
    pr: "P1",
    severity: "alta",
    text: "Rejeitar segredos padrão/placeholder na validação de ambiente e exigir entropia mínima para JWT_ACCESS_SECRET e REFRESH_TOKEN_PEPPER; bloquear inicialização em produção com segredo público (findings 4.1)."
  },
  {
    pr: "P1",
    severity: "media",
    text: "Forçar AUTH_COOKIE_SECURE=true em produção (NODE_ENV=production) e unificar o path do cookie de refresh (finding 4.2)."
  },
  {
    pr: "P2",
    severity: "media",
    text: "Implementar Row-Level Security no PostgreSQL com políticas por church_id, mantendo o filtro de aplicação como segunda camada (finding 1.1)."
  },
  {
    pr: "P2",
    severity: "baixa",
    text: "Adicionar proteção de autorização no servidor do Next.js (middleware.ts / Server Components) para não servir UI restrita a não autorizados (finding 2.1)."
  },
  {
    pr: "P3",
    severity: "baixa",
    text: "Remover o default de endpoint de produção em API_PROXY_TARGET e adicionar headers de CSP estrita em next.config.ts (findings 4.3, 5.1)."
  },
  {
    pr: "P3",
    severity: "info",
    text: "Consistir findCellByCode com deletedAt e verificar/rotacionar eventuais credenciais reais no .env local (findings 1.2, 4.4)."
  }
];

const issues = [
  {
    title: "[Segurança] Validação de startup aceita segredos JWT/pépper placeholder de conhecimento público",
    labels: "security, alta",
    body: `## Problema
A validação de ambiente da API (\`parseAuthenticationEnvironment\`) exige que \`JWT_ACCESS_SECRET\` e \`REFRESH_TOKEN_PEPPER\` tenham ≥32 caracteres e sejam distintos, mas **não rejeita os valores placeholder do** \`.env.example\`. Ambos os exemplares públicos (\`replace-with-at-least-32-random-characters\`, \`replace-with-a-different-32-character-secret\`) passam na validação por terem ≥32 chars.

## Por que é explorável
Um deploy que copie o \`.env.example\` para produção sobe com segredos de assinatura publicamente conhecidos. O atacante forja um JWT de acesso com \`roles: [\"ADMIN\"]\` (claims \`sub\`, \`churchId\`, \`sid\`) e deriva refresh tokens usando a pépper conhecida → acesso total à conta de qualquer usuário e a todos os dados da organização.

## Evidência
\`packages/config/src/server.ts:12,17,31-36,69-77\`
\`\`\`ts
JWT_ACCESS_SECRET: z.string().min(32).optional(),
REFRESH_TOKEN_PEPPER: z.string().min(32).optional(),
...
const authenticationEnvironmentSchema = serverEnvironmentSchema.required({
  JWT_ACCESS_SECRET: true, REFRESH_TOKEN_PEPPER: true
});
// valida apenas:  (1) presentes, (2) ≥32 chars, (3) distintos
if (parsed.JWT_ACCESS_SECRET === parsed.REFRESH_TOKEN_PEPPER) throw ...
\`\`\`
\`.env.example:16,22\`

## Impacto
Account takeover total e comprometimento da autenticação/autorização de toda a plataforma.

## Sugestão de correção
Rejeitar um bloco de placeholders conhecidos; exigir entropia mínima (ex.: base64url ≥ 32 bytes); bloquear inicialização com \`NODE_ENV=production\` se o segredo for padrão.

## Critérios de aceite
- [ ] \`parseAuthenticationEnvironment\` rejeita os valores placeholder de \`.env.example\`.
- [ ] Rejeição cobre variações (\`replace-with-*\`, \`change-me\`, senha padrão etc.).
- [ ] Testes unitários cobrem os casos placeholder e a ausência dos segredos em produção.
- [ ] \`.env.example\` documenta a rotação obrigatória.`
  },
  {
    title: "[Segurança] Cookie de refresh sem flag Secure em produção (AUTH_COOKIE_SECURE default false)",
    labels: "security, média",
    body: `## Problema
\`AUTH_COOKIE_SECURE\` tem default \`false\` e não há guarda de startup que o force a \`true\` quando \`NODE_ENV=production\`. O cookie httpOnly de refresh é emitido sem \`Secure\`.

## Evidência
\`packages/config/src/server.ts:24-27\` (\`AUTH_COOKIE_SECURE: z.enum([\"true\",\"false\"]).default(\"false\")\`)
\`apps/api/src/modules/identity/presentation/cookies/refresh-cookie.service.ts:44-52\` (cookies sem \`secure\` quando false; path muda entre \`/auth\` e \`/api/auth\`)
\`.env:20\` (\`AUTH_COOKIE_SECURE=false\`)

## Impacto
Sequestro de sessão por captura do token de refresh em conexões HTTP (downgrade/MITM) em produção.

## Sugestão de correção
Em \`NODE_ENV=production\`, exigir \`AUTH_COOKIE_SECURE=true\` (erro de startup se \`false\`) e fixar um único \`path\` (/api/auth).

## Critérios de aceite
- [ ] Startup falha em produção com \`AUTH_COOKIE_SECURE=false\`.
- [ ] Cookie emitido com flag \`Secure\` em produção.
- [ ] \`path\` do cookie estável entre ambientes.
- [ ] Testes cobrem os cenários dev/prod.`
  },
  {
    title: "[Segurança] Isolamento de inquilino sem Row-Level Security no PostgreSQL",
    labels: "security, média",
    body: `## Problema
O isolamento entre igrejas depende apenas do filtro \`churchId\` na camada de aplicação. Não há RLS no banco, que é explicitamente multi-inquilino (\`church_id\` em toda tabela de negócio).

## Evidência
\`packages/database/prisma/schema.prisma\` (sem políticas RLS); todos os repositories filtram manualmente \`churchId = principal.churchId\` (ex.: \`prisma-cells-management.repository.ts:287-291\`).
\`apps/api/src/main.ts\` — sem inicialização de RLS.

## Impacto
Uma única consulta (listagem/agregação/relatório/raw query) que esqueça o filtro vaza dados de outra igreja; sem defesa em profundidade no banco.

## Sugestão de correção
Migração SQL para habilitar RLS com política por \`church_id\` usando \`SET LOCAL app.church_id\` por request autenticado; manter filtro de aplicação.

## Critérios de aceite
- [ ] Migração RLS para tabelas de negócio com política por church_id.
- [ ] Sessão/request seta a variável \`app.church_id\` antes das queries.
- [ ] Teste de integração prova que usuário de igreja A não lê dados da igreja B mesmo via query crua.
- [ ] Filtro de aplicação preservado.`
  },
  {
    title: "[Segurança] Autorização do frontend apenas client-side — sem middleware/Server Component no Next.js",
    labels: "security, baixa",
    body: `## Problema
\`RequireRole\`/\`Can\` são client-side e só escondem a UI. Não há \`middleware.ts\` nem roteamento protegido no servidor.

## Evidência
\`apps/web/src/shared/auth/guards.tsx:41-74\` (componentes \`\"use client\"\`)
\`apps/web/app/(authenticated)/layout.tsx\` — sem checagem server; ausência de \`apps/web/middleware.ts\`.

## Impacto
Defesa em profundidade fraca: UI e conteúdo restrito são entregues ao navegador de não autorizados; a segurança real depende apenas da API.

## Sugestão de correção
Adicionar \`middleware.ts\`/Server Components para autenticar e autorizar no servidor e não servir conteúdo restrito.

## Critérios de aceite
- [ ] \`middleware.ts\` redireciona não autenticados para /login.
- [ ] Rotas de admin negadas no servidor para papéis sem permissão (HTTP 403/redirect).
- [ ] Testes E2E confirmam acesso negado no servidor.`
  },
  {
    title: "[Segurança] API_PROXY_TARGET com default de produção + ausência de Content-Security-Policy",
    labels: "security, baixa",
    body: `## Problema (agrupado)
(1) \`next.config.ts\` usa endpoint de produção como default de proxy; (2) nenhum header de CSP é enviado pelo painel.

## Evidência
\`apps/web/next.config.ts:8\` (\`process.env.API_PROXY_TARGET ?? \"https://eccosistema-celula.onrender.com\"\`) e \`apps/web/next.config.ts\` (sem \`headers\`).
\`apps/web/app/layout.tsx:32\` (\`dangerouslySetInnerHTML\` para script de tema).

## Impacto
Roteamento acidental de tráfego de dev para produção; e, sem CSP, qualquer XSS futuro no painel não é mitigado pelo navegador.

## Sugestão de correção
Remover o default de produção do proxy; adicionar Headers de CSP estrita (\`script-src 'self'; img-src 'self' data: https:; object-src 'none'\`).

## Critérios de aceite
- [ ] \`API_PROXY_TARGET\` sem default de produção (ou vazio inválido).
- [ ] Headers CSP presentes nas respostas do painel.
- [ ] Navegação e logotipo continuam funcionando sob a CSP configurada.`
  }
];

function donutSVG(results) {
  const total = results.reduce((a, b) => a + b.value, 0) || 1;
  const R = 80, C = 2 * Math.PI * R, cx = 120, cy = 120;
  let offset = 0;
  let slices = "";
  for (const s of results) {
    const frac = s.value / total;
    const dash = frac * C;
    slices += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${s.color}" stroke-width="34" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-offset}" />`;
    offset += dash;
  }
  return `
  <svg viewBox="0 0 240 240" width="240" height="240" style="background:#fff">
    ${slices}
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="34" font-weight="700" fill="#111827">${total}</text>
    <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="13" fill="#6B7280">achados</text>
  </svg>`;
}

function barSVG(catCounts) {
  const max = Math.max(1, ...catCounts.map((c) => c.value));
  const bh = 200, bw = 46, gap = 40, left = 50, bottom = 40;
  let bars = "", labels = "", values = "";
  catCounts.forEach((c, i) => {
    const x = left + i * (bw + gap);
    const h = (c.value / max) * bh;
    const y = bottom + bh - h;
    bars += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 0)}" rx="6" fill="${c.color}" />`;
    values += `<text x="${x + bw / 2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="#111827">${c.value}</text>`;
    labels += `<text x="${x + bw / 2}" y="${bottom + bh + 18}" text-anchor="middle" font-size="12" fill="#111827">Cat. ${c.id}</text>`;
  });
  const totalW = left + catCounts.length * (bw + gap);
  return `<svg viewBox="0 0 ${totalW + 10} ${bottom + bh + 40}" width="${totalW + 10}" height="${bottom + bh + 40}" style="background:#fff">
    <line x1="${left}" y1="${bottom}" x2="${left + catCounts.length * (bw + gap)}" y2="${bottom}" stroke="#D1D5DB" stroke-width="1"/>
    <line x1="${left}" y1="${bottom}" x2="${left}" y2="${bottom - bh}" stroke="#D1D5DB" stroke-width="1"/>
    ${bars}${values}${labels}
  </svg>`;
}

const sevCounts = SEVERITY_ORDER.filter((s) => s !== "info").map((s) => ({
  key: s,
  value: findings.filter((f) => f.severity === s).length,
  color: COLORS[s]
}));
const catCounts = CATEGORIES.map((cat) => ({
  id: cat.id,
  value: findings.filter((f) => f.category === cat.id).length,
  color: COLORS[findings.filter((f) => f.category === cat.id)[0]?.severity] ?? COLORS.media
}));

function chip(sev) {
  const label = SEVERITY_LABEL[sev];
  return `<span class="chip chip--${sev}">${label}</span>`;
}

const findingsRows = findings
  .slice()
  .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || a.id.localeCompare(b.id))
  .map(
    (f) => `<tr>
      <td>${chip(f.severity)}</td>
      <td class="mono nowrap">${f.id}</td>
      <td class="mono filecol">${f.file}</td>
      <td>${f.title}</td>
    </tr>`
  )
  .join("");

const detailed = findings
  .slice()
  .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || a.id.localeCompare(b.id))
  .map(
    (f) => `<section class="finding">
      <div class="finding-head">
        <span class="fid">${f.id}</span>
        <span class="fcat">Categoria ${f.category} · ${CATEGORIES.find((c) => c.id === f.category)?.name}</span>
        ${chip(f.severity)}
      </div>
      <h4>${f.title}</h4>
      <p class="meta mono">${f.file}</p>
      <p><strong>Descrição:</strong> ${f.description}</p>
      <p><strong>Por que é explorável:</strong> ${f.exploitable}</p>
      <p><strong>Impacto:</strong> ${f.impact}</p>
      <p><strong>Sugestão de correção:</strong> ${f.fix}</p>
    </section>`
  )
  .join("");

const strengthsBlocks = strengths
  .map((s) => `<li><strong>${s.title}.</strong> ${s.body}</li>`)
  .join("");

const recRows = recommendations
  .map((r) => `<tr><td class="pr">${r.pr}</td><td>${chip(r.severity)}</td><td>${r.text}</td></tr>`)
  .join("");

const issuesBlocks = issues
  .map((issue, i) => `<section class="issue">
    <div class="issue-head">ISSUE ${i + 1}</div>
    <h4>${issue.title}</h4>
    <p><strong>Labels sugeridas:</strong> <span class="chip-label">${issue.labels}</span></p>
    <div class="issue-md"><pre>${escapeHtml(issue.body)}</pre></div>
    <div class="issue-foot">--- FIM ISSUE ${i + 1} ---</div>
  </section>`)
  .join("");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  html { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; font-size: 10.5pt; }
  body { margin: 0; }
  h1,h2,h3,h4 { margin: 0 0 8px 0; color: #111827; }
  h2 { font-size: 17pt; border-bottom: 2px solid #111827; padding-bottom: 6px; margin-top: 28px; }
  h3 { font-size: 13pt; margin-top: 18px; }
  p { margin: 6px 0; line-height: 1.5; }
  code { background:#F3F4F6; padding: 1px 4px; border-radius:3px; font-family: Consolas,monospace; font-size: 8.8pt; }
  .mono { font-family: Consolas, monospace; font-size: 8.3pt; }
  pre { background:#0B1220; color:#E5E7EB; padding:12px; border-radius:6px; font-size:8.2pt; white-space:pre-wrap; word-break:break-word; font-family:Consolas,monospace; }
  .cover { height: 250px; text-align:center; padding-top: 60px; }
  .cover h1 { font-size: 28pt; color:#111827; }
  .cover .sub { font-size: 13pt; color:#374151; margin-top: 14px; }
  .cover .box { display:inline-block; background:#111827; color:#fff; padding:6px 18px; border-radius:4px; margin-top:20px; }
  .cover .scope { margin-top: 40px; font-size: 10pt; color:#4B5563; }
  .cover .method { margin-top: 6px; font-size: 9pt; color:#6B7280; max-width: 640px; margin-left:auto; margin-right:auto; text-align:left; line-height:1.5; }
  .grid2 { display:flex; gap: 18px; }
  .grid2 > div { flex: 1; }
  .center { text-align:center; }
  .counts { display:flex; gap:12px; margin: 12px 0; }
  .count { flex:1; border-radius:8px; padding:10px 6px; text-align:center; color:#fff; font-weight:700; }
  .count small { display:block; font-weight:400; font-size:8.5pt; opacity:0.9; }
  table { border-collapse: collapse; width:100%; margin: 10px 0; font-size: 8.8pt; }
  th, td { border:1px solid #E5E7EB; padding:6px 8px; text-align:left; vertical-align:top; }
  th { background:#F9FAFB; }
  .filecol { white-space: normal; word-break: break-word; }
  .nowrap { white-space: nowrap; }
  .chip { display:inline-block; padding:2px 9px; border-radius:12px; color:#fff; font-size:8.2pt; font-weight:600; white-space:nowrap; }
  .chip--critica{background:#B91C1C}.chip--alta{background:#EA580C}.chip--media{background:#D97706}.chip--baixa{background:#2563EB}.chip--info{background:#6B7280}
  .chip-label{display:inline-block; padding:2px 8px; border-radius:11px; background:#EEF2FF; color:#3730A3; font-size:8.2pt;}
  .finding { border:1px solid #E5E7EB; border-left:4px solid #9CA3AF; border-radius:6px; padding:12px 14px; margin:14px 0; page-break-inside:avoid; }
  .finding-head { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
  .fid { font-weight:800; color:#111827; }
  .fcat { color:#6B7280; font-size:8.8pt; flex:1; }
  .issue { border:1px solid #D1D5DB; border-radius:8px; padding:14px; margin:14px 0; page-break-inside:avoid; }
  .issue-head { font-weight:800; color:#111827; margin-bottom:6px; border-bottom:1px dashed #D1D5DB; padding-bottom:6px;}
  .issue-foot { margin-top:8px; font-weight:700; color:#374151; font-size:8.5pt; }
  .pr { font-weight:800; color:#111827; white-space:nowrap; }
  ul { padding-left:20px; }
  .legend { display:flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-top:8px; font-size:8.5pt;}
  .legend span { display:inline-flex; align-items:center; gap:5px;}
  .dot { width:11px; height:11px; border-radius:3px; display:inline-block;}
  .footer-note { font-size:8pt; color:#9CA3AF; margin-top:20px; }
</style></head>
<body>

<!-- CAPA -->
<div class="cover">
  <h1>Relatório de Auditoria de Segurança</h1>
  <div class="sub">Ecossistema de Células — Missão Atos</div>
  <div class="box">Agosto de 2026</div>
  <div class="scope">
    <strong>Escopo auditado:</strong> API NestJS (apps/api), painel web Next.js (apps/web), packages (domain, contracts, database, config) e artefatos de deploy (compose.yaml, GitHub Actions).
    <div class="method">
      <strong>Nota metodológica:</strong> Stack detectada — TypeScript · Turborepo · NestJS 11 (Express) · Prisma 7 (PostgreSQL 18) · Next.js 16 App Router (React 19) · auth própria (JWT HS256 + refresh opaco HTTPOnly) · deploy: Render (API) + Vercel (web) via GitHub Actions; sem Dockerfile/Terraform/Helm. Cada categoria mapeada: (1) isolamento = RLS ausente → verificação do filtro por <code>churchId</code> via <code>principal.churchId</code> em toda query de listagem/consulta; (2) páginas client-side vs. gate de papel no servidor; (3) revisão sistemática de todos os handlers por ID; (4) segredos em código/config/histórico git; (5) XSS em sinks do framework (React).
    </div>
  </div>
</div>

<!-- RESUMO EXECUTIVO -->
<h2>1. Resumo Executivo</h2>
<p>Foram identificados <strong>${findings.length} achados</strong> (${sevCounts.reduce((a, b) => a + b.value, 0)} acionáveis + informativos), sendo ${sevCounts.filter((s) => s.key === "alta").map((s) => `${s.value} de severidade ${SEVERITY_LABEL[s.key].toLowerCase()}`).join(" e ")}. A base é sólida: isolamento por igreja aplicado em toda a camada de dados, autorização de servidor em toda rota sensível, ausência de sinks XSS no frontend e histórico git limpo. Os riscos centrais estão na <strong>configuração de segredos e cookies</strong> (tema 4) e na <strong>ausência de RLS</strong> no banco (tema 1).</p>

<div class="counts">
  ${sevCounts.map((s) => `<div class="count" style="background:${s.color}"><span style="font-size:18pt">${s.value}</span><small>${SEVERITY_LABEL[s.key]}</small></div>`).join("")}
</div>
<div class="grid2">
  <div class="center">
    <h3>Distribuição por Severidade</h3>
    ${donutSVG(sevCounts)}
    <div class="legend">
      ${sevCounts.map((s) => `<span><i class="dot" style="background:${s.color}"></i>${SEVERITY_LABEL[s.key]}</span>`).join("")}
    </div>
  </div>
  <div class="center">
    <h3>Distribuição por Categoria</h3>
    ${barSVG(catCounts)}
    <div class="legend">
      ${CATEGORIES.map((c) => `<span><i class="dot" style="background:${catCounts.find((x) => x.id === c.id)?.color}"></i>Cat. ${c.id}</span>`).join("")}
    </div>
  </div>
</div>

<!-- PONTOS FORTES E FRACOS -->
<h2>2. Pontos Fortes e Pontos Fracos</h2>
<h3>2.1 Pontos fortes (verificados e corretos)</h3>
<ul>${strengthsBlocks}</ul>

<h3>2.2 Pontos fracos (riscos centrais)</h3>
<p>Os principais riscos são de <strong>configuração e defesa em profundidade</strong>, não de código funcional atravessado por tenant/IDOR:</p>
<ul>
  <li><strong>Segredos padrão não rejeitados</strong> (4.1, alta): placeholder de JWT/pépper passa na validação e vira segredo real se copiado para produção.</li>
  <li><strong>Cookie de refresh sem Secure permitido em produção</strong> (4.2, média).</li>
  <li><strong>Sem RLS no PostgreSQL</strong> (1.1, média): isolamento só na camada de aplicação em um modelo multi-inquilino.</li>
  <li><strong>Frontend sem autorização no servidor</strong> (2.1, baixa): gates apenas client-side (defesa em profundidade).</li>
</ul>

<!-- TABELA DE ACHADOS -->
<h2>3. Tabela de Achados</h2>
<table>
  <thead><tr><th>Severidade</th><th>ID</th><th>Arquivo:linha</th><th>Descrição</th></tr></thead>
  <tbody>${findingsRows}</tbody>
</table>

<!-- ACHADOS DETALHADOS -->
<h2>4. Achados Detalhados por Categoria</h2>
${detailed}

<!-- RECOMENDACOES -->
<h2>5. Recomendações Priorizadas</h2>
<table>
  <thead><tr><th>Prioridade</th><th>Severidade</th><th>Ação</th></tr></thead>
  <tbody>${recRows}</tbody>
</table>

<!-- ISSUES -->
<h2>6. Issues para o GitHub</h2>
<p>Issues prontas em Markdown, abaixo do bloco <code>--- ISSUE n ---</code> / <code>--- FIM ISSUE n ---</code>.</p>
${issuesBlocks}

<div class="footer-note">Gerado automaticamente em docs/security-audit — pode ser regenerado com <span class="mono">npm run report:security</span> ou <span class="mono">node generate-report.mjs</span>.</div>
</body></html>`;

writeFileSync(HTML, html, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.emulateMedia({ media: "screen" });
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#9CA3AF;width:100%;text-align:center;">Relatório de Auditoria de Segurança — Ecossistema de Células</div>`,
  footerTemplate: `<div style="font-size:8px;color:#9CA3AF;width:100%;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`
});
await browser.close();

console.log("PDF gerado:", OUT);
process.exit(0);
