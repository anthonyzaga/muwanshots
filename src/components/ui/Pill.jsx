export function Pill({ active, children, className='', ...props }) {
  return (
    <button
      className={`inline-flex items-center rounded-full px-5 py-2.5 text-xs sm:text-sm font-medium tracking-wide transition-colors border ${active ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] shadow-sm' : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({ children, className='' }) {
  return <span className={`inline-flex items-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 text-xs font-medium tracking-wide ${className}`}>{children}</span>;
}
