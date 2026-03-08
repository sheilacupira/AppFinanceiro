import { useEffect, useState, useCallback } from 'react';
import { fetchUsers, giftUser, revokeUser, blockUser, type AdminUser } from '@/lib/adminService';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  pro: 'bg-violet-700 text-violet-100',
  enterprise: 'bg-yellow-700 text-yellow-100',
};

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{text}</span>;
}

interface GiftModalProps {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (planId: string, days: number) => void;
}

function GiftModal({ user, onClose, onConfirm }: GiftModalProps) {
  const [planId, setPlanId] = useState('pro');
  const [days, setDays] = useState(30);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white font-semibold">🎁 Dar plano de presente</h3>
        <p className="text-gray-400 text-sm">{user.email}</p>

        <div>
          <label className="text-sm text-gray-300 mb-1 block">Plano</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-1 block">Dias</label>
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800">
            Cancelar
          </button>
          <button onClick={() => onConfirm(planId, days)} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [giftTarget, setGiftTarget] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({ search, plan: planFilter, status: statusFilter, page });
      setUsers(res.users);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleGift(planId: string, days: number) {
    if (!giftTarget) return;
    try {
      const res = await giftUser(giftTarget.email, planId, days);
      showToast(res.message);
      setGiftTarget(null);
      load();
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message);
    }
  }

  async function handleRevoke(user: AdminUser) {
    if (!confirm(`Revogar plano de ${user.email}?`)) return;
    try {
      const res = await revokeUser(user.email);
      showToast(res.message);
      load();
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message);
    }
  }

  async function handleBlock(user: AdminUser) {
    const action = user.isBlocked ? 'desbloquear' : 'bloquear';
    if (!confirm(`Deseja ${action} ${user.email}?`)) return;
    try {
      const res = await blockUser(user.email, !user.isBlocked);
      showToast(res.message);
      load();
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message);
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm z-50 max-w-xs">
          {toast}
        </div>
      )}

      {giftTarget && (
        <GiftModal user={giftTarget} onClose={() => setGiftTarget(null)} onConfirm={handleGift} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Usuários <span className="text-gray-500 text-lg">({total})</span></h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por email ou nome..."
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
        >
          <option value="">Todos os planos</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="blocked">Bloqueados</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3">Usuário</th>
              <th className="text-left px-4 py-3">Plano</th>
              <th className="text-left px-4 py-3">Expira</th>
              <th className="text-left px-4 py-3">Cadastro</th>
              <th className="text-right px-5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-600">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-600">Nenhum usuário encontrado</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{u.name || '—'}</div>
                    <div className="text-gray-400 text-xs">{u.email}</div>
                    {u.isBlocked && <span className="text-red-400 text-xs">🚫 bloqueado</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge text={u.plan} color={PLAN_COLORS[u.plan] ?? 'bg-gray-700 text-gray-300'} />
                    {u.billingStatus === 'gift' && <span className="ml-1 text-pink-400 text-xs">🎁</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.giftExpiry ? new Date(u.giftExpiry).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setGiftTarget(u)}
                        className="text-xs px-3 py-1 rounded-lg bg-violet-700/40 hover:bg-violet-700 text-violet-300 transition-colors"
                      >
                        🎁 Gift
                      </button>
                      {u.billingStatus === 'gift' && (
                        <button
                          onClick={() => handleRevoke(u)}
                          className="text-xs px-3 py-1 rounded-lg bg-orange-700/40 hover:bg-orange-700/70 text-orange-300 transition-colors"
                        >
                          Revogar
                        </button>
                      )}
                      <button
                        onClick={() => handleBlock(u)}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                          u.isBlocked
                            ? 'bg-green-700/40 hover:bg-green-700/70 text-green-300'
                            : 'bg-red-700/40 hover:bg-red-700/70 text-red-300'
                        }`}
                      >
                        {u.isBlocked ? '✅ Desbloquear' : '🚫 Bloquear'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 disabled:opacity-40 text-sm"
          >
            ← Anterior
          </button>
          <span className="text-gray-500 text-sm">{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 disabled:opacity-40 text-sm"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
