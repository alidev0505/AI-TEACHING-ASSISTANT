import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login status on load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Attempt to fetch user details using the stored token
        const res = await api.get('/auth/me');
        
        // Handle potential response structure variations
        const userData = res.data.user || res.data;
        setUser(userData);
        
      } catch (err) {
        // If 401 (Unauthorized) or 403 (Forbidden), clear the session
        console.warn("Session expired or invalid token. Logging out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Clean up any stale user data
        setUser(null);
      } finally {
        // Always stop loading, whether success or fail
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const loginUser = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    
    if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        // If your backend sends the user object in login response, set it here
        const userData = res.data.user;
        setUser(userData);
        return userData;
    }
  };

  const signupUser = async (userData) => {
    return await api.post('/auth/signup', userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login'; // Hard redirect to clear any app state
  };

  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>
            Loading Session...
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loginUser, signupUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};