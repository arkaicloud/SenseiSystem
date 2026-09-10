---
name: Identidade do aluno em planos família
description: Regra de separação entre responsável financeiro, usuário autenticado e aluno ativo.
---

Em planos família ou combo, cada matrícula mantém identidade esportiva própria. Sexo, idade, faixa, aulas disponíveis e presença pertencem sempre ao aluno ativo, mesmo quando outra pessoa é responsável pelo pagamento.

**Why:** Um responsável que selecionou uma dependente conseguiu confirmar uma aula feminina, mas a presença foi atribuída ao perfil masculino do responsável. Adultos dependentes também precisam usar normalmente o próprio login e perfil.

**How to apply:** Ao consultar agenda ou confirmar/cancelar presença, autorize o usuário autenticado sobre o perfil solicitado, mas use o `studentId` e os dados pessoais do perfil selecionado. O usuário autenticado deve ser apenas o autor da ação quando estiver operando por um dependente.