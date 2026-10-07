import { useEffect, useState } from 'react';
import api from './api.js';

export const STATUS = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-900 ring-amber-300', hint: 'Waiting for barangay staff to start reviewing your request.' },
  under_review: { label: 'Under review', cls: 'bg-sky-100 text-sky-900 ring-sky-300', hint: 'Barangay staff are checking your details and attachments.' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-900 ring-emerald-300', hint: 'Approved by the barangay. Your document is being prepared.' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-900 ring-red-300', hint: 'This request was not approved. See the reason below.' },
  ready_for_pickup: { label: 'Ready for pickup', cls: 'bg-brand-100 text-brand-900 ring-brand-300', hint: 'Your document is ready. Bring a valid ID to the barangay hall.' },
  released: { label: 'Released', cls: 'bg-slate-200 text-slate-800 ring-slate-300', hint: 'Your document has been released to you.' },
};

export const STATUS_ORDER = ['pending', 'under_review', 'approved', 'rejected', 'ready_for_pickup', 'released'];

export const ROLE_LABEL = { admin: 'Admin / Secretary', staff: 'Barangay Staff', captain: 'Barangay Captain', resident: 'Resident' };
export const ACCOUNT_LABEL = { pending: 'Awaiting verification', verified: 'Verified', deactivated: 'Deactivated' };

export const fmtDate = (d, withTime = false) => {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date)) return '-';
  return date.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

// Dates like "2026-10-03" should not shift by timezone.
export const fmtDay = (d) => (d ? fmtDate(`${String(d).slice(0, 10)}T00:00:00`) : '-');

export const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const humanize = (s) => String(s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

let metaCache = null;
export function useMeta() {
  const [meta, setMeta] = useState(metaCache);
  useEffect(() => {
    if (metaCache) return;
    api.get('/meta').then((r) => { metaCache = r.data; setMeta(r.data); }).catch(() => {});
  }, []);
  return meta || { barangay: 'San Sotero', purposes: [], civil_statuses: [] };
}

/** Re-runs `fn` every `ms` while the tab is visible (used for near real-time status updates). */
export function usePolling(fn, ms) {
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) fn(); }, ms);
    return () => clearInterval(id);
  }, [fn, ms]);
}

export function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
