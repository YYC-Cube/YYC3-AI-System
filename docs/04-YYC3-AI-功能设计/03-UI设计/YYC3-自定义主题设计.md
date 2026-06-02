---
file: 自定义主题.md
description: Multi-Panel Layout Builder 自定义主题系统规范
author: YanYuCloudCube Team
version: 2.0.0
created: 2026-03-08
updated: 2026-03-15
status: active
tags: theme, customization, design-system
---

> ***YanYuCloudCube***
> ***言启象限 | 语枢未来***
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> ***万象归元于云枢 | 深栈智启新纪元***
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 🎨 品牌元素自定义

### 可自定义的品牌元素

YYC³ AI Code 支持以下品牌元素的完全自定义，用户可以通过设置界面或配置文件进行修改：

#### 1. Logo（标志）
- **文件格式**: SVG, PNG, WebP
- **推荐尺寸**: 32x32, 64x64, 128x128, 256x256
- **透明背景**: 支持
- **动画效果**: 支持旋转、浮动等CSS动画
- **配置路径**: `src/config/branding.ts` 或设置界面

#### 2. 标语（Slogan）
- **中文标语**: "言启象限 | 语枢未来"
- **英文标语**: "Words Initiate Quadrants, Language Serves as Core for Future"
- **副标语中文**: "万象归元于云枢 | 深栈智启新纪元"
- **副标语英文**: "All things converge in cloud pivot; Deep stacks ignite a new era of intelligence"
- **显示位置**: 首页、登录页、关于页面
- **自定义方式**: 设置界面 → 品牌设置 → 标语编辑

#### 3. 页面标题
- **SEO 标题**: 可自定义，默认 "YYC³ AI Code Designer"
- **SEO 描述**: 可自定义，支持多语言
- **浏览器标签**: 支持自定义图标和标题
- **配置方式**: `src/config/seo.ts` 或设置界面

#### 4. 联系信息
- **邮箱**: admin@0379.email（可自定义）
- **官网**: 可自定义URL
- **社交媒体**: 支持添加多个社交链接
- **版权信息**: 可自定义版权年份和所有者

### 实现方式

#### TypeScript 配置文件

```typescript
// src/config/branding.ts
export interface BrandingConfig {
  // Logo 配置
  logo: {
    light: string;  // 浅色模式 logo 路径
    dark: string;   // 深色模式 logo 路径
    width: number;
    height: number;
    animated?: boolean;
  };

  // 标语配置
  slogan: {
    primary: {
      zh: string;  // 主标语中文
      en: string;  // 主标语英文
    };
    secondary: {
      zh: string;  // 副标语中文
      en: string;  // 副标语英文
    };
  };

  // 页面标题配置
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };

  // 联系信息
  contact: {
    email: string;
    website?: string;
    social?: {
      github?: string;
      twitter?: string;
      linkedin?: string;
    };
  };

  // 版权信息
  copyright: {
    year: number;
    owner: string;
    license?: string;
  };
}

export const defaultBranding: BrandingConfig = {
  logo: {
    light: '/assets/logo-light.svg',
    dark: '/assets/logo-dark.svg',
    width: 40,
    height: 40,
    animated: true,
  },
  slogan: {
    primary: {
      zh: '言启象限 | 语枢未来',
      en: 'Words Initiate Quadrants, Language Serves as Core for Future',
    },
    secondary: {
      zh: '万象归元于云枢 | 深栈智启新纪元',
      en: 'All things converge in cloud pivot; Deep stacks ignite a new era of intelligence',
    },
  },
  seo: {
    title: 'YYC³ AI Code Designer',
    description: '智能AI代码设计器，支持实时协作、多设备预览、AI辅助开发',
    keywords: ['AI', 'Code', 'Designer', 'Collaboration', 'Real-time'],
  },
  contact: {
    email: 'admin@0379.email',
    website: 'https://yanyucloudcube.com',
  },
  copyright: {
    year: new Date().getFullYear(),
    owner: 'YanYuCloudCube Team',
    license: 'MIT',
  },
};
```

#### React 组件实现

```tsx
// src/components/branding/Logo.tsx
import React from 'react';
import { useBranding } from '@/hooks/useBranding';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const { branding } = useBranding();
  const { logo } = branding;

  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 40, height: 40 },
    lg: { width: 64, height: 64 },
  };

  const sizeProps = sizes[size];

  return (
    <img
      src={logo.light}
      alt={branding.seo.title}
      width={sizeProps.width}
      height={sizeProps.height}
      className={`logo logo-${size} ${logo.animated ? 'logo-animated' : ''}`}
      style={{
        animation: logo.animated ? 'logoFloat 3s ease-in-out infinite' : undefined,
      }}
    />
  );
};

// src/components/branding/Slogan.tsx
import React from 'react';
import { useBranding } from '@/hooks/useBranding';
import { useLanguage } from '@/hooks/useLanguage';

export const Slogan: React.FC = () => {
  const { branding } = useBranding();
  const { language } = useLanguage();
  const { slogan } = branding;

  const currentSlogan = language === 'zh' ? slogan.primary.zh : slogan.primary.en;
  const currentSecondary = language === 'zh' ? slogan.secondary.zh : slogan.secondary.en;

  return (
    <div className="slogan-container">
      <h1 className="slogan-primary">{currentSlogan}</h1>
      <p className="slogan-secondary">{currentSecondary}</p>
    </div>
  );
};

// src/components/branding/BrandingSettings.tsx
import React, { useState } from 'react';
import { useBranding, useUpdateBranding } from '@/hooks/useBranding';

export const BrandingSettings: React.FC = () => {
  const { branding } = useBranding();
  const updateBranding = useUpdateBranding();
  const [editing, setEditing] = useState(false);

  const handleSave = async (newBranding: BrandingConfig) => {
    await updateBranding(newBranding);
    setEditing(false);
  };

  return (
    <div className="branding-settings">
      <h2>品牌设置</h2>
      
      {/* Logo 上传 */}
      <div className="setting-group">
        <label>Logo</label>
        <input
          type="file"
          accept="image/svg+xml,image/png,image/webp"
          onChange={(e) => handleLogoUpload(e)}
        />
        <img src={branding.logo.light} alt="Logo preview" />
      </div>

      {/* 标语编辑 */}
      <div className="setting-group">
        <label>主标语（中文）</label>
        <input
          type="text"
          value={branding.slogan.primary.zh}
          onChange={(e) => handleSloganChange('primary', 'zh', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>主标语（英文）</label>
        <input
          type="text"
          value={branding.slogan.primary.en}
          onChange={(e) => handleSloganChange('primary', 'en', e.target.value)}
        />
      </div>

      {/* 页面标题 */}
      <div className="setting-group">
        <label>页面标题</label>
        <input
          type="text"
          value={branding.seo.title}
          onChange={(e) => handleSeoChange('title', e.target.value)}
        />
      </div>

      <button onClick={() => handleSave(branding)}>保存更改</button>
    </div>
  );
};
```

#### Zustand Store

```typescript
// src/stores/brandingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandingConfig, defaultBranding } from '@/config/branding';

interface BrandingStore {
  branding: BrandingConfig;
  updateBranding: (branding: BrandingConfig) => void;
  resetBranding: () => void;
}

export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set) => ({
      branding: defaultBranding,
      updateBranding: (branding) => set({ branding }),
      resetBranding: () => set({ branding: defaultBranding }),
    }),
    {
      name: 'yyc3-branding',
    }
  )
);

export const useBranding = () => useBrandingStore((state) => state.branding);
export const useUpdateBranding = () => useBrandingStore((state) => state.updateBranding);
```

### 使用说明

#### 1. 通过设置界面修改
1. 打开应用设置
2. 进入"品牌设置"页面
3. 上传自定义Logo
4. 编辑标语文本
5. 修改页面标题和描述
6. 点击"保存更改"

#### 2. 通过配置文件修改
1. 编辑 `src/config/branding.ts`
2. 修改相应的配置项
3. 重启应用或刷新页面

#### 3. 实时预览
- 所有修改支持实时预览
- 修改后立即在界面中显示效果
- 支持对比模式查看修改前后效果

---

# YYC³ Multi-Panel Layout Builder 自定义主题系统

## 概述

YYC³ CloudPivot Intelli-Matrix 自定义主题系统是一个高度灵活的主题定制框架，支持用户深度定制应用的视觉外观，包括颜色、字体、布局、品牌元素等。系统采用语义化变量设计，确保主题切换的一致性和可维护性。

---

## 核心特性

### 1. 高度可定制

- **颜色系统**: OKLch 颜色空间，支持精确的色彩控制
- **字体系统**: 支持自定义字体上传和宿主机字体引入
- **布局系统**: 可自定义间距、圆角、阴影等布局参数
- **品牌元素**: 支持 Logo、标语、页面标题、背景等品牌元素定制

### 2. 实时预览

- **即时反馈**: 所有修改实时预览，无需刷新页面
- **对比模式**: 支持新旧主题对比，方便调整
- **响应式预览**: 支持不同设备尺寸的预览

### 3. 主题管理

- **预设主题**: 提供多种预设主题，一键应用
- **主题导入/导出**: 支持主题配置的导入和导出
- **主题版本控制**: 支持主题版本管理和回滚

### 4. 智能辅助

- **自动对比度检测**: 确保文本与背景的对比度符合 WCAG 标准
- **色彩建议**: 基于色彩理论提供配色建议
- **无障碍检查**: 自动检查可访问性问题

---

## 颜色系统

### 颜色表示规范

系统采用两种颜色表示方式，兼顾设计灵活性与开发可读性：

#### OKLch 颜色空间

- **用途**: 定义语义化主题变量（如 Primary、Background）
- **优势**: 通过亮度（L）、色度（C）、色调（H）精准控制色彩，避免传统 RGB 的感知偏差
- **格式**: `oklch(L C H)`

#### 十六进制（HEX）

- **用途**: 具体组件前景色或交互色
- **优势**: 直接映射到 CSS 样式，提升开发效率
- **格式**: `#RRGGBB` 或 `#RRGGBBAA`

### 语义化颜色变量

系统将颜色划分为多层语义，统一变量，确保视觉一致性与可访问性：

#### 1. 基础颜色

| 变量名 | OKLch 值 | 前景色 OKLch | 说明 |
|--------|-----------|-------------|------|
| 主色 | `oklch(0.55 0.22 264)` | `oklch(0.98 0.01 264)` | 主要交互元素、按钮、链接 |
| 次色 | `oklch(0.65 0.15 200)` | `oklch(0.98 0.01 200)` | 次要交互元素、标签 |
| 强调色 | `oklch(0.60 0.25 30)` | `oklch(0.98 0.01 30)` | 强调元素、通知、提示 |
| 背景色 | `oklch(0.98 0.01 264)` | `oklch(0.15 0.02 264)` | 页面背景 |
| 卡片色 | `oklch(1.00 0.00 0)` | `oklch(0.15 0.02 264)` | 卡片、容器背景 |
| 弹窗色 | `oklch(1.00 0.00 0)` | `oklch(0.15 0.02 264)` | 模态框、下拉菜单 |
| 柔和色 | `oklch(0.95 0.02 264)` | `oklch(0.20 0.02 264)` | 辅助背景、分隔线 |
| 破坏性 | `oklch(0.55 0.22 25)` | `oklch(0.98 0.01 25)` | 删除、危险操作 |
| 边框色 | `oklch(0.85 0.02 264)` | `oklch(0.15 0.02 264)` | 边框、分割线 |
| 输入色 | `oklch(1.00 0.00 0)` | `oklch(0.15 0.02 264)` | 输入框背景 |

#### 2. 环形区域颜色

| 变量名 | OKLch 值 | 前景色 OKLch | 说明 |
|--------|-----------|-------------|------|
| 图表1 | `oklch(0.55 0.22 264)` | `oklch(0.98 0.01 264)` | 图表主色 |
| 图表2 | `oklch(0.60 0.25 30)` | `oklch(0.98 0.01 30)` | 图表次色 |
| 图表3 | `oklch(0.65 0.15 200)` | `oklch(0.98 0.01 200)` | 图表第三色 |
| 图表4 | `oklch(0.70 0.18 150)` | `oklch(0.98 0.01 150)` | 图表第四色 |
| 图表5 | `oklch(0.75 0.20 280)` | `oklch(0.98 0.01 280)` | 图表第五色 |
| 图表6 | `oklch(0.80 0.12 100)` | `oklch(0.98 0.01 100)` | 图表第六色 |
| 侧边栏 | `oklch(0.95 0.02 264)` | `oklch(0.15 0.02 264)` | 侧边栏背景 |
| 侧边栏主色 | `oklch(0.55 0.22 264)` | `oklch(0.98 0.01 264)` | 侧边栏主元素 |
| 侧边栏强调色 | `oklch(0.60 0.25 30)` | `oklch(0.98 0.01 30)` | 侧边栏强调元素 |
| 侧边栏边框 | `oklch(0.85 0.02 264)` | `oklch(0.15 0.02 264)` | 侧边栏边框 |

### 透明度应用

组件阴影使用带透明度的颜色，避免阴影过于突兀，同时保持界面层次感与柔和度。

#### 阴影透明度规范

| 用途 | 颜色 | 透明度 | 示例 |
|------|------|--------|------|
| 轻微阴影 | Destructive | 5.1% | `rgba(211, 65, 43, 0.051)` |
| 中等阴影 | Destructive | 10% | `rgba(211, 65, 43, 0.10)` |
| 深阴影 | Destructive | 15% | `rgba(211, 65, 43, 0.15)` |

---

## 字体排版系统

### 字体家族

通过字体家族的分层设计，建立清晰的视觉层次，提升内容可读性与信息区分度。

