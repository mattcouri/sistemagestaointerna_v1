import { useState } from 'react';

export interface LocalUser {
  id: string;
  email: string;
  user_metadata: { name: string };
}

const HARDCODED_USER: LocalUser = {
  id: 'matt-user-001',
  email: 'matt@trinitygroup.com.br',
  user_metadata: { name: 'Matt' },
};

const HARDCODED_PASSWORD = '4mm@40VP';

const SESSION_KEY = 'local_auth_session';

function getStoredUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function useSupabase() {
  const [user, setUser] = useState<LocalUser | null>(() => getStoredUser());
  const [loading] = useState(false);

  const signIn = async (email: string, password: string) => {
    if (
      email.trim().toLowerCase() === HARDCODED_USER.email.toLowerCase() &&
      password === HARDCODED_PASSWORD
    ) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(HARDCODED_USER));
      setUser(HARDCODED_USER);
      return { data: { user: HARDCODED_USER }, error: null };
    }
    return { data: null, error: new Error('Invalid email or password') };
  };

  const signUp = async (_email: string, _password: string, _name: string) => {
    return { data: null, error: new Error('Sign up is not available') };
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    return { error: null };
  };

  return { user, loading, signIn, signUp, signOut };
}
