import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell.jsx';
import { Alert, Button, Field, Input, Select, Textarea } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage, fieldErrors } from '../../lib/api.js';
import { useMeta } from '../../lib/utils.js';

export const ID_TYPES = ['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'PhilHealth ID', "Voter's ID", 'Postal ID', 'Senior Citizen ID', 'PWD ID', 'School ID', 'Other government ID'];

export default function Register() {
  const { register } = useAuth();
  const meta = useMeta();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', password_confirmation: '', purok: '', address: '', birthdate: '', civil_status: '', contact_number: '', valid_id_type: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    const body = new FormData();
    Object.entries(f).forEach(([k, v]) => body.append(k, v));
    if (file) body.append('valid_id', file);
    try {
      await register(body);
      navigate('/app', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <AuthShell wide title="Create your resident account" subtitle="Barangay staff will check your details and ID before you can submit requests.">
      <form onSubmit={submit} className="space-y-6">
        {error && <Alert type="error">{error}</Alert>}

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-extrabold text-brand-800">Personal details</legend>
          <Field label="Full name" required error={errors.name} className="sm:col-span-2" hint="First name, middle name, last name">
            <Input value={f.name} onChange={set('name')} required autoComplete="name" maxLength={120} />
          </Field>
          <Field label="Birthdate" required error={errors.birthdate}>
            <Input type="date" value={f.birthdate} onChange={set('birthdate')} required max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Civil status" required error={errors.civil_status}>
            <Select value={f.civil_status} onChange={set('civil_status')} required>
              <option value="">Select...</option>
              {meta.civil_statuses.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Purok / Zone" required error={errors.purok}>
            <Input value={f.purok} onChange={set('purok')} required placeholder="e.g. Purok 3" maxLength={100} />
          </Field>
          <Field label="Mobile number" required error={errors.contact_number}>
            <Input type="tel" inputMode="numeric" value={f.contact_number} onChange={set('contact_number')} required placeholder="09171234567" />
          </Field>
          <Field label="House no. and street" required error={errors.address} className="sm:col-span-2">
            <Textarea rows={2} value={f.address} onChange={set('address')} required maxLength={255} />
          </Field>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-extrabold text-brand-800">Valid ID</legend>
          <Field label="ID type" required error={errors.valid_id_type}>
            <Select value={f.valid_id_type} onChange={set('valid_id_type')} required>
              <option value="">Select...</option>
              {ID_TYPES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Photo or scan of your ID" required error={errors.valid_id} hint="JPG, PNG or PDF, up to 4 MB. Make sure your name and photo are readable.">
            <Input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setFile(e.target.files[0] || null)} />
          </Field>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-extrabold text-brand-800">Sign-in details</legend>
          <Field label="Email address" required error={errors.email} className="sm:col-span-2">
            <Input type="email" value={f.email} onChange={set('email')} required autoComplete="email" />
          </Field>
          <Field label="Password" required error={errors.password} hint="At least 8 characters, with letters and numbers.">
            <Input type="password" value={f.password} onChange={set('password')} required autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" required>
            <Input type="password" value={f.password_confirmation} onChange={set('password_confirmation')} required autoComplete="new-password" />
          </Field>
        </fieldset>

        <Button type="submit" loading={busy} className="w-full sm:w-auto">Create account</Button>
        <p className="text-sm text-slate-600">Already registered? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
