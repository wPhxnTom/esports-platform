import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Storage from '../utils/storage';
import api, { setOnUnauthorizedCallback } from '../api/client';

interface User {
  id: string;
  pseudo: string;
  email: string;
  avatar: string | null;
  xp: number;
  rank: string;
  coins: number;
  wins: number;
  losses: number;
  totalMatches: number;
  trustScore?: number;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (pseudo: string, email: string, password: string, earlyAccessKey?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOnUnauthorizedCallback(() => setUser(null));
    loadUser();
    return () => { setOnUnauthorizedCallback(null); };
  }, []);

  async function loadUser() {
    try {
      const token = await Storage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch {
      await Storage.deleteItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    await Storage.setItem('token', response.data.token);
    setUser(response.data.user);
  }

  async function register(pseudo: string, email: string, password: string, earlyAccessKey?: string) {
    const response = await api.post('/auth/register', { pseudo, email, password, earlyAccessKey });
    await Storage.setItem('token', response.data.token);
    setUser(response.data.user);
  }

  async function logout() {
    await Storage.deleteItem('token');
    setUser(null);
  }

  async function refreshUser() {
    const response = await api.get('/auth/me');
    setUser(response.data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
