import React, { createContext, useState, useEffect } from 'react';
import { AuthContextType, LoginResponse, User } from '../types';
import { api } from '../lib/api';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for token in local storage
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      // Fetch user data
      fetchUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      setUser(userData.user);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setToken(null);
      localStorage.removeItem('token');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error messages from the server
        const errorMessage = data.message || 'Login failed';
        throw new Error(errorMessage);
      }
      
      setUser(data.user);
      setToken('authenticated'); // Session-based auth
      localStorage.setItem('token', 'authenticated');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Email ou senha incorretos');
      setIsLoading(false);
      throw err; // Re-throw to handle in components
    }
  };

  const register = async (email: string, password: string, additionalData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, ...additionalData }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Registration successful but user needs approval
      setError(null);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Erro ao criar conta');
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      error, 
      login, 
      register, 
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
