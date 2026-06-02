/**
 * @file type-helpers.test.ts
 * @description YYC³便携式智能AI系统 - 类型辅助工具测试
 * Type Helpers Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,utils,types,helpers
 */

import { describe, test, expect } from 'vitest'

import {
  isError,
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isNullOrUndefined,
  isFunction as _isFunction,
  isJSONSerializable,
  assertType as _assertType,
  getSafeProperty,
  getSafeNestedProperty,
  i18nToRecord,
  hasI18nKey,
  getI18nValue,
  getErrorMessage,
  getErrorCode,
  isRetryableError,
  createEmptyObject,
  createEmptyArray,
  pick,
  omit,
} from '../../app/utils/type-helpers'

describe('Type Helpers - isError', () => {
  test('should return true for Error instance', () => {
    expect(isError(new Error('test'))).toBe(true)
  })

  test('should return true for TypeError instance', () => {
    expect(isError(new TypeError('type error'))).toBe(true)
  })

  test('should return false for non-error values', () => {
    expect(isError('error')).toBe(false)
    expect(isError({ message: 'error' })).toBe(false)
    expect(isError(null)).toBe(false)
    expect(isError(undefined)).toBe(false)
  })
})

describe('Type Helpers - isObject', () => {
  test('should return true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ key: 'value' })).toBe(true)
  })

  test('should return false for non-objects', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('string')).toBe(false)
    expect(isObject(123)).toBe(false)
    expect(isObject(undefined)).toBe(false)
  })
})

describe('Type Helpers - isArray', () => {
  test('should return true for arrays', () => {
    expect(isArray([])).toBe(true)
    expect(isArray([1, 2, 3])).toBe(true)
  })

  test('should return false for non-arrays', () => {
    expect(isArray({})).toBe(false)
    expect(isArray('array')).toBe(false)
    expect(isArray(null)).toBe(false)
  })
})

describe('Type Helpers - isString', () => {
  test('should return true for strings', () => {
    expect(isString('')).toBe(true)
    expect(isString('hello')).toBe(true)
  })

  test('should return false for non-strings', () => {
    expect(isString(123)).toBe(false)
    expect(isString(null)).toBe(false)
    expect(isString({})).toBe(false)
  })
})

describe('Type Helpers - isNumber', () => {
  test('should return true for valid numbers', () => {
    expect(isNumber(0)).toBe(true)
    expect(isNumber(123)).toBe(true)
    expect(isNumber(-456)).toBe(true)
    expect(isNumber(1.23)).toBe(true)
  })

  test('should return false for NaN and non-numbers', () => {
    expect(isNumber(NaN)).toBe(false)
    expect(isNumber('123')).toBe(false)
    expect(isNumber(null)).toBe(false)
    expect(isNumber(undefined)).toBe(false)
  })
})

describe('Type Helpers - isBoolean', () => {
  test('should return true for booleans', () => {
    expect(isBoolean(true)).toBe(true)
    expect(isBoolean(false)).toBe(true)
  })

  test('should return false for non-booleans', () => {
    expect(isBoolean('true')).toBe(false)
    expect(isBoolean(1)).toBe(false)
    expect(isBoolean(null)).toBe(false)
  })
})

describe('Type Helpers - isNullOrUndefined', () => {
  test('should return true for null and undefined', () => {
    expect(isNullOrUndefined(null)).toBe(true)
    expect(isNullOrUndefined(undefined)).toBe(true)
  })

  test('should return false for other values', () => {
    expect(isNullOrUndefined('')).toBe(false)
    expect(isNullOrUndefined(0)).toBe(false)
    expect(isNullOrUndefined(false)).toBe(false)
  })
})

describe('Type Helpers - isJSONSerializable', () => {
  test('should return true for primitive values', () => {
    expect(isJSONSerializable(null)).toBe(true)
    expect(isJSONSerializable(undefined)).toBe(true)
    expect(isJSONSerializable('string')).toBe(true)
    expect(isJSONSerializable(123)).toBe(true)
    expect(isJSONSerializable(true)).toBe(true)
    expect(isJSONSerializable(false)).toBe(true)
  })

  test('should return true for arrays of serializable values', () => {
    expect(isJSONSerializable([1, 2, 3])).toBe(true)
    expect(isJSONSerializable(['a', 'b'])).toBe(true)
    expect(isJSONSerializable([1, 'a', true, null])).toBe(true)
  })

  test('should return true for objects with serializable values', () => {
    expect(isJSONSerializable({ key: 'value' })).toBe(true)
    expect(isJSONSerializable({ num: 123, bool: true })).toBe(true)
  })

  test('should return false for non-serializable values', () => {
    expect(isJSONSerializable(() => {})).toBe(false)
    expect(isJSONSerializable(Symbol('test'))).toBe(false)
    expect(isJSONSerializable([() => {}])).toBe(false)
    expect(isJSONSerializable({ fn: () => {} })).toBe(false)
  })
})

describe('Type Helpers - pick', () => {
  test('should pick specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = pick(obj, ['a', 'c'])
    expect(result).toEqual({ a: 1, c: 3 })
  })

  test('should return empty object for no keys', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, [])
    expect(result).toEqual({})
  })

  test('should handle non-existing keys', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, ['a', 'nonexistent' as unknown])
    expect(result).toEqual({ a: 1, nonexistent: undefined })
  })
})

describe('Type Helpers - getSafeProperty', () => {
  const obj = { name: 'test', age: 30, nested: { value: 42 } } as const

  test('should return property value for existing keys', () => {
    expect(getSafeProperty(obj, 'name')).toBe('test')
    expect(getSafeProperty(obj, 'age')).toBe(30)
  })

  test('should return undefined for non-existing keys', () => {
    expect(getSafeProperty(obj, 'nonexistent' as never)).toBe(undefined)
  })
})

describe('Type Helpers - getSafeNestedProperty', () => {
  const obj = {
    user: {
      profile: {
        name: 'John',
        age: 30,
      },
    },
    settings: {
      theme: 'dark',
    },
  }

  test('should return nested property value', () => {
    expect(getSafeNestedProperty<string>(obj, 'user.profile.name')).toBe('John')
    expect(getSafeNestedProperty<number>(obj, 'user.profile.age')).toBe(30)
    expect(getSafeNestedProperty<string>(obj, 'settings.theme')).toBe('dark')
  })

  test('should return undefined for non-existing paths', () => {
    expect(getSafeNestedProperty(obj, 'user.nonexistent.name')).toBe(undefined)
    expect(getSafeNestedProperty(obj, 'nonexistent.path')).toBe(undefined)
  })
})

describe('Type Helpers - i18nToRecord', () => {
  const i18n = {
    greeting: 'Hello',
    user: {
      name: 'Name',
      email: 'Email',
    },
    settings: {
      theme: 'Theme',
    },
  }

  test('should flatten nested i18n object', () => {
    const result = i18nToRecord(i18n)
    expect(result).toEqual({
      greeting: 'Hello',
      'user.name': 'Name',
      'user.email': 'Email',
      'settings.theme': 'Theme',
    })
  })

  test('should handle empty object', () => {
    const result = i18nToRecord({})
    expect(result).toEqual({})
  })
})

describe('Type Helpers - hasI18nKey', () => {
  const i18n = {
    greeting: 'Hello',
    user: {
      name: 'Name',
      email: 'Email',
    },
  }

  test('should return true for existing keys', () => {
    expect(hasI18nKey(i18n, 'greeting')).toBe(true)
    expect(hasI18nKey(i18n, 'user.name')).toBe(true)
    expect(hasI18nKey(i18n, 'user.email')).toBe(true)
  })

  test('should return false for non-existing keys', () => {
    expect(hasI18nKey(i18n, 'nonexistent')).toBe(false)
    expect(hasI18nKey(i18n, 'user.nonexistent')).toBe(false)
  })
})

