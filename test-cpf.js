function isValidCPF(cpf) {
  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (casos inválidos como 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Converte para array de números
  const digits = cleanCPF.split('').map(Number);
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  const firstVerifier = 11 - (sum % 11);
  const expectedFirstDigit = firstVerifier > 9 ? 0 : firstVerifier;
  
  if (digits[9] !== expectedFirstDigit) return false;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (11 - i);
  }
  sum += digits[9] * 2;
  const secondVerifier = 11 - (sum % 11);
  const expectedSecondDigit = secondVerifier > 9 ? 0 : secondVerifier;
  
  return digits[10] === expectedSecondDigit;
}

// Testar alguns CPFs
const cpfs = [
  '766.622.389-70',
  '879.224.114-05', 
  '666.548.718-04',
  '111.111.111-11', // Inválido
  '123.456.789-01'  // Inválido
];

console.log('Teste de validação dos CPFs:');
cpfs.forEach(cpf => {
  console.log(`${cpf}: ${isValidCPF(cpf) ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
});
