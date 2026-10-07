import { Link } from 'react-router-dom';
import { useMeta } from '../lib/utils.js';
import BrandIdentity from './BrandIdentity.jsx';

export default function AuthShell({ title, subtitle, children, wide }) {
  const meta = useMeta();
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-brand-700 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" aria-label={`Barangay ${meta.barangay} home`} className="min-w-0">
            <BrandIdentity name={meta.barangay} size="sm" />
          </Link>
          <Link to="/" className="text-sm text-brand-100 hover:text-white">Back to home</Link>
        </div>
      </header>
      <main className={`mx-auto px-4 py-8 sm:py-12 ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mb-6 mt-1 text-sm text-slate-600">{subtitle}</p>}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">{children}</div>
      </main>
    </div>
  );
}
