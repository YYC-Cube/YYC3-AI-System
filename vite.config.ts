/**
 * @file vite.config.ts
 * @description YYC³便携式智能AI系统 - Vite构建配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags config,vite,build,dev-server
 */

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // PWA配置
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'yyc3-icons/*.png',
        'yyc3-icons/*.svg',
        'yyc3-icons/*.jpg',
      ],
      manifest: {
        name: 'YYC³ 便携式智能AI系统',
        short_name: 'YYC³',
        description: '言启象限 | 语枢未来 - 便携式智能AI代码设计器',
        theme_color: '#667eea',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/yyc3-icons/Web App/android-chrome-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/yyc3-icons/Web App/android-chrome-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/yyc3-icons/Web App/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/yyc3-icons/Web App/favicon-32.png',
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: '/yyc3-icons/Web App/favicon-16.png',
            sizes: '16x16',
            type: 'image/png',
          },
        ],
        categories: ['developer tools', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: '新建项目',
            short_name: '新建',
            description: '创建一个新的YYC³项目',
            url: '/?action=new',
            icons: [{ src: '/yyc3-icons/Web App/favicon-32.png', sizes: '32x32' }],
          },
          {
            name: 'AI助手',
            short_name: 'AI',
            description: '打开AI代码助手',
            url: '/?panel=ai',
            icons: [{ src: '/yyc3-icons/Web App/favicon-32.png', sizes: '32x32' }],
          },
        ],
      },
      workbox: {
        // 增加预缓存文件大小限制到10MB（Monaco Editor worker和编辑器主文件）
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        // 预缓存清单配置
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,eot}',
        ],
        // 预缓存策略版本控制
        runtimeCaching: [
          // CDN资源 - CacheFirst, 长期缓存
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cdn',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unpkg-cdn',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdnjs-cdn',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Monaco Editor - CacheFirst, 非常重要
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-editor-cdn',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 本地静态资源 - CacheFirst, 首屏关键资源
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 图片资源 - CacheFirst, 长期缓存
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 字体资源 - CacheFirst, 永久缓存
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // API请求 - NetworkFirst, 短期缓存
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5分钟
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // AI API请求 - NetworkFirst, 较长缓存
          {
            urlPattern: /\/api\/ai\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ai-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 15, // 15分钟
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 配置文件 - StaleWhileRevalidate
          {
            urlPattern: /\/.*\.config\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'config-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60, // 1小时
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // 自定义Service Worker模板
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/ai/],
        // 清理旧缓存
        cleanupOutdatedCaches: true,
        // 客户端消息通信
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true, // 开发环境也启用PWA
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // GitHub Pages部署配置 - 使用自定义域名时base为'/'
  base: '/',

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    port: 3156,
    host: true,
  },

  // 代码分割配置
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['sql.js'],
      output: {
        // 手动代码分割策略
        manualChunks: {
          // React核心库
          'react-core': ['react', 'react-dom', 'react-router'],
          // UI组件库
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@mui/material',
            '@mui/icons-material',
            'lucide-react',
          ],
          // Monaco Editor - 懒加载，独立chunk
          // @monaco-editor/react包会自动处理语言服务的懒加载
          'monaco-editor': [
            '@monaco-editor/react',
          ],
          // 富文本编辑器
          'editor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-collaboration',
            '@tiptap/extension-collaboration-cursor',
          ],
          // 协作功能
          'collaboration': ['yjs'],
          // 数据可视化
          'charts': ['recharts', '@radix-ui/react-progress'],
          // 拖拽功能
          'dnd': ['react-dnd', 'react-dnd-html5-backend'],
          // 表单处理
          'forms': ['react-hook-form'],
          // 其他大型依赖
          'vendor': [
            'zustand',
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'cmdk',
            'react-resizable-panels',
          ],
        },
      },
    },
  },
})
