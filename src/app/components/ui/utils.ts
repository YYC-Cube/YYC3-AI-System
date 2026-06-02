/**
 * @file utils.ts
 * @description YYC³便携式智能AI系统 - UI工具函数
 * UI Utility Functions
 * 提供CSS类名合并工具函数，基于clsx和tailwind-merge
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-20
 * @updated 2026-03-20
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui-utils,clsx,tailwind-merge,helper
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
