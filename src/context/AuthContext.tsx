import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { login } from "../api/mockApi";
import type { User } from "../types/auth";

const SESSION_KEY = "shifttrack.session.v1";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(SESSION_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        try {
          const session = JSON.parse(stored) as { token: string; user: User };
          if (session.token && session.user?.id && session.user?.name)
            setUser(session.user);
        } catch {
          return SecureStore.deleteItemAsync(SESSION_KEY);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    const session = await login(email, password);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    setUser(session.user);
  }

  async function signOut(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
