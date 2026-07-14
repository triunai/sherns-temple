import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/languageContext';
import { useAuth } from '@/hooks/useAuth';

type PillTab = 'login' | 'register';

interface AdminLoginViewProps {
  onForgotSuccess: () => void;
}

export default function AdminLoginView({ onForgotSuccess }: AdminLoginViewProps) {
  const { t } = useLanguage();
  const { login, register, forgotPassword, authError, loading, clearError } = useAuth();
  const [tab, setTab] = useState<PillTab>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function switchTab(newTab: PillTab) {
    setTab(newTab);
    setLocalError(null);
    setForgotSent(false);
    setRegisterDone(false);
    clearError();
  }

  async function handleLogin() {
    setLocalError(null);
    clearError();
    if (!email || !password) {
      const msg = t('form_required');
      setLocalError(msg);
      toast.error(`Validation: ${msg}`, { duration: 4000 });
      return;
    }
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalError(msg);
      toast.error(`Login Exception: ${msg}`, { duration: 6000 });
    }
  }

  async function handleRegister() {
    setLocalError(null);
    clearError();
    if (!email || !password || !confirmPassword) {
      const msg = t('form_required');
      setLocalError(msg);
      toast.error(`Validation: ${msg}`, { duration: 4000 });
      return;
    }
    if (password !== confirmPassword) {
      const msg = t('settings_password_mismatch');
      setLocalError(msg);
      toast.error(`Validation: ${msg}`, { duration: 4000 });
      return;
    }
    try {
      const ok = await register(email, password);
      if (ok) {
        setRegisterDone(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalError(msg);
      toast.error(`Register Exception: ${msg}`, { duration: 6000 });
    }
  }

  async function handleForgot() {
    setLocalError(null);
    clearError();
    if (!email) {
      const msg = t('form_required');
      setLocalError(msg);
      toast.error(`Validation: ${msg}`, { duration: 4000 });
      return;
    }
    try {
      const ok = await forgotPassword(email);
      if (ok) {
        setForgotSent(true);
        onForgotSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalError(msg);
      toast.error(`Forgot Password Exception: ${msg}`, { duration: 6000 });
    }
  }

  const displayError = localError || (authError ? t(authError) : null);

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <div className="bg-temple-card border border-temple-gold/30 rounded-lg p-6 space-y-5">
        <h2 className="text-lg font-bold text-temple-goldLight text-center">
          {t('admin_dashboard')}
        </h2>

        {/* Pill Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden border border-temple-gold/40 bg-temple-bg">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              tab === 'login'
                ? 'bg-temple-gold text-black'
                : 'text-temple-goldLight/60 hover:text-temple-goldLight'
            }`}
          >
            {t('admin_tab_login')}
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              tab === 'register'
                ? 'bg-temple-gold text-black'
                : 'text-temple-goldLight/60 hover:text-temple-goldLight'
            }`}
          >
            {t('admin_tab_register')}
          </button>
        </div>

        {tab === 'login' ? (
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-temple-goldLight/80">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={t('admin_email_placeholder')}
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
              />
            </div>

            {/* Password + Show/Hide Toggle */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-temple-goldLight/80">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder={t('admin_password_placeholder')}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-temple-goldLight/40 hover:text-temple-goldLight/80 text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? t('admin_hide_password') : t('admin_show_password')}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <button
              type="button"
              onClick={handleForgot}
              className="text-xs text-temple-gold/60 hover:text-temple-gold transition-colors"
            >
              {t('admin_forgot_password')}
            </button>

            {forgotSent && (
              <p className="text-green-400 text-xs text-center">
                {t('auth_forgot_success')}
              </p>
            )}

            {displayError && (
              <p className="text-red-400 text-xs text-center">{displayError}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded font-semibold text-sm bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors disabled:opacity-50"
            >
              {loading ? t('form_loading') : t('admin_tab_login')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-temple-goldLight/80">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('admin_email_placeholder')}
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
              />
            </div>

            {/* Password + Show/Hide */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-temple-goldLight/80">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('admin_password_placeholder')}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-10 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-temple-goldLight/40 hover:text-temple-goldLight/80 text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? t('admin_hide_password') : t('admin_show_password')}
                </button>
              </div>
            </div>

            {/* Confirm Password + Show/Hide */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-temple-goldLight/80">
                {t('settings_confirm_password')}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('admin_confirm_password_placeholder')}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-10 bg-temple-bg border border-temple-gold/40 rounded text-white text-sm placeholder:text-white/25 focus:ring-2 focus:ring-temple-gold/60 focus:border-temple-gold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-temple-goldLight/40 hover:text-temple-goldLight/80 text-xs"
                  tabIndex={-1}
                >
                  {showConfirm ? t('admin_hide_password') : t('admin_show_password')}
                </button>
              </div>
            </div>

            {registerDone ? (
              <div className="bg-temple-bg/50 border border-temple-gold/20 rounded-lg p-4 text-center space-y-2">
                <span className="text-2xl block">✅</span>
                <p className="text-green-400 text-xs">
                  {t('admin_register_success_message')}
                </p>
              </div>
            ) : (
              <>
                {displayError && (
                  <p className="text-red-400 text-xs text-center">{displayError}</p>
                )}

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full py-2.5 rounded font-semibold text-sm bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson transition-colors disabled:opacity-50"
                >
                  {loading ? t('form_loading') : t('admin_tab_register')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
