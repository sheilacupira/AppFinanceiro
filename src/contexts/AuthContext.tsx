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
  cnpj?: string;
  razaoSocial?: string;
};

type AuthSession = {
  user: AuthUser;
  tenant: AuthTenant;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

export type TenantMember = {
  userId: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isCurrentUser: boolean;
  joinedAt: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  expiresAt: string;
  createdAt: string;
};

interface AuthContextType {
  status: AuthStatus;
  session: AuthSession | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; phone?: string; fullName: string; password: string; tenantName: string }) => Promise<void>;
  logout: () => Promise<void>;
  listProfiles: () => Promise<Array<{ tenant: AuthTenant; role: 'OWNER' | 'ADMIN' | 'MEMBER'; isCurrent: boolean }>>;
  switchProfile: (tenantId: string) => Promise<void>;
  createProfile: (payload: { name: string; profileType: 'personal' | 'business' }) => Promise<void>;
  updateTenant: (payload: { name?: string; cnpj?: string | null; razaoSocial?: string | null }) => Promise<void>;
  listMembers: () => Promise<TenantMember[]>;
  inviteCollaborator: (payload: { email: string; role: 'ADMIN' | 'MEMBER' }) => Promise<{ inviteUrl: string }>;
  listPendingInvites: () => Promise<PendingInvite[]>;
  cancelInvite: (id: string) => Promise<void>;
  updateMemberRole: (userId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<{ tenantId: string; tenantName: string }>;
  forgotPassword: (phone: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
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
    async (payload: { email: string; phone?: string; fullName: string; password: string; tenantName: string }) => {
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

  const updateTenant = useCallback(async (payload: { name?: string; cnpj?: string | null; razaoSocial?: string | null }) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const response = await apiRequest<{ tenant: AuthTenant }>('/api/me/tenant', {
      method: 'PATCH',
      token: tokens.accessToken,
      body: JSON.stringify(payload),
    });

    setSession((prev) =>
      prev ? { ...prev, tenant: { ...prev.tenant, ...response.tenant } } : prev
    );
  }, []);

  const listMembers = useCallback(async (): Promise<TenantMember[]> => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) return [];
    const res = await apiRequest<{ members: TenantMember[] }>('/api/me/members', { method: 'GET', token: tokens.accessToken });
    return res.members;
  }, []);

  const inviteCollaborator = useCallback(async (payload: { email: string; role: 'ADMIN' | 'MEMBER' }) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) throw new Error('Sessão inválida. Faça login novamente.');
    const res = await apiRequest<{ invite: { inviteUrl: string } }>('/api/me/invites', {
      method: 'POST',
      token: tokens.accessToken,
      body: JSON.stringify(payload),
    });
    return { inviteUrl: res.invite.inviteUrl };
  }, []);

  const listPendingInvites = useCallback(async (): Promise<PendingInvite[]> => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) return [];
    const res = await apiRequest<{ invites: PendingInvite[] }>('/api/me/invites', { method: 'GET', token: tokens.accessToken });
    return res.invites;
  }, []);

  const cancelInvite = useCallback(async (id: string) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) throw new Error('Sessão inválida. Faça login novamente.');
    await apiRequest(`/api/me/invites/${id}`, { method: 'DELETE', token: tokens.accessToken });
  }, []);

  const updateMemberRole = useCallback(async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) throw new Error('Sessão inválida. Faça login novamente.');
    await apiRequest(`/api/me/members/${userId}/role`, {
      method: 'PATCH',
      token: tokens.accessToken,
      body: JSON.stringify({ role }),
    });
  }, []);

  const removeMember = useCallback(async (userId: string) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) throw new Error('Sessão inválida. Faça login novamente.');
    await apiRequest(`/api/me/members/${userId}`, { method: 'DELETE', token: tokens.accessToken });
  }, []);

  const acceptInvite = useCallback(async (token: string) => {
    const tokens = loadSaasTokens();
    if (!tokens?.accessToken) throw new Error('Faça login primeiro para aceitar o convite.');
    const res = await apiRequest<{ ok: boolean; tenantId: string; tenantName: string }>(`/api/invites/${token}/accept`, {
      method: 'POST',
      token: tokens.accessToken,
    });
    return { tenantId: res.tenantId, tenantName: res.tenantName };
  }, []);

  const forgotPassword = useCallback(async (phone: string) => {
    await apiRequest<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }, []);

  const refreshSession = useCallback(async () => {
    const tokens = loadSaasTokens();
    if (!tokens) return;
    await resolveSessionFromTokens(tokens);
  }, [resolveSessionFromTokens]);

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
      updateTenant,
      listMembers,
      inviteCollaborator,
      listPendingInvites,
      cancelInvite,
      updateMemberRole,
      removeMember,
      acceptInvite,
      forgotPassword,
      resetPassword,
      refreshSession,
    }),
    [status, session, login, register, logout, listProfiles, switchProfile, createProfile, updateTenant,
     listMembers, inviteCollaborator, listPendingInvites, cancelInvite, updateMemberRole, removeMember, acceptInvite,
     forgotPassword, resetPassword, refreshSession]
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
