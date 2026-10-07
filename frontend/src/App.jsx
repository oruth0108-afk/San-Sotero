import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { PageLoader } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ResidentHome from './pages/resident/Home.jsx';
import NewRequest from './pages/resident/NewRequest.jsx';
import MyRequests from './pages/resident/MyRequests.jsx';
import ResidentRequestDetail from './pages/resident/RequestDetail.jsx';
import Profile from './pages/resident/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Requests from './pages/admin/Requests.jsx';
import AdminRequestDetail from './pages/admin/RequestDetail.jsx';
import Residents from './pages/admin/Residents.jsx';
import DocumentTypes from './pages/admin/DocumentTypes.jsx';
import Staff from './pages/admin/Staff.jsx';
import ActivityLogs from './pages/admin/ActivityLogs.jsx';

const home = (user) => (user.role === 'resident' ? '/app' : '/admin');

function RequireRole({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={home(user)} replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to={home(user)} replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireRole roles={['resident']} />}>
        <Route element={<Layout />}>
          <Route path="/app" element={<ResidentHome />} />
          <Route path="/app/new" element={<NewRequest />} />
          <Route path="/app/requests" element={<MyRequests />} />
          <Route path="/app/requests/:id" element={<ResidentRequestDetail />} />
          <Route path="/app/notifications" element={<Notifications base="/app" />} />
          <Route path="/app/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['admin', 'staff', 'captain']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/requests" element={<Requests />} />
          <Route path="/admin/requests/:id" element={<AdminRequestDetail />} />
          <Route path="/admin/residents" element={<Residents />} />
          <Route path="/admin/notifications" element={<Notifications base="/admin" />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/document-types" element={<DocumentTypes />} />
          <Route path="/admin/staff" element={<Staff />} />
          <Route path="/admin/logs" element={<ActivityLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
