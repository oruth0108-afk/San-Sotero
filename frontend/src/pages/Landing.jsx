import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMeta } from '../lib/utils.js';
import { StatusBadge } from '../components/ui.jsx';
import BrandIdentity from '../components/BrandIdentity.jsx';

const DOCS = ['Barangay Clearance', 'Certificate of Residency', 'Certificate of Indigency', 'Certificate of Good Moral Character', 'Business Clearance', 'Barangay ID'];

export default function Landing() {
  const { user } = useAuth();
  const meta = useMeta();
  if (user) return <Navigate to={user.role === 'resident' ? '/app' : '/admin'} replace />;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" aria-label={`Barangay ${meta.barangay} home`} className="min-w-0">
            <BrandIdentity name={meta.barangay} size="sm" />
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link to="/login" className="rounded-lg px-3 py-2 hover:bg-brand-800">Sign in</Link>
            <Link to="/register" className="rounded-lg bg-white px-3 py-2 text-brand-800 hover:bg-brand-50">Register</Link>
          </nav>
        </div>
      </header>

      <section className="bg-brand-700 pb-14 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 lg:grid-cols-2 lg:pt-12">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Get your barangay documents without lining up at the hall.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-brand-100">
              Send your request and requirements online, follow its progress, and visit the barangay hall only to pick up your document.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-lg bg-gold-500 px-5 py-3 font-bold text-white hover:bg-gold-600">Create an account</Link>
              <Link to="/login" className="rounded-lg px-5 py-3 font-bold text-white ring-1 ring-brand-300 hover:bg-brand-800">I already have an account</Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 text-slate-800 shadow-xl sm:p-6" aria-label="Example of how a request is tracked">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-4">
              <img
                src="/src/barangay-seal.jpg"
                alt={`Barangay ${meta.barangay} seal`}
                className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover sm:h-20 sm:w-20"
              />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-brand-800">Barangay {meta.barangay}</p>
                <p className="mt-1 text-xs text-slate-500">Official barangay seal</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500">Reference SS-2026-000123</p>
            <p className="text-lg font-bold">Barangay Clearance</p>
            <ol className="mt-4 space-y-3">
              {[['pending', 'You send your request', true], ['under_review', 'Staff check your details', true], ['approved', 'The Punong Barangay approves it', true], ['ready_for_pickup', 'Pick it up on the date shown', false]].map(([s, text, done]) => (
                <li key={s} className="flex items-center gap-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${done ? 'bg-brand-600' : 'bg-slate-300'}`} />
                  <span className={`flex-1 text-sm ${done ? 'text-slate-800' : 'text-slate-500'}`}>{text}</span>
                  <StatusBadge status={s} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Documents you can request</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {DOCS.map((d) => <li key={d} className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold ring-1 ring-slate-200">{d}</li>)}
          </ul>
          <p className="mt-3 text-sm text-slate-500">More documents may be offered by the barangay office.</p>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">How it works</h2>
          <ol className="mt-4 space-y-4">
            {[['Register', 'Fill in your details and upload a valid ID. Barangay staff verify your account.'],
              ['Request', 'Choose the document, tell us the purpose, and upload the requirements.'],
              ['Track', 'You get a notification each time your request moves forward.'],
              ['Pick up', 'Bring a valid ID on your pickup date and pay the fee, if any.']].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{i + 1}</span>
                <div><p className="font-bold">{t}</p><p className="text-sm text-slate-600">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Barangay {meta.barangay} Online Document Request System
      </footer>
    </div>
  );
}
