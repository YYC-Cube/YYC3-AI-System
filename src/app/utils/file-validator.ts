/**
 * @file file-validator.ts
 * @description YYC³便携式智能AI系统 - 文件名验证工具
 * File Name Validation Utility
 * Validates file names against security rules and platform restrictions
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,validation,security,file
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  sanitizedName?: string;
}

const WINDOWS_RESERVED_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

const WINDOWS_RESERVED_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

const UNIX_RESERVED_CHARS = /[\x00/]/g;

const DANGEROUS_PATTERNS = [
  /\.\./, // Directory traversal
  /^\.+$/, // Only dots
  /^-/, // Leading dash (command injection risk)
  /<script/i, // XSS attempt
  /javascript:/i, // JavaScript protocol
  /data:/i, // Data URI
  /vbscript:/i, // VBScript protocol
  /file:\/\//i, // File protocol
];

const MAX_FILENAME_LENGTH = 255;

const ALLOWED_EXTENSIONS = new Set([
  // Source code
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'php',
  'vue',
  'svelte',
  'astro',
  // Web
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  'json',
  'xml',
  'yaml',
  'yml',
  // Config
  'config',
  'conf',
  'ini',
  'env',
  'toml',
  'lock',
  // Documentation
  'md',
  'mdx',
  'txt',
  'rst',
  'adoc',
  // Data
  'csv',
  'sql',
  'graphql',
  'prisma',
  // Shell
  'sh',
  'bash',
  'zsh',
  'fish',
  'ps1',
  'bat',
  'cmd',
  // Markup
  'svg',
  'wasm',
  // Other
  'gitignore',
  'dockerignore',
  'editorconfig',
  'prettierrc',
  'eslintrc',
]);

const FORBIDDEN_EXTENSIONS = new Set([
  'exe',
  'dll',
  'so',
  'dylib',
  'app',
  'dmg',
  'pkg',
  'deb',
  'rpm',
  'zip',
  'tar',
  'gz',
  'rar',
  '7z',
  'bz2',
  'iso',
  'img',
  'bin',
]);

export function validateFileName(
  filename: string,
  options: {
    allowHidden?: boolean;
    allowNoExtension?: boolean;
    platform?: 'windows' | 'unix' | 'cross';
    strictMode?: boolean;
  } = {}
): FileValidationResult {
  const {
    allowHidden = false,
    allowNoExtension = true,
    platform = 'cross',
    strictMode = false,
  } = options;

  if (!filename || filename.trim() === '') {
    return { valid: false, error: '文件名不能为空' };
  }

  const trimmedName = filename.trim();

  if (trimmedName !== filename) {
    return {
      valid: false,
      error: '文件名前后不能包含空格',
      sanitizedName: trimmedName,
    };
  }

  if (filename.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `文件名长度不能超过 ${MAX_FILENAME_LENGTH} 个字符`,
      sanitizedName: filename.substring(0, MAX_FILENAME_LENGTH),
    };
  }

  if (!allowHidden && filename.startsWith('.')) {
    return {
      valid: false,
      error: '隐藏文件（以.开头）不被允许',
      warning: '如需创建隐藏文件，请在设置中启用相应选项',
    };
  }

  const baseName = filename.includes('.')
    ? filename.substring(0, filename.lastIndexOf('.'))
    : filename;

  if (baseName === '') {
    return { valid: false, error: '文件名不能只包含扩展名' };
  }

  const upperBaseName = baseName.toUpperCase();
  if (WINDOWS_RESERVED_NAMES.has(upperBaseName)) {
    return {
      valid: false,
      error: `"${baseName}" 是系统保留名称，不能用作文件名`,
    };
  }

  if (platform === 'windows' || platform === 'cross') {
    if (WINDOWS_RESERVED_CHARS.test(filename)) {
      const sanitized = filename.replace(WINDOWS_RESERVED_CHARS, '_');
      return {
        valid: false,
        error: '文件名包含不允许的字符 (<>:"/\\|?*)',
        sanitizedName: sanitized,
      };
    }
  }

  if (platform === 'unix' || platform === 'cross') {
    if (UNIX_RESERVED_CHARS.test(filename)) {
      const sanitized = filename.replace(UNIX_RESERVED_CHARS, '_');
      return {
        valid: false,
        error: '文件名包含不允许的字符 (/ 或 null)',
        sanitizedName: sanitized,
      };
    }
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(filename)) {
      return {
        valid: false,
        error: '文件名包含潜在危险的内容',
      };
    }
  }

  if (filename.includes('.')) {
    const extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();

    if (FORBIDDEN_EXTENSIONS.has(extension)) {
      return {
        valid: false,
        error: `扩展名 ".${extension}" 不被允许`,
        warning: '出于安全考虑，某些可执行文件类型被禁止',
      };
    }

    if (strictMode && !ALLOWED_EXTENSIONS.has(extension)) {
      return {
        valid: false,
        error: `扩展名 ".${extension}" 不在允许列表中`,
        warning: '严格模式下只允许特定类型的文件',
      };
    }
  } else if (!allowNoExtension) {
    return {
      valid: false,
      error: '文件必须包含扩展名',
    };
  }

  if (filename.startsWith('-')) {
    return {
      valid: false,
      error: '文件名不能以连字符(-)开头',
      sanitizedName: '_' + filename.substring(1),
    };
  }

  const controlChars = /[\x00-\x1f\x7f]/g;
  if (controlChars.test(filename)) {
    return {
      valid: false,
      error: '文件名包含控制字符',
    };
  }

  const endsWithDot = /\.$/;
  if (endsWithDot.test(filename)) {
    return {
      valid: false,
      error: '文件名不能以点(.)结尾',
      sanitizedName: filename.replace(/\.$/, ''),
    };
  }

  return { valid: true };
}

export function sanitizeFileName(
  filename: string,
  options: {
    replacement?: string;
    platform?: 'windows' | 'unix' | 'cross';
  } = {}
): string {
  const { replacement = '_', platform = 'cross' } = options;

  let sanitized = filename.trim();

  if (platform === 'windows' || platform === 'cross') {
    sanitized = sanitized.replace(WINDOWS_RESERVED_CHARS, replacement);
  }

  if (platform === 'unix' || platform === 'cross') {
    sanitized = sanitized.replace(UNIX_RESERVED_CHARS, replacement);
  }

  const upperBaseName = sanitized.split('.')[0]?.toUpperCase() || '';
  if (WINDOWS_RESERVED_NAMES.has(upperBaseName)) {
    sanitized = `_${sanitized}`;
  }

  if (sanitized.startsWith('-')) {
    sanitized = `_${sanitized.substring(1)}`;
  }

  sanitized = sanitized.replace(/\.$/, '');

  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const ext = sanitized.includes('.') ? sanitized.substring(sanitized.lastIndexOf('.')) : '';
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH - ext.length) + ext;
  }

  return sanitized;
}

export function isValidPath(path: string): boolean {
  if (!path || path.trim() === '') {
    return false;
  }

  if (path.includes('..')) {
    return false;
  }

  const parts = path.split(/[/\\]/);
  for (const part of parts) {
    if (part === '') continue;

    const result = validateFileName(part, { allowHidden: true });
    if (!result.valid) {
      return false;
    }
  }

  return true;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return '';
  }
  return filename.substring(lastDot + 1).toLowerCase();
}

export function isAllowedFileType(filename: string, strictMode = false): boolean {
  const ext = getFileExtension(filename);
  if (!ext) {
    return !strictMode;
  }
  return ALLOWED_EXTENSIONS.has(ext) || !strictMode;
}
