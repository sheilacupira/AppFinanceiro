import { useEffect, useState } from 'react';
import { fetchDashboard, type DashboardData } from '@/lib/adminService';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color ?? 'text-white'}`}>{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!data) return <div className="p-8 text-gray-400">Carregando...</div>;

  const mrr = (data.plans.pro * 29.9 + data.plans.enterprise * 99.9).toFixed(0);
  const growthLabel = data.users.growth !== null
    ? `${data.users.growth >= 0 ? '+' : ''}${data.users.growth}% vs mês anterior`
    : 'primeiro mês';

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Usuários */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Usuários</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={data.users.total} />
          <StatCard label="Novos este mês" value={data.users.newThisMonth} sub={growthLabel} color="text-green-400" />
          <StatCard label="Bloqueados" value={data.users.blocked} color={data.users.blocked > 0 ? 'text-red-400' : 'text-white'} />
          <StatCard label="MRR estimado" value={`R$ ${mrr}`} sub="Pro + Enterprise ativos" color="text-violet-400" />
        </div>
      </section>

      {/* Planos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Planos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Free" value={data.plans.free} color="text-gray-300" />
          <StatCard label="Pro" value={data.plans.pro} color="text-violet-400" />
          <StatCard label="Enterprise" value={data.plans.enterprise} color="text-yellow-400" />
          <StatCard label="Presente" value={data.plans.gift} color="text-pink-400" />
        </div>
      </section>

      {/* Afiliados */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Afiliados</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard label="Afiliados ativos" value={data.affiliates.active} />
          <StatCard
            label="Comissões pendentes"
            value={`R$ ${data.affiliates.pendingCommissions.toFixed(2)}`}
            color="text-yellow-400"
          />
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 col-span-1 lg:col-span-1">
            <div className="text-gray-400 text-sm mb-3">Top Afiliados</div>
            {data.affiliates.top.length === 0 ? (
              <div className="text-gray-600 text-sm">Nenhum afiliado ainda</div>
            ) : (
              <ol className="space-y-2">
                {data.affiliates.top.map((a, i) => (
                  <li key={a.code} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      <span className="text-gray-500 mr-2">{i + 1}.</span>
                      {a.name}
                      <span className="text-gray-600 ml-1 text-xs">({a._count.referrals} ref.)</span>
                    </span>
                    <span className="text-green-400">R$ {a.totalEarned.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
