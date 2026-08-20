"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type Role = 'admin' | 'supervisor' | 'normal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const mockUsers: User[] = [
  { id: '1', name: 'Administrador Principal', email: 'admin@greenpack.com', role: 'admin' },
  { id: '2', name: 'Supervisor Ventas', email: 'super@greenpack.com', role: 'supervisor' },
  { id: '3', name: 'Usuario Observador', email: 'user@greenpack.com', role: 'normal' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for session
    const storedUser = localStorage.getItem('dashboard_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('dashboard_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (email: string, pass: string) => {
    // For demo purposes, password is just the role or 'admin' / 'super' / 'user'
    const found = mockUsers.find(u => u.email === email);
    // Extremely basic mock auth
    if (found && (pass === found.role || pass === found.email.split('@')[0])) {
      setUser(found);
      localStorage.setItem('dashboard_user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dashboard_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
