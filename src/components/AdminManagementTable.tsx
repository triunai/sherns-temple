import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/languageContext';
import { useAdminProfiles } from '@/hooks/useAdminProfiles';
import type { AdminProfile } from '@/types';

interface AdminManagementTableProps {
  currentUserId: string;
  currentUserRole: string;
}

export default function AdminManagementTable({ currentUserId, currentUserRole }: AdminManagementTableProps) {
  const { t } = useLanguage();
  const { admins, loading, toggleApproval } = useAdminProfiles();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const others = admins.filter((a) => a.user_id !== currentUserId);

  async function handleToggle(admin: AdminProfile, approve: boolean) {
    setUpdatingId(admin.user_id);
    try {
      await toggleApproval(admin.user_id, approve);
      toast.success(`Admin "${admin.email}" ${approve ? 'approved' : 'revoked'}.`, { duration: 3000 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Approval Toggle Error: ${msg}`, { duration: 6000 });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-center text-temple-goldLight/40 text-sm animate-shimmer py-8">
        {t('admin_table_loading')}
      </p>
    );
  }

  if (others.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-temple-goldLight/40">{t('admin_management_no_admins')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-temple-gold/20">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-temple-card text-temple-goldLight/70">
            <th className="text-left p-3 font-medium">Email</th>
            <th className="text-center p-3 font-medium">Role</th>
            <th className="text-center p-3 font-medium">{t('admin_status')}</th>
            <th className="text-center p-3 font-medium">{t('admin_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {others.map((admin) => {
            const isUpdating = updatingId === admin.user_id;
            return (
              <tr
                key={admin.user_id}
                className="border-t border-temple-gold/10 hover:bg-temple-gold/5 transition-colors"
              >
                <td className="p-3 text-white">{admin.email}</td>
                <td className="p-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                    admin.role === 'superadmin'
                      ? 'bg-temple-gold/20 text-temple-gold'
                      : 'bg-temple-bg text-temple-goldLight/60'
                  }`}>
                    {admin.role}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                    admin.is_approved
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-temple-yellow/20 text-temple-yellow'
                  }`}>
                    {admin.is_approved ? t('approval_approved') : t('approval_pending')}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {currentUserRole === 'superadmin' && (
                    <button
                      onClick={() => handleToggle(admin, !admin.is_approved)}
                      disabled={isUpdating}
                      className={`text-[10px] px-3 py-1 rounded border transition-colors ${
                        admin.is_approved
                          ? 'border-red-700/40 text-red-400 hover:bg-red-950/30'
                          : 'border-green-700/40 text-green-400 hover:bg-green-950/30'
                      }`}
                    >
                      {isUpdating
                        ? '...'
                        : admin.is_approved
                          ? t('admin_management_revoke')
                          : t('admin_management_approve')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
