import { useState } from 'react';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Textarea, useToast } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api, { errorMessage, fieldErrors } from '../../lib/api.js';
import { ACCOUNT_LABEL, fmtDate, useMeta } from '../../lib/utils.js';
import { ID_TYPES } from '../auth/Register.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const [f, setF] = useState({
    name: user.name, purok: user.purok || '', address: user.address || '', birthdate: (user.birthdate || '').slice(0, 10),
    civil_status: user.civil_status || '', contact_number: user.contact_number || '', valid_id_type: user.valid_id_type || '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = new FormData();
    Object.entries(f).forEach(([k, v]) => body.append(k, v));
    if (file) body.append('valid_id', file);
    try {
      const { data } = await api.post('/profile', body);
      setUser(data.user); setFile(null);
      toast(data.message);
    } catch (err) { setErrors(fieldErrors(err)); toast(errorMessage(err), 'error'); }
    finally { setBusy(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwBusy(true); setPwErrors({});
    try {
      await api.put('/profile/password', pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast('Password changed.');
    } catch (err) { setPwErrors(fieldErrors(err)); toast(errorMessage(err), 'error'); }
    finally { setPwBusy(false); }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle={`${user.email} - ${ACCOUNT_LABEL[user.account_status]}${user.verified_at ? ` since ${fmtDate(user.verified_at)}` : ''}`} />
      <div className="space-y-6">
        <form onSubmit={save}>
          <Card title="Personal details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name} className="sm:col-span-2"><Input value={f.name} onChange={set('name')} required /></Field>
              <Field label="Birthdate" required error={errors.birthdate}><Input type="date" value={f.birthdate} onChange={set('birthdate')} required /></Field>
              <Field label="Civil status" required error={errors.civil_status}>
                <Select value={f.civil_status} onChange={set('civil_status')} required>
                  <option value="">Select...</option>
                  {meta.civil_statuses.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Purok / Zone" required error={errors.purok}><Input value={f.purok} onChange={set('purok')} required /></Field>
              <Field label="Mobile number" required error={errors.contact_number}><Input value={f.contact_number} onChange={set('contact_number')} required /></Field>
              <Field label="House no. and street" required error={errors.address} className="sm:col-span-2"><Textarea rows={2} value={f.address} onChange={set('address')} required /></Field>
              <Field label="ID type" error={errors.valid_id_type}>
                <Select value={f.valid_id_type} onChange={set('valid_id_type')}>
                  <option value="">Select...</option>
                  {ID_TYPES.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Replace valid ID" error={errors.valid_id} hint="Optional. A new ID must be checked again by barangay staff.">
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files[0] || null)} className="block w-full rounded-lg bg-white p-2 text-sm ring-1 ring-slate-300" />
              </Field>
            </div>
            <Button type="submit" loading={busy} className="mt-5">Save changes</Button>
          </Card>
        </form>

        <form onSubmit={changePassword}>
          <Card title="Change password">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Current password" error={pwErrors.current_password}><Input type="password" autoComplete="current-password" required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
              <Field label="New password" error={pwErrors.password} hint="8+ characters, letters and numbers"><Input type="password" autoComplete="new-password" required value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
              <Field label="Confirm new password"><Input type="password" autoComplete="new-password" required value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} /></Field>
            </div>
            <Button type="submit" variant="secondary" loading={pwBusy} className="mt-5">Change password</Button>
          </Card>
        </form>
        {user.account_status === 'pending' && <Alert type="warn">Your account is still waiting for verification.</Alert>}
      </div>
    </>
  );
}
