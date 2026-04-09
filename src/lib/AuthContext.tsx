import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/index.js';
import { apiService } from '../services/apiService.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerUser: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  registerUser: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('academia_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const persistUser = (apiUser: User) => {
    setUser(apiUser);
    localStorage.setItem('academia_user', JSON.stringify(apiUser));
  };

  const login = async (rawUsername: string, password: string) => {
    const username = rawUsername.trim();
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }
    const apiUser = await apiService.login({ username, password });
    persistUser(apiUser);
  };

  const registerUser = async (rawUsername: string, password: string) => {
    const username = rawUsername.trim();
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }
    const apiUser = await apiService.register({ username, password });
    persistUser(apiUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('academia_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
