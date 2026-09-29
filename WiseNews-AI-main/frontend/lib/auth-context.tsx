'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load auth state from localStorage on mount
    const storedAuth = localStorage.getItem('wisenews-auth');
    if (storedAuth) {
      try {
        const { isLoggedIn: logged, username: user } = JSON.parse(storedAuth);
        setIsLoggedIn(logged);
        setUsername(user);
      } catch (error) {
        console.error('Failed to parse auth state:', error);
      }
    }
    setIsHydrated(true);
  }, []);

  const login = (user: string) => {
    setIsLoggedIn(true);
    setUsername(user);
    localStorage.setItem('wisenews-auth', JSON.stringify({ isLoggedIn: true, username: user }));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('wisenews-auth');
  };

  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
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
