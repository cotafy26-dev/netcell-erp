import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Role } from '@/shared';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  customer_id: string | null;
}

interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, role, customer_id')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    session,
    profile,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/invalid login credentials/i.test(error.message)) throw new Error('E-mail ou senha inválidos.');
        throw new Error(error.message);
      }
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
