import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, EmptyState, PageHeader, PageLoader, StatusBadge } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../lib/api.js';
import { STATUS, STATUS_ORDER, fmtDate, usePolling } from '../../lib/utils.js';

export default function ResidentHome() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState(null);

  const load = useCallback(() => {
    api.get('/requests/summary').then((r) => setSummary(r.data));
    api.get('/requests', { params: { per_page: 5 } }).then((r) => setRecent(r.data.data));
  }, []);
  useEffect(load, [load]);
  usePolling(load, 20000);

  if (!summary || !recent) return <PageLoader />;
  const verified = user.account_status === 'verified';

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Request a barangay document or check where your request stands."
        actions={verified && <Link to="/app/new"><Button>New request</Button></Link>} />

      {user.account_status === 'pending' && (
        <Alert type="warn" title="Your account is waiting for verification" className="mb-6">
          Barangay staff are checking your details and ID. You can submit requests as soon as your account is verified, and we will notify you.
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUS_ORDER.map((s) => (
          <Link key={s} to={`/app/requests?status=${s}`} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand-400">
            <p className="text-3xl font-extrabold text-slate-900">{summary.by_status[s]}</p>
            <p className="text-xs font-semibold text-slate-500">{STATUS[s].label}</p>
          </Link>
        ))}
      </div>

      <Card title="Recent requests" actions={<Link to="/app/requests" className="text-sm font-semibold text-brand-700 hover:underline">See all</Link>} bodyClass="">
        {recent.length === 0 ? (
          <EmptyState title="You have no requests yet" text="Start with the document you need. It only takes a few minutes."
            action={verified && <Link to="/app/new"><Button>Request a document</Button></Link>} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((r) => (
              <li key={r.id}>
                <Link to={`/app/requests/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{r.document_type?.name}</p>
                    <p className="text-xs text-slate-500">{r.reference_no} - {fmtDate(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
