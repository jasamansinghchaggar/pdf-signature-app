import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('ProtectedRoute: Checking authentication...');
    axiosInstance.get('/auth/profile')
      .then(res => {
        console.log('ProtectedRoute: Authentication successful', res.data);
        setUser(res.data.data.user);
        setIsAuthenticated(true);
      })
      .catch(error => {
        console.log('ProtectedRoute: Authentication failed', error.response?.status, error.response?.data);
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
