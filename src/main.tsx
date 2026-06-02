/**
 * @file main.tsx
 * @description React应用入口文件 - YYC³便携式智能AI系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2025-03-19
 * @updated 2025-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2025 YanYuCloudCube Team. All rights reserved.
 * @tags entry-point, react, app-bootstrap
 */

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './app/App'
import { ServiceWorkerRegister } from './app/components/ServiceWorkerRegister'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServiceWorkerRegister
      showUpdatePrompt={true}
      onRegistered={(registration) => {
        console.log('[Main] Service Worker registered:', registration)
      }}
      onUpdateAvailable={(registration) => {
        console.log('[Main] Update available:', registration)
      }}
      onUpdateReady={(registration) => {
        console.log('[Main] Update ready:', registration)
      }}
      onError={(error) => {
        console.error('[Main] Service Worker error:', error)
      }}
    />
    <App />
  </React.StrictMode>,
)
