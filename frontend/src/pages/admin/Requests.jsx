import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Input, PageHeader, PageLoader, Pagination, Select, StatusBadge, TableWrap, Td, Th, useToast } from '../../components/ui.jsx';
import api, { errorMessage, openFile } from '../../lib/api.js';
import { STATUS, STATUS_ORDER, fmtDate, useDebounced } from '../../lib/utils.js';

export default function Requests() {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [types, setTypes] = useState([]);
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const filters = { status: sp.get('status') || '', document_type_id: sp.get('type') || '', from: sp.get('from') || '', to: sp.get('to') || '' };
  const setFilter = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };

  useEffect(() => { api.get('/document-types', { params: { all: 1 } }).then((r) => setTypes(r.data.data)); }, []);

  const load = useCallback(() => {
    api.get('/admin/requests', { params: { ...filters, q: dq, page } }).then((r) => setData(r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, dq, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [sp, dq]);

  const exportAs = async (format) => {
    try {
      await openFile(`/admin/requests-export/${format}`, { download: true, filename: `requests.${format}`, params: { ...filters, q: dq } });
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <>
      <PageHeader title="Requests" subtitle="Search, filter and process document requests."
        actions={<><Button variant="secondary" onClick={() => exportAs('csv')}>Export CSV</Button><Button variant="secondary" onClick={() => exportAs('pdf')}>Export PDF</Button></>} />
      <Card bodyClass="">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input className="lg:col-span-2" placeholder="Search reference or resident name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </Select>
          <Select value={filters.document_type_id} onChange={(e) => setFilter('type', e.target.value)} aria-label="Document type">
            <option value="">All documents</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} aria-label="From date" />
            <span className="text-slate-400">to</span>
            <Input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} aria-label="To date" />
          </div>
        </div>
        {!data ? <PageLoader /> : data.data.length === 0 ? <EmptyState title="No requests match these filters" /> : (
          <TableWrap>
            <thead><tr><Th>Reference</Th><Th>Resident</Th><Th>Document</Th><Th>Purpose</Th><Th>Submitted</Th><Th>Status</Th></tr></thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <Td><Link to={`/admin/requests/${r.id}`} className="font-bold text-brand-700 hover:underline">{r.reference_no}</Link></Td>
                  <Td>{r.user?.name}<span className="block text-xs text-slate-500">{r.user?.purok}</span></Td>
                  <Td>{r.document_type?.name}</Td><Td>{r.purpose}</Td>
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
