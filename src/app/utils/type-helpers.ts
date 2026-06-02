/**
 * @file type-helpers.ts
 * @description YYC³便携式智能AI系统 - 类型辅助工具
 * 类型辅助工具
 * 提供通用类型定义和类型守卫，消除 any 使用，提高类型安全性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,types,helpers
 */

// ═════════════════════════════════════════════════════
// 通用类型定义
// ═════════════════════════════════════════════════════

/** 索引类型 - 用于数组映射和循环 */
export type IndexType = number

/** 基础键值对类型 */
export type KeyValue<T = unknown> = Record<string, T>

/** 异步函数类型 */
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>

/** 回调函数类型 */
export type Callback<T = unknown> = (arg: T) => void

/** 带参数的异步回调 */
export type AsyncCallback<T = unknown> = (arg: T) => Promise<void>

/** 错误类型 - 标准错误或自定义错误对象 */
export type ErrorType = Error | { message: string; code?: string | number; stack?: string }

/** JSON 可序列化类型 */
export type JSONSerializable = string | number | boolean | null | JSONSerializable[] | { [key: string]: JSONSerializable }

/** 国际化翻译对象类型 - 支持嵌套对象 */
export type I18nTranslations = Record<string, string | Record<string, unknown>>

/** 部分的国际化翻译对象类型 */

/** 组件属性类型 - 用于 React 组件 props */
export type ComponentProps<T = unknown> = T & { className?: string; id?: string }

/** 事件处理器类型 */
export type EventHandler<T = Event> = (event: T) => void

/** 异步事件处理器 */
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// ═════════════════════════════════════════════════════
// 类型守卫 (Type Guards)
// ═════════════════════════════════════════════════════

/**
 * 检查值是否为标准 Error 对象
 * @param value - 要检查的值
 * @returns 是否为 Error 实例
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * 检查值是否为对象（非 null，非数组）
 * @param value - 要检查的值
 * @returns 是否为普通对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 检查值是否为数组
 * @param value - 要检查的值
 * @returns 是否为数组
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 检查值是否为字符串
 * @param value - 要检查的值
 * @returns 是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * 检查值是否为数字（不包括 NaN）
 * @param value - 要检查的值
 * @returns 是否为有效数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 检查值是否为布尔值
 * @param value - 要检查的值
 * @returns 是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * 检查值是否为函数
 * @param value - 要检查的值
 * @returns 是否为函数
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

/**
 * 检查值是否为 null 或 undefined
 * @param value - 要检查的值
 * @returns 是否为 null 或 undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * 检查值是否为 JSON 可序列化
 * @param value - 要检查的值
 * @returns 是否为 JSON 可序列化
 */
export function isJSONSerializable(value: unknown): value is JSONSerializable {
  if (isNullOrUndefined(value) || isString(value) || isNumber(value) || isBoolean(value)) {
    return true
  }
  if (isArray(value)) {
    return value.every(isJSONSerializable)
  }
  if (isObject(value)) {
    return Object.values(value).every(isJSONSerializable)
  }
  return false
}

// ═════════════════════════════════════════════════════
// 类型断言助手 (Type Assertion Helpers)
// ═════════════════════════════════════════════════════

/**
 * 安全的类型断言 - 使用 unknown 中间类型避免类型错误
 * @param value - 要断言的值
 * @returns 断言为指定类型的值
 */
export function assertType<T>(value: unknown): T {
  return value as T
}

/**
 * 安全地获取对象的属性
 * @param obj - 目标对象
 * @param key - 属性键
 * @returns 属性值或 undefined
 */
export function getSafeProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined {
  try {
    return obj[key]
  } catch {
    return undefined
  }
}

/**
 * 安全地获取嵌套对象的属性
 * @param obj - 目标对象
 * @param path - 属性路径（如 'user.profile.name'）
 * @returns 属性值或 undefined
 */
export function getSafeNestedProperty<T>(
  obj: Record<string, unknown>,
  path: string
): T | undefined {
  try {
    const keys = path.split('.')
    let result: unknown = obj

    for (const key of keys) {
      if (isObject(result)) {
        result = result[key]
      } else {
        return undefined
      }
    }

    return result as T
  } catch {
    return undefined
  }
}

