import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell.jsx';
import { Alert, Button, Field, Input } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../lib/api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(user.role === 'resident' ? '/app' : '/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Sign in" subtitle="Use the email and password you registered with.">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        <Field label="Email address">
          <Input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
        <p className="text-center text-sm text-slate-600">
          New resident? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
