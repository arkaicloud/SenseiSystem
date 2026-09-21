---
name: Overrides de segurança npm
description: Estratégia para corrigir transitivos vulneráveis sem forçar migrações incompatíveis dos pacotes-pai.
---

Quando o pacote-pai compatível mais recente ainda aponta para um transitivo vulnerável, prefira um `overrides` limitado à faixa principal afetada em vez de substituir globalmente todas as versões do pacote.

**Why:** Atualizações diretas isoladas podem falhar por conflitos de pares entre Vite, plugins e tipos do Node; overrides globais também podem rebaixar ou promover dependências de outras gerações na mesma árvore.

**How to apply:** Atualize primeiro os pacotes diretos em grupos compatíveis, confirme a árvore com `npm ls`, e aplique overrides por faixa somente aos transitivos restantes. Valide com auditoria, build e testes.