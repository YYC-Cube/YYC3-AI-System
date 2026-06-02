/**
 * @file vite-env.d.ts
 * @description YYC³便携式智能AI系统 - Vite环境类型声明
 * Vite Environment Type Declarations
 * 声明Vite构建环境的类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-20
 * @updated 2026-03-20
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @types typescript,vite,declaration
 */

/// <reference types="vite/client" />

declare module '*.png' {
  const img: string;
  export default img;
}

declare module '*.svg' {
  const img: string;
  export default img;
}

declare module '*.jpg' {
  const img: string;
  export default img;
}

declare module '*.jpeg' {
  const img: string;
  export default img;
}

declare module '*.gif' {
  const img: string;
  export default img;
}

declare module '*.webp' {
  const img: string;
  export default img;
}
