import { apiRequest } from './apiClient';

const ADMIN_TOKEN_KEY = 'af_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string) {
  return apiRequest<{ token: string; email: string }>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  users: { total: number; newThisMonth: number; newLastMonth: number; growth: number | null; blocked: number };
  plans: { free: number; pro: number; enterprise: number; gift: number };
  affiliates: { active: number; pendingCommissions: number; top: { name: string; code: string; totalEarned: number; commissionRate: number; _count: { referrals: number } }[] };
}

export async function fetchDashboard(): Promise<DashboardData> {
  return apiRequest<DashboardData>('/api/admin/dashboard', { headers: adminHeaders() });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isBlocked: boolean;
  referralCode?: string;
  plan: string;
  billingStatus?: string;
  giftExpiry?: string;
  hasSubscription: boolean;
  createdAt: string;
}

export interface UsersResponse {
  total: number;
  page: number;
  pages: number;
  users: AdminUser[];
}

export async function fetchUsers(params?: { search?: string; plan?: string; status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.plan)   qs.set('plan', params.plan);
  if (params?.status) qs.set('status', params.status);
  if (params?.page)   qs.set('page', String(params.page));
  return apiRequest<UsersResponse>(`/api/admin/users?${qs}`, { headers: adminHeaders() });
}

export async function giftUser(email: string, planId: string, days: number) {
  return apiRequest<{ message: string }>('/api/admin/gift', {
    method: 'POST',
    body: JSON.stringify({ email, planId, days }),
    headers: adminHeaders(),
  });
}

export async function revokeUser(email: string) {
  return apiRequest<{ message: string }>('/api/admin/revoke', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: adminHeaders(),
  });
}

export async function blockUser(email: string, blocked: boolean) {
  return apiRequest<{ message: string }>('/api/admin/block', {
    method: 'POST',
    body: JSON.stringify({ email, blocked }),
    headers: adminHeaders(),
  });
}

// ── Affiliates ────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  status: string;
  totalEarned: number;
  totalPaid: number;
  pendingCommission: number;
  totalReferrals: number;
  notes?: string;
  createdAt: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredEmail: string;
  referredUserId?: string;
  plan?: string;
  commissionAmount: number;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
}

export async function fetchAffiliates(): Promise<Affiliate[]> {
  return apiRequest<Affiliate[]>('/api/admin/affiliates', { headers: adminHeaders() });
}

export async function createAffiliate(data: { name: string; email: string; code: string; commissionRate: number; notes?: string }) {
  return apiRequest<Affiliate>('/api/admin/affiliates', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: adminHeaders(),
  });
}

export async function updateAffiliate(id: string, data: Partial<Affiliate>) {
  return apiRequest<Affiliate>(`/api/admin/affiliates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: adminHeaders(),
  });
}

export async function fetchReferrals(affiliateId: string): Promise<AffiliateReferral[]> {
  return apiRequest<AffiliateReferral[]>(`/api/admin/affiliates/${affiliateId}/referrals`, { headers: adminHeaders() });
}

export async function updateReferral(id: string, status: string) {
  return apiRequest<AffiliateReferral>(`/api/admin/affiliates/referrals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: adminHeaders(),
  });
}
