import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Field, PageHeader, PageLoader, Select, Textarea, cx, useToast } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api, { errorMessage, fieldErrors } from '../../lib/api.js';
import { peso, useMeta } from '../../lib/utils.js';

export default function NewRequest() {
  const { user } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  const [types, setTypes] = useState(null);
  const [typeId, setTypeId] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/document-types').then((r) => setTypes(r.data.data)); }, []);

  if (!types) return <PageLoader />;

  if (user.account_status !== 'verified') {
    return (
      <>
        <PageHeader title="New request" />
        <Alert type="warn" title="Your account is not verified yet">
          You can submit a request after barangay staff verify your account. We will send you a notification.
        </Alert>
      </>
    );
  }

  const type = types.find((t) => t.id === typeId);
  const needsDetails = purpose === 'Others' || type?.template === 'business';

  const pickType = (id) => { setTypeId(id); setFiles({}); setErrors({}); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    const body = new FormData();
    body.append('document_type_id', type.id);
    body.append('purpose', purpose);
    if (details) body.append('purpose_details', details);
    (type.required_attachments || []).forEach((_, i) => files[i] && body.append(`attachments[${i}]`, files[i]));
    try {
      const { data } = await api.post('/requests', body);
      toast(`Request sent. Your reference number is ${data.data.reference_no}.`);
      navigate(`/app/requests/${data.data.id}`);
    } catch (err) {
      setErrors(fieldErrors(err)); setError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="New request" subtitle="Choose the document you need, then upload the requirements." />
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <form onSubmit={submit} className="space-y-6">
        <Card title="1. Choose a document">
          <div className="grid gap-3 sm:grid-cols-2">
            {types.map((t) => (
              <button type="button" key={t.id} onClick={() => pickType(t.id)}
                className={cx('rounded-xl p-4 text-left ring-1 transition', t.id === typeId ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-white ring-slate-200 hover:ring-brand-400')}>
                <span className="block font-bold text-slate-900">{t.name}</span>
                {t.description && <span className="mt-0.5 block text-sm text-slate-600">{t.description}</span>}
                <span className="mt-2 block text-xs font-semibold text-brand-700">
                  {Number(t.fee) > 0 ? peso(t.fee) : 'Free'} - ready in about {t.processing_days} day{t.processing_days > 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
          {errors.document_type_id && <p className="mt-2 text-sm text-red-600">{errors.document_type_id}</p>}
        </Card>

        {type && (
          <>
            <Card title="2. Purpose">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="What do you need it for?" required error={errors.purpose}>
                  <Select value={purpose} onChange={(e) => setPurpose(e.target.value)} required>
                    <option value="">Select a purpose...</option>
                    {meta.purposes.map((p) => <option key={p}>{p}</option>)}
                  </Select>
                </Field>
                <Field label={type.template === 'business' ? 'Business name and address' : 'More details'} required={needsDetails}
                  error={errors.purpose_details} hint={purpose === 'Others' ? 'Tell us what the document is for.' : undefined}>
                  <Textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} required={needsDetails} maxLength={500} />
                </Field>
              </div>
            </Card>

            <Card title="3. Upload requirements">
              {(type.required_attachments || []).length === 0 ? <p className="text-sm text-slate-600">No attachments are needed for this document.</p> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {type.required_attachments.map((label, i) => (
                    <Field key={label + i} label={label} required error={errors[`attachments.${i}`]} hint="JPG, PNG or PDF, up to 4 MB">
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" required
                        onChange={(e) => setFiles({ ...files, [i]: e.target.files[0] })}
                        className="block w-full rounded-lg bg-white p-2 text-sm ring-1 ring-slate-300" />
                    </Field>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={busy}>Send request</Button>
              <Link to="/app" className="text-sm font-semibold text-slate-600 hover:underline">Cancel</Link>
              {Number(type.fee) > 0 && <span className="text-sm text-slate-600">Fee of {peso(type.fee)} is paid at the barangay hall when you pick up.</span>}
            </div>
          </>
        )}
      </form>
    </>
  );
}
