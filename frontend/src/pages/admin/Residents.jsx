import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Input, PageHeader, PageLoader, Pagination, Select, TableWrap, Td, Th, cx, useToast } from '../../components/ui.jsx';
import api, { errorMessage, openFile } from '../../lib/api.js';
import { ACCOUNT_LABEL, fmtDay, useDebounced } from '../../lib/utils.js';

const TONE = { pending: 'bg-amber-100 text-amber-900', verified: 'bg-emerald-100 text-emerald-900', deactivated: 'bg-slate-200 text-slate-700' };

export default function Residents() {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const load = useCallback(() => { api.get('/admin/residents', { params: { status, q: dq, page } }).then((r) => setData(r.data)); }, [status, dq, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [status, dq]);

  const setAccount = async (u, next) => {
    if (next === 'deactivated' && !window.confirm(`Deactivate ${u.name}? They will be signed out and unable to log in.`)) return;
    try { await api.patch(`/admin/residents/${u.id}/status`, { status: next }); toast(`${u.name}: ${ACCOUNT_LABEL[next].toLowerCase()}.`); load(); }
    catch (e) { toast(errorMessage(e), 'error'); }
  };
  const viewId = async (u) => { try { await openFile(`/admin/residents/${u.id}/valid-id`); } catch (e) { toast(errorMessage(e), 'error'); } };

  return (
    <>
      <PageHeader title="Residents" subtitle="Check each resident's ID, then verify the account so they can submit requests." />
      <Card bodyClass="">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2">
          <Input placeholder="Search name, email or purok" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <Select value={status} onChange={(e) => setSp(e.target.value ? { status: e.target.value } : {})} aria-label="Account status">
            <option value="">All accounts</option>
            {Object.entries(ACCOUNT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        {!data ? <PageLoader /> : data.data.length === 0 ? <EmptyState title="No residents found" /> : (
          <TableWrap>
            <thead><tr><Th>Resident</Th><Th>Contact</Th><Th>Address</Th><Th>Birthdate</Th><Th>Requests</Th><Th>Account</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id}>
                  <Td><span className="font-bold text-slate-900">{u.name}</span><span className="block text-xs text-slate-500">{u.email}</span></Td>
                  <Td>{u.contact_number}</Td>
                  <Td className="min-w-48">{u.address}<span className="block text-xs text-slate-500">{u.purok}</span></Td>
                  <Td className="whitespace-nowrap">{fmtDay(u.birthdate)}</Td>
                  <Td>{u.requests_count}</Td>
                  <Td><span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', TONE[u.account_status])}>{ACCOUNT_LABEL[u.account_status]}</span></Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {u.has_valid_id && <Button size="sm" variant="secondary" onClick={() => viewId(u)}>View ID</Button>}
                      {u.account_status !== 'verified' && <Button size="sm" onClick={() => setAccount(u, 'verified')}>{u.account_status === 'deactivated' ? 'Reactivate' : 'Verify'}</Button>}
                      {u.account_status !== 'deactivated' && <Button size="sm" variant="danger" onClick={() => setAccount(u, 'deactivated')}>Deactivate</Button>}
                    </div>
                  </Td>
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
