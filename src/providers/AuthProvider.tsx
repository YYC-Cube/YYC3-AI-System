/**
 * @file AuthProvider.tsx
 * @description AuthProvider 集成组件 - 在应用根部提供认证上下文
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

import React from 'react';

import { AuthProvider as BaseAuthProvider } from '../contexts/AuthContext';
import { AuthRoutes } from '../pages/auth-routes';

/**
 * AppAuthProvider - 应用认证提供者
 * 包装应用并提供认证上下文
 */
export const AppAuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <BaseAuthProvider>{children || <AuthRoutes />}</BaseAuthProvider>;
};

export default AppAuthProvider;