#### 1. 无衬线字体（Sans-serif）

**用途**: 正文、标题、按钮等主要文本

**层级**:

- **Primary**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- **Secondary**: 'Segoe UI', Roboto, 'Helvetica Neue', Arial
- **Tertiary**: system-ui, -apple-system, sans-serif

**字号规范**:

- **xs**: 12px - 辅助文字、标签、提示
- **sm**: 14px - 次要文字、按钮文字
- **base**: 16px - 正文、输入框文字
- **lg**: 18px - 小标题、卡片标题
- **xl**: 20px - 中标题、页面副标题
- **2xl**: 24px - 大标题、主要标题
- **3xl**: 30px - 页面标题、主标题
- **4xl**: 36px - 特大标题
- **5xl**: 48px - 超大标题

**字重规范**:

- **Regular**: 400 - 正文、辅助文字
- **Medium**: 500 - 强调文字、按钮
- **Semibold**: 600 - 标题、重要信息
- **Bold**: 700 - 主标题、重点强调
- **Extrabold**: 800 - 特殊强调

#### 2. 衬线字体（Serif）

**用途**: 引用、特殊文本、装饰性文字

**层级**:

- **Primary**: Georgia, 'Times New Roman', Times, serif
- **Secondary**: 'Palatino Linotype', 'Book Antiqua', Palatino, serif

#### 3. 单色字体（Monospace）

**用途**: 代码、数据、终端

**层级**:

- **Primary**: 'Fira Code', 'Courier New', monospace
- **Secondary**: 'Consolas', 'Monaco', 'Lucida Console', monospace

### 字体上传功能

#### 支持的字体格式

- **TrueType Font (.ttf)**
- **OpenType Font (.otf)**
- **Web Open Font Format (.woff)**
- **Web Open Font Format 2 (.woff2)**

#### 字体上传流程

1. **选择字体文件**: 从本地选择字体文件
2. **验证字体**: 系统自动验证字体格式和完整性
3. **预览字体**: 实时预览字体效果
4. **设置字体层级**: 选择字体应用的层级（Primary/Secondary/Tertiary）
5. **保存字体**: 字体文件存储到本地 IndexedDB
6. **应用字体**: 自动应用到相关组件

#### 字体限制

- **单个字体大小**: 最大 5 MB
- **总字体数量**: 最多 20 个自定义字体
- **字体命名**: 遵循 kebab-case 命名规范

---

## 布局系统

### 圆角（Radius）

统一所有组件的边角曲率，符合现代 UI 的柔和设计风格，提升视觉一致性。

| 变量名 | 值 | 说明 |
|--------|-----|------|
| radius-xs | 4px | 小元素（按钮、输入框） |
| radius-sm | 8px | 中小元素（标签、徽章） |
| radius-md | 12px | 中等元素（卡片、容器） |
| radius-lg | 16px | 大元素（模态框、大型容器） |
| radius-xl | 24px | 特大元素（特殊容器） |
| radius-full | 9999px | 圆形元素（头像、圆形按钮） |

### 阴影（Shadow）

通过微阴影提升组件立体感，同时避免过度装饰，保持界面简洁。

| 变量名 | X 偏移 | Y 偏移 | 模糊半径 | 传播距离 | 扩散颜色 | 说明 |
|--------|---------|---------|----------|----------|----------|------|
| shadow-xs | 0px | 1px | 2px | 0px | rgba(0,0,0,0.05) | 轻微阴影 |
| shadow-sm | 0px | 1px | 3px | 0px | rgba(0,0,0,0.10) | 小阴影 |
| shadow-md | 0px | 4px | 6px | -1px | rgba(0,0,0,0.10) | 中等阴影 |
| shadow-lg | 0px | 10px | 15px | -3px | rgba(0,0,0,0.10) | 大阴影 |
| shadow-xl | 0px | 20px | 25px | -5px | rgba(0,0,0,0.10) | 特大阴影 |

### 间距系统

| 变量名 | 值 | 说明 |
|--------|-----|------|
| space-0 | 0px | 无间距 |
| space-1 | 4px | 极小间距 |
| space-2 | 8px | 小间距 |
| space-3 | 12px | 中小间距 |
| space-4 | 16px | 标准间距 |
| space-5 | 20px | 中大间距 |
| space-6 | 24px | 大间距 |
| space-8 | 32px | 特大间距 |
| space-10 | 40px | 超大间距 |
| space-12 | 48px | 页面边距 |

---

## 品牌元素定制

### 1. Logo 定制

#### Logo 上传功能

**支持的格式**:

- **PNG**: 推荐，支持透明背景
- **SVG**: 矢量格式，可缩放
- **JPG**: 不推荐，不支持透明背景

**尺寸要求**:

- **最小尺寸**: 32x32 px
- **推荐尺寸**: 256x256 px
- **最大尺寸**: 1024x1024 px
- **文件大小**: 最大 2 MB

#### Logo 配置选项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| Logo 图片 | 上传的 Logo 文件 | 默认 Logo |
| Logo 尺寸 | 显示尺寸 | 40px 高度 |
| Logo 圆角 | Logo 圆角半径 | 8px |
| Logo 透明度 | Logo 透明度 | 100% |
| Logo 链接 | 点击 Logo 跳转链接 | 首页 |

#### Logo 应用位置

- 顶部导航栏左侧
- 登录页面
- 设置页面
- 关于页面

### 2. 标语定制

#### 标语配置

| 配置项 | 说明 | 限制 |
|--------|------|------|
| 主标语 | 主要标语文字 | 最多 50 字符 |
| 副标语 | 次要标语文字 | 最多 100 字符 |
| 标语位置 | 显示位置 | 顶部导航栏 / 登录页 |
| 标语样式 | 字体、颜色、大小 | 支持自定义 |

#### 标语示例

```
主标语: 言启象限 | 语枢未来
副标语: Words Initiate Quadrants, Language Serves as Core for Future
```

### 3. 页面标题定制

#### 页面标题配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| 应用名称 | 应用主标题 | YYC³ CloudPivot Intelli-Matrix |
| 页面标题格式 | 动态标题格式 | {pageName} - {appName} |
| 浏览器标题 | 浏览器标签页标题 | 自动生成 |
| SEO 标题 | SEO 优化标题 | 可自定义 |

#### 标题模板

```javascript
// 默认标题模板
const titleTemplate = {
  default: '{appName}',
  page: '{pageName} - {appName}',
  withSubtitle: '{pageName} - {subtitle} - {appName}'
};

// 使用示例
// Dashboard 页面标题: "Dashboard - YYC³ CloudPivot Intelli-Matrix"
// Files 页面标题: "Files - YYC³ CloudPivot Intelli-Matrix"
```

### 4. 背景上传功能

#### 背景类型

**1. 纯色背景**

- 支持所有颜色格式（OKLch、HEX、RGB）
- 实时预览
- 支持渐变背景

**2. 图片背景**

