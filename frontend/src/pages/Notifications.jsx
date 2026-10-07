import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, PageHeader, PageLoader, cx } from '../components/ui.jsx';
import api from '../lib/api.js';
import { fmtDate, usePolling } from '../lib/utils.js';

export default function Notifications({ base }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    api.get('/notifications').then((r) => { setItems(r.data.data); setUnread(r.data.unread_count); }).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);
  usePolling(load, 30000);

  const open = async (n) => {
    if (!n.read_at) await api.post(`/notifications/${n.id}/read`).catch(() => {});
    if (n.document_request_id) navigate(`${base}/requests/${n.document_request_id}`);
    else load();
  };

  const readAll = async () => { await api.post('/notifications/read-all'); load(); };

  if (!items) return <PageLoader />;

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates about your requests appear here."
        actions={unread > 0 && <Button variant="secondary" onClick={readAll}>Mark all as read</Button>} />
      <Card bodyClass="">
        {items.length === 0 ? <EmptyState title="No notifications yet" text="We will let you know when something changes." /> : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => open(n)} className={cx('flex w-full gap-3 px-5 py-4 text-left hover:bg-slate-50', !n.read_at && 'bg-brand-50/60')}>
                  <span className={cx('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-gold-500')} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">{n.title}</span>
                    <span className="block text-sm text-slate-600">{n.message}</span>
                    <span className="mt-1 block text-xs text-slate-400">{fmtDate(n.created_at, true)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
