import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { isSaasMode } from '@/config/runtime';
import {
  loadSaasTokens,
  saveSaasTokens,
  clearSaasTokens,
  type SaasTokens,
} from '@/lib/saasAuthStorage';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

type AuthTenant = {
  id: string;
  name: string;
};

type AuthSession = {
  user: AuthUser;
  tenant: AuthTenant;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

interface AuthContextType {
  status: AuthStatus;
  session: AuthSession | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; fullName: string; password: string; tenantName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthResponse = {
  user: AuthUser;
  tenant: AuthTenant;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  accessToken: string;
  refreshToken: string;
};

type MeResponse = {
  user: AuthUser;
  tenant: AuthTenant;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSaasMode ? 'loading' : 'authenticated');
  const [session, setSession] = useState<AuthSession | null>(null);

  const applySession = useCallback((payload: { user: AuthUser; tenant: AuthTenant; role?: 'OWNER' | 'ADMIN' | 'MEMBER' }) => {
    setSession({
      user: payload.user,
      tenant: payload.tenant,
      role: payload.role || 'MEMBER',
    });
    setStatus('authenticated');
  }, []);

  const refreshAccessToken = useCallback(async (refreshToken: string): Promise<string> => {
    const refreshed = await apiRequest<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    saveSaasTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    });

    return refreshed.accessToken;
  }, []);

  const resolveSessionFromTokens = useCallback(async (tokens: SaasTokens) => {
    try {
      const me = await apiRequest<MeResponse>('/api/me', {
        method: 'GET',
        token: tokens.accessToken,
      });
      applySession(me);
      return;
    } catch {
      try {
        const newAccessToken = await refreshAccessToken(tokens.refreshToken);
        const me = await apiRequest<MeResponse>('/api/me', {
          method: 'GET',
          token: newAccessToken,
        });
        applySession(me);
        return;
      } catch {
        clearSaasTokens();
        setSession(null);
        setStatus('anonymous');
      }
    }
  }, [applySession, refreshAccessToken]);

  useEffect(() => {
    if (!isSaasMode) {
      return;
    }

    // Desabilitado: sempre pedir login ao abrir
    // const tokens = loadSaasTokens();
    // if (!tokens) {
    //   setStatus('anonymous');
    //   return;
    // }
    // void resolveSessionFromTokens(tokens);
    
    // Sempre começar no estado anonymous para forçar login
    setStatus('anonymous');
  }, [resolveSessionFromTokens]);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    console.log('[AuthContext] login() called with:', payload);
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('[AuthContext] login response:', response);

      saveSaasTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      console.log('[AuthContext] tokens saved to localStorage');

      applySession(response);
      console.log('[AuthContext] session applied');
    } catch (error) {
      console.error('[AuthContext] login error:', error);
      throw error;
    }
  }, [applySession]);

  const register = useCallback(
    async (payload: { email: string; fullName: string; password: string; tenantName: string }) => {
      console.log('[AuthContext] register() called with:', payload);
      try {
        const response = await apiRequest<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        console.log('[AuthContext] register response:', response);

        saveSaasTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        console.log('[AuthContext] tokens saved to localStorage');

        applySession(response);
        console.log('[AuthContext] session applied');
      } catch (error) {
        console.error('[AuthContext] register error:', error);
        throw error;
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    const tokens = loadSaasTokens();

    try {
      if (tokens?.refreshToken) {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }
    } finally {
      clearSaasTokens();
      setSession(null);
      setStatus(isSaasMode ? 'anonymous' : 'authenticated');
      
      // Recarregar a página para garantir estado limpo
      if (isSaasMode) {
        window.location.reload();
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      session,
      login,
      register,
      logout,
    }),
    [status, session, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
