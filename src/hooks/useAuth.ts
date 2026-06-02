/**
 * @file useAuth.ts
 * @description useAuth Hook - 获取认证状态和功能的快捷方式
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 */

import { useMemo } from 'react';

import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * useAuth Hook - 获取认证状态和功能
 * 这是一个便捷的Hook，直接导出自AuthContext
 */
export const useAuth = () => {
  const auth = useAuthContext();

  return useMemo(() => auth, [auth]);
};

export default useAuth;