- 支持的格式: PNG, JPG, WebP
- 尺寸要求: 最小 1920x1080 px
- 文件大小: 最大 5 MB
- 支持透明度调整

**3. 视频背景**

- 支持的格式: MP4, WebM
- 时长限制: 最长 30 秒
- 文件大小: 最大 20 MB
- 支持循环播放

#### 背景配置选项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 背景类型 | 纯色 / 图片 / 视频 | 纯色 |
| 背景颜色 | 纯色背景颜色 | #F3F4F6 |
| 背景图片 | 上传的背景图片 | 无 |
| 背景视频 | 上传的背景视频 | 无 |
| 背景位置 | 背景位置 | center center |
| 背景大小 | 背景大小 | cover |
| 背景重复 | 背景重复 | no-repeat |
| 背景固定 | 背景固定 | scroll |
| 背景透明度 | 背景透明度 | 100% |
| 背景模糊 | 背景模糊程度 | 0px |

#### 背景应用范围

- 登录页面
- 锁屏页面
- 启动页面
- 可选择应用到所有页面

---

## 预设主题

### 基础色调

#### 1. 基础色调（Light）

```json
{
  "name": "基础色调",
  "type": "light",
  "colors": {
    "primary": "oklch(0.55 0.22 264)",
    "secondary": "oklch(0.65 0.15 200)",
    "accent": "oklch(0.60 0.25 30)",
    "background": "oklch(0.98 0.01 264)",
    "card": "oklch(1.00 0.00 0)",
    "border": "oklch(0.85 0.02 264)"
  }
}
```

#### 2. 宇宙之夜（Dark）

```json
{
  "name": "宇宙之夜",
  "type": "dark",
  "colors": {
    "primary": "oklch(0.65 0.22 264)",
    "secondary": "oklch(0.70 0.15 200)",
    "accent": "oklch(0.68 0.25 30)",
    "background": "oklch(0.15 0.02 264)",
    "card": "oklch(0.20 0.02 264)",
    "border": "oklch(0.30 0.02 264)"
  }
}
```

#### 3. 柔和流行

```json
{
  "name": "柔和流行",
  "type": "light",
  "colors": {
    "primary": "oklch(0.70 0.18 320)",
    "secondary": "oklch(0.75 0.15 180)",
    "accent": "oklch(0.72 0.20 40)",
    "background": "oklch(0.97 0.01 320)",
    "card": "oklch(1.00 0.00 0)",
    "border": "oklch(0.88 0.01 320)"
  }
}
```

#### 4. 赛博朋克

```json
{
  "name": "赛博朋克",
  "type": "dark",
  "colors": {
    "primary": "oklch(0.60 0.25 300)",
    "secondary": "oklch(0.65 0.20 180)",
    "accent": "oklch(0.70 0.30 60)",
    "background": "oklch(0.10 0.02 300)",
    "card": "oklch(0.15 0.02 300)",
    "border": "oklch(0.25 0.02 300)"
  }
}
```

#### 5. 现代极简

```json
{
  "name": "现代极简",
  "type": "light",
  "colors": {
    "primary": "oklch(0.30 0.00 0)",
    "secondary": "oklch(0.50 0.00 0)",
    "accent": "oklch(0.40 0.00 0)",
    "background": "oklch(0.98 0.00 0)",
    "card": "oklch(1.00 0.00 0)",
    "border": "oklch(0.90 0.00 0)"
  }
}
```

#### 6. 未来科技

```json
{
  "name": "未来科技",
  "type": "dark",
  "colors": {
    "primary": "oklch(0.55 0.25 200)",
    "secondary": "oklch(0.60 0.20 160)",
    "accent": "oklch(0.65 0.30 280)",
    "background": "oklch(0.12 0.02 200)",
    "card": "oklch(0.18 0.02 200)",
    "border": "oklch(0.28 0.02 200)"
  }
}
```

---

## 主题管理

### 主题导入/导出

#### 导出格式

**JSON 格式**:

```json
{
  "version": "2.0.0",
  "name": "自定义主题",
  "type": "light",
  "created": "2026-03-02T00:00:00Z",
  "colors": {
    "primary": "oklch(0.55 0.22 264)",
    "secondary": "oklch(0.65 0.15 200)",
    "accent": "oklch(0.60 0.25 30)",
    "background": "oklch(0.98 0.01 264)",
    "card": "oklch(1.00 0.00 0)",
    "border": "oklch(0.85 0.02 264)"
  },
  "fonts": {
    "sans": {
      "primary": "Inter",
      "secondary": "Segoe UI"
    },
    "serif": {
      "primary": "Georgia"
    },
    "mono": {
      "primary": "Fira Code"
    }
  },
  "layout": {
    "radius": {
      "sm": "8px",
      "md": "12px",
      "lg": "16px"
    },
    "shadow": {
      "sm": "0 1px 3px rgba(0,0,0,0.10)",
      "md": "0 4px 6px rgba(0,0,0,0.10)",
      "lg": "0 10px 15px rgba(0,0,0,0.10)"
    }
  },
  "branding": {
    "logo": {
      "image": "data:image/png;base64,...",
      "size": "40px",
      "radius": "8px"
    },
    "slogan": {
      "primary": "言启象限 | 语枢未来",
      "secondary": "Words Initiate Quadrants, Language Serves as Core for Future"
    },
    "background": {
      "type": "color",
      "value": "#F3F4F6"
    }
  }
}
```

#### 导出流程

1. **配置主题**: 在主题编辑器中配置所有参数
2. **验证主题**: 系统自动验证主题配置
3. **导出主题**: 选择导出格式（JSON）
4. **下载文件**: 下载主题配置文件
5. **分享主题**: 可分享给其他用户

#### 导入流程

1. **选择文件**: 选择主题配置文件（JSON）
2. **验证文件**: 系统自动验证文件格式和内容
3. **预览主题**: 实时预览导入的主题
4. **应用主题**: 确认后应用主题
5. **保存主题**: 保存到本地主题库

### 主题版本控制

#### 版本管理

- **自动版本**: 每次修改自动创建版本
- **手动版本**: 支持手动创建版本快照
- **版本回滚**: 支持回滚到任意历史版本
- **版本对比**: 支持对比不同版本的差异

#### 版本存储

- **本地存储**: IndexedDB 存储版本历史
- **云存储**: 可选的云端同步（需要配置）
- **版本限制**: 最多保留 50 个版本

---

## 实时预览

### 预览功能

#### 1. 即时预览

- **实时更新**: 所有修改立即反映在预览中
- **无延迟**: 使用 CSS 变量实现零延迟预览
- **平滑过渡**: 颜色和样式的平滑过渡动画

#### 2. 对比模式

- **分屏对比**: 左右分屏显示新旧主题
- **差异高亮**: 自动高亮差异部分
- **快速切换**: 一键切换新旧主题

#### 3. 响应式预览

- **设备模拟**: 模拟不同设备尺寸
- **断点测试**: 测试不同断点的显示效果
- **设备列表**: Mobile (375px), Tablet (768px), Desktop (1440px)

### 预览组件

#### 可预览的组件

- **按钮**: 所有变体和状态
- **输入框**: 所有变体和状态
- **卡片**: 所有变体
- **表格**: 完整表格样式
- **导航**: 顶部和侧边导航
- **模态框**: 所有变体
- **图表**: 所有图表类型
- **页面**: 完整页面预览

---

## 智能辅助

### 自动对比度检测

#### WCAG 标准

- **AA 级别**: 对比度 >= 4.5:1（正常文本）
- **AAA 级别**: 对比度 >= 7:1（正常文本）
- **大文本**: 对比度 >= 3:1（AA 级别）

#### 检测功能

- **实时检测**: 实时检测文本与背景的对比度
- **视觉反馈**: 不符合标准时显示警告
- **自动建议**: 提供改进建议
- **批量检测**: 批量检测所有文本元素

### 色彩建议

#### 配色理论

- **互补色**: 色相相差 180 度
- **类比色**: 色相相差 30 度
- **三角色**: 色相相差 120 度
- **四角色**: 色相相差 90 度

#### 建议功能

- **智能配色**: 基于主色自动生成配色方案
- **色彩和谐**: 确保配色方案的和谐性
- **可访问性**: 确保配色方案符合可访问性标准
- **多样性**: 提供多种配色方案选择

### 无障碍检查

#### 检查项目

- **色彩对比度**: 文本与背景的对比度
- **焦点环**: 键盘导航的焦点指示
- **屏幕阅读器**: ARIA 标签和语义
- **键盘导航**: 所有功能可通过键盘访问
- **色盲友好**: 确保色盲用户可区分颜色

#### 检查报告

- **问题列表**: 列出所有无障碍问题
- **严重程度**: 标记问题的严重程度
- **修复建议**: 提供具体的修复建议
- **自动修复**: 支持一键自动修复部分问题

---

## 技术实现

### CSS 变量

#### 变量命名规范

```css
:root {
  /* 颜色变量 */
  --color-primary: oklch(0.55 0.22 264);
  --color-primary-foreground: oklch(0.98 0.01 264);
  --color-secondary: oklch(0.65 0.15 200);
  --color-secondary-foreground: oklch(0.98 0.01 200);
  
  /* 字体变量 */
  --font-sans-primary: 'Inter', -apple-system, BlinkMacSystemFont;
  --font-sans-secondary: 'Segoe UI', Roboto;
  --font-mono-primary: 'Fira Code', 'Courier New', monospace;
  
  /* 间距变量 */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  
  /* 圆角变量 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* 阴影变量 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.10);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.10);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.10);
}
```

### JavaScript API

#### 主题切换 API

```javascript
// 切换主题
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
}

// 获取当前主题
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme');
}

// 应用自定义主题
function applyCustomTheme(themeConfig) {
  const root = document.documentElement;
  
  // 应用颜色
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // 应用字体
  Object.entries(themeConfig.fonts).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });
  
  // 应用布局
  Object.entries(themeConfig.layout).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}
```

#### 主题导出 API

```javascript
// 导出当前主题
function exportCurrentTheme() {
  const root = document.documentElement;
  const computedStyles = getComputedStyle(root);
  
  const theme = {
    colors: {},
    fonts: {},
    layout: {}
  };
  
  // 获取颜色变量
  document.querySelectorAll('[style*="--color-"]').forEach(el => {
    const style = el.style;
    Object.keys(style).forEach(key => {
      if (key.startsWith('--color-')) {
        theme.colors[key.replace('--color-', '')] = style[key];
      }
    });
  });
  
  return JSON.stringify(theme, null, 2);
}
```

---

## 核心意旨

### 1. 主题定制与切换

所有颜色、样式均通过变量定义，支持一键切换主题（如深色 / 浅色模式），开发时无需逐个修改组件样式。

智能开发工具可基于变量自动生成 CSS 变量、Tailwind 配置，大幅提升主题定制效率。

### 2. 组件复用与一致性

组件级样式（圆角、阴影）的统一配置，确保所有组件视觉一致，减少开发中的样式重复工作。

语义化变量避免硬编码颜色值，降低维护成本，同时支持组件库的跨项目复用。

### 3. 可访问性保障

语义化颜色变量确保文本与背景的对比度符合 WCAG 标准，提升界面可访问性。

焦点环（Ring）变量明确，支持键盘导航与屏幕阅读器的无障碍交互。

### 4. 品牌一致性

通过 Logo、标语、页面标题、背景等品牌元素的统一配置，确保应用在不同平台和设备上保持品牌一致性。

支持品牌元素的灵活定制，满足不同场景下的品牌展示需求。

---

## 最佳实践

### 1. 主题设计原则

- **一致性**: 确保所有颜色、字体、间距的一致性
- **可访问性**: 确保对比度符合 WCAG 标准
- **可维护性**: 使用语义化变量，避免硬编码
- **可扩展性**: 设计易于扩展的主题系统

### 2. 性能优化

- **CSS 变量**: 使用 CSS 变量实现主题切换，避免重绘
- **按需加载**: 按需加载字体和图片资源
- **缓存策略**: 合理使用缓存，减少重复加载
- **压缩优化**: 压缩主题配置文件，减少加载时间

### 3. 用户体验

- **实时预览**: 提供实时预览功能，方便调整
- **平滑过渡**: 使用 CSS transition 实现平滑过渡
- **撤销重做**: 支持撤销和重做操作
- **自动保存**: 自动保存主题配置，避免丢失

---

## 附录

### A. 主题配置示例

完整的主题配置示例，包含所有可配置项。

### B. API 参考

详细的 JavaScript API 文档。

### C. 浏览器兼容性

支持的浏览器和版本列表。

### D. 常见问题

主题定制过程中的常见问题和解决方案。

---

## 自定义功能闭环落实

### 1. 品牌元素全局统一更新机制

#### 1.1 统一配置中心

所有品牌元素（Logo、标语、页面标题、背景）通过统一的配置中心管理，确保用户修改后全局生效。

**配置文件结构**:

```typescript
// src/config/branding.ts
export interface BrandingConfig {
  logo: {
    light: string;
    dark: string;
    width: number;
    height: number;
    animated: boolean;
  };
  slogan: {
    primary: {
      zh: string;
      en: string;
    };
    secondary: {
      zh: string;
      en: string;
    };
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  contact: {
    email: string;
    website?: string;
    social?: {
      github?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  copyright: {
    year: number;
    owner: string;
    license?: string;
  };
  background?: {
    type: 'color' | 'image' | 'video';
    value: string;
    opacity?: number;
  };
}
```

#### 1.2 全局状态管理

使用 Zustand 实现品牌元素的全局状态管理，确保所有组件都能实时响应配置变化。

```typescript
// src/stores/brandingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandingConfig, defaultBranding } from '@/config/branding';

interface BrandingStore {
  branding: BrandingConfig;
  updateBranding: (branding: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
  exportBranding: () => string;
  importBranding: (config: string) => void;
}

export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set, get) => ({
      branding: defaultBranding,
      updateBranding: (newBranding) => 
        set((state) => ({
          branding: { ...state.branding, ...newBranding }
        })),
      resetBranding: () => 
        set({ branding: defaultBranding }),
      exportBranding: () => 
        JSON.stringify(get().branding, null, 2),
      importBranding: (config) => 
        set({ branding: JSON.parse(config) }),
    }),
    {
      name: 'yyc3-branding',
    }
  )
);
```

#### 1.3 统一品牌组件

创建统一的品牌组件，确保所有页面使用相同的品牌元素。

```tsx
// src/components/branding/BrandHeader.tsx
import React from 'react';
import { useBranding } from '@/hooks/useBranding';
import { Logo } from './Logo';
import { Slogan } from './Slogan';

export const BrandHeader: React.FC<{ showSlogan?: boolean }> = ({ 
  showSlogan = false 
}) => {
  const { branding } = useBranding();

  return (
    <header className="brand-header">
      <Logo size="md" />
      {showSlogan && <Slogan />}
    </header>
  );
};

// src/components/branding/BrandFooter.tsx
import React from 'react';
import { useBranding } from '@/hooks/useBranding';

export const BrandFooter: React.FC = () => {
  const { branding } = useBranding();

  return (
    <footer className="brand-footer">
      <p>© {branding.copyright.year} {branding.copyright.owner}</p>
      {branding.copyright.license && (
        <p>License: {branding.copyright.license}</p>
      )}
    </footer>
  );
};
```

#### 1.4 自动更新机制

当用户修改品牌元素时，系统自动更新所有相关位置：

1. **顶部导航栏**: Logo 和标语自动更新
2. **登录页面**: Logo、标语、背景自动更新
3. **设置页面**: Logo、联系信息自动更新
4. **关于页面**: 所有品牌元素自动更新
5. **浏览器标签**: 页面标题自动更新
6. **SEO 元数据**: 标题、描述自动更新

**实现示例**:

```tsx
// src/app/layout.tsx
import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { branding } = useBranding();

  useEffect(() => {
    // 更新页面标题
    document.title = branding.seo.title;
    
    // 更新 meta 描述
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', branding.seo.description);
    }
    
    // 更新 meta 关键词
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', branding.seo.keywords.join(','));
    }
  }, [branding]);

  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. 字体本地化上传与管理

#### 2.1 字体上传系统

实现完整的字体上传、存储、管理和应用系统。

**字体上传组件**:

```tsx
// src/components/branding/FontUploader.tsx
import React, { useState } from 'react';
import { useFontStore } from '@/stores/fontStore';

export const FontUploader: React.FC = () => {
  const { fonts, addFont, removeFont, setActiveFont } = useFontStore();
  const [uploading, setUploading] = useState(false);

  const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件格式
    const validFormats = ['ttf', 'otf', 'woff', 'woff2'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validFormats.includes(fileExtension || '')) {
      alert('不支持的字体格式');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('字体文件过大，最大支持 5MB');
      return;
    }

    setUploading(true);

    try {
      // 读取字体文件
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // 生成字体名称
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-');
      
      // 添加字体到存储
      await addFont({
        name: fontName,
        displayName: file.name,
        format: fileExtension as 'ttf' | 'otf' | 'woff' | 'woff2',
        data: base64,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });

      // 创建 CSS 字体规则
      const fontFace = `
        @font-face {
          font-family: '${fontName}';
          src: url('data:font/${fileExtension};base64,${base64}') format('${fileExtension}');
          font-weight: normal;
          font-style: normal;
        }
      `;
      
      // 添加到页面样式
      const style = document.createElement('style');
      style.textContent = fontFace;
      document.head.appendChild(style);

      alert('字体上传成功！');
    } catch (error) {
      console.error('字体上传失败:', error);
      alert('字体上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFont = async (fontName: string) => {
    if (confirm('确定要删除这个字体吗？')) {
      await removeFont(fontName);
    }
  };

  const handleSetActiveFont = async (fontName: string, type: 'primary' | 'secondary' | 'tertiary') => {
    await setActiveFont(type, fontName);
  };

  return (
    <div className="font-uploader">
      <h3>字体管理</h3>
      
      {/* 上传区域 */}
      <div className="upload-area">
        <input
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFontUpload}
          disabled={uploading}
          id="font-upload"
        />
        <label htmlFor="font-upload" className="upload-button">
          {uploading ? '上传中...' : '上传字体'}
        </label>
        <p className="upload-hint">支持格式: TTF, OTF, WOFF, WOFF2（最大 5MB）</p>
      </div>

      {/* 字体列表 */}
      <div className="font-list">
        {fonts.map((font) => (
          <div key={font.name} className="font-item">
            <div className="font-info">
              <h4>{font.displayName}</h4>
              <p>大小: {(font.size / 1024).toFixed(2)} KB</p>
              <p>格式: {font.format.toUpperCase()}</p>
            </div>
            
            <div className="font-preview" style={{ fontFamily: font.name }}>
              字体预览 Font Preview
            </div>
            
            <div className="font-actions">
              <button onClick={() => handleSetActiveFont(font.name, 'primary')}>
                设为主字体
              </button>
              <button onClick={() => handleSetActiveFont(font.name, 'secondary')}>
                设为次字体
              </button>
              <button 
                className="delete-button"
                onClick={() => handleRemoveFont(font.name)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 2.2 字体存储系统

使用 IndexedDB 存储字体文件，支持离线使用。

```typescript
// src/stores/fontStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomFont {
  name: string;
  displayName: string;
  format: 'ttf' | 'otf' | 'woff' | 'woff2';
  data: string; // base64 编码
  size: number;
  uploadedAt: string;
}

interface FontStore {
  fonts: CustomFont[];
  activeFonts: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  addFont: (font: CustomFont) => Promise<void>;
  removeFont: (fontName: string) => Promise<void>;
  setActiveFont: (type: 'primary' | 'secondary' | 'tertiary', fontName: string) => void;
  resetFonts: () => void;
}

export const useFontStore = create<FontStore>()(
  persist(
    (set, get) => ({
      fonts: [],
      activeFonts: {
        primary: 'Inter',
        secondary: 'Segoe UI',
        tertiary: 'system-ui',
      },
      
      addFont: async (font) => {
        const fonts = get().fonts;
        
        // 检查字体数量限制（最多 20 个）
        if (fonts.length >= 20) {
          throw new Error('字体数量已达上限（20 个）');
        }
        
        // 检查字体名称是否已存在
        if (fonts.some(f => f.name === font.name)) {
          throw new Error('字体名称已存在');
        }
        
        set({ fonts: [...fonts, font] });
      },
      
      removeFont: async (fontName) => {
        set((state) => ({
          fonts: state.fonts.filter(f => f.name !== fontName),
        }));
      },
      
      setActiveFont: (type, fontName) => {
        set((state) => ({
          activeFonts: {
            ...state.activeFonts,
            [type]: fontName,
          },
        }));
      },
      
      resetFonts: () => {
        set({
          fonts: [],
          activeFonts: {
            primary: 'Inter',
            secondary: 'Segoe UI',
            tertiary: 'system-ui',
          },
        });
      },
    }),
    {
      name: 'yyc3-fonts',
    }
  )
);
```

#### 2.3 字体应用系统

将上传的字体应用到全局 CSS 变量中。

```typescript
// src/utils/fontManager.ts
import { useFontStore } from '@/stores/fontStore';

export const applyFonts = () => {
  const { activeFonts, fonts } = useFontStore.getState();
  
  // 获取字体数据
  const getFontFamily = (fontName: string) => {
    const font = fonts.find(f => f.name === fontName);
    return font ? font.name : fontName;
  };
  
  // 设置 CSS 变量
  document.documentElement.style.setProperty(
    '--font-primary',
    getFontFamily(activeFonts.primary)
  );
  document.documentElement.style.setProperty(
    '--font-secondary',
    getFontFamily(activeFonts.secondary)
  );
  document.documentElement.style.setProperty(
    '--font-tertiary',
    getFontFamily(activeFonts.tertiary)
  );
  
  // 更新全局样式
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --font-primary: ${getFontFamily(activeFonts.primary)};
      --font-secondary: ${getFontFamily(activeFonts.secondary)};
      --font-tertiary: ${getFontFamily(activeFonts.tertiary)};
    }
    
    body {
      font-family: var(--font-primary), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-primary), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .font-secondary {
      font-family: var(--font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .font-tertiary {
      font-family: var(--font-tertiary), system-ui, -apple-system, sans-serif;
    }
  `;
  document.head.appendChild(style);
};

// 在应用启动时应用字体
export const initializeFonts = () => {
  applyFonts();
  
  // 监听字体变化
  useFontStore.subscribe(
    (state) => state.activeFonts,
    () => {
      applyFonts();
    }
  );
};
```

### 3. 主题切换与持久化

#### 3.1 主题切换系统

实现深色/浅色主题的自动切换和手动切换。

```typescript
// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeStore {
  mode: ThemeMode;
  customTheme: string | null;
  setMode: (mode: ThemeMode) => void;
  setCustomTheme: (theme: string) => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'auto',
      customTheme: null,
      setMode: (mode) => set({ mode }),
      setCustomTheme: (theme) => set({ customTheme: theme }),
      resetTheme: () => set({ mode: 'auto', customTheme: null }),
    }),
    {
      name: 'yyc3-theme',
    }
  )
);
```

#### 3.2 主题应用逻辑

```typescript
// src/utils/themeManager.ts
import { useThemeStore } from '@/stores/themeStore';

export const applyTheme = () => {
  const { mode, customTheme } = useThemeStore.getState();
  
  // 确定主题模式
  let themeMode = mode;
  if (mode === 'auto') {
    themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  
  // 应用主题
  document.documentElement.setAttribute('data-theme', themeMode);
  
  // 如果有自定义主题，应用自定义主题
  if (customTheme) {
    try {
      const themeConfig = JSON.parse(customTheme);
      Object.entries(themeConfig.colors || {}).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value as string);
      });
    } catch (error) {
      console.error('应用自定义主题失败:', error);
    }
  }
  
  // 监听系统主题变化
  if (mode === 'auto') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
};

