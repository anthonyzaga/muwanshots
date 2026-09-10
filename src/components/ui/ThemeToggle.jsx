import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle({ variant='compact' }) {
  const { preference, setPreference } = useTheme();
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'Auto', icon: Monitor },
  ];
  if (variant === 'segmented') {
    return (
      <div role="group" aria-label="Theme" className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 gap-0.5">
        {options.map(opt => {
          const ActiveIcon = opt.icon;
          const isActive = preference === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setPreference(opt.value)}
              aria-pressed={isActive}
              aria-label={`Switch to ${opt.label} theme`}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${isActive ? 'text-[var(--bg)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              {isActive && <motion.span layoutId="theme-pill" className="absolute inset-0 bg-[var(--text-primary)] rounded-full" transition={{ type:'spring', stiffness:400, damping:30 }} />}
              <span className="relative flex items-center gap-1.5"><ActiveIcon size={14} aria-hidden /> {opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  // compact cycling button
  const current = options.find(o=>o.value===preference) || options[1];
  const Icon = current.icon;
  return (
    <button
      onClick={() => setPreference(preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light')}
      aria-label={`Theme: ${current.label}. Click to change.`}
      title={`Theme: ${current.label}`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={preference} initial={{ rotate:-30, opacity:0, scale:0.8 }} animate={{ rotate:0, opacity:1, scale:1 }} exit={{ rotate:30, opacity:0, scale:0.8 }} transition={{ duration:0.18 }}>
          <Icon size={16} aria-hidden />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
export default ThemeToggle;
