import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Input, PageHeader, PageLoader, Pagination, Select, StatusBadge, TableWrap, Td, Th } from '../../components/ui.jsx';
import api from '../../lib/api.js';
import { STATUS, STATUS_ORDER, fmtDate, useDebounced } from '../../lib/utils.js';

export default function MyRequests() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const status = params.get('status') || '';
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get('/requests', { params: { status, q: dq, page } }).then((r) => setData(r.data));
  }, [status, dq, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [status, dq]);

  return (
    <>
      <PageHeader title="My requests" subtitle="Your full request history." actions={<Link to="/app/new"><Button>New request</Button></Link>} />
      <Card bodyClass="">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2">
          <Input placeholder="Search by reference or document" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <Select value={status} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </Select>
        </div>
        {!data ? <PageLoader /> : data.data.length === 0 ? <EmptyState title="No requests found" text="Try a different filter, or send a new request." /> : (
          <TableWrap>
            <thead><tr><Th>Reference</Th><Th>Document</Th><Th>Purpose</Th><Th>Submitted</Th><Th>Status</Th></tr></thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <Td><Link to={`/app/requests/${r.id}`} className="font-bold text-brand-700 hover:underline">{r.reference_no}</Link></Td>
                  <Td>{r.document_type?.name}</Td>
                  <Td>{r.purpose}</Td>
                  <Td className="whitespace-nowrap">{fmtDate(r.created_at)}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
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
