# Instruções da API

Estas regras complementam o AGENTS.md da raiz.

- Organizar funcionalidades por módulos NestJS.
- Controllers não devem conter regras de negócio.
- Casos de uso ficam na camada de aplicação.
- Repositórios ficam na infraestrutura.
- Todo endpoint deve verificar igreja e escopo hierárquico.
- Operações de sincronização devem ser idempotentes.
- Documentar endpoints no Swagger.
