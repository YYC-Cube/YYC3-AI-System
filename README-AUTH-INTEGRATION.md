# 认证登录系统 - 快速集成指南

## 📦 安装依赖

确保项目已安装以下依赖：

```bash
pnpm install react-router-dom lucide-react
```

## 🚀 快速集成（3步完成）

### 步骤 1: 替换 App.tsx

将以下代码复制到您的 `src/App.tsx`：

```tsx
import React from 'react';
import { AppAuthProvider } from './providers/AuthProvider';

function App() {
  return <AppAuthProvider />;
}

export default App;
```

### 步骤 2: 验证集成

启动开发服务器：

```bash
pnpm dev
```

访问以下路由验证功能：

- 登录页面: <http://localhost:3156/login>
- 注册页面: <http://localhost:3156/register>
- 忘记密码: <http://localhost:3156/forgot-password>

### 步骤 3: 测试演示账号

使用演示账号登录：

```text
邮箱: demo@example.com
密码: password123
```

## 🔧 高级集成

### 方式 1: 集成到现有路由

如果您已经有路由配置，可以这样集成：

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthRoutes } from './pages/auth-routes';
import YourExistingPage from './components/YourExistingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={<AuthRoutes />} />
          {/* 添加您的其他路由 */}
          <Route path="/your-page" element={<YourExistingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 方式 2: 保护现有页面

使用 `ProtectedRoute` 保护需要登录的页面：

```tsx
import { ProtectedRoute } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

function YourProtectedPage() {
  return (
    <ProtectedRoute fallback={<LoginPage />}>
      <YourPageContent />
    </ProtectedRoute>
  );
}

// 或在组件内部检查
function YourComponent() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1>欢迎, {user?.username}</h1>
      {/* 您的组件内容 */}
    </div>
  );
}
```

### 方式 3: 添加用户信息显示

在头部或其他位置显示用户信息：

```tsx
import { useAuth } from './contexts/AuthContext';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-4">
        {user?.avatar && (
          <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
        )}
        {isAuthenticated && (
          <span className="text-gray-900 dark:text-white">
            {user?.username}
          </span>
        )}
      </div>

      {isAuthenticated && (
        <button onClick={logout} className="text-sm text-gray-600">
          退出登录
        </button>
      )}
    </header>
  );
}
```

## 🎨 自定义样式

### 修改主题色

在 `src/pages/LoginPage.tsx` 中修改渐变色：

```tsx
// 当前: from-blue-600 to-purple-600
// 修改为: from-green-600 to-teal-600
<button
  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-lg"
>
  登录
</button>
```

### 修改 Logo

在页面顶部修改 Logo 图标：

```tsx
// LoginPage.tsx
<div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
  {/* 您可以更换为其他图标 */}
  <Lock className="w-8 h-8 text-white" />
</div>
```

## 📱 添加社交登录

### 示例：添加 Google 登录

```tsx
// src/pages/LoginPage.tsx
import { Chrome } from 'lucide-react';

// 在登录表单下方添加
<div className="mt-6">
  <button className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
    <Chrome className="w-5 h-5" />
    使用 Google 账号登录
  </button>
</div>
```

## 🔒 后端集成

### 连接真实 API

修改 `src/contexts/AuthContext.tsx` 中的 `login` 函数：

```typescript
const login = useCallback(
  async (data: LoginFormData): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        saveUserToStorage(result.user, result.token);
        setUser(result.user);
        setStatus('authenticated');

        return {
          success: true,
          user: result.user,
          token: result.token,
          message: '登录成功'
        };
      } else {
        return {
          success: false,
          error: result.message || '登录失败'
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
```

## 🧪 运行测试

```bash
# 运行所有测试
pnpm test

# 运行认证相关测试
pnpm test auth

# 运行特定测试文件
pnpm test AuthContext.test
pnpm test LoginPage.test
```

## 📚 更多资源

- 完整文档: `docs/YYC3-2026-03-24-认证登录系统文档.md`
- 开发总结: `docs/YYC3-2026-03-24-认证登录系统开发总结.md`
- 类型定义: `src/types/auth.ts`
- 集成示例: `src/App.auth-integration.tsx`

## ❓ 常见问题

### Q: 如何修改演示账号？

A: 编辑 `src/contexts/AuthContext.tsx` 中的 `login` 函数：

```typescript
if (data.email === 'your-email@example.com' && data.password === 'your-password') {
  // ...
}
```

### Q: 如何禁用演示账号？

A: 移除或注释掉演示账号的判断逻辑，只连接真实 API。

### Q: 如何添加记住我功能？

A: 已实现。在 `login` 函数中，根据 `rememberMe` 参数调整 token 存储时长。

### Q: 如何实现 Token 刷新？

A: 添加 `refreshToken` 函数，使用 `axios` 拦截器自动刷新：

```typescript
// 示例
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const result = await response.json();
  if (response.ok) {
    saveUserToStorage(result.user, result.token);
  }
};
```

## 🆘 需要帮助？

如有问题，请查看：

- 使用文档: `docs/YYC3-2026-03-24-认证登录系统文档.md`
- 或联系团队: <admin@0379.email>

---

**YYC³ Team** © 2024
