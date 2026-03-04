/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { AuthService } from '@/api';
import { setOnUnauthorized } from '@/api/fetchInterceptor';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  sessionExpired: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const isCheckingAuth = useRef(true);

  // Check if user is already logged in on mount
  const checkAuth = useCallback(async () => {
    isCheckingAuth.current = true;
    try {
      const user = await AuthService.getCurrentUser();
      setIsAuthenticated(true);
      setUsername(user.username ?? null);
    } catch {
      setIsAuthenticated(false);
      setUsername(null);
    } finally {
      isCheckingAuth.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Register global 401 interceptor — skip during the initial auth check
  useEffect(() => {
    setOnUnauthorized(() => {
      if (!isCheckingAuth.current) {
        setIsAuthenticated(false);
        setUsername(null);
        setSessionExpired(true);
      }
    });
    return () => setOnUnauthorized(null);
  }, []);

  const login = async (usernameInput: string, password: string) => {
    setSessionExpired(false);
    try {
      await AuthService.login({ username: usernameInput, password });
      await checkAuth();
    } catch {
      throw new Error('Invalid credentials');
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setSessionExpired(false);
    setIsAuthenticated(false);
    setUsername(null);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    try {
      await AuthService.changePassword({ currentPassword, newPassword, confirmPassword });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        username,
        sessionExpired,
        login,
        logout,
        changePassword,
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
