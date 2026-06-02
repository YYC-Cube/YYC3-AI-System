/**
 * @file AuthContext.tsx
 * @description 认证上下文 - 管理全局认证状态
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';

import {
  User,
  AuthStatus,
  AuthContextType,
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  AuthResponse
} from '../types/auth';

// 认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 组件 - 提供认证状态和功能
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isLoading, setIsLoading] = useState(false);

  // 模拟用户数据存储
  const STORAGE_KEY = 'yyc3_auth_user';
  const TOKEN_KEY = 'yyc3_auth_token';

  /**
   * 从本地存储加载用户数据
   */
  const loadUserFromStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      
      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setStatus('authenticated');
        return true;
      } else {
        setUser(null);
        setStatus('unauthenticated');
        return false;
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      setUser(null);
      setStatus('error');
      return false;
    }
  }, []);

  /**
   * 保存用户数据到本地存储
   */
  const saveUserToStorage = useCallback((userData: User, token: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }, []);

  /**
   * 清除用户数据
   */
  const clearUserFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear user from storage:', error);
    }
  }, []);

  /**
   * 初始化认证状态
   */
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  /**
   * 登录函数
   */
  const login = useCallback(
    async (data: LoginFormData): Promise<AuthResponse> => {
      setIsLoading(true);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        // 模拟登录逻辑
        if (data.email === 'demo@example.com' && data.password === 'password123') {
          const userData: User = {
            id: '1',
            email: data.email,
            username: 'Demo User',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };

          const token = 'mock-jwt-token-' + Date.now();

          saveUserToStorage(userData, token);
          setUser(userData);
          setStatus('authenticated');

          return {
            success: true,
            user: userData,
            token,
            message: '登录成功'
          };
        } else {
          return {
            success: false,
            error: '邮箱或密码错误'
          };
        }
      } catch (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: '登录失败，请稍后重试'
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveUserToStorage]
  );

  /**
   * 注册函数
   */
  const register = useCallback(
    async (data: RegisterFormData): Promise<AuthResponse> => {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        // 验证密码一致性
        if (data.password !== data.confirmPassword) {
          return {
            success: false,
            error: '两次输入的密码不一致'
          };
        }

        // 模拟注册逻辑
        const userData: User = {
          id: Date.now().toString(),
          email: data.email,
          username: data.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const token = 'mock-jwt-token-' + Date.now();

        saveUserToStorage(userData, token);
        setUser(userData);
        setStatus('authenticated');

        return {
          success: true,
          user: userData,
          token,
          message: '注册成功'
        };
      } catch (error) {
        console.error('Register error:', error);
        return {
          success: false,
          error: '注册失败，请稍后重试'
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveUserToStorage]
  );

  /**
   * 忘记密码函数
   */
  const forgotPassword = useCallback(
    async (data: ForgotPasswordFormData): Promise<AuthResponse> => {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // 模拟发送重置密码邮件
        return {
          success: true,
          message: '重置密码邮件已发送至您的邮箱'
        };
      } catch (error) {
        console.error('Forgot password error:', error);
        return {
          success: false,
          error: '发送失败，请稍后重试'
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 重置密码函数
   */
  const resetPassword = useCallback(
    async (data: ResetPasswordFormData): Promise<AuthResponse> => {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        if (data.newPassword !== data.confirmPassword) {
          return {
            success: false,
            error: '两次输入的密码不一致'
          };
        }

        return {
          success: true,
          message: '密码重置成功'
        };
      } catch (error) {
        console.error('Reset password error:', error);
        return {
          success: false,
          error: '重置失败，请稍后重试'
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 更新用户信息
   */
  const updateUser = useCallback(
    async (data: Partial<User>): Promise<void> => {
      if (!user) return;

      const updatedUser = {
        ...user,
        ...data,
        updatedAt: new Date().toISOString()
      };

      setUser(updatedUser);
      saveUserToStorage(updatedUser, localStorage.getItem(TOKEN_KEY) || '');
    },
    [user, saveUserToStorage]
  );

  /**
   * 刷新用户信息
   */
  const refreshUser = useCallback(async () => {
    await loadUserFromStorage();
  }, [loadUserFromStorage]);

  /**
   * 登出函数
   */
  const logout = useCallback(async () => {
    clearUserFromStorage();
    setUser(null);
    setStatus('unauthenticated');
  }, [clearUserFromStorage]);

  /**
   * 计算属性
   */
  const isAuthenticated = useMemo(
    () => status === 'authenticated' && user !== null,
    [status, user]
  );

  /**
   * 提供给子组件的值
   */
  const value: AuthContextType = useMemo(
    () => ({
      user,
      status,
      isLoading,
      isAuthenticated,
      login,
      logout,
      register,
      forgotPassword,
      resetPassword,
      updateUser,
      refreshUser
    }),
    [
      user,
      status,
      isLoading,
      isAuthenticated,
      login,
      logout,
      register,
      forgotPassword,
      resetPassword,
      updateUser,
      refreshUser
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook - 获取认证状态和功能
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * ProtectedRoute 组件 - 路由守卫
 */
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  return <>{children}</>;
};
