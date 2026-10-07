import { useCallback, useEffect, useState } from 'react';
import { Card, EmptyState, Input, PageHeader, PageLoader, Pagination, Select, TableWrap, Td, Th } from '../../components/ui.jsx';
import api from '../../lib/api.js';
import { ROLE_LABEL, fmtDate, humanize, useDebounced } from '../../lib/utils.js';

export default function ActivityLogs() {
  const [data, setData] = useState(null);
  const [actions, setActions] = useState([]);
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { api.get('/admin/activity-logs/actions').then((r) => setActions(r.data.data)); }, []);
  const load = useCallback(() => { api.get('/admin/activity-logs', { params: { action, q: dq, from, to, page } }).then((r) => setData(r.data)); }, [action, dq, from, to, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [action, dq, from, to]);

  return (
    <>
      <PageHeader title="Activity logs" subtitle="A record of who did what, and when." />
      <Card bodyClass="">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Search description or name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <Select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Action">
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{humanize(a)}</option>)}
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        </div>
        {!data ? <PageLoader /> : data.data.length === 0 ? <EmptyState title="No activity found" /> : (
          <TableWrap>
            <thead><tr><Th>When</Th><Th>User</Th><Th>Action</Th><Th>Description</Th><Th>IP address</Th></tr></thead>
            <tbody>
              {data.data.map((l) => (
                <tr key={l.id}>
                  <Td className="whitespace-nowrap">{fmtDate(l.created_at, true)}</Td>
                  <Td className="whitespace-nowrap">{l.user ? <>{l.user.name}<span className="block text-xs text-slate-500">{ROLE_LABEL[l.user.role]}</span></> : <span className="text-slate-400">System / guest</span>}</Td>
                  <Td className="whitespace-nowrap font-semibold">{humanize(l.action)}</Td>
                  <Td className="min-w-64">{l.description}</Td>
                  <Td className="whitespace-nowrap text-xs text-slate-500">{l.ip_address}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Pagination page={data} onPage={setPage} />
      </Card>
    </>
  );
}
