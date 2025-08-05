// Gerador de CPFs válidos usando o algoritmo oficial brasileiro
export class CPFGenerator {
  static generateValidCPF(): string {
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
  
  static isValidCPF(cpf: string): boolean {
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
  
  static generateMultipleValidCPFs(count: number): string[] {
    const cpfs: string[] = [];
    const used = new Set<string>();
    
    while (cpfs.length < count) {
      const cpf = this.generateValidCPF();
      if (!used.has(cpf)) {
        used.add(cpf);
        cpfs.push(cpf);
      }
    }
    
    return cpfs;
  }
}