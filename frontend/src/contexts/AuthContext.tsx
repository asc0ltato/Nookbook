"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { AuthService, User, UserRole, mapApiUserToUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const consumeOAuthTokenFromUrl = (): string | null => {
      if (typeof window === 'undefined') return null;
      try {
        const url = new URL(window.location.href);
        const oauthStatus = url.searchParams.get('oauth');
        const tokenParam = url.searchParams.get('token');

        if (oauthStatus !== 'success' || !tokenParam) {
          return null;
        }

        url.searchParams.delete('oauth');
        url.searchParams.delete('token');
        url.searchParams.delete('user');
        window.history.replaceState(
          {},
          document.title,
          url.pathname + (url.search ? url.search : '') + url.hash
        );

        return tokenParam;
      } catch (e) {
        console.error('Failed to consume OAuth params from URL:', e);
        return null;
      }
    };

    const initAuth = async () => {
      try {
        const oauthToken = consumeOAuthTokenFromUrl();
        if (oauthToken) {
          AuthService.setAuth(oauthToken, oauthToken, {
            id: 0,
            name: '',
            email: '',
            role: UserRole.User,
            createdAt: new Date().toISOString(),
          });
          try {
            const fetchedUser = await AuthService.fetchCurrentUser();
            AuthService.setAuth(oauthToken, oauthToken, fetchedUser);
            setUser(fetchedUser);
          } catch (fetchError) {
            console.error('Failed to fetch user after OAuth:', fetchError);
            AuthService.clearAuth();
            setUser(null);
          }
          setIsLoading(false);
          return;
        }

        const token = AuthService.getToken();
        if (token) {
          const cachedUser = AuthService.getUser();
          if (cachedUser) {
            setUser(cachedUser);
          }

          try {
            const fetchedUser = await AuthService.fetchCurrentUser();
            const refresh = AuthService.getRefreshToken() || token;
            AuthService.setAuth(token, refresh, fetchedUser);
            setUser(fetchedUser);
          } catch (fetchError: unknown) {
            const err = fetchError as { status?: number; response?: { status?: number } };
            const status = err?.status ?? err?.response?.status;
            if (status === 401 || status === 403) {
              AuthService.clearAuth();
              setUser(null);
            } else if (!cachedUser) {
              console.error("Failed to fetch user:", fetchError);
            }
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const syncAuthState = () => {
      const nextUser = AuthService.getUser();
      setUser(nextUser);
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('focus', syncAuthState);
    window.addEventListener('pageshow', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('focus', syncAuthState);
      window.removeEventListener('pageshow', syncAuthState);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      console.log('Starting registration...', { name, email });
      const user = await AuthService.register(name, email, password);
      console.log('Registration successful, user:', user);
      setUser(user);
    } catch (error) {
      console.error('Registration error in context:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = AuthService.getToken();
    if (!token) return;
    try {
      const next = await AuthService.fetchCurrentUser();
      AuthService.setAuth(token, AuthService.getRefreshToken() || token, next);
      setUser(next);
    } catch {
    }
  }, []);

  const hasRole = useCallback((role: UserRole): boolean => {
    return AuthService.hasRole(role);
  }, []);

  const isAdmin = useCallback((): boolean => {
    return AuthService.isAdmin();
  }, []);

  const isManager = useCallback((): boolean => {
    return AuthService.isManager();
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    isAdmin,
    isManager,
  }), [user, isLoading, login, register, logout, refreshUser, hasRole, isAdmin, isManager]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
