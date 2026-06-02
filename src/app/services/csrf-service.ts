/**
 * @file csrf-service.ts
 * @description YYC³便携式智能AI系统 - CSRF Token防护服务
 * CSRF Token Protection Service
 * Generates and validates CSRF tokens for API requests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,security,csrf,protection
 */

const CSRF_TOKEN_KEY = 'yyc3_csrf_token'
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 3600000 // 1 hour in milliseconds

interface CSRFToken {
  token: string
  createdAt: number
  expiresAt: number
}

class CSRFService {
  private token: CSRFToken | null = null

  constructor() {
    this.loadToken()
  }

  private generateToken(): string {
    const array = new Uint8Array(CSRF_TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  private loadToken(): void {
    try {
      const stored = localStorage.getItem(CSRF_TOKEN_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CSRFToken
        if (parsed && parsed.expiresAt > Date.now()) {
          this.token = parsed
          return
        }
      }
    } catch (error) {
      console.warn('[CSRF] Failed to load token from storage:', error)
    }
    this.generateNewToken()
  }

  private saveToken(): void {
    if (this.token) {
      try {
        localStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(this.token))
      } catch (error) {
        console.warn('[CSRF] Failed to save token to storage:', error)
      }
    }
  }

  generateNewToken(): string {
    const now = Date.now()
    this.token = {
      token: this.generateToken(),
      createdAt: now,
      expiresAt: now + CSRF_TOKEN_EXPIRY,
    }
    this.saveToken()
    return this.token.token
  }

  getToken(): string {
    if (!this.token || this.token.expiresAt <= Date.now()) {
      return this.generateNewToken()
    }
    return this.token.token
  }

  validateToken(tokenToValidate: string): boolean {
    if (!this.token) {
      return false
    }

    if (this.token.expiresAt <= Date.now()) {
      this.generateNewToken()
      return false
    }

    return this.token.token === tokenToValidate
  }

  clearToken(): void {
    this.token = null
    try {
      localStorage.removeItem(CSRF_TOKEN_KEY)
    } catch (error) {
      console.warn('[CSRF] Failed to clear token from storage:', error)
    }
  }

  getTokenInfo(): CSRFToken | null {
    return this.token ? { ...this.token } : null
  }

  isTokenExpiringSoon(thresholdMs: number = 300000): boolean {
    if (!this.token) {
      return true
    }
    return this.token.expiresAt - Date.now() < thresholdMs
  }

  refreshTokenIfNeeded(): string {
    if (this.isTokenExpiringSoon()) {
      return this.generateNewToken()
    }
    return this.getToken()
  }
}

export const csrfService = new CSRFService()

export function withCSRFToken<T extends Record<string, unknown>>(
  data: T,
  tokenKey: string = '_csrf'
): T & { [key: string]: string } {
  return {
    ...data,
    [tokenKey]: csrfService.getToken(),
  }
}

export function createCSRFHeaders(
  headers: HeadersInit = {},
  tokenHeader: string = 'X-CSRF-Token'
): HeadersInit {
  return {
    ...headers,
    [tokenHeader]: csrfService.getToken(),
  }
}

export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {},
  tokenHeader: string = 'X-CSRF-Token'
): Promise<Response> {
  const headers = new Headers(options.headers || {})
  headers.set(tokenHeader, csrfService.getToken())

  return fetch(url, {
    ...options,
    headers,
  })
}
