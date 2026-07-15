'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_PLATFORM_CONFIG,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SECURITY_PREFS,
  type PlatformConfig,
  type NotificationPrefs,
  type SecurityPrefs,
} from '@/lib/supabase';
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Save,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';

type TabKey = 'profile' | 'platform' | 'notifications' | 'security';

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Admin Profile', icon: User },
  { key: 'platform', label: 'Platform Config', icon: SettingsIcon },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security & Access', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Platform config state
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(DEFAULT_PLATFORM_CONFIG);
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformMsg, setPlatformMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security state
  const [securityPrefs, setSecurityPrefs] = useState<SecurityPrefs>(DEFAULT_SECURITY_PREFS);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ userId: string; lastSignIn: string | null } | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setSessionInfo({
        userId: session.user.id,
        lastSignIn: session.user.last_sign_in_at || null,
      });

      // Fetch admin user profile
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('auth_user_id', session.user.id)
        .single();

      if (userData) {
        setProfile({
          full_name: userData.full_name || '',
          email: userData.email || session.user.email || '',
        });
      }

      // Fetch all admin settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (settingsData) {
        for (const row of settingsData) {
          if (row.setting_key === 'platform_config') {
            setPlatformConfig({ ...DEFAULT_PLATFORM_CONFIG, ...(row.setting_value as PlatformConfig) });
          } else if (row.setting_key === 'notification_prefs') {
            setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(row.setting_value as NotificationPrefs) });
          } else if (row.setting_key === 'security_prefs') {
            setSecurityPrefs({ ...DEFAULT_SECURITY_PREFS, ...(row.setting_value as SecurityPrefs) });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const upsertSetting = async (key: string, value: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('admin_settings')
      .upsert(
        { setting_key: key, setting_value: value, updated_by: session.user.id },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { error: dbError } = await supabase
        .from('users')
        .update({ full_name: profile.full_name, email: profile.email })
        .eq('auth_user_id', session.user.id);

      if (dbError) throw dbError;

      if (profile.email && profile.email !== session.user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: profile.email });
        if (authError) throw authError;
      }

      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileMsg({ type: 'error', text: 'Failed to update profile. ' + (error as Error).message });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePlatformConfig = async () => {
    setPlatformSaving(true);
    setPlatformMsg(null);
    try {
      await upsertSetting('platform_config', platformConfig as unknown as Record<string, unknown>);
      setPlatformMsg({ type: 'success', text: 'Platform configuration saved.' });
    } catch (error) {
      console.error('Error saving platform config:', error);
      setPlatformMsg({ type: 'error', text: 'Failed to save configuration. ' + (error as Error).message });
    } finally {
      setPlatformSaving(false);
    }
  };

  const saveNotifications = async () => {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      await upsertSetting('notification_prefs', notifPrefs as unknown as Record<string, unknown>);
      setNotifMsg({ type: 'success', text: 'Notification preferences saved.' });
    } catch (error) {
      console.error('Error saving notifications:', error);
      setNotifMsg({ type: 'error', text: 'Failed to save preferences. ' + (error as Error).message });
    } finally {
      setNotifSaving(false);
    }
  };

  const saveSecurity = async () => {
    setSecuritySaving(true);
    setSecurityMsg(null);
    try {
      if (passwordForm.new) {
        if (passwordForm.new.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        if (passwordForm.new !== passwordForm.confirm) {
          throw new Error('New passwords do not match.');
        }
        const { error: pwdError } = await supabase.auth.updateUser({ password: passwordForm.new });
        if (pwdError) throw pwdError;
        setPasswordForm({ current: '', new: '', confirm: '' });
      }

      await upsertSetting('security_prefs', securityPrefs as unknown as Record<string, unknown>);
      setSecurityMsg({ type: 'success', text: 'Security settings saved.' });
    } catch (error) {
      console.error('Error saving security settings:', error);
      setSecurityMsg({ type: 'error', text: 'Failed to save security settings. ' + (error as Error).message });
    } finally {
      setSecuritySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#113f59]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <section className="rounded-[28px] border border-[#EDE9DD] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(71,115,114,0.05)] lg:px-8 lg:py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D9EBE8] text-[#113f59]">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Settings</h1>
            <p className="mt-2 text-sm text-slate-500">Manage your admin profile, platform configuration, notifications, and security.</p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 rounded-[20px] border border-[#EDE9DD] bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#113f59] to-[#9DCFDB] text-white shadow-[0_10px_24px_rgba(17,63,89,0.18)]'
                  : 'text-slate-600 hover:bg-[#D9EBE8]/70 hover:text-[#113f59]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D9EBE8] text-[#113f59]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Admin Profile</h2>
                <p className="text-sm text-slate-500">Update your personal admin account details.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </div>

          {profileMsg && (
            <div className={`mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
            }`}>
              {profileMsg.type === 'success' ? <Check className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {profileMsg.text}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] disabled:opacity-50"
            >
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'platform' && (
        <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D9EBE8] text-[#113f59]">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Platform Configuration</h2>
                <p className="text-sm text-slate-500">Manage subscription tier names, pricing, and application review defaults.</p>
              </div>
            </div>
          </div>

          {/* Tier Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Subscription Tiers</h3>
            {(['get_started', 'premium', 'premium_plus'] as const).map((tierKey) => (
              <div key={tierKey} className="grid gap-4 rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8]/50 p-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {tierKey.replace(/_/g, ' ')} — Display Name
                  </label>
                  <input
                    type="text"
                    value={platformConfig.tierNames[tierKey]}
                    onChange={(e) =>
                      setPlatformConfig({
                        ...platformConfig,
                        tierNames: { ...platformConfig.tierNames, [tierKey]: e.target.value },
                      })
                    }
                    className="h-11 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Monthly Price (ZAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={platformConfig.tierPrices[tierKey]}
                    onChange={(e) =>
                      setPlatformConfig({
                        ...platformConfig,
                        tierPrices: { ...platformConfig.tierPrices, [tierKey]: Number(e.target.value) },
                      })
                    }
                    className="h-11 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Review Threshold */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Default Application Review</label>
            <select
              value={platformConfig.defaultReviewThreshold}
              onChange={(e) =>
                setPlatformConfig({
                  ...platformConfig,
                  defaultReviewThreshold: e.target.value as PlatformConfig['defaultReviewThreshold'],
                })
              }
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8] sm:max-w-xs"
            >
              <option value="manual">Manual review (all applications)</option>
              <option value="auto_approve">Auto-approve all applications</option>
              <option value="auto_reject">Auto-reject all applications</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">Controls how new vendor applications are processed by default.</p>
          </div>

          {platformMsg && (
            <div className={`mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
              platformMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
            }`}>
              {platformMsg.type === 'success' ? <Check className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {platformMsg.text}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={savePlatformConfig}
              disabled={platformSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] disabled:opacity-50"
            >
              {platformSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {platformSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'notifications' && (
        <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D9EBE8] text-[#113f59]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Notifications &amp; Alerts</h2>
                <p className="text-sm text-slate-500">Choose which platform events trigger email notifications.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'newApplications' as const, label: 'New Application Submissions', desc: 'Get notified when a new vendor or venue application is submitted.' },
              { key: 'expiringSubs' as const, label: 'Expiring Subscriptions', desc: 'Receive alerts when vendor subscriptions are about to expire (5-day and 1-day reminders).' },
              { key: 'weeklySummary' as const, label: 'Weekly Summary Report', desc: 'A weekly digest of platform activity, new users, and revenue.' },
              { key: 'paymentAlerts' as const, label: 'Payment Received', desc: 'Get notified when a payment is recorded for a vendor subscription.' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8]/50 p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key] })}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                    notifPrefs[item.key] ? 'bg-[#113f59]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      notifPrefs[item.key] ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {notifMsg && (
            <div className={`mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
              notifMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
            }`}>
              {notifMsg.type === 'success' ? <Check className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {notifMsg.text}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={saveNotifications}
              disabled={notifSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] disabled:opacity-50"
            >
              {notifSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {notifSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D9EBE8] text-[#113f59]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Security &amp; Access</h2>
                <p className="text-sm text-slate-500">Manage password, two-factor preferences, and session settings.</p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8]/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#113f59]" />
              <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(['current', 'new', 'confirm'] as const).map((field) => (
                <div key={field}>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {field === 'confirm' ? 'Confirm New Password' : `${field.charAt(0).toUpperCase() + field.slice(1)} Password`}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[field] ? 'text' : 'password'}
                      value={passwordForm[field]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                      className="h-11 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPasswords[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Leave password fields blank to keep your current password. Minimum 8 characters.</p>
          </div>

          {/* 2FA Toggle */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8]/50 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#113f59]" />
                <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">Require a second verification step when signing in. (Preference stored — enforcement requires additional setup.)</p>
            </div>
            <button
              onClick={() => setSecurityPrefs({ ...securityPrefs, twoFactorEnabled: !securityPrefs.twoFactorEnabled })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                securityPrefs.twoFactorEnabled ? 'bg-[#113f59]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                  securityPrefs.twoFactorEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Session Timeout */}
          <div className="mt-4 rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8]/50 p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Session Timeout (minutes)</label>
            <select
              value={securityPrefs.sessionTimeout}
              onChange={(e) => setSecurityPrefs({ ...securityPrefs, sessionTimeout: Number(e.target.value) })}
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8] sm:max-w-xs"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">How long before an inactive admin session expires.</p>
          </div>

          {/* Session Info */}
          {sessionInfo && (
            <div className="mt-4 rounded-3xl border border-[#EDE9DD] bg-white p-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Session Information</h3>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-mono text-xs text-slate-700">{sessionInfo.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Sign-In:</span>
                  <span className="text-slate-700">
                    {sessionInfo.lastSignIn ? new Date(sessionInfo.lastSignIn).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {securityMsg && (
            <div className={`mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
              securityMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
            }`}>
              {securityMsg.type === 'success' ? <Check className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {securityMsg.text}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={saveSecurity}
              disabled={securitySaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] disabled:opacity-50"
            >
              {securitySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {securitySaving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
