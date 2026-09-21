---
name: Calendar date contract
description: Regra para manter datas de calendário estáveis em Brasília sem alterar o significado de timestamps reais.
---

Datas de calendário (nascimento, vencimento, matrícula, aula e presença) devem ser comparadas e exibidas como chaves `YYYY-MM-DD`, usando `America/Sao_Paulo` para obter o dia atual. Não devem passar por `new Date("YYYY-MM-DD")` nem por `toISOString()` para decidir o dia. Timestamps reais (criação, logs, pagamentos recebidos, assinaturas e sessões) continuam sendo instantes.

**Why:** O host e o navegador podem usar UTC, fazendo datas de calendário aparecerem no dia anterior ou marcando cobranças e presenças incorretamente perto da meia-noite.

**How to apply:** Use os helpers em `shared/calendarDates.ts`; ao adicionar uma rota ou tela, classifique primeiro o campo como data de calendário ou instante antes de escolher a conversão.