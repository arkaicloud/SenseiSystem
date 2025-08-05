// Script simples para gerar CPFs válidos
function generateValidCPF() {
  // Gera os 9 primeiros dígitos aleatoriamente
  const firstNineDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += firstNineDigits[i] * (10 - i);
  }
  const firstVerifier = 11 - (sum % 11);
  const firstDigit = firstVerifier > 9 ? 0 : firstVerifier;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += firstNineDigits[i] * (11 - i);
  }
  sum += firstDigit * 2;
  const secondVerifier = 11 - (sum % 11);
  const secondDigit = secondVerifier > 9 ? 0 : secondVerifier;
  
  // Monta o CPF completo
  const allDigits = [...firstNineDigits, firstDigit, secondDigit];
  
  // Formata com pontos e hífen
  return `${allDigits.slice(0, 3).join('')}.${allDigits.slice(3, 6).join('')}.${allDigits.slice(6, 9).join('')}-${allDigits.slice(9).join('')}`;
}

// Gera 15 CPFs válidos únicos
const validCPFs = [];
const used = new Set();

while (validCPFs.length < 15) {
  const cpf = generateValidCPF();
  if (!used.has(cpf)) {
    used.add(cpf);
    validCPFs.push(cpf);
  }
}

console.log('CPFs válidos gerados:');
validCPFs.forEach((cpf, index) => {
  console.log(`${index + 1}. ${cpf}`);
});
