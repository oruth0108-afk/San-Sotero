import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, EmptyState, Field, Input, Modal, PageHeader, PageLoader, Select, TableWrap, Td, Textarea, Th, cx, useToast } from '../../components/ui.jsx';
import api, { errorMessage, fieldErrors } from '../../lib/api.js';
import { peso } from '../../lib/utils.js';

const TEMPLATES = { clearance: 'Barangay clearance', residency: 'Certificate of residency', indigency: 'Certificate of indigency', good_moral: 'Good moral character', business: 'Business clearance', barangay_id: 'Barangay ID', generic: 'General certification' };
const blank = { name: '', description: '', fee: 0, processing_days: 3, template: 'generic', is_active: true, required_attachments: ['Valid ID'] };

export default function DocumentTypes() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { api.get('/document-types', { params: { all: 1 } }).then((r) => setItems(r.data.data)); }, []);
  useEffect(load, [load]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = { ...edit, required_attachments: edit.required_attachments.filter((x) => x.trim()) };
    try {
      edit.id ? await api.put(`/admin/document-types/${edit.id}`, body) : await api.post('/admin/document-types', body);
      toast('Document type saved.'); setEdit(null); load();
    } catch (err) { setErrors(fieldErrors(err)); toast(errorMessage(err), 'error'); }
    finally { setBusy(false); }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    try { await api.delete(`/admin/document-types/${t.id}`); toast('Document type deleted.'); load(); }
    catch (e) { toast(errorMessage(e), 'error'); }
  };

  const setAtt = (i, v) => setEdit({ ...edit, required_attachments: edit.required_attachments.map((x, j) => (j === i ? v : x)) });

  if (!items) return <PageLoader />;

  return (
    <>
      <PageHeader title="Document types" subtitle="Set which documents residents can request, their fees and required attachments."
        actions={<Button onClick={() => { setErrors({}); setEdit({ ...blank }); }}>Add document type</Button>} />
      <Card bodyClass="">
        {items.length === 0 ? <EmptyState title="No document types yet" /> : (
          <TableWrap>
            <thead><tr><Th>Document</Th><Th>Fee</Th><Th>Days</Th><Th>Required attachments</Th><Th>Requests</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <Td className="min-w-48"><span className="font-bold text-slate-900">{t.name}</span><span className="block text-xs text-slate-500">{TEMPLATES[t.template]}</span></Td>
                  <Td>{Number(t.fee) > 0 ? peso(t.fee) : 'Free'}</Td>
                  <Td>{t.processing_days}</Td>
                  <Td className="min-w-48 text-xs text-slate-600">{(t.required_attachments || []).join(', ') || 'None'}</Td>
                  <Td>{t.requests_count}</Td>
                  <Td><span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', t.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700')}>{t.is_active ? 'Active' : 'Inactive'}</span></Td>
                  <Td><div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => { setErrors({}); setEdit({ ...t, fee: Number(t.fee), required_attachments: t.required_attachments || [] }); }}>Edit</Button><Button size="sm" variant="danger" onClick={() => remove(t)}>Delete</Button></div></Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit document type' : 'Add document type'} wide>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name" required error={errors.name}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required maxLength={120} /></Field>
            <Field label="Description" error={errors.description}><Textarea rows={2} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} maxLength={500} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Fee (PHP)" required error={errors.fee}><Input type="number" min="0" step="0.01" value={edit.fee} onChange={(e) => setEdit({ ...edit, fee: e.target.value })} required /></Field>
              <Field label="Processing days" required error={errors.processing_days}><Input type="number" min="1" max="60" value={edit.processing_days} onChange={(e) => setEdit({ ...edit, processing_days: e.target.value })} required /></Field>
              <Field label="Printed layout" error={errors.template}>
                <Select value={edit.template} onChange={(e) => setEdit({ ...edit, template: e.target.value })}>
                  {Object.entries(TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold text-slate-700">Required attachments</legend>
              <div className="space-y-2">
                {edit.required_attachments.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={a} onChange={(e) => setAtt(i, e.target.value)} placeholder="e.g. Valid ID" maxLength={100} aria-label={`Attachment ${i + 1}`} />
                    <Button type="button" variant="secondary" onClick={() => setEdit({ ...edit, required_attachments: edit.required_attachments.filter((_, j) => j !== i) })}>Remove</Button>
                  </div>
                ))}
              </div>
              {edit.required_attachments.length < 8 && <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setEdit({ ...edit, required_attachments: [...edit.required_attachments, ''] })}>Add attachment</Button>}
              {errors.required_attachments && <p className="text-xs text-red-600">{errors.required_attachments}</p>}
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 rounded" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Residents can request this document</label>
            {edit.id && <Alert type="info">Changing attachments only affects new requests.</Alert>}
            <Button type="submit" loading={busy}>Save document type</Button>
          </form>
        )}
      </Modal>
    </>
  );
}
