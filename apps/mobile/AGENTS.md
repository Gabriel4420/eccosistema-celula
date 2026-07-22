# Instruções do aplicativo mobile

Estas regras complementam o AGENTS.md da raiz.

- Utilizar Expo e Expo Router.
- Dados offline devem passar pela camada de sincronização.
- Não chamar diretamente a API dentro de componentes visuais.
- Toda operação local deve possuir operationId.
- Exibir claramente os estados sincronizado, pendente e com erro.
- Nunca perder um rascunho por falha de rede.
