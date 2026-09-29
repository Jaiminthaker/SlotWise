import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingState } from './States.jsx';

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-page"><LoadingState label="Checking your session" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'provider' ? '/provider' : user.role === 'admin' ? '/admin/services' : '/services';
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}