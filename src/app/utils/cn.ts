/**
 * @file cn.ts
 * @description YYC³便携式智能AI系统 - Tailwind CSS 类名合并工具（唯一规范实现）
 * Canonical className merge utility — all other cn() re-export from here.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-20
 * @updated 2026-07-11
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,clsx,tailwind-merge,helper,canonical
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
