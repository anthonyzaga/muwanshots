import { Link } from 'react-router-dom';

const base = "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed select-none";
const sizes = {
  sm: "h-9 px-5 text-sm",
  md: "h-11 px-7 text-sm sm:text-[0.9375rem]",
  lg: "h-[52px] px-8 text-[0.9375rem]",
};
const variants = {
  primary: "bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90 active:scale-[0.98] shadow-sm",
  secondary: "bg-[var(--accent)] text-white hover:brightness-110 active:scale-[0.98]",
  outline: "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:scale-[0.98] bg-transparent",
  ghost: "text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
};

export function Button({ variant='primary', size='md', className='', ...props }) {
  const cls = `${base} ${sizes[size]||sizes.md} ${variants[variant]||variants.primary} ${className}`;
  if (props.to) return <Link className={cls} {...props} />;
  if (props.href) return <a className={cls} {...props} />;
  return <button className={cls} {...props} />;
}

export function IconButton({ className='', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
