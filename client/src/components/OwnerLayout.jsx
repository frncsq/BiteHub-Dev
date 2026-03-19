import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import OwnerSidebar from './OwnerSidebar';

function OwnerLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Hit any protected endpoint to verify session exists
        await axios.get(`${baseURL}/api/owner/dashboard`, { withCredentials: true });
        setIsAuthenticated(true);
      } catch (err) {
        // If 401 Unauthorized, backend rejected the session
        navigate('/restaurant-login');
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default OwnerLayout;