// 在应用启动时应用主题
export const initializeTheme = () => {
  applyTheme();
  
  // 监听主题变化
  useThemeStore.subscribe(
    (state) => ({ mode: state.mode, customTheme: state.customTheme }),
    () => {
      applyTheme();
    }
  );
};
```

### 4. 实时预览与对比

#### 4.1 实时预览系统

实现所有自定义修改的实时预览功能。

```tsx
// src/components/branding/ThemePreview.tsx
import React from 'react';
import { useBrandingStore } from '@/stores/brandingStore';
import { useThemeStore } from '@/stores/themeStore';

export const ThemePreview: React.FC = () => {
  const { branding } = useBrandingStore();
  const { mode } = useThemeStore();

  return (
    <div className="theme-preview">
      <div className="preview-container" data-theme={mode}>
        {/* Logo 预览 */}
        <div className="preview-section">
          <h4>Logo 预览</h4>
          <img 
            src={branding.logo.light} 
            alt="Logo" 
            style={{ 
              width: branding.logo.width, 
              height: branding.logo.height 
            }} 
          />
        </div>

        {/* 标语预览 */}
        <div className="preview-section">
          <h4>标语预览</h4>
          <h2>{branding.slogan.primary.zh}</h2>
          <p>{branding.slogan.primary.en}</p>
        </div>

        {/* 颜色预览 */}
        <div className="preview-section">
          <h4>颜色预览</h4>
          <div className="color-grid">
            <div className="color-item">
              <div className="color-box" style={{ background: 'var(--primary)' }} />
              <span>主色</span>
            </div>
            <div className="color-item">
              <div className="color-box" style={{ background: 'var(--secondary)' }} />
              <span>次色</span>
            </div>
            <div className="color-item">
              <div className="color-box" style={{ background: 'var(--accent)' }} />
              <span>强调色</span>
            </div>
          </div>
        </div>

        {/* 组件预览 */}
        <div className="preview-section">
          <h4>组件预览</h4>
          <button className="preview-button">按钮</button>
          <input className="preview-input" placeholder="输入框" />
          <div className="preview-card">卡片</div>
        </div>
      </div>
    </div>
  );
};
```

#### 4.2 对比模式

支持新旧主题的对比查看。

```tsx
// src/components/branding/ThemeComparison.tsx
import React, { useState } from 'react';
import { useBrandingStore } from '@/stores/brandingStore';