describe('Type Helpers - getI18nValue', () => {
  const i18n = {
    greeting: 'Hello',
    user: {
      name: 'Name',
    },
  }

  test('should return value for existing keys', () => {
    expect(getI18nValue(i18n, 'greeting')).toBe('Hello')
    expect(getI18nValue(i18n, 'user.name')).toBe('Name')
  })

  test('should return default value for non-existing keys', () => {
    expect(getI18nValue(i18n, 'nonexistent', 'Default')).toBe('Default')
    expect(getI18nValue(i18n, 'nonexistent')).toBe('nonexistent')
  })
})

describe('Type Helpers - getErrorMessage', () => {
  test('should return message from Error instance', () => {
    const err = new Error('Test error')
    expect(getErrorMessage(err)).toBe('Test error')
  })

  test('should return message from error object', () => {
    const err = { message: 'Custom error' }
    expect(getErrorMessage(err)).toBe('Custom error')
  })

  test('should return string value', () => {
    const err = { message: 'String error' }
    expect(getErrorMessage(err)).toBe('String error')
  })

  test('should return "Unknown error" for unknown types', () => {
    expect(getErrorMessage(null as unknown)).toBe('Unknown error')
    expect(getErrorMessage(undefined as unknown)).toBe('Unknown error')
  })
})

describe('Type Helpers - getErrorCode', () => {
  test('should return code from error object', () => {
    const err = { message: 'Error', code: 500 }
    expect(getErrorCode(err)).toBe(500)
  })

  test('should return code from Error instance with code property', () => {
    const err = new Error('Test') as Error & { code?: number }
    err.code = 404
    expect(getErrorCode(err)).toBe(404)
  })

  test('should return undefined for error without code', () => {
    const err = new Error('Test')
    expect(getErrorCode(err)).toBe(undefined)
  })
})

describe('Type Helpers - isRetryableError', () => {
  test('should return true for network errors', () => {
    expect(isRetryableError(new Error('Network error'))).toBe(true)
    expect(isRetryableError(new Error('Connection timeout'))).toBe(true)
    expect(isRetryableError(new Error('Fetch failed'))).toBe(true)
  })

  test('should return true for 5xx errors', () => {
    const err = { code: 500, message: 'Internal Server Error' }
    expect(isRetryableError(err)).toBe(true)

    const err503 = { code: 503, message: 'Service Unavailable' }
    expect(isRetryableError(err503)).toBe(true)
  })

  test('should return false for client errors', () => {
    const err = { code: 404, message: 'Not Found' }
    expect(isRetryableError(err)).toBe(false)

    const err400 = { code: 400, message: 'Bad Request' }
    expect(isRetryableError(err400)).toBe(false)
  })

  test('should return false for other errors', () => {
    expect(isRetryableError(new Error('Validation error'))).toBe(false)
    expect(isRetryableError(new Error('Unauthorized'))).toBe(false)
  })
})

describe('Type Helpers - createEmptyObject', () => {
  test('should create empty object', () => {
    const obj = createEmptyObject<{ key: string }>()
    expect(obj).toEqual({})
    expect(typeof obj).toBe('object')
  })
})

describe('Type Helpers - createEmptyArray', () => {
  test('should create empty array', () => {
    const arr = createEmptyArray<string>()
    expect(arr).toEqual([])
    expect(Array.isArray(arr)).toBe(true)
  })
})

describe('Type Helpers - omit', () => {
  test('should omit specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = omit(obj, ['b', 'd'])
    expect(result).toEqual({ a: 1, c: 3 })
  })

  test('should return original object for no keys', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, [])
    expect(result).toEqual(obj)
  })

  test('should handle non-existing keys', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, ['b', 'nonexistent' as never])
    expect(result).toEqual({ a: 1 })
  })
})
