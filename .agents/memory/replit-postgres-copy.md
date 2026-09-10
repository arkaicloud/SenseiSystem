---
name: Cópia PostgreSQL no Replit
description: Restrições não óbvias ao restaurar produção no banco de desenvolvimento gerenciado pelo Replit.
---

Ao copiar produção para desenvolvimento, inclua somente o schema `public`. Não tente restaurar schemas internos gerenciados pelo Replit, como `_system`. Deixe o próprio `pg_restore` recriar `public` depois da limpeza, pois recriá-lo antes causa conflito.

**Why:** Um dump sem filtro incluiu `_system` e falhou porque esse schema já existia. Em seguida, recriar `public` manualmente antes do restore também conflitou com o `CREATE SCHEMA public` presente no dump.

**How to apply:** Gere primeiro o dump de produção e um backup temporário do destino. Só então remova `public`; restaure o dump filtrado e reaplique o schema atual de desenvolvimento. Se o restore falhar, tente recuperar o backup do destino.