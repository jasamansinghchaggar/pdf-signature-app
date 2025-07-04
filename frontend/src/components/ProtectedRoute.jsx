import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    axiosInstance.get('/auth/profile')
      .then(res => {
        setUser(res.data.data.user);
        setIsAuthenticated(true);
      })
      .catch(error => {
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Pass user and setUser as props to children if needed
  return React.cloneElement(children, { user, setUser });
};

export default ProtectedRoute;
