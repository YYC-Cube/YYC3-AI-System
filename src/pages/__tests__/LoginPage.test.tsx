/**
 * @file LoginPage.test.tsx
 * @description LoginPage 组件测试
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../contexts/AuthContext';
import LoginPage from '../LoginPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应该渲染登录表单', () => {
    renderLoginPage();

    expect(screen.getByText('欢迎回来')).toBeInTheDocument();
    expect(screen.getByText('登录 YYC³ 便携式智能 AI 系统')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('应该显示演示账号提示', () => {
    renderLoginPage();

    expect(screen.getByText('演示账号：')).toBeInTheDocument();
    expect(screen.getByText(/demo@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/password123/)).toBeInTheDocument();
  });

  it('应该显示"记住我"复选框', () => {
    renderLoginPage();

    expect(screen.getByText('记住我')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('应该显示"忘记密码"链接', () => {
    renderLoginPage();

    const forgotPasswordLink = screen.getByText('忘记密码？');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('应该显示"立即注册"链接', () => {
    renderLoginPage();

    const registerLink = screen.getByText('立即注册');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('应该切换密码可见性', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText('••••••••');
    const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton! as HTMLElement);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('应该验证空邮箱', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: '登录' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入邮箱地址')).toBeInTheDocument();
    });
  });

  it('应该验证无效邮箱格式', async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    });
  });

  it('应该验证空密码', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    await user.type(emailInput, 'demo@example.com');

    const submitButton = screen.getByRole('button', { name: '登录' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });
  });

  it('应该验证密码长度', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    await user.type(emailInput, 'demo@example.com');

    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, '12345');

    const submitButton = screen.getByRole('button', { name: '登录' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('密码长度至少为6位')).toBeInTheDocument();
    });
  });

  it('应该使用演示账号登录', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: '登录' });

    await user.type(emailInput, 'demo@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // 等待登录完成
    await waitFor(
      () => {
        expect(submitButton).toBeDisabled();
      },
      { timeout: 3000 }
    );

    // 验证登录状态
    await waitFor(
      () => {
        expect(screen.queryByText('邮箱或密码错误')).not.toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('应该显示登录错误信息', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: '登录' });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // 等待错误提示
    await waitFor(
      () => {
        expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('应该显示加载状态', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: '登录' });

    await user.type(emailInput, 'demo@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // 检查加载状态
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('登录中...')).toBeInTheDocument();
  });

  it('应该清除字段错误当用户输入', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const submitButton = screen.getByRole('button', { name: '登录' });

    // 触发错误
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('请输入邮箱地址')).toBeInTheDocument();
    });

    // 输入有效邮箱
    await user.type(emailInput, 'demo@example.com');

    // 错误应该被清除
    await waitFor(() => {
      expect(screen.queryByText('请输入邮箱地址')).not.toBeInTheDocument();
    });
  });
});
