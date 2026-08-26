const hookUrl = process.env.RENDER_DEPLOY_HOOK_URL?.trim();

if (!hookUrl) {
  console.error("Defina RENDER_DEPLOY_HOOK_URL no ambiente ou no arquivo .env.");
  process.exit(1);
}

let endpoint;
try {
  endpoint = new URL(hookUrl);
} catch {
  console.error("RENDER_DEPLOY_HOOK_URL não contém uma URL válida.");
  process.exit(1);
}

if (endpoint.protocol !== "https:") {
  console.error("RENDER_DEPLOY_HOOK_URL deve usar HTTPS.");
  process.exit(1);
}

try {
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    console.error("A Render recusou o deploy hook com HTTP " + response.status + ".");
    process.exit(1);
  }

  console.log("Deploy da Render acionado com sucesso.");
} catch (error) {
  const message = error instanceof Error ? error.message : "erro desconhecido";
  console.error("Não foi possível acionar o deploy da Render: " + message);
  process.exit(1);
}
