# ADR 003 — Transporte e ciclo de vida dos tokens

**Status:** aceito para o plano 003  
**Data:** 2026-07-23

## Contexto

A API precisa autenticar usuários existentes sem expor credenciais ou permitir sessões não revogáveis. O MVP atende uma igreja e uma instância da API.

## Decisão

- Access Token: JWT HS256 em `Authorization: Bearer`, duração padrão de 10 minutos, mantido em memória pelo cliente.
- Refresh Token: valor opaco aleatório de 256 bits, enviado somente em cookie `HttpOnly`, `SameSite=Strict`, `Path=/auth` e `Secure` fora do desenvolvimento local.
- Persistência: somente HMAC-SHA-256 do Refresh Token, com pepper distinto do segredo JWT.
- Rotação: cada refresh revoga o registro consumido e cria um sucessor na mesma família, atomicamente.
- Replay: reutilização de token rotacionado revoga a família.
- Logout: revoga somente a sessão corrente e sempre remove o cookie.
- CSRF: endpoints que consomem cookie validam `Origin` contra a allowlist CORS quando o header estiver presente.
- Tenant do login: `AUTH_CHURCH_ID` resolve a igreja no MVP; outra estratégia exigirá nova decisão antes de multi-igreja.

## Consequências

Logout não invalida imediatamente Access Tokens já emitidos; o risco fica limitado ao TTL curto. O rate limit em memória restringe esta solução a uma instância.

