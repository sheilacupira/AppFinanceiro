import { useState } from 'react';
import { isSaasMode } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { BottomNav, NavPage } from '@/components/BottomNav';
import { AuthPage } from './AuthPage';
import { MonthPage } from './MonthPage';
import { YearPage } from './YearPage';
import { RecurrencesPage } from './RecurrencesPage';
import { CategoriesPage } from './CategoriesPage';
import { SettingsPage } from './SettingsPage';

function AppContent() {
  const [activePage, setActivePage] = useState<NavPage>('month');

  const renderPage = () => {
    switch (activePage) {
      case 'month':
        return <MonthPage />;
      case 'year':
        return <YearPage />;
      case 'recurrences':
        return <RecurrencesPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MonthPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto px-4 py-4 pb-20">
        {renderPage()}
      </main>
      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}

export default function Index() {
  const { status } = useAuth();

  if (isSaasMode && status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Carregando sessão...
      </div>
    );
  }

  if (isSaasMode && status === 'anonymous') {
    return <AuthPage />;
  }

  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
