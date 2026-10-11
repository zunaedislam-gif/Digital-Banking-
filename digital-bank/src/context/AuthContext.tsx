import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, BankAccount } from '../types/banking.js';
import { api, tokenStorage } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  account: BankAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ user: User; account?: BankAccount }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ user: User; account: BankAccount }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAccount: (acc: BankAccount | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const existingToken = tokenStorage.get();
    if (!existingToken) {
      setUser(null);
      setAccount(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setAccount(data.account || null);
      setToken(existingToken);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      tokenStorage.clear();
      setUser(null);
      setAccount(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, pass);
      setUser(data.user);
      setAccount(data.account || null);
      setToken(data.token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (regData: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    password: string;
    confirmPassword: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await api.register(regData);
      setUser(data.user);
      setAccount(data.account);
      setToken(data.token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setAccount(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        token,
        isAuthenticated,
        isAdmin,
        isCustomer,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        setAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