export const ThemeComparison: React.FC = () => {
  const { branding } = useBrandingStore();
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="theme-comparison">
      <button onClick={() => setShowComparison(!showComparison)}>
        {showComparison ? '关闭对比' : '开启对比'}
      </button>

      {showComparison && (
        <div className="comparison-container">
          <div className="comparison-side">
            <h4>当前主题</h4>
            <div className="comparison-content">
              {/* 当前主题预览 */}
            </div>
          </div>
          
          <div className="comparison-side">
            <h4>新主题</h4>
            <div className="comparison-content">
              {/* 新主题预览 */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 5. 导入导出功能

#### 5.1 主题配置导出

```typescript
// src/utils/themeExporter.ts
import { useBrandingStore } from '@/stores/brandingStore';
import { useThemeStore } from '@/stores/themeStore';
import { useFontStore } from '@/stores/fontStore';

export interface ThemeExport {
  branding: any;
  theme: any;
  fonts: any[];
  exportedAt: string;
  version: string;
}

export const exportTheme = (): string => {
  const branding = useBrandingStore.getState().branding;
  const theme = useThemeStore.getState();
  const fonts = useFontStore.getState().fonts;

  const exportData: ThemeExport = {
    branding,
    theme,
    fonts,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  return JSON.stringify(exportData, null, 2);
};

export const downloadTheme = (filename: string = 'yyc3-theme.json') => {
  const themeData = exportTheme();
  const blob = new Blob([themeData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

#### 5.2 主题配置导入

```typescript
// src/utils/themeImporter.ts
import { useBrandingStore } from '@/stores/brandingStore';
import { useThemeStore } from '@/stores/themeStore';
import { useFontStore } from '@/stores/fontStore';
import { ThemeExport } from './themeExporter';

export const importTheme = async (file: File): Promise<void> => {
  try {
    const text = await file.text();
    const themeData: ThemeExport = JSON.parse(text);

    // 验证主题数据
    if (!themeData.branding || !themeData.theme) {
      throw new Error('无效的主题文件');
    }

    // 导入品牌配置
    useBrandingStore.getState().updateBranding(themeData.branding);

    // 导入主题配置
    useThemeStore.getState().setMode(themeData.theme.mode);
    if (themeData.theme.customTheme) {
      useThemeStore.getState().setCustomTheme(themeData.theme.customTheme);
    }

    // 导入字体
    for (const font of themeData.fonts) {
      try {
        await useFontStore.getState().addFont(font);
      } catch (error) {
        console.error(`导入字体 ${font.name} 失败:`, error);
      }
    }

    alert('主题导入成功！');
  } catch (error) {
    console.error('主题导入失败:', error);
    alert('主题导入失败');
  }
};
```

### 6. 自动保存与版本控制

#### 6.1 自动保存机制

```typescript
// src/utils/autoSave.ts
import { debounce } from 'lodash-es';
import { useBrandingStore } from '@/stores/brandingStore';
import { useThemeStore } from '@/stores/themeStore';

export const setupAutoSave = () => {
  const saveState = debounce(() => {
    const branding = useBrandingStore.getState().branding;
    const theme = useThemeStore.getState();

    // 保存到 localStorage
    localStorage.setItem('yyc3-auto-save', JSON.stringify({
      branding,
      theme,
      savedAt: new Date().toISOString(),
    }));

    console.log('自动保存完成');
  }, 1000); // 1秒防抖

  // 监听状态变化
  useBrandingStore.subscribe(saveState);
  useThemeStore.subscribe(saveState);
};

export const restoreAutoSave = () => {
  const saved = localStorage.getItem('yyc3-auto-save');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      useBrandingStore.getState().updateBranding(data.branding);
      useThemeStore.getState().setMode(data.theme.mode);
      return true;
    } catch (error) {
      console.error('恢复自动保存失败:', error);
      return false;
    }
  }
  return false;
};
```

#### 6.2 版本控制系统

```typescript
// src/stores/versionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeVersion {
  id: string;
  name: string;
  branding: any;
  theme: any;
  createdAt: string;
}

interface VersionStore {
  versions: ThemeVersion[];
  currentVersionId: string | null;
  saveVersion: (name: string) => void;
  loadVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  exportVersion: (id: string) => string;
}

export const useVersionStore = create<VersionStore>()(
  persist(
    (set, get) => ({
      versions: [],
      currentVersionId: null,

      saveVersion: (name) => {
        const branding = useBrandingStore.getState().branding;
        const theme = useThemeStore.getState();

        const version: ThemeVersion = {
          id: Date.now().toString(),
          name,
          branding,
          theme,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          versions: [...state.versions, version],
          currentVersionId: version.id,
        }));
      },

      loadVersion: (id) => {
        const version = get().versions.find(v => v.id === id);
        if (version) {
          useBrandingStore.getState().updateBranding(version.branding);
          useThemeStore.getState().setMode(version.theme.mode);
          set({ currentVersionId: id });
        }
      },

      deleteVersion: (id) => {
        set((state) => ({
          versions: state.versions.filter(v => v.id !== id),
        }));
      },

      exportVersion: (id) => {
        const version = get().versions.find(v => v.id === id);
        return version ? JSON.stringify(version, null, 2) : '';
      },
    }),
    {
      name: 'yyc3-versions',
    }
  )
);
```

### 7. 完整的自定义设置界面

```tsx
// src/components/branding/CustomizationPanel.tsx
import React from 'react';
import { BrandHeader } from './BrandHeader';
import { BrandingSettings } from './BrandingSettings';
import { FontUploader } from './FontUploader';
import { ThemePreview } from './ThemePreview';
import { ThemeComparison } from './ThemeComparison';

export const CustomizationPanel: React.FC = () => {
  return (
    <div className="customization-panel">
      <h2>自定义设置</h2>

      {/* 品牌设置 */}
      <section className="panel-section">
        <h3>品牌设置</h3>
        <BrandingSettings />
      </section>

      {/* 字体设置 */}
      <section className="panel-section">
        <h3>字体设置</h3>
        <FontUploader />
      </section>

      {/* 主题设置 */}
      <section className="panel-section">
        <h3>主题设置</h3>
        <ThemePreview />
        <ThemeComparison />
      </section>

      {/* 版本管理 */}
      <section className="panel-section">
        <h3>版本管理</h3>
        <VersionManager />
      </section>

      {/* 导入导出 */}
      <section className="panel-section">
        <h3>导入导出</h3>
        <ImportExport />
      </section>
    </div>
  );
};
```

---

## 总结

YYC³ 自定义主题系统通过以下机制实现完整的自定义功能闭环：

### 核心优势

1. **全局统一管理**: 所有品牌元素通过统一配置中心管理，确保修改后全局生效
2. **实时预览反馈**: 所有自定义修改支持实时预览，无需刷新页面
3. **持久化存储**: 使用 Zustand + localStorage 实现配置的持久化存储
4. **版本控制**: 支持主题版本的保存、加载、删除和回滚
5. **导入导出**: 支持主题配置的导入导出，便于分享和备份
6. **字体本地化**: 支持字体文件的上传、存储和应用，实现完全的字体自定义
7. **自动保存**: 实现自动保存机制，避免配置丢失
8. **智能辅助**: 提供对比度检测、色彩建议、无障碍检查等智能辅助功能

### 技术实现

- **状态管理**: Zustand + persist 中间件
- **字体存储**: IndexedDB + Base64 编码
- **主题切换**: CSS 变量 + data-theme 属性
- **实时预览**: React 响应式更新
- **导入导出**: JSON 格式 + Blob API

### 用户体验

- **简洁直观**: 所有自定义功能集中在一个设置界面
- **即时反馈**: 修改后立即看到效果
- **安全可靠**: 自动保存 + 版本控制
- **易于分享**: 支持主题配置的导入导出

通过以上机制，YYC³ 自定义主题系统实现了完整的自定义功能闭环，用户可以轻松定制应用的视觉外观，确保品牌一致性，提升用户体验。

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
