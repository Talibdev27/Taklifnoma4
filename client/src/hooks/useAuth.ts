import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  clearSessionError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored authentication on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Verify token is still valid
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        setSessionError('Session data corrupted. Please log in again.');
        logout();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      // Always send the token in the Authorization header
      const response = await fetch('/api/user/current', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSessionError('Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          setSessionError('Session invalid. Please log in again.');
        } else {
          setSessionError('Unable to verify session. Please try logging in again.');
        }
        logout();
      } else {
        const verifiedUser = await response.json();
        setUser(verifiedUser);
        localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
        setSessionError(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      setSessionError('Network error during session verification. Your data is safe, but please check your connection and try logging in again.');
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setSessionError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('token', data.token); // <-- Add this line for guest manager compatibility
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // Set token expiry reminder
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 6); // Remind 1 day before expiry
      localStorage.setItem('tokenExpiryReminder', tokenExpiry.toISOString());

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred. Please check your connection and try again.' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setSessionError(null);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Registration failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // Set token expiry reminder
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 6);
      localStorage.setItem('tokenExpiryReminder', tokenExpiry.toISOString());

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error occurred. Please check your connection and try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiryReminder');
    setSessionError(null);
  };

  const clearSessionError = () => {
    setSessionError(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
    sessionError,
    clearSessionError
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}