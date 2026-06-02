/**
 * @file auth-routes.tsx
 * @description 认证相关路由配置
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

import { Routes, Route } from 'react-router-dom';

import HomePage from '../components/HomePage';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../contexts/AuthContext';

import ForgotPasswordPage from './ForgotPasswordPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ResetPasswordPage from './ResetPasswordPage';

/**
 * AuthRoutes - 认证相关路由组件
 */
export const AuthRoutes: React.FC = () => {
  const { status } = useAuth();

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* 受保护的路由 - 需要登录才能访问 */}
      <Route
        path="/*"
        element={
          <ProtectedRoute fallback={<LoginPage />}>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AuthRoutes;
