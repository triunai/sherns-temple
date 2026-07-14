import { useState, useCallback } from 'react';
import { LanguageProvider } from '@/lib/languageContext';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import BulletinGrid from '@/components/BulletinGrid';
import AdminDashboard from '@/components/AdminDashboard';
import Footer from '@/components/Footer';
import { isEnabled } from '@/config/features';

type View = 'public' | 'admin';

export default function App() {
  const [view, setView] = useState<View>('public');
  const { user } = useAuth();

  const toggleAdmin = useCallback(() => {
    setView((prev) => (prev === 'admin' ? 'public' : 'admin'));
  }, []);

  const isAdmin = view === 'admin' && isEnabled('ENABLE_ADMIN_VIEW');

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-temple-bg flex flex-col">
        <Header
          onAdminClick={toggleAdmin}
          isAdmin={isAdmin}
          userEmail={user?.email}
        />

        <main className="flex-1">
          {isAdmin ? (
            <AdminDashboard onBackToPublic={() => setView('public')} />
          ) : (
            <>
              <HeroCarousel />
              <BulletinGrid />
            </>
          )}
        </main>

        <Footer />
      </div>
    </LanguageProvider>
  );
}
