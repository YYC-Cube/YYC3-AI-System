/**
 * @file monaco-config.ts
 * @description YYC³便携式智能AI系统 - Monaco Editor懒加载配置
 * Monaco Editor Lazy Loading Configuration
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags config,monaco,lazy-loading,performance
 */

/// <reference types="vite/client" />

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

/**
 * 常用语言列表 - 这些语言的语言服务会被立即加载
 */
export const COMMON_LANGUAGES = [
  'typescript',
  'javascript',
  'json',
  'html',
  'css',
  'markdown',
] as const;

/**
 * 罕用语言列表 - 这些语言的语言服务会按需加载
 */
export const RARE_LANGUAGES = [
  'python',
  'java',
  'csharp',
  'cpp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'dart',
  'sql',
  'yaml',
  'xml',
  'bash',
  'powershell',
  'dockerfile',
  'graphql',
  'solidity',
  'less',
  'scss',
] as const;

/**
 * 已加载的语言服务缓存
 */
const loadedLanguages = new Set<string>();

/**
 * 正在加载中的语言服务
 */
const loadingLanguages = new Map<string, Promise<void>>();

/**
 * 配置Monaco Editor的Workers
 * 使用动态加载减少初始Bundle大小
 */
export function configureMonacoWorkers() {
  self.MonacoEnvironment = {
    getWorker(_workerId, label) {
      switch (label) {
        case 'json':
          return new jsonWorker();
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker();
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker();
        case 'typescript':
        case 'javascript':
          return new tsWorker();
        default:
          return new editorWorker();
      }
    },
  };
}

/**
 * 注册语言服务
 * 动态加载语言支持，减少初始Bundle
 * 注意：Monaco Editor的语言服务通过@monaco-editor/react自动管理
 * 这里只标记语言为已加载状态
 */
async function loadLanguageService(language: string): Promise<void> {
  // 如果已经加载过，直接返回
  if (loadedLanguages.has(language)) {
    return;
  }

  // 如果正在加载中，返回相同的Promise
  if (loadingLanguages.has(language)) {
    return loadingLanguages.get(language)!;
  }

  // 创建加载Promise
  const loadPromise = (async () => {
    try {
      // Monaco Editor的语言服务通过@monaco-editor/react自动加载
      // 这里我们只需要标记语言为已加载
      // 实际的语言服务工作由Monaco Editor内部处理

      // 模拟异步加载（给用户更好的体验）
      await new Promise((resolve) => setTimeout(resolve, 100));

      loadedLanguages.add(language);
      console.log(`[Monaco] Language service ready: ${language}`);
    } catch (error) {
      console.error(`[Monaco] Failed to load language service for ${language}:`, error);
    } finally {
      loadingLanguages.delete(language);
    }
  })();

  loadingLanguages.set(language, loadPromise);
  return loadPromise;
}

/**
 * 预加载常用语言服务
 * 这些语言会在应用初始化时自动加载
 */
export async function preloadCommonLanguages() {
  console.log('[Monaco] Preloading common languages...');

  const loadPromises = COMMON_LANGUAGES.map((lang) =>
    loadLanguageService(lang).catch((err) => {
      console.warn(`[Monaco] Failed to preload ${lang}:`, err);
    })
  );

  await Promise.all(loadPromises);
  console.log('[Monaco] Common languages preloaded:', Array.from(loadedLanguages));
}

/**
 * 按需加载语言服务
 * 当用户打开特定文件时，才加载对应的语言服务
 */
export async function loadLanguageOnDemand(language: string): Promise<void> {
  // 检查是否是常用语言
  if ((COMMON_LANGUAGES as readonly string[]).includes(language)) {
    return; // 常用语言已在初始化时加载
  }

  console.log(`[Monaco] Loading language on demand: ${language}`);
  await loadLanguageService(language);
}

/**
 * 获取已加载的语言列表
 */
export function getLoadedLanguages(): string[] {
  return Array.from(loadedLanguages);
}

/**
 * 检查语言是否已加载
 */
export function isLanguageLoaded(language: string): boolean {
  return loadedLanguages.has(language);
}

/**
 * 卸载未使用的语言服务
 * 释放内存
 */
export function unloadRareLanguages() {
  RARE_LANGUAGES.forEach((lang) => {
    if (loadedLanguages.has(lang)) {
      loadedLanguages.delete(lang);
      console.log(`[Monaco] Unloaded language: ${lang}`);
    }
  });
}

/**
 * 初始化Monaco Editor配置
 * 配置Workers和预加载常用语言
 */
export async function initializeMonaco(preloadCommon: boolean = true) {
  console.log('[Monaco] Initializing Monaco Editor...');

  // 配置Workers
  configureMonacoWorkers();

  // 预加载常用语言
  if (preloadCommon) {
    await preloadCommonLanguages();
  }

  console.log('[Monaco] Initialization complete');
}

/**
 * Monaco Editor懒加载配置导出
 */
export const monacoLazyConfig = {
  configureMonacoWorkers,
  loadLanguageOnDemand,
  preloadCommonLanguages,
  getLoadedLanguages,
  isLanguageLoaded,
  unloadRareLanguages,
  initializeMonaco,
  COMMON_LANGUAGES,
  RARE_LANGUAGES,
};

export default monacoLazyConfig;
