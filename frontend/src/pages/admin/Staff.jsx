import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Field, Input, Modal, PageHeader, PageLoader, Select, TableWrap, Td, Th, cx, useToast } from '../../components/ui.jsx';
import api, { errorMessage, fieldErrors } from '../../lib/api.js';
import { ROLE_LABEL, fmtDate } from '../../lib/utils.js';

export default function Staff() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', role: 'staff', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { api.get('/admin/staff').then((r) => setItems(r.data.data)); }, []);
  useEffect(load, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try { await api.post('/admin/staff', f); toast('Account created.'); setOpen(false); setF({ name: '', email: '', role: 'staff', password: '' }); load(); }
    catch (err) { setErrors(fieldErrors(err)); toast(errorMessage(err), 'error'); }
    finally { setBusy(false); }
  };

  const toggle = async (u) => {
    const next = u.account_status === 'deactivated' ? 'verified' : 'deactivated';
    try { await api.patch(`/admin/staff/${u.id}/status`, { status: next }); load(); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  if (!items) return <PageLoader />;

  return (
    <>
      <PageHeader title="Staff accounts" subtitle="Accounts for the Barangay Secretary, staff and the Punong Barangay." actions={<Button onClick={() => setOpen(true)}>Add account</Button>} />
      <Card bodyClass="">
        <TableWrap>
          <thead><tr><Th>Name</Th><Th>Role</Th><Th>Last sign-in</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <Td><span className="font-bold text-slate-900">{u.name}</span><span className="block text-xs text-slate-500">{u.email}</span></Td>
                <Td>{ROLE_LABEL[u.role]}</Td>
                <Td className="whitespace-nowrap">{u.last_login_at ? fmtDate(u.last_login_at, true) : 'Never'}</Td>
                <Td><span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', u.account_status === 'deactivated' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-900')}>{u.account_status === 'deactivated' ? 'Deactivated' : 'Active'}</span></Td>
                <Td>{u.id !== user.id && <Button size="sm" variant={u.account_status === 'deactivated' ? 'secondary' : 'danger'} onClick={() => toggle(u)}>{u.account_status === 'deactivated' ? 'Reactivate' : 'Deactivate'}</Button>}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add staff account">
        <form onSubmit={create} className="space-y-4">
          <Field label="Full name" required error={errors.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="Email address" required error={errors.email}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <Field label="Role" required error={errors.role}>
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="staff">Barangay Staff - review and process</option>
              <option value="captain">Barangay Captain - can approve</option>
              <option value="admin">Admin / Secretary - full access</option>
            </Select>
          </Field>
          <Field label="Temporary password" required error={errors.password} hint="At least 8 characters, letters and numbers. Ask them to change it after signing in."><Input type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
          <Button type="submit" loading={busy}>Create account</Button>
        </form>
      </Modal>
    </>
  );
}
