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
  profileType?: 'personal' | 'business';
  billingPlan?: 'free' | 'pro' | 'enterprise';
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
  listProfiles: () => Promise<Array<{ tenant: AuthTenant; role: 'OWNER' | 'ADMIN' | 'MEMBER'; isCurrent: boolean }>>;
  switchProfile: (tenantId: string) => Promise<void>;
  createProfile: (payload: { name: string; profileType: 'personal' | 'business' }) => Promise<void>;
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

type MembershipResponse = {
  memberships: Array<{
    tenant: AuthTenant;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    isCurrent: boolean;
  }>;
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

    const tokens = loadSaasTokens();
    if (!tokens) {
      setStatus('anonymous');
      return;
    }
    void resolveSessionFromTokens(tokens);
  }, [resolveSessionFromTokens]);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    saveSaasTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    applySession(response);
  }, [applySession]);

  const register = useCallback(
    async (payload: { email: string; fullName: string; password: string; tenantName: string }) => {
      const response = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      saveSaasTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      applySession(response);
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
    } catch {
      // Ignore logout API errors — always clear local session
    } finally {
      clearSaasTokens();
      setSession(null);
      setStatus(isSaasMode ? 'anonymous' : 'authenticated');
    }
  }, []);

  const listProfiles = useCallback(async () => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) {
      return [];
    }

    const response = await apiRequest<MembershipResponse>('/api/me/memberships', {
      method: 'GET',
      token: tokens.accessToken,
    });

    return response.memberships;
  }, []);

  const switchProfile = useCallback(async (tenantId: string) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const response = await apiRequest<AuthResponse>('/api/me/switch-tenant', {
      method: 'POST',
      token: tokens.accessToken,
      body: JSON.stringify({ tenantId }),
    });

    saveSaasTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    applySession(response);
  }, [applySession]);

  const createProfile = useCallback(async (payload: { name: string; profileType: 'personal' | 'business' }) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const response = await apiRequest<AuthResponse>('/api/me/tenants', {
      method: 'POST',
      token: tokens.accessToken,
      body: JSON.stringify(payload),
    });

    saveSaasTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    applySession(response);
  }, [applySession]);

  const value = useMemo(
    () => ({
      status,
      session,
      login,
      register,
      logout,
      listProfiles,
      switchProfile,
      createProfile,
    }),
    [status, session, login, register, logout, listProfiles, switchProfile, createProfile]
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
