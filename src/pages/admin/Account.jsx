import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Shield, Mail, Lock, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

export default function Account() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Email form
  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '', confirmEmail: '' });
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // Password form
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSaving, setPassSaving] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    if (!emailForm.currentPassword || !emailForm.newEmail || !emailForm.confirmEmail) {
      setEmailError('All fields are required');
      return;
    }
    if (emailForm.newEmail.toLowerCase() !== emailForm.confirmEmail.toLowerCase()) {
      setEmailError('New email and confirmation do not match');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      setEmailError('Invalid email');
      return;
    }
    setEmailSaving(true);
    try {
      const res = await api.request('/auth/profile', {
        method: 'PUT',
        body: { currentPassword: emailForm.currentPassword, newEmail: emailForm.newEmail.trim().toLowerCase(), newName: admin.name },
      });
      if (res.requiresRelogin) {
        setEmailSuccess('Email updated. Please log in again with your new email.');
        setTimeout(async () => {
          await logout();
          navigate('/admin/login', { replace: true });
        }, 1500);
      } else {
        setEmailSuccess('Email updated successfully');
        setEmailForm({ currentPassword: '', newEmail: '', confirmEmail: '' });
      }
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      setPassError('All fields are required');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New password and confirmation do not match');
      return;
    }
    if (passForm.newPassword.length < 8) {
      setPassError('New password must be at least 8 characters');
      return;
    }
    setPassSaving(true);
    try {
      await api.request('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
          confirmPassword: passForm.confirmPassword,
        },
      });
      setPassSuccess('Password updated. Please log in again.');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(async () => {
        await logout();
        navigate('/admin/login', { replace: true });
      }, 1500);
    } catch (err) {
      setPassError(err.message);
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Account</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage your administrator account. Email and password changes require your current password.</p>
      </div>

      {/* Profile display */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center font-semibold text-lg shrink-0" aria-hidden>
            {(admin?.name || admin?.email || 'A').trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{admin?.name || 'Admin'}</div>
            <div className="text-sm text-[var(--text-muted)] truncate">{admin?.email}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
              <Shield size={12} aria-hidden /> Account active • Created {admin?.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Change email */}
      <form onSubmit={handleEmailSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4" noValidate>
        <div className="flex items-center gap-2">
          <Mail size={18} aria-hidden className="text-[var(--accent)]" />
          <h2 className="font-semibold">Change email</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">You will need to log in again after changing your email.</p>

        {emailError && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3">{emailError}</div>}
        {emailSuccess && <div role="status" className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm px-4 py-3">{emailSuccess}</div>}

        <div className="space-y-1.5">
          <label htmlFor="email-current-password" className="block text-sm font-medium">Current password <span aria-hidden className="text-red-500">*</span></label>
          <input
            id="email-current-password"
            type="password"
            autoComplete="current-password"
            required
            value={emailForm.currentPassword}
            onChange={e => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-email" className="block text-sm font-medium">New email</label>
          <input
            id="new-email"
            type="email"
            autoComplete="email"
            required
            value={emailForm.newEmail}
            onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="new@muwanshots.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-email" className="block text-sm font-medium">Confirm new email</label>
          <input
            id="confirm-email"
            type="email"
            autoComplete="email"
            required
            value={emailForm.confirmEmail}
            onChange={e => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="new@muwanshots.com"
          />
        </div>

        <button
          type="submit"
          disabled={emailSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold disabled:opacity-50 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Save size={16} aria-hidden /> {emailSaving ? 'Saving…' : 'Update email'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4" noValidate>
        <div className="flex items-center gap-2">
          <Lock size={18} aria-hidden className="text-[var(--accent)]" />
          <h2 className="font-semibold">Change password</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">You will be logged out and need to log in with your new password.</p>

        {passError && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3">{passError}</div>}
        {passSuccess && <div role="status" className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm px-4 py-3">{passSuccess}</div>}

        <div className="space-y-1.5">
          <label htmlFor="pass-current" className="block text-sm font-medium">Current password</label>
          <input
            id="pass-current"
            type="password"
            autoComplete="current-password"
            required
            value={passForm.currentPassword}
            onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-sm font-medium">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={passForm.newPassword}
            onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="•••••••• (min 8)"
          />
          <p className="text-xs text-[var(--text-muted)]">At least 8 characters, must be different from current.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-sm font-medium">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={passForm.confirmPassword}
            onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle size={14} aria-hidden className="shrink-0" />
          <span>You will be logged out after changing your password.</span>
        </div>

        <button
          type="submit"
          disabled={passSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold disabled:opacity-50 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Save size={16} aria-hidden /> {passSaving ? 'Saving…' : 'Update password'}
        </button>
      </form>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
        <h3 className="text-sm font-medium flex items-center gap-2"><User size={14} aria-hidden /> Security</h3>
        <ul className="mt-2 text-xs text-[var(--text-muted)] list-disc list-inside space-y-1">
          <li>Passwords are hashed with bcrypt (10 rounds) and never stored in plain text.</li>
          <li>Sessions use HTTP-only <code className="px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">__Host-muwan_session</code> with Secure + SameSite=Lax.</li>
          <li>Email/password changes require your current password and invalidate the current session.</li>
        </ul>
      </div>
    </div>
  );
}
