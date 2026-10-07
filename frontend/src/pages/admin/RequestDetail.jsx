import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AttachmentList, InfoGrid, Timeline } from '../../components/RequestParts.jsx';
import { Alert, Button, Card, Field, Input, Modal, PageHeader, PageLoader, StatusBadge, Textarea, useToast } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api, { errorMessage, fieldErrors, openFile } from '../../lib/api.js';
import { ACCOUNT_LABEL, fmtDate, fmtDay, peso } from '../../lib/utils.js';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AdminRequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [r, setR] = useState(null);
  const [missing, setMissing] = useState(false);
  const [dialog, setDialog] = useState(null); // 'reject' | 'ready' | 'release' | 'approve' | 'review'
  const [form, setForm] = useState({ remarks: '', pickup_date: '', is_paid: false, or_number: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/admin/requests/${id}`).then((res) => setR(res.data.data)).catch(() => setMissing(true));
  }, [id]);
  useEffect(load, [load]);

  const close = () => { setDialog(null); setErrors({}); };
  const start = (d) => {
    setForm({ remarks: '', pickup_date: r.pickup_date?.slice(0, 10) || '', is_paid: r.is_paid, or_number: r.or_number || '' });
    setDialog(d);
  };

  const send = async (status) => {
    setBusy(true); setErrors({});
    const body = { status, remarks: form.remarks || undefined };
    if (status === 'ready_for_pickup') body.pickup_date = form.pickup_date;
    if (status === 'released') { body.is_paid = form.is_paid; body.or_number = form.or_number || undefined; }
    try {
      const { data } = await api.patch(`/admin/requests/${id}/status`, body);
      setR(data.data); close(); toast('Request updated. The resident has been notified.');
    } catch (err) { setErrors(fieldErrors(err)); toast(errorMessage(err), 'error'); }
    finally { setBusy(false); }
  };

  const pdf = async () => {
    try { await openFile(`/admin/requests/${id}/pdf`, { download: true, filename: `${r.reference_no}.pdf` }); }
    catch (e) { toast('Could not generate the PDF. ' + (e?.response?.status === 422 ? 'The request must be approved first.' : ''), 'error'); }
  };

  const viewId = async () => {
    try { await openFile(`/admin/residents/${r.user.id}/valid-id`); } catch (e) { toast(errorMessage(e), 'error'); }
  };

  if (missing) return <Alert type="error" title="Request not found"><Link to="/admin/requests" className="underline">Back to requests</Link></Alert>;
  if (!r) return <PageLoader />;

  const u = r.user;
  const canApprove = user.role === 'admin' || user.role === 'captain';
  const printable = ['approved', 'ready_for_pickup', 'released'].includes(r.status);

  return (
    <>
      <PageHeader title={r.document_type.name} subtitle={`Reference ${r.reference_no} - submitted ${fmtDate(r.created_at, true)}`} actions={<StatusBadge status={r.status} />} />

      {u.account_status !== 'verified' && (
        <Alert type="warn" className="mb-6">This resident's account is <b>{ACCOUNT_LABEL[u.account_status].toLowerCase()}</b>. <Link to="/admin/residents" className="font-semibold underline">Check the account</Link> before approving.</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Actions">
            <div className="flex flex-wrap gap-2">
              {r.status === 'pending' && <Button onClick={() => start('review')}>Start review</Button>}
              {r.status === 'under_review' && canApprove && <Button onClick={() => start('approve')}>Approve</Button>}
              {r.status === 'under_review' && !canApprove && <p className="text-sm text-slate-600">Waiting for the Barangay Captain or Admin to approve.</p>}
              {r.status === 'approved' && <Button onClick={() => start('ready')}>Mark ready for pickup</Button>}
              {r.status === 'ready_for_pickup' && <Button onClick={() => start('release')}>Mark as released</Button>}
              {['pending', 'under_review'].includes(r.status) && <Button variant="danger" onClick={() => start('reject')}>Reject</Button>}
              {printable && <Button variant="secondary" onClick={pdf}>Download PDF</Button>}
              {['rejected', 'released'].includes(r.status) && !printable && <p className="text-sm text-slate-600">This request is closed.</p>}
            </div>
            {r.status === 'rejected' && <Alert type="error" className="mt-4" title="Rejected">{r.rejection_reason}</Alert>}
          </Card>

          <Card title="Request details">
            <InfoGrid items={[
              ['Document', r.document_type.name], ['Purpose', r.purpose], ['Details', r.purpose_details],
              ['Fee', Number(r.fee_amount) > 0 ? `${peso(r.fee_amount)} - ${r.is_paid ? `paid${r.or_number ? ` (OR ${r.or_number})` : ''}` : 'unpaid'}` : 'Free'],
              ['Pickup date', r.pickup_date ? fmtDay(r.pickup_date) : null],
              ['Reviewed by', r.reviewer?.name], ['Approved by', r.approver ? `${r.approver.name} on ${fmtDate(r.approved_at)}` : null],
              ['Released by', r.releaser ? `${r.releaser.name} on ${fmtDate(r.released_at)}` : null],
            ]} />
          </Card>

          <Card title="Attachments"><AttachmentList attachments={r.attachments} /></Card>
        </div>

        <div className="space-y-6">
          <Card title="Resident">
            <InfoGrid items={[
              ['Name', u.name], ['Account', ACCOUNT_LABEL[u.account_status]], ['Birthdate', fmtDay(u.birthdate)], ['Civil status', u.civil_status],
              ['Address', `${u.address || ''}${u.purok ? `, ${u.purok}` : ''}`], ['Mobile', u.contact_number], ['Email', u.email], ['ID type', u.valid_id_type],
            ]} />
            {u.has_valid_id && <Button variant="secondary" size="sm" className="mt-4" onClick={viewId}>View valid ID</Button>}
          </Card>
          <Card title="History"><Timeline histories={r.histories} showStaff /></Card>
        </div>
      </div>

      <Modal open={dialog === 'review'} onClose={close} title="Start review">
        <p className="mb-4 text-sm text-slate-600">Mark this request as under review? Check the resident's details and each attachment before approving.</p>
        <Field label="Note to resident (optional)"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
        <Button className="mt-4" loading={busy} onClick={() => send('under_review')}>Start review</Button>
      </Modal>

      <Modal open={dialog === 'approve'} onClose={close} title="Approve request">
        <p className="mb-4 text-sm text-slate-600">Approve {r.reference_no} for {u.name}? The document can then be generated and prepared for pickup.</p>
        <Field label="Remarks (optional)"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
        <Button className="mt-4" loading={busy} onClick={() => send('approved')}>Approve</Button>
      </Modal>

      <Modal open={dialog === 'reject'} onClose={close} title="Reject request">
        <Field label="Reason for rejection" required error={errors.remarks} hint="The resident will see this message.">
          <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} maxLength={1000} />
        </Field>
        <Button variant="danger" className="mt-4" loading={busy} onClick={() => send('rejected')}>Reject request</Button>
      </Modal>

      <Modal open={dialog === 'ready'} onClose={close} title="Ready for pickup">
        <div className="space-y-4">
          <Field label="Pickup date" required error={errors.pickup_date}><Input type="date" min={todayStr()} value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} /></Field>
          <Field label="Note to resident (optional)"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
        </div>
        <Button className="mt-4" loading={busy} onClick={() => send('ready_for_pickup')}>Notify resident</Button>
      </Modal>

      <Modal open={dialog === 'release'} onClose={close} title="Release document">
        <div className="space-y-4">
          {Number(r.fee_amount) > 0 && (
            <>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 rounded" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} /> Fee of {peso(r.fee_amount)} has been paid</label>
              {errors.is_paid && <p className="text-xs font-medium text-red-600">{errors.is_paid}</p>}
              <Field label="Official receipt no. (optional)"><Input value={form.or_number} onChange={(e) => setForm({ ...form, or_number: e.target.value })} maxLength={40} /></Field>
            </>
          )}
          <p className="text-sm text-slate-600">Confirm that you checked the resident's ID before handing over the document.</p>
        </div>
        <Button className="mt-4" loading={busy} onClick={() => send('released')}>Mark as released</Button>
      </Modal>
    </>
  );
}
