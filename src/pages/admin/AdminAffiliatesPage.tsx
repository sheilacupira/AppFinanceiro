import { useEffect, useState } from 'react';
import {
  fetchAffiliates,
  createAffiliate,
  updateAffiliate,
  fetchReferrals,
  updateReferral,
  type Affiliate,
  type AffiliateReferral,
} from '@/lib/adminService';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-700/40 text-green-300',
  inactive: 'bg-gray-700 text-gray-400',
  suspended: 'bg-red-700/40 text-red-300',
};

const REFERRAL_COLORS: Record<string, string> = {
  pending: 'bg-yellow-700/40 text-yellow-300',
  confirmed: 'bg-blue-700/40 text-blue-300',
  paid: 'bg-green-700/40 text-green-300',
  cancelled: 'bg-gray-700 text-gray-400',
};

interface NewAffiliateForm {
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  notes: string;
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selected, setSelected] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState<NewAffiliateForm>({
    name: '', email: '', code: '', commissionRate: 0.20, notes: '',
  });
  const [saving, setSaving] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function loadAffiliates() {
    try {
      const data = await fetchAffiliates();
      setAffiliates(data);
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message);
    }
  }

  useEffect(() => { loadAffiliates(); }, []);

  async function handleSelectAffiliate(a: Affiliate) {
    setSelected(a);
    try {
      const refs = await fetchReferrals(a.id);
      setReferrals(refs);
    } catch {
      setReferrals([]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAffiliate({ ...form, code: form.code.toUpperCase() });
      showToast('✅ Afiliado criado com sucesso!');
      setShowForm(false);
      setForm({ name: '', email: '', code: '', commissionRate: 0.20, notes: '' });
      loadAffiliates();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(a: Affiliate, status: string) {
    try {
      await updateAffiliate(a.id, { status } as Partial<Affiliate>);
      showToast(`✅ Status atualizado para ${status}`);
      loadAffiliates();
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message);
    }
  }

  async function handleReferralStatus(id: string, status: string) {
    try {
      await updateReferral(id, status);
      showToast('✅ Indicação atualizada');
      if (selected) handleSelectAffiliate(selected);
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Afiliados</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Novo afiliado
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h3 className="text-white font-semibold">Cadastrar afiliado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Nome *</label>
              <input
                required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Email *</label>
              <input
                required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Código de indicação *</label>
              <input
                required value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="ex: MARIA20"
                maxLength={20}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm uppercase focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Comissão (%)</label>
              <input
                type="number" min={0} max={100} step={1}
                value={Math.round(form.commissionRate * 100)}
                onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) / 100 })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-300 mb-1 block">Observações</label>
              <input
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm disabled:opacity-50">
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de afiliados */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 text-sm text-gray-400 font-medium">
            Lista ({affiliates.length})
          </div>
          {affiliates.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-600 text-sm">Nenhum afiliado cadastrado</div>
          ) : (
            affiliates.map((a) => (
              <div
                key={a.id}
                onClick={() => handleSelectAffiliate(a)}
                className={`px-5 py-4 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/40 transition-colors ${selected?.id === a.id ? 'bg-gray-800/60 border-l-2 border-l-violet-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-white text-sm">{a.name}</div>
                    <div className="text-gray-400 text-xs">{a.email}</div>
                    <div className="mt-1">
                      <code className="text-violet-400 text-xs bg-violet-900/30 px-2 py-0.5 rounded">{a.code}</code>
                      <span className="text-gray-500 text-xs ml-2">{Math.round(a.commissionRate * 100)}% comissão</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? ''}`}>
                      {a.status}
                    </span>
                    <div className="text-green-400 text-sm font-medium mt-1">
                      R$ {a.totalEarned.toFixed(2)}
                    </div>
                    <div className="text-gray-500 text-xs">{a.totalReferrals} indicações</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {a.status !== 'active' && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(a, 'active'); }}
                      className="text-xs px-2 py-0.5 rounded bg-green-700/30 text-green-400 hover:bg-green-700/50">
                      Ativar
                    </button>
                  )}
                  {a.status === 'active' && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(a, 'inactive'); }}
                      className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600">
                      Desativar
                    </button>
                  )}
                  {a.status !== 'suspended' && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(a, 'suspended'); }}
                      className="text-xs px-2 py-0.5 rounded bg-red-700/30 text-red-400 hover:bg-red-700/50">
                      Suspender
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Indicações do afiliado selecionado */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 text-sm text-gray-400 font-medium">
            {selected ? `Indicações de ${selected.name}` : 'Selecione um afiliado'}
          </div>

          {!selected ? (
            <div className="px-5 py-8 text-center text-gray-600 text-sm">
              Clique em um afiliado para ver suas indicações
            </div>
          ) : referrals.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-600 text-sm">Nenhuma indicação ainda</div>
          ) : (
            referrals.map((r) => (
              <div key={r.id} className="px-5 py-3 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm">{r.referredEmail}</div>
                    <div className="text-gray-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                      {r.plan && <span className="ml-2 text-violet-400">{r.plan}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${REFERRAL_COLORS[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                    <div className="text-green-400 text-xs mt-0.5">
                      R$ {r.commissionAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
                {r.status === 'confirmed' && (
                  <button
                    onClick={() => handleReferralStatus(r.id, 'paid')}
                    className="mt-1 text-xs px-2 py-0.5 rounded bg-green-700/30 text-green-400 hover:bg-green-700/50"
                  >
                    Marcar como pago
                  </button>
                )}
                {r.status === 'pending' && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleReferralStatus(r.id, 'confirmed')}
                      className="text-xs px-2 py-0.5 rounded bg-blue-700/30 text-blue-400 hover:bg-blue-700/50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleReferralStatus(r.id, 'cancelled')}
                      className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {selected && (
            <div className="px-5 py-3 bg-gray-800/30 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total ganho</span>
                <span className="text-green-400 font-medium">R$ {selected.totalEarned.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Total pago</span>
                <span className="text-gray-300">R$ {selected.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Pendente</span>
                <span className="text-yellow-400">R$ {(selected.pendingCommission).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
