import { useState, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '@/lib/languageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useEvents } from '@/hooks/useEvents';
import { isEnabled } from '@/config/features';
import AdminLoginView from './AdminLoginView';
import SubmissionsTable from './SubmissionsTable';
import AdminManagementTable from './AdminManagementTable';
import AccountSettings from './AccountSettings';
import EventsAdmin from './EventsAdmin';
import StatsCards from './admin/StatsCards';
import EventFinancialRollup from './admin/EventFinancialRollup';
import { HourglassIcon, RefreshIcon } from './ui/Icons';
import type { AdminTab, SubmissionStats } from '@/types';

interface AdminDashboardProps {
  onBackToPublic: () => void;
}

export default function AdminDashboard({ onBackToPublic }: AdminDashboardProps) {
  const { t } = useLanguage();
  const {
    session,
    user,
    profile,
    loading,
    isApproved,
    logout,
  } = useAuth();
  const { submissions, loading: subsLoading, updateApproval, refetch } = useSubmissions();
  const { events } = useEvents();
  const [adminTab, setAdminTab] = useState<AdminTab>('submissions');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const stats: SubmissionStats = useMemo(() => {
    return submissions.reduce<SubmissionStats>(
      (acc, submission) => {
        acc.total += 1;
        if (submission.admin_approval === 'Pending') {
          acc.pending += 1;
          acc.awaiting += submission.total_amount_paid;
        } else if (submission.admin_approval === 'Approved') {
          acc.approved += 1;
          acc.collected += submission.total_amount_paid;
        } else if (submission.admin_approval === 'Rejected') {
          acc.rejected += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, collected: 0, awaiting: 0 }
    );
  }, [submissions]);

  if (!isEnabled('ENABLE_ADMIN_VIEW')) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-temple-goldLight/60">Admin view is disabled.</p>
      </section>
    );
  }

  // Initializing session
  if (loading && !session) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-temple-goldLight/40 animate-shimmer text-sm">
          {t('carousel_loading')}
        </p>
      </section>
    );
  }

  // Unauthenticated → Login/Register
  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        <AdminLoginView onForgotSuccess={() => {}} />
      </>
    );
  }

  // Authenticated but not approved → pending approval screen
  if (!isApproved) {
    return (
      <>
        <Toaster position="top-right" />
        <section className="max-w-md mx-auto px-4 py-16">
          <div className="bg-temple-card border border-temple-gold/30 rounded-lg p-8 text-center space-y-4">
            <HourglassIcon className="w-10 h-10 mx-auto text-temple-gold/70" />
            <h2 className="text-lg font-bold text-temple-goldLight">
              {t('admin_pending_approval_title')}
            </h2>
            <p className="text-xs text-temple-goldLight/70">
              {t('admin_pending_approval_body')}
            </p>
            <button
              onClick={async () => {
                await logout();
                onBackToPublic();
              }}
              className="text-xs text-temple-goldLight/40 hover:text-temple-goldLight/70 transition-colors"
            >
              {t('back_to_public')}
            </button>
          </div>
        </section>
      </>
    );
  }

  // Approved admin dashboard
  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'submissions', label: t('admin_submissions_title') },
    { key: 'events', label: t('admin_events_title') },
    { key: 'management', label: t('admin_management_title') },
    { key: 'settings', label: t('settings_title') },
  ];

  async function handleLogout() {
    setShowLogoutConfirm(false);
    await logout();
    onBackToPublic();
  }

  return (
    <>
      <Toaster position="top-right" />
      <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Header bar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-temple-goldLight">
            {t('admin_dashboard')}
          </h2>
          <span className="text-[11px] text-temple-goldLight/50 truncate max-w-[55%]">
            {user?.email}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={subsLoading}
            className="min-h-[44px] flex items-center gap-1.5 text-temple-goldLight/50 hover:text-temple-goldLight border border-temple-gold/30 rounded px-3 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={subsLoading ? 'inline-block animate-spin' : 'inline-block'}>
              ↻
            </span>
            {t('admin_refresh')}
          </button>
          <button
            onClick={onBackToPublic}
            className="min-h-[44px] text-temple-goldLight/50 hover:text-temple-goldLight border border-temple-gold/30 rounded px-3 py-1 transition-colors"
          >
            {t('back_to_public')}
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="min-h-[44px] text-red-400/60 hover:text-red-400 border border-red-800/40 rounded px-3 py-1 transition-colors"
          >
            {t('admin_logout')}
          </button>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-temple-card border border-temple-gold/30 rounded-lg p-6 max-w-sm w-full mx-4 space-y-4 text-center">
            <p className="text-sm text-temple-goldLight/80">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs rounded border border-temple-gold/40 text-temple-goldLight/70 hover:bg-temple-gold/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs rounded bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors"
              >
                {t('admin_logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {!subsLoading && <StatsCards stats={stats} />}

      {/* Per-event financial + registration rollup (Feature #4) */}
      {!subsLoading && <EventFinancialRollup submissions={submissions} events={events} />}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-temple-gold/20 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAdminTab(tab.key)}
            className={`min-h-[40px] px-4 py-2 text-xs font-medium rounded-t transition-colors whitespace-nowrap ${
              adminTab === tab.key
                ? 'bg-temple-gold/10 text-temple-gold border-b-2 border-temple-gold'
                : 'text-temple-goldLight/50 hover:text-temple-goldLight/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {adminTab === 'submissions' && (
        <SubmissionsTable
          submissions={submissions}
          events={events}
          loading={subsLoading}
          onUpdateApproval={updateApproval}
        />
      )}

      {adminTab === 'events' && <EventsAdmin />}

      {adminTab === 'management' && profile && (
        <AdminManagementTable
          currentUserId={user!.id}
          currentUserRole={profile.role}
        />
      )}

      {adminTab === 'settings' && (
        <AccountSettings />
      )}
      </section>
      </>
  );
}
