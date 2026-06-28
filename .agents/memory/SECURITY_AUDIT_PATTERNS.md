---
name: Segurança — Padrões de Auditoria Recorrentes
description: Padrões de risco de segurança encontrados no SenseiSystem, com localização e correção recomendada
---

## Rotas públicas intencionais vs acidentais

O onboarding do SenseiSystem requer rotas públicas para registro de alunos (`/api/register-student`, `/api/payment-plans`, `/api/coupons/validate`, `/api/public/belts`, `/api/school/public-info`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/validate-reset-token`).

**Risco:** Várias rotas que DEVERIAM ser protegidas estão públicas:
- `POST /api/students/:id/health-questionnaire` — dados médicos
- `POST /api/students/:id/documents/:kind` — upload de RG/atestados
- `GET /api/students/:id/documents` — listagem de documentos
- `GET /api/documents/:docId/download` — download de documentos
- `GET /api/validate-cpf/:cpf` — enumeração de CPFs
- `POST /webhooks/asaas` e `POST /api/webhook/asaas` — webhooks sem validação de assinatura

**Como aplicar:** Sempre revisar rotas sem middleware de autenticação. Verificar se são intencionalmente públicas.

## Duplicação de rota

`GET /api/notices` está declarada em duas linhas (7273 e 7691) em `server/routes.ts`. A segunda sobrescreve a primeira.

**Why:** Causa comportamento indefinido — a rota pode ter proteção diferente do que parece.
**Como aplicar:** Procurar por "duplicated route" em qualquer arquivo de rotas grande.

## PII em console.log

Múltiplos `console.log` no backend expõem dados sensíveis (emails, nomes, CPFs, birthDate) em logs não estruturados. Isso viola GDPR-A5-32 e CCPA.

**Locais principais:** `server/auth.ts` (login attempts, successful logins), `server/routes.ts` (aprovação de alunos, CPF validation, registro).

**Como aplicar:** Nunca logar dados PII diretamente. Usar IDs ou hash parcial. Substituir todos os `console.log` com dados sensíveis por logs estruturados sem PII.

## XSS via dangerouslySetInnerHTML

Três locais no frontend renderizam conteúdo sem sanitização:
- `StudentNotifications.tsx` (`notification.message`)
- `StudentBell.tsx` (`selectedNotification?.content`)
- `reports.tsx` (`log.activity`)

O `rich-content.tsx` usa `sanitizeHTML()` corretamente — usar esse padrão nos outros.

**How to apply:** Sempre que usar `dangerouslySetInnerHTML`, garantir que o conteúdo passou por `sanitizeHTML()` do `htmlUtils.ts`.

## Upload service — funções stub

`server/services/uploadService.ts` tem `getStudentDocuments()`, `getDocumentById()`, `deleteDocument()` que retornam dados vazios/nulos. Documentos são salvos em disco mas não são recuperáveis pelo serviço.

**Why:** Upload funciona, mas listagem e download dependem de outro mecanismo. Isso é confuso para manutenção.
**How to apply:** Implementar as funções stub ou remover o serviço e usar apenas o middleware de upload.

## Session secret fallback hardcoded

`server/auth.ts` usa `process.env.SESSION_SECRET || "senseisystem-secret-key"`. Se a env var não estiver setada, o segredo é público (está no código-fonte).

**How to apply:** Nunca ter fallback hardcoded para secrets. O servidor deve falhar ao iniciar se SESSION_SECRET não estiver configurado.

## Senhas padrão hardcoded

`server/storage.ts` e `server/auth.ts` têm senhas padrão para admin e instrutor. Isso significa que qualquer pessoa que leia o código-fonte sabe as credenciais.

**How to apply:** Gerar senhas aleatórias na inicialização e logar uma vez, ou exigir configuração via env vars.
