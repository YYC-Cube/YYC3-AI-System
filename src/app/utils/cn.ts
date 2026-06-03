/**
 * @file cn.ts
 * @description Tailwind CSS class merging utility — shared across the app
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
