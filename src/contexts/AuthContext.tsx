import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '@/lib/api';

interface User {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  investment_style?: string;
  risk_tolerance?: string;
  interested_sectors?: string[];
  account_status?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await userApi.getProfile();
    if (data && !error) {
      setUser(data);
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password);
    
    if (error) {
      return { success: false, error };
    }

    if (data) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);
      return { success: true };
    }

    return { success: false, error: 'Unknown error occurred' };
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => {
    const { error } = await authApi.register(data);
    
    if (error) {
      return { success: false, error };
    }

    return { success: true };
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await userApi.getProfile();
    if (data) {
      setUser(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