// ═════════════════════════════════════════════════════
// I18n 类型辅助
// ═════════════════════════════════════════════════════

/**
 * 将 I18n 翻译对象转换为扁平的 Record<string, string>
 * 支持嵌套对象的展平（如 'user.name' -> user.name）
 * @param i18n - I18n 翻译对象
 * @returns 扁平的键值对对象
 */
export function i18nToRecord(i18n: I18nTranslations): Record<string, string> {
  const result: Record<string, string> = {}

  function traverse(obj: I18nTranslations, prefix: string = '') {
    for (const key in obj) {
      const value = obj[key]
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'string') {
        result[fullKey] = value
      } else if (isObject(value)) {
        // 递归处理嵌套对象
        traverse(value as I18nTranslations, fullKey)
      }
    }
  }

  traverse(i18n)
  return result
}

/**
 * 检查 I18n 翻译键是否存在
 * @param i18n - I18n 翻译对象
 * @param key - 翻译键（支持嵌套路径）
 * @returns 键是否存在
 */
export function hasI18nKey(i18n: I18nTranslations, key: string): boolean {
  const keys = key.split('.')
  let current: unknown = i18n

  for (const k of keys) {
    if (isObject(current)) {
      current = current[k]
      if (current === undefined) {
        return false
      }
    } else {
      return false
    }
  }

  return typeof current === 'string'
}

/**
 * 安全地获取 I18n 翻译值
 * @param i18n - I18n 翻译对象
 * @param key - 翻译键（支持嵌套路径）
 * @param defaultValue - 默认值（如果键不存在）
 * @returns 翻译值或默认值
 */
export function getI18nValue(
  i18n: I18nTranslations,
  key: string,
  defaultValue: string = key
): string {
  const value = getSafeNestedProperty<string>(i18n, key)
  return value ?? defaultValue
}

// ═════════════════════════════════════════════════════
// 错误处理辅助
// ═════════════════════════════════════════════════════

/**
 * 从错误对象中提取错误消息
 * @param err - 错误对象
 * @returns 错误消息
 */
export function getErrorMessage(err: ErrorType): string {
  if (isError(err)) {
    return err.message
  }

  if (isObject(err) && typeof err.message === 'string') {
    return err.message
  }

  if (isString(err)) {
    return err
  }

  return 'Unknown error'
}

/**
 * 从错误对象中提取错误代码
 * @param err - 错误对象
 * @returns 错误代码或 undefined
 */
export function getErrorCode(err: ErrorType): string | number | undefined {
  if (isObject(err)) {
    return err.code
  }
  return undefined
}

/**
 * 判断错误是否可重试
 * @param err - 错误对象
 * @returns 是否可重试
 */
export function isRetryableError(err: ErrorType): boolean {
  const message = getErrorMessage(err).toLowerCase()

  // 网络错误
  if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
    return true
  }

  // 服务端错误（5xx）
  const code = getErrorCode(err)
  if (typeof code === 'number' && code >= 500 && code < 600) {
    return true
  }

  return false
}

// ═════════════════════════════════════════════════════
// 泛型辅助函数
// ═════════════════════════════════════════════════════

/**
 * 创建类型安全的空对象
 * @returns 空对象
 */
export function createEmptyObject<T extends object>(): T {
  return {} as T
}

/**
 * 创建类型安全的空数组
 * @returns 空数组
 */
export function createEmptyArray<T = unknown>(): T[] {
  return []
}

/**
 * 从对象中提取指定键，返回新对象
 * @param obj - 源对象
 * @param keys - 要提取的键
 * @returns 新对象
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>

  for (const key of keys) {
    result[key] = obj[key]
  }

  return result
}

/**
 * 从对象中排除指定键，返回新对象
 * @param obj - 源对象
 * @param keys - 要排除的键
 * @returns 新对象
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }

  for (const key of keys) {
    delete result[key]
  }

  return result
}
