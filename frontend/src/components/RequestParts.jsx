import { useState } from 'react';
import { errorMessage, openFile } from '../lib/api.js';
import { STATUS, fmtDate, fmtSize } from '../lib/utils.js';
import { useToast } from './ui.jsx';

export function InfoGrid({ items }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-semibold text-slate-500">{k}</dt>
          <dd className="break-words text-sm font-medium text-slate-900">{v || '-'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ histories, showStaff }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-brand-100 pl-5">
      {[...histories].reverse().map((h, i) => (
        <li key={h.id} className="relative">
          <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-brand-600' : 'bg-brand-200'}`} />
          <p className="text-sm font-bold text-slate-900">{STATUS[h.to_status]?.label || h.to_status}</p>
          {h.remarks && <p className="text-sm text-slate-600">{h.remarks}</p>}
          <p className="text-xs text-slate-400">
            {fmtDate(h.created_at, true)}{showStaff && h.changer ? ` - ${h.changer.name}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function AttachmentList({ attachments }) {
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const view = async (a) => {
    setBusy(a.id);
    try { await openFile(`/attachments/${a.id}`); }
    catch (e) { toast(errorMessage(e), 'error'); }
    finally { setBusy(null); }
  };

  if (!attachments?.length) return <p className="text-sm text-slate-500">No attachments.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{a.label}</p>
            <p className="truncate text-xs text-slate-500">{a.original_name} - {fmtSize(a.size)}</p>
          </div>
          <button onClick={() => view(a)} disabled={busy === a.id} className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            {busy === a.id ? 'Opening...' : 'View'}
          </button>
        </li>
      ))}
    </ul>
  );
}
