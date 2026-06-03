/**
 * @file App.auth-integration.tsx
 * @description App.tsx 集成认证系统的示例
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2024-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2024 YYC³ Team
 *
 * 这是一个完整的 App.tsx 集成示例，展示如何将认证系统集成到现有应用中
 *
 * 使用方法：
 * 1. 将此文件的内容复制到您的 App.tsx
 * 2. 或者直接使用 AppAuthProvider
 */

import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { AuthRoutes } from './pages/auth-routes';

/**
 * App 组件 - 主应用组件
 *
 * 这个示例展示了如何将认证系统集成到应用中
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * 或者使用 AppAuthProvider（更简洁）
 *
 * import { AppAuthProvider } from './providers/AuthProvider';
 *
 * function App() {
 *   return <AppAuthProvider />;
 * }
 */

export default App;
