import { useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { useAuth } from '@/hooks/useAuth';

export default function AccountSettings() {
  const { t } = useLanguage();
  const { updateEmail, updatePassword, loading, authError } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);

  async function handleEmailUpdate() {
    setLocalError(null);
    setEmailSuccess(false);
    if (!newEmail) {
      setLocalError(t('form_required'));
      return;
    }
    updateEmail(newEmail).then((err) => {
      if (err) {
        setLocalError(err);
      } else {
        setEmailSuccess(true);
        setNewEmail('');
      }
    });
  }

  async function handlePasswordUpdate() {
    setLocalError(null);
    setPasswordSuccess(false);
    if (!newPassword || !confirmNewPassword) {
      setLocalError(t('form_required'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError(t('settings_password_mismatch'));
      return;
    }
    updatePassword(newPassword).then((err) => {
      if (err) {
        setLocalError(err);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    });
  }

  const displayError = localError || (authError ? t(authError) : null);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {displayError && (
        <p className="text-red-400 text-xs text-center bg-red-950/20 border border-red-800/30 rounded p-3">
          {displayError}
        </p>
      )}

      {/* Update Email */}
      <div className="bg-temple-card/50 border border-temple-gold/20 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-temple-goldLight">
          {t('settings_email_label')}
        </h3>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-temple-goldLight/70">
            {t('settings_new_email')}
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailUpdate()}
            placeholder={t('settings_new_email')}
            autoComplete="email"
            className="w-full px-4 py-2.5 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
          />
        </div>
        {emailSuccess && (
          <p className="text-green-400 text-xs">{t('settings_success')}</p>
        )}
        <button
          onClick={handleEmailUpdate}
          disabled={loading}
          className="w-full py-2 rounded font-semibold text-xs bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors disabled:opacity-50"
        >
          {loading ? t('form_loading') : t('settings_save')}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-temple-card/50 border border-temple-gold/20 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-temple-goldLight">
          {t('settings_password_label')}
        </h3>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-temple-goldLight/70">
            {t('settings_new_password')}
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('settings_new_password')}
            autoComplete="new-password"
            className="w-full px-4 py-2.5 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-temple-goldLight/70">
            {t('settings_confirm_password')}
          </label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordUpdate()}
            placeholder={t('settings_confirm_password')}
            autoComplete="new-password"
            className="w-full px-4 py-2.5 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
          />
        </div>

        {passwordSuccess && (
          <p className="text-green-400 text-xs">{t('settings_success')}</p>
        )}

        <button
          onClick={handlePasswordUpdate}
          disabled={loading}
          className="w-full py-2 rounded font-semibold text-xs bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors disabled:opacity-50"
        >
          {loading ? t('form_loading') : t('settings_save')}
        </button>
      </div>
    </div>
  );
}
