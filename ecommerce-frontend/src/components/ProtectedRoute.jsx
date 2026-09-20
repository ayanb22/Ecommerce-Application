import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Remember where the person was headed so login can send them back
    // after a successful sign-in instead of dumping them on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
