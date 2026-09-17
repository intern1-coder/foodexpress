/**
 * Auth Context
 * 
 * Manages authentication state across the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, usersAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Register
  const register = async (data) => {
    const response = await authAPI.register(data);
    const { user: newUser, token: newToken } = response.data.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return response.data;
  };

  // Login
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user: loggedInUser, token: newToken } = response.data.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);

    return response.data;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Update profile
  const updateProfile = async (data) => {
    const response = await usersAPI.updateProfile(data);
    const updatedUser = response.data.data;

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    return response.data;
  };

  // Check if user is admin
  const isAdmin = () => user?.role === 'admin';

  // Check if user is customer
  const isCustomer = () => user?.role === 'customer';

  // Check if user is delivery partner
  const isDeliveryPartner = () => user?.role === 'delivery_partner';

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateProfile,
    isAdmin,
    isCustomer,
    isDeliveryPartner
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
