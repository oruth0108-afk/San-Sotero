import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Card, PageHeader, PageLoader, StatusBadge, TableWrap, Td, Th } from '../../components/ui.jsx';
import api from '../../lib/api.js';
import { STATUS, STATUS_ORDER, fmtDate, usePolling } from '../../lib/utils.js';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const load = useCallback(() => { api.get('/admin/dashboard').then((r) => setD(r.data)); }, []);
  useEffect(load, [load]);
  usePolling(load, 30000);

  if (!d) return <PageLoader />;
  const maxType = Math.max(1, ...d.by_type.map((t) => t.total));
  const maxMonth = Math.max(1, ...d.monthly.map((m) => m.total));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Where every request stands right now." />

      {d.totals.pending_residents > 0 && (
        <Alert type="warn" className="mb-6">
          <Link to="/admin/residents?status=pending" className="font-bold underline">{d.totals.pending_residents} resident{d.totals.pending_residents > 1 ? 's are' : ' is'} waiting for account verification.</Link>
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['All requests', d.totals.all], ['Today', d.totals.today], ['This month', d.totals.this_month], ['Awaiting verification', d.totals.pending_residents]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-3xl font-extrabold text-slate-900">{v}</p>
            <p className="text-xs font-semibold text-slate-500">{k}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUS_ORDER.map((s) => (
          <Link key={s} to={`/admin/requests?status=${s}`} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand-400">
            <StatusBadge status={s} />
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{d.by_status[s]}</p>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Requests by document type">
          {d.by_type.length === 0 ? <p className="text-sm text-slate-500">No document types yet.</p> : (
            <ul className="space-y-3">
              {d.by_type.map((t) => (
                <li key={t.id}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-slate-800">{t.name}</span><span className="text-slate-600">{t.total}</span></div>
                  <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-brand-600" style={{ width: `${(t.total / maxType) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Requests per month">
          <div className="flex h-44 items-end gap-3" role="img" aria-label="Bar chart of requests in the last six months">
            {d.monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-semibold text-slate-600">{m.total}</span>
                <div className="w-full rounded-t-md bg-gold-500" style={{ height: `${Math.max(4, (m.total / maxMonth) * 120)}px` }} />
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Latest requests" actions={<Link to="/admin/requests" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>} bodyClass="">
        <TableWrap>
          <thead><tr><Th>Reference</Th><Th>Resident</Th><Th>Document</Th><Th>Submitted</Th><Th>Status</Th></tr></thead>
          <tbody>
            {d.recent.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <Td><Link to={`/admin/requests/${r.id}`} className="font-bold text-brand-700 hover:underline">{r.reference_no}</Link></Td>
                <Td>{r.user?.name}</Td><Td>{r.document_type?.name}</Td>
                <Td className="whitespace-nowrap">{fmtDate(r.created_at)}</Td>
                <Td><StatusBadge status={r.status} /></Td>
              </tr>
            ))}
            {d.recent.length === 0 && <tr><Td className="text-center text-slate-500" colSpan={5}>No requests yet.</Td></tr>}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
