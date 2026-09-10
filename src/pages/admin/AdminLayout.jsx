import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Images, Tag, Album, Settings, LogOut, Camera, Menu, X, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/photos', label: 'Photos', icon: Images },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/albums', label: 'Albums', icon: Album },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const titles = {
  '/admin': 'Dashboard',
  '/admin/photos': 'Photos',
  '/admin/categories': 'Categories',
  '/admin/albums': 'Albums',
  '/admin/settings': 'Settings',
  '/admin/account': 'Account',
};

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Close on Escape and trap focus
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // focus first link
    setTimeout(() => drawerRef.current?.querySelector('a')?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const currentTitle = titles[location.pathname] || titles[Object.keys(titles).find(k => location.pathname.startsWith(k) && k !== '/admin')] || 'Admin';

  return (
    <div className="min-h-screen bg-[var(--bg)] flex overflow-x-hidden">
      {/* Desktop Sidebar — fixed, does not scroll with page */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[260px] border-r border-[var(--border)] bg-[var(--surface)] flex-col h-[100dvh] overflow-hidden">
        <div className="px-6 py-6 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center shrink-0">
            <Camera size={16} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-semibold leading-none truncate">Muwan Shots</div>
            <div className="text-xs text-[var(--text-muted)]">Admin</div>
          </div>
        </div>

        <nav aria-label="Primary" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isActive ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <item.icon size={16} aria-hidden />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin/account"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isActive ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)]'}`}
          >
            <User size={16} aria-hidden /> Account
          </NavLink>
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="px-3 py-2.5 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <div className="text-sm font-medium truncate">{admin?.name || 'Admin'}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{admin?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] hover:bg-[var(--bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Logout"
          >
            <LogOut size={16} aria-hidden /> Logout
          </button>
        </div>
      </aside>

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile/Tablet Drawer */}
      <aside
        ref={drawerRef}
        aria-label="Admin navigation"
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 left-0 z-40 w-[300px] max-w-[85vw] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-transform duration-300 lg:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 py-6 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center"><Camera size={16} aria-hidden /></div>
            <div>
              <div className="font-serif font-semibold leading-none">Muwan Shots</div>
              <div className="text-xs text-[var(--text-muted)]">Admin</div>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0">
            <X size={18} aria-hidden />
          </button>
        </div>
        <nav aria-label="Mobile primary" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-soft)]'}`}
            >
              <item.icon size={16} aria-hidden /> {item.label}
            </NavLink>
          ))}
          <NavLink to="/admin/account" onClick={() => setDrawerOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-soft)]'}`}>
            <User size={16} aria-hidden /> Account
          </NavLink>
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <div className="text-sm font-medium truncate">{admin?.name || 'Admin'}</div>
          <div className="text-xs text-[var(--text-muted)] truncate">{admin?.email}</div>
          <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)]">
            <LogOut size={16} aria-hidden /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden lg:ml-[260px]">
        {/* Admin Header — sits to the right of fixed sidebar on desktop */}
        <header className="sticky top-0 z-20 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            className="lg:hidden w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Menu size={18} aria-hidden />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>Admin</span> <ChevronRight size={12} aria-hidden /> <span className="text-[var(--text-primary)] font-medium truncate">{currentTitle}</span>
            </div>
            <h1 className="font-serif text-lg sm:text-xl font-semibold leading-none truncate">{currentTitle}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="hidden lg:inline truncate max-w-[160px]">{admin?.email}</span>
            <span className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center text-xs font-semibold shrink-0" aria-hidden>{(admin?.name || admin?.email || 'A').trim().charAt(0).toUpperCase()}</span>
          </div>
        </header>

        {/* Mobile pills - only on dashboard/photos etc. keeps existing but now drawer handles nav, so pills are secondary */}
        <div className="lg:hidden border-b border-[var(--border)] bg-[var(--surface)] px-2 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isActive ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-muted)]'
                }`
              }
            >
              <item.icon size={14} aria-hidden /> {item.label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
