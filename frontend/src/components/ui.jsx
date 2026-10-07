import { createContext, forwardRef, useCallback, useContext, useEffect, useState } from 'react';
import { STATUS } from '../lib/utils.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

/* ---------- Buttons ---------- */
const BTN = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-300',
  secondary: 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  gold: 'bg-gold-500 text-white hover:bg-gold-600 disabled:bg-gold-400',
  ghost: 'text-brand-700 hover:bg-brand-50',
};
export function Button({ variant = 'primary', size = 'md', loading, className, children, ...p }) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        BTN[variant], className
      )}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const PageLoader = () => (
  <div className="flex items-center justify-center py-20 text-brand-700"><Spinner className="h-8 w-8" /></div>
);

/* ---------- Form fields ---------- */
const fieldCls = 'block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600 disabled:bg-slate-100';

export function Field({ label, error, hint, required, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1 block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-600"> *</span>}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600" role="alert">{error}</span>}
    </label>
  );
}
export const Input = forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cx(fieldCls, className)} {...p} />);
export const Textarea = forwardRef(({ className, ...p }, ref) => <textarea ref={ref} rows={3} className={cx(fieldCls, className)} {...p} />);
export const Select = forwardRef(({ className, children, ...p }, ref) => <select ref={ref} className={cx(fieldCls, className)} {...p}>{children}</select>);

/* ---------- Layout bits ---------- */
export function Card({ title, actions, children, className, bodyClass = 'p-5' }) {
  return (
    <section className={cx('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'bg-slate-100 text-slate-700 ring-slate-300' };
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', s.cls)}>{s.label}</span>;
}

const ALERT = {
  info: 'bg-sky-50 text-sky-900 ring-sky-200',
  warn: 'bg-amber-50 text-amber-900 ring-amber-200',
  error: 'bg-red-50 text-red-900 ring-red-200',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
};
export function Alert({ type = 'info', title, children, className }) {
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={cx('rounded-lg px-4 py-3 text-sm ring-1', ALERT[type], className)}>
      {title && <p className="font-bold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-base font-bold text-slate-800">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({ page, onPage }) {
  if (!page || page.last_page <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
      <span className="text-slate-600">Page {page.current_page} of {page.last_page} <span className="hidden sm:inline">({page.total} records)</span></span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page.current_page <= 1} onClick={() => onPage(page.current_page - 1)}>Previous</Button>
        <Button size="sm" variant="secondary" disabled={page.current_page >= page.last_page} onClick={() => onPage(page.current_page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, type }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx('pointer-events-auto max-w-md rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg', t.type === 'error' ? 'bg-red-700' : 'bg-brand-800')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Data table wrapper (scrolls sideways on phones) ---------- */
export const TableWrap = ({ children }) => <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">{children}</table></div>;
export const Th = ({ children, className }) => <th className={cx('whitespace-nowrap bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600', className)}>{children}</th>;
export const Td = ({ children, className }) => <td className={cx('border-t border-slate-100 px-4 py-3 align-middle', className)}>{children}</td>;
