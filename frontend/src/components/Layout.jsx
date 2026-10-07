import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import { ROLE_LABEL, useMeta, usePolling } from '../lib/utils.js';
import { cx } from './ui.jsx';
import BrandIdentity from './BrandIdentity.jsx';

const Icon = ({ d }) => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const I = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  badge: 'M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
};

function navFor(user) {
  if (user.role === 'resident') {
    return [
      { to: '/app', label: 'Home', icon: I.home, end: true },
      { to: '/app/new', label: 'New request', icon: I.plus },
      { to: '/app/requests', label: 'My requests', icon: I.list },
      { to: '/app/notifications', label: 'Notifications', icon: I.bell, bell: true },
      { to: '/app/profile', label: 'My profile', icon: I.user },
    ];
  }
  const items = [
    { to: '/admin', label: 'Dashboard', icon: I.home, end: true },
    { to: '/admin/requests', label: 'Requests', icon: I.file },
    { to: '/admin/residents', label: 'Residents', icon: I.users },
  ];
  if (user.role === 'admin') {
    items.push(
      { to: '/admin/document-types', label: 'Document types', icon: I.badge },
      { to: '/admin/staff', label: 'Staff accounts', icon: I.shield },
      { to: '/admin/logs', label: 'Activity logs', icon: I.clock },
    );
  }
  items.push({ to: '/admin/notifications', label: 'Notifications', icon: I.bell, bell: true });
  return items;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const meta = useMeta();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(() => {
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.unread_count)).catch(() => {});
  }, []);
  useEffect(loadUnread, [loadUnread, pathname]);
  usePolling(loadUnread, 30000);
  useEffect(() => setOpen(false), [pathname]);

  const items = navFor(user);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Main">
      {items.map((it) => (
        <NavLink
          key={it.to} to={it.to} end={it.end}
          className={({ isActive }) => cx(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
            isActive ? 'bg-white text-brand-800' : 'text-brand-100 hover:bg-brand-800'
          )}
        >
          <Icon d={it.icon} />
          <span className="flex-1">{it.label}</span>
          {it.bell && unread > 0 && <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
        </NavLink>
      ))}
    </nav>
  );

  const brand = (
    <Link to={user.role === 'resident' ? '/app' : '/admin'} className="block px-5 py-5">
      <BrandIdentity name={meta.barangay} subtitle="Online Document Requests" />
    </Link>
  );

  const userBox = (
    <div className="border-t border-brand-800 p-4">
      <p className="truncate text-sm font-bold text-white">{user.name}</p>
      <p className="mb-3 text-xs text-brand-200">{ROLE_LABEL[user.role]}</p>
      <button onClick={async () => { await logout(); navigate('/login'); }} className="w-full rounded-lg bg-brand-800 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-900">
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-700 lg:fixed lg:inset-y-0 lg:flex">
        {brand}{nav}{userBox}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-700 px-4 py-3 text-white lg:hidden">
        <BrandIdentity name={meta.barangay} size="sm" />
        <div className="flex items-center gap-1">
          <Link to={user.role === 'resident' ? '/app/notifications' : '/admin/notifications'} className="relative rounded-md p-2" aria-label="Notifications">
            <Icon d={I.bell} />
            {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold">{unread}</span>}
          </Link>
          <button onClick={() => setOpen(true)} className="rounded-md p-2" aria-label="Open menu">
            <Icon d="M4 6h16M4 12h16M4 18h16" />
          </button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-brand-700">
            {brand}{nav}{userBox}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
