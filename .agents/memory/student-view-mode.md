---
name: Visualização como aluno
description: Regra de segurança e experiência para o modo temporário de visualização do Super Admin.
---

A visualização como aluno deve ser temporária, somente leitura e preservar a identidade original do Super Admin sem alterar papéis no banco.

**Why:** O recurso existe para conferência e suporte. Permitir mutações nesse modo poderia registrar presenças, pagamentos ou outras ações em nome do aluno por engano; perder a identidade original também impediria o retorno seguro.

**How to apply:** Toda nova rota ou tela disponível ao aluno deve respeitar o bloqueio de escrita durante essa sessão. A ação de retorno ao Super Admin deve continuar visível em qualquer rota, e falhas de sessão devem restaurar o administrador ou encerrar a sessão com segurança.