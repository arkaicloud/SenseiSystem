---
name: Cobrança de plano familiar
description: Regras de propriedade das faturas, alerta de atraso e bloqueio de presença em planos familiares.
---

A cobrança do plano familiar deve aparecer uma única vez, no perfil do usuário identificado como responsável financeiro. Trocar o aluno ativo nunca muda quem pode visualizar ou pagar a fatura.

**Why:** O plano é único para toda a família. Separar cobranças por dependente duplica a experiência e pode expor dados financeiros a quem não é o responsável.

**How to apply:** Resolva a família e o responsável no servidor pelo vínculo familiar e identidade normalizada. Datas ASAAS sem horário são dias de calendário de Brasília, não instantes UTC. Só reconcilie duplicatas pela mesma obrigação identificável; mês e valor isolados podem pertencer a irmãos diferentes. Exiba links ASAAS apenas ao responsável. Atraso gera alerta; criação de presença e check-in são negados somente quando o responsável ou aluno estiver explicitamente bloqueado financeiramente.