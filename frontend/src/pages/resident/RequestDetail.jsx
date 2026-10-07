import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AttachmentList, InfoGrid, Timeline } from '../../components/RequestParts.jsx';
import { Alert, Card, PageHeader, PageLoader, StatusBadge } from '../../components/ui.jsx';
import api from '../../lib/api.js';
import { STATUS, fmtDate, fmtDay, peso, usePolling } from '../../lib/utils.js';

export default function ResidentRequestDetail() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    api.get(`/requests/${id}`).then((res) => setR(res.data.data)).catch(() => setMissing(true));
  }, [id]);
  useEffect(load, [load]);
  usePolling(load, 15000); // keeps the status fresh without reloading the page

  if (missing) return <Alert type="error" title="Request not found">This request does not exist or is not yours. <Link to="/app/requests" className="font-semibold underline">Back to my requests</Link></Alert>;
  if (!r) return <PageLoader />;

  return (
    <>
      <PageHeader title={r.document_type.name} subtitle={`Reference number ${r.reference_no}`} actions={<StatusBadge status={r.status} />} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Alert type={r.status === 'rejected' ? 'error' : r.status === 'ready_for_pickup' ? 'success' : 'info'} title={STATUS[r.status].label}>
            {STATUS[r.status].hint}
            {r.status === 'ready_for_pickup' && r.pickup_date && <> Pickup date: <b>{fmtDay(r.pickup_date)}</b>.{Number(r.fee_amount) > 0 && <> Please bring {peso(r.fee_amount)} for the fee.</>}</>}
            {r.status === 'rejected' && r.rejection_reason && <p className="mt-1 font-semibold">Reason: {r.rejection_reason}</p>}
          </Alert>

          <Card title="Request details">
            <InfoGrid items={[
              ['Document', r.document_type.name], ['Purpose', r.purpose],
              ['Details', r.purpose_details], ['Submitted', fmtDate(r.created_at, true)],
              ['Fee', Number(r.fee_amount) > 0 ? `${peso(r.fee_amount)}${r.is_paid ? ' (paid)' : ' (pay at pickup)'}` : 'Free'],
              ['Pickup date', r.pickup_date ? fmtDay(r.pickup_date) : null],
              r.remarks && r.status !== 'rejected' ? ['Remarks from the barangay', r.remarks] : null,
            ]} />
          </Card>

          <Card title="Your attachments"><AttachmentList attachments={r.attachments} /></Card>
        </div>

        <Card title="Progress" className="h-fit"><Timeline histories={r.histories} /></Card>
      </div>
    </>
  );
}
