---
name: Cópia PostgreSQL no Replit
description: Restrições não óbvias ao restaurar produção no banco de desenvolvimento gerenciado pelo Replit.
---

Ao copiar produção para desenvolvimento, limite a cópia ao schema `public`, preserve as sessões locais e impeça gravações concorrentes em todas as instâncias.

**Why:** Schemas internos do Replit não devem ser restaurados. Alterar o schema enquanto o app aceita gravações ou perde sua tabela de sessão pode corromper o destino e impedir até o acompanhamento ou rollback do job.

**How to apply:** Faça backup do destino antes de alterá-lo, coordene a manutenção com lock compartilhado entre processos e mantenha o backup disponível quando a recuperação automática não terminar.