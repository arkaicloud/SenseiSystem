---
name: Estado de aprovação
description: Tratamento seguro para cadastros com indicadores de ativação e aprovação inconsistentes.
---

Um cadastro com `active=true` e `status=pending` deve ser tratado como uma aprovação incompleta e passar pelo fluxo normal de aprovação até que o estado seja normalizado.

**Why:** Uma versão anterior em produção deixou um cadastro recém-criado nessa combinação. A listagem o reconheceu como pendente, mas a aprovação o recusou como já ativo, impedindo a correção pela interface.

**How to apply:** Fluxos de aprovação podem recuperar especificamente a combinação ativo+pendente. Usuários ativos em qualquer outro estado continuam protegidos contra nova aprovação.