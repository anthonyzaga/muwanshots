import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLogin() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Muwan Shots</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Admin — Sign in to manage your portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-8 space-y-5 shadow-sm">
          <div>
            <h2 className="font-serif text-xl">Welcome back</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Enter your admin credentials</p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@muwanshots.com"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-full bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Secure HTTP-only session · 7 days
          </p>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          <a href="/" className="hover:underline">← Back to website</a>
        </p>
      </div>
    </div>
  );
}
