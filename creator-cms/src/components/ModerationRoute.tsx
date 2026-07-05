import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODERATOR_ROLES = new Set(['admin', 'moderator']);

export function ModerationRoute() {
  const { user } = useAuth();
  if (!user || !MODERATOR_ROLES.has(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}