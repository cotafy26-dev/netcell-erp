export type Mask = 'digits' | 'phone' | 'cpf' | 'cnpj' | 'cep' | 'name' | 'uf' | 'int';

const LEN: Record<string, number> = { phone: 11, cpf: 11, cnpj: 14, cep: 8, uf: 2 };

const digits = (v: string) => v.replace(/\D+/g, '');

/** Limpa o valor conforme a máscara enquanto a pessoa digita. */
export function applyMask(mask: Mask, value: string): string {
  switch (mask) {
    case 'phone':
    case 'cpf':
    case 'cnpj':
    case 'cep':
      return digits(value).slice(0, LEN[mask]);
    case 'digits':
    case 'int':
      return digits(value);
    case 'uf':
      return value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    case 'name':
      // letras (com acento), espaço e pontuação comum de nomes/razão social
      return value.replace(/[^\p{L}\p{M}\s.'&/,-]/gu, '').replace(/\s{2,}/g, ' ');
    default:
      return value;
  }
}

/** Mensagem de erro se o campo estiver com tamanho errado (ou null se ok). */
export function maskError(mask: Mask | undefined, value: string): string | null {
  if (!value) return null;
  const d = digits(value);
  if (mask === 'cpf' && d.length !== 11) return 'CPF deve ter 11 números.';
  if (mask === 'cnpj' && d.length !== 14) return 'CNPJ deve ter 14 números.';
  if (mask === 'cep' && d.length !== 8) return 'CEP deve ter 8 números.';
  if (mask === 'phone' && d.length < 10) return 'Telefone deve ter 10 ou 11 números (com DDD).';
  if (mask === 'uf' && value.length !== 2) return 'UF deve ter 2 letras.';
  return null;
}

export function isDigitMask(mask?: Mask) {
  return mask === 'phone' || mask === 'cpf' || mask === 'cnpj' || mask === 'cep' || mask === 'digits' || mask === 'int';
}
