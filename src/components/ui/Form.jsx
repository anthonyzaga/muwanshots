export function Field({ label, id, error, hint, required, children }) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">
          {label} {required && <span className="text-[var(--accent)]" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
const inputBase = "w-full rounded-xl border bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors disabled:opacity-50";
export function Input({ className='', error, ...props }) {
  return <input className={`${inputBase} ${error ? 'border-red-500' : 'border-[var(--border)]'} ${className}`} aria-invalid={!!error} {...props} />;
}
export function Textarea({ className='', error, ...props }) {
  return <textarea className={`${inputBase} min-h-[110px] resize-y ${error ? 'border-red-500' : 'border-[var(--border)]'} ${className}`} aria-invalid={!!error} {...props} />;
}
export function Select({ className='', error, children, ...props }) {
  return <select className={`${inputBase} ${error ? 'border-red-500' : 'border-[var(--border)]'} ${className}`} aria-invalid={!!error} {...props}>{children}</select>;
}
