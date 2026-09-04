import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  // Mensagem clara em vez de erro genérico de rede.
  // Não usamos os valores vazios direto no createClient: uma URL inválida faz
  // o supabase-js lançar exceção na hora de importar o módulo, o que derruba
  // o app inteiro com tela branca. Com um placeholder válido, o app sobe e
  // main.tsx mostra o aviso de configuração ausente.
  console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env / nas variáveis do deploy.');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/** Lança o erro do Supabase de forma legível. */
export function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}
