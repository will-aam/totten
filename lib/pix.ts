export function detectAndFormatPixKey(key: string): string {
  if (!key) return "";

  // Email
  if (key.includes("@")) {
    return key.trim().toLowerCase();
  }

  // Chave Aleatória (UUID)
  const alphanumeric = key.replace(/[^a-zA-Z0-9]/g, "");
  if (alphanumeric.length === 32) {
    return alphanumeric.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5").toLowerCase();
  }

  const digits = key.replace(/\D/g, "");

  // CNPJ
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }

  // CPF ou Telefone (11 dígitos)
  if (digits.length === 11) {
    if (isValidCpf(digits)) {
      return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    } else {
      // Celular: (XX) 9XXXX-XXXX
      return digits.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2$3-$4");
    }
  }

  // Telefone Fixo (10 dígitos)
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  // Telefone com DDI 55
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    const ddd = digits.substring(2, 4);
    const num = digits.substring(4);
    if (num.length === 9) {
      return `+55 (${ddd}) ${num.substring(0, 1)}${num.substring(1, 5)}-${num.substring(5)}`;
    }
    if (num.length === 8) {
      return `+55 (${ddd}) ${num.substring(0, 4)}-${num.substring(4)}`;
    }
  }

  return key;
}

export function getRawPixKey(key: string): string {
  if (!key) return "";
  
  if (key.includes("@")) return key.trim().toLowerCase();

  const alphanumeric = key.replace(/[^a-zA-Z0-9]/g, "");
  if (alphanumeric.length === 32) return alphanumeric.toLowerCase();

  const digits = key.replace(/\D/g, "");
  
  if (digits.length === 14) return digits;
  if (digits.length === 11 && isValidCpf(digits)) return digits;

  // Se for telefone, o BACEN exige +55DDDNUMERO
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith("55")) return `+${digits}`;
  }

  return key.trim();
}

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}
