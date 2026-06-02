/**
 * @file AuthContext.test.tsx
 * @description AuthContext 单元测试
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

import { LoginFormData, RegisterFormData } from '../../types/auth';
import { AuthProvider, useAuth } from '../AuthContext';

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
  });

  describe('useAuth', () => {
    it('应该抛出错误在 AuthProvider 之外使用', () => {
      // 抑制 console.error
      const consoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = consoleError;
    });

    it('应该正确初始化', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('应该成功登录演示账号', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginData: LoginFormData = {
        email: 'demo@example.com',
        password: 'password123',
        rememberMe: true,
      };

      await act(async () => {
        const response = await result.current.login(loginData);

        expect(response.success).toBe(true);
        expect(response.user).toBeDefined();
        expect(response.user?.email).toBe('demo@example.com');
        expect(response.token).toBeDefined();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('demo@example.com');
    });

    it('应该失败于错误的凭据', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginData: LoginFormData = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
        rememberMe: false,
      };

      await act(async () => {
        const response = await result.current.login(loginData);

        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('应该设置加载状态', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginData: LoginFormData = {
        email: 'demo@example.com',
        password: 'password123',
      };

      // 开始登录
      act(() => {
        result.current.login(loginData);
      });

      // 等待加载状态
      expect(result.current.isLoading).toBe(true);

      // 等待完成
      await act(async () => {
        await result.current.login(loginData);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const registerData: RegisterFormData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'password123',
        agreeToTerms: true,
      };

      await act(async () => {
        const response = await result.current.register(registerData);

        expect(response.success).toBe(true);
        expect(response.user).toBeDefined();
        expect(response.user?.email).toBe('newuser@example.com');
        expect(response.user?.username).toBe('newuser');
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('应该失败于密码不匹配', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const registerData: RegisterFormData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'different123',
        agreeToTerms: true,
      };

      await act(async () => {
        const response = await result.current.register(registerData);

        expect(response.success).toBe(false);
        expect(response.error).toContain('密码');
      });
    });
  });

  describe('logout', () => {
    it('应该成功登出', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // 先登录
      await act(async () => {
        await result.current.login({
          email: 'demo@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // 登出
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('应该更新用户信息', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // 先登录
      await act(async () => {
        await result.current.login({
          email: 'demo@example.com',
          password: 'password123',
        });
      });

      const originalUsername = result.current.user?.username;

      // 更新用户名
      await act(async () => {
        await result.current.updateUser({
          username: 'updateduser',
        });
      });

      expect(result.current.user?.username).toBe('updateduser');
      expect(result.current.user?.username).not.toBe(originalUsername);
    });

    it('不应该在没有用户时更新', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // 尝试在没有用户时更新
      await act(async () => {
        await result.current.updateUser({
          username: 'updateduser',
        });
      });

      // 应该没有用户
      expect(result.current.user).toBeNull();
    });
  });

  describe('持久化', () => {
    it('应该将用户数据保存到 localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginData: LoginFormData = {
        email: 'demo@example.com',
        password: 'password123',
        rememberMe: true,
      };

      await act(async () => {
        await result.current.login(loginData);
      });

      const storedUser = localStorage.getItem('yyc3_auth_user');
      const storedToken = localStorage.getItem('yyc3_auth_token');

      expect(storedUser).toBeDefined();
      expect(storedToken).toBeDefined();

      const parsedUser = JSON.parse(storedUser!);
      expect(parsedUser.email).toBe('demo@example.com');
    });

    it('应该从 localStorage 加载用户数据', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const user = {
        id: '1',
        email: 'demo@example.com',
        username: 'Demo User',
        role: 'user' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const token = 'test-token';

      // 手动设置 localStorage
      localStorage.setItem('yyc3_auth_user', JSON.stringify(user));
      localStorage.setItem('yyc3_auth_token', token);

      // 重新挂载（模拟页面刷新）
      const { result: newResult } = renderHook(() => useAuth(), { wrapper });

      // 应该从 localStorage 加载用户
      expect(newResult.current.user).toBeDefined();
      expect(newResult.current.user?.email).toBe('demo@example.com');
      expect(newResult.current.isAuthenticated).toBe(true);
    });

    it('登出时应该清除 localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // 先登录
      await act(async () => {
        await result.current.login({
          email: 'demo@example.com',
          password: 'password123',
          rememberMe: true,
        });
      });

      expect(localStorage.getItem('yyc3_auth_user')).toBeDefined();

      // 登出
      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('yyc3_auth_user')).toBeNull();
      expect(localStorage.getItem('yyc3_auth_token')).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('应该发送重置密码邮件', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.forgotPassword({
          email: 'demo@example.com',
        });

        expect(response.success).toBe(true);
        expect(response.message).toContain('邮件');
      });
    });
  });

  describe('resetPassword', () => {
    it('应该成功重置密码', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.resetPassword({
          token: 'test-token',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        });

        expect(response.success).toBe(true);
        expect(response.message).toContain('成功');
      });
    });

    it('应该失败于密码不匹配', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.resetPassword({
          token: 'test-token',
          newPassword: 'newpassword123',
          confirmPassword: 'different',
        });

        expect(response.success).toBe(false);
        expect(response.error).toContain('密码');
      });
    });
  });
});
