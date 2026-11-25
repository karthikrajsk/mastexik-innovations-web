import { Navigate, Outlet } from 'react-router-dom';

// ProtectedRoute component to guard routes
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};


export default ProtectedRoute;