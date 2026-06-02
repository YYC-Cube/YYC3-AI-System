/**
 * @file data-processing.test.ts
 * @description YYC³便携式智能AI系统 - 数据处理工具函数测试
 * Data Processing Utilities Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @updated 2026-03-25
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,utils,data-processing
 */

import { describe, it, expect } from 'vitest'

// ═════════════════════════════════════════════════════
// File Path Processing Tests
// ═════════════════════════════════════════════════════

describe('File Path Processing', () => {
  it('should normalize file paths', () => {
    const normalizePath = (path: string): string => {
      return path.replace(/\\/g, '/').replace(/\/+/g, '/')
    }
    
    expect(normalizePath('C:\\Users\\test\\file.ts')).toBe('C:/Users/test/file.ts')
    expect(normalizePath('folder//file.ts')).toBe('folder/file.ts')
    expect(normalizePath('./folder/file.ts')).toBe('./folder/file.ts')
  })

  it('should extract file extension', () => {
    const getExtension = (filename: string): string => {
      const parts = filename.split('.')
      return parts.length > 1 ? parts.pop() || '' : ''
    }
    
    expect(getExtension('file.ts')).toBe('ts')
    expect(getExtension('file.test.ts')).toBe('ts')
    expect(getExtension('file')).toBe('')
    expect(getExtension('.gitignore')).toBe('gitignore')
  })

  it('should get file name without extension', () => {
    const getFileName = (path: string): string => {
      const parts = path.split('/')
      const filename = parts.pop() || path
      const extIndex = filename.lastIndexOf('.')
      return extIndex > 0 ? filename.substring(0, extIndex) : filename
    }
    
    expect(getFileName('/path/to/file.ts')).toBe('file')
    expect(getFileName('file.ts')).toBe('file')
    expect(getFileName('file')).toBe('file')
  })

  it('should get directory path', () => {
    const getDirPath = (path: string): string => {
      const normalizedPath = path.replace(/\/+$/, '') // Remove trailing slashes
      const parts = normalizedPath.split('/')
      parts.pop()
      return parts.join('/')
    }
    
    expect(getDirPath('/path/to/file.ts')).toBe('/path/to')
    expect(getDirPath('file.ts')).toBe('')
    expect(getDirPath('/path/to/')).toBe('/path')
  })
})

// ═════════════════════════════════════════════════════
// Data Conversion Tests
// ═════════════════════════════════════════════════════

describe('Data Conversion', () => {
  it('should convert bytes to human-readable format', () => {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }
    
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('should parse JSON safely', () => {
    const safeJsonParse = (json: string, defaultValue: unknown = null): unknown => {
      try {
        return JSON.parse(json)
      } catch {
        return defaultValue
      }
    }
    
    expect(safeJsonParse('{"key": "value"}')).toEqual({ key: 'value' })
    expect(safeJsonParse('invalid json', {})).toEqual({})
    expect(safeJsonParse('null')).toBe(null)
    expect(safeJsonParse('123')).toBe(123)
  })

  it('should convert object to query string', () => {
    const toQueryString = (obj: Record<string, any>): string => {
      return Object.entries(obj)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    }
    
    expect(toQueryString({ key: 'value', num: 123 })).toBe('key=value&num=123')
    expect(toQueryString({})).toBe('')
    expect(toQueryString({ a: '1', b: '2' })).toBe('a=1&b=2')
  })
})

// ═════════════════════════════════════════════════════
// Data Validation Tests
// ═════════════════════════════════════════════════════

describe('Data Validation', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }
    
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@invalid.com')).toBe(false)
  })

  it('should validate URL format', () => {
    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }
    
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://localhost:3000')).toBe(true)
    expect(isValidUrl('ftp://server.com')).toBe(true)
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })

  it('should validate file type by extension', () => {
    const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      return allowedTypes.includes(ext)
    }
    
    expect(isValidFileType('file.ts', ['ts', 'tsx', 'js'])).toBe(true)
    expect(isValidFileType('file.js', ['ts', 'tsx', 'js'])).toBe(true)
    expect(isValidFileType('file.txt', ['ts', 'tsx', 'js'])).toBe(false)
  })

  it('should validate object structure', () => {
    const validateObject = (obj: unknown, schema: Record<string, (val: unknown) => boolean>): boolean => {
      return Object.entries(schema).every(([key, validator]) => {
        if (!(key in obj)) return false
        return validator(obj[key])
      })
    }
    
    const schema = {
      name: (val: unknown) => typeof val === 'string',
      age: (val: unknown) => typeof val === 'number' && val > 0,
      email: (val: unknown) => typeof val === 'string',
    }
    
    expect(validateObject({ name: 'John', age: 30, email: 'john@example.com' }, schema)).toBe(true)
    expect(validateObject({ name: 'John', age: -1, email: 'john@example.com' }, schema)).toBe(false)
    expect(validateObject({ name: 'John', email: 'john@example.com' }, schema)).toBe(false)
  })
})

// ═════════════════════════════════════════════════════
// Array Processing Tests
// ═════════════════════════════════════════════════════

describe('Array Processing', () => {
  it('should remove duplicates from array', () => {
    const unique = <T,>(arr: T[]): T[] => {
      return Array.from(new Set(arr))
    }
    
    expect(unique([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4])
    expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
    expect(unique([])).toEqual([])
  })

  it('should chunk array into groups', () => {
    const chunk = <T,>(arr: T[], size: number): T[][] => {
      const result: T[][] = []
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size))
      }
      return result
    }
    
    expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]])
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]])
    expect(chunk([], 2)).toEqual([])
  })

  it('should flatten nested arrays', () => {
    const flatten = <T,>(arr: unknown[]): T[] => {
      return arr.reduce<T[]>((acc, val) => {
        return acc.concat(Array.isArray(val) ? flatten(val) : val)
      }, [])
    }
    
    expect(flatten([1, [2, [3, 4], 5]])).toEqual([1, 2, 3, 4, 5])
    expect(flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4])
    expect(flatten([])).toEqual([])
  })

  it('should sort array of objects by key', () => {
    const sortByKey = <T,>(arr: T[], key: keyof T): T[] => {
      return [...arr].sort((a, b) => {
        const valA = a[key]
        const valB = b[key]
        if (valA < valB) return -1
        if (valA > valB) return 1
        return 0
      })
    }
    
    const data = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ]
    
    expect(sortByKey(data, 'name')).toEqual([
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
      { name: 'John', age: 30 },
    ])
    
    expect(sortByKey(data, 'age')).toEqual([
      { name: 'Alice', age: 25 },
      { name: 'John', age: 30 },
      { name: 'Bob', age: 35 },
    ])
  })
})

// ═════════════════════════════════════════════════════
// String Processing Tests
// ═════════════════════════════════════════════════════

describe('String Processing', () => {
  it('should capitalize first letter', () => {
    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
    
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('Hello')).toBe('Hello')
    expect(capitalize('')).toBe('')
    expect(capitalize('h')).toBe('H')
  })

  it('should truncate string with ellipsis', () => {
    const truncate = (str: string, length: number): string => {
      if (str.length <= length) return str
      return str.slice(0, length) + '...'
    }
    
    expect(truncate('Hello World', 5)).toBe('Hello...')
    expect(truncate('Hi', 10)).toBe('Hi')
    expect(truncate('', 5)).toBe('')
  })

  it('should convert kebab-case to camelCase', () => {
    const kebabToCamel = (str: string): string => {
      return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    }
    
    expect(kebabToCamel('hello-world')).toBe('helloWorld')
    expect(kebabToCamel('my-component')).toBe('myComponent')
    expect(kebabToCamel('alreadycamel')).toBe('alreadycamel')
  })

  it('should convert camelCase to kebab-case', () => {
    const camelToKebab = (str: string): string => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    }
    
    expect(camelToKebab('helloWorld')).toBe('hello-world')
    expect(camelToKebab('myComponent')).toBe('my-component')
    expect(camelToKebab('already-kebab')).toBe('already-kebab')
  })

  it('should escape HTML special characters', () => {
    const escapeHtml = (str: string): string => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      }
      return str.replace(/[&<>"']/g, char => map[char])
    }
    
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
    expect(escapeHtml('Hello & World')).toBe('Hello &amp; World')
    expect(escapeHtml('')).toBe('')
  })
})

// ═════════════════════════════════════════════════════
// Number Processing Tests
// ═════════════════════════════════════════════════════

describe('Number Processing', () => {
  it('should clamp number between min and max', () => {
    const clamp = (num: number, min: number, max: number): number => {
      return Math.min(Math.max(num, min), max)
    }
    
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('should round number to decimal places', () => {
    const round = (num: number, decimals: number): number => {
      const factor = Math.pow(10, decimals)
      return Math.round(num * factor) / factor
    }
    
    expect(round(3.14159, 2)).toBe(3.14)
    expect(round(3.14559, 2)).toBe(3.15)
    expect(round(3, 2)).toBe(3)
    expect(round(3.999, 0)).toBe(4)
  })

  it('should generate random number in range', () => {
    const randomInRange = (min: number, max: number): number => {
      return Math.random() * (max - min) + min
    }
    
    for (let i = 0; i < 100; i++) {
      const num = randomInRange(10, 20)
      expect(num).toBeGreaterThanOrEqual(10)
      expect(num).toBeLessThan(20)
    }
  })

  it('should format number with thousands separator', () => {
    const formatNumber = (num: number): string => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
    expect(formatNumber(1234567.89)).toBe('1,234,567.89')
    expect(formatNumber(0)).toBe('0')
  })
})
