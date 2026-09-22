# Black and Blue — UI/UX

Esta branch contém os tokens, fontes locais, componentes visuais, navegação e telas reformuladas. A edição do aluno abre em página própria, preservando o sidebar. As configurações da escola são organizadas por tópico.

## Escopo

- Sem servidor de prévia, fixtures, sessão demonstrativa ou dados fictícios.
- Sem alterações no backend, schema, autenticação, permissões ou dependências.
- Mantidos os endpoints, payloads de gravação, service worker e a escolha de tema da escola/usuário.
- A foto utiliza a URL disponível; na ausência dela, mostra iniciais. Não adiciona upload ou armazenamento de fotos.
- StudentPagination mantém o componente existente com nome distinto do pagination do shadcn, evitando colisão em sistemas de arquivos sem distinção entre maiúsculas e minúsculas.

## Validação e integração

Executar `npm run build`. Iniciar com `npm run dev` e a configuração real de ambiente do projeto. Nenhum serviço demonstrativo faz parte desta entrega.

Antes da publicação, validar em homologação: login, edição e gravação do aluno, navegação por tópicos, gravação das configurações da escola, temas e dispositivos móveis. A validação local de build não substitui testes com banco e permissões reais.

As fontes Inter e sua licença estão em `client/public/design-system`. As cores e tipografia ficam em `client/src/index.css` e `tailwind.config.ts`.
