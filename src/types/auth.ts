/**
 * @file auth.ts
 * @description 认证系统类型定义
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

/**
 * 用户信息接口
 */
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * 认证状态
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * 登录表单数据
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 注册表单数据
 */
export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

/**
 * 忘记密码表单数据
 */
export interface ForgotPasswordFormData {
  email: string;
}

/**
 * 重置密码表单数据
 */
export interface ResetPasswordFormData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 认证响应数据
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

/**
 * 认证上下文接口
 */
export interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<AuthResponse>;
  forgotPassword: (data: ForgotPasswordFormData) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordFormData) => Promise<AuthResponse>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * 验证错误类型
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 表单验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
