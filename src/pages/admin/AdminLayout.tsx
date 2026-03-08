import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getAdminToken, clearAdminToken } from '@/lib/adminService';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users',     label: 'Usuários',   icon: '👥' },
  { path: '/admin/affiliates',label: 'Afiliados',  icon: '🤝' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) navigate('/admin', { replace: true });
  }, [navigate]);

  function handleLogout() {
    clearAdminToken();
    navigate('/admin', { replace: true });
  }

  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <>
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <Link
        to="/"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-400 hover:bg-gray-800 transition-colors"
      >
        <span>🏠</span>
        Ver App
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── SIDEBAR desktop ── */}
      <aside className="hidden md:flex w-56 bg-gray-900 border-r border-gray-800 flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="text-xl font-bold text-white">🛡️ Admin</div>
          <div className="text-xs text-gray-500 mt-0.5">AppFinanceiro</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* ── TOPBAR mobile ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <div className="text-base font-bold text-white">🛡️ Admin</div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-gray-400 hover:text-white p-2"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── DRAWER mobile ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-14 left-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 p-3 space-y-1">
              <NavLinks onClose={() => setMenuOpen(false)} />
            </nav>
            <div className="p-3 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
              >
                <span>🚪</span> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <main className="flex-1 overflow-auto md:mt-0 mt-14">
        <Outlet />
      </main>
    </div>
  );
}
