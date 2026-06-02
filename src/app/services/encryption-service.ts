/**
 * @file encryption-service.ts
 * @description YYC³便携式智能AI系统 - 本地存储加密服务
 * Local Storage Encryption Service using Web Crypto API
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,security,encryption,web-crypto
 */

const ALGORITHM_NAME = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const ITERATIONS = 100000
const HASH_ALGORITHM = 'SHA-256'

export interface EncryptedData {
  ciphertext: string
  iv: string
  salt: string
}

export interface EncryptionConfig {
  keyLength?: number
  ivLength?: number
  saltLength?: number
  iterations?: number
}

class EncryptionService {
  private key: CryptoKey | null = null
  private config: Required<EncryptionConfig>

  constructor(config: EncryptionConfig = {}) {
    this.config = {
      keyLength: config.keyLength ?? KEY_LENGTH,
      ivLength: config.ivLength ?? IV_LENGTH,
      saltLength: config.saltLength ?? SALT_LENGTH,
      iterations: config.iterations ?? ITERATIONS,
    }
  }

  private async generateKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: this.config.iterations,
        hash: HASH_ALGORITHM,
      },
      baseKey,
      { name: ALGORITHM_NAME, length: this.config.keyLength },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length))
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  async initialize(password: string): Promise<void> {
    const salt = this.generateRandomBytes(this.config.saltLength)
    this.key = await this.generateKeyFromPassword(password, salt)
    
    const storedSalt = localStorage.getItem('__enc_salt__')
    if (!storedSalt) {
      localStorage.setItem('__enc_salt__', this.arrayBufferToBase64(salt))
    }
  }

  async initializeWithStoredKey(): Promise<boolean> {
    const storedSalt = localStorage.getItem('__enc_salt__')
    if (!storedSalt) {
      return false
    }

    const storedKey = localStorage.getItem('__enc_key__')
    if (!storedKey) {
      return false
    }

    try {
      const keyBuffer = this.base64ToArrayBuffer(storedKey)
      this.key = await crypto.subtle.importKey(
        'raw',
        keyBuffer.buffer as ArrayBuffer,
        { name: ALGORITHM_NAME },
        false,
        ['encrypt', 'decrypt']
      )
      return true
    } catch {
      return false
    }
  }

  async generateAndStoreKey(): Promise<void> {
    this.key = await crypto.subtle.generateKey(
      { name: ALGORITHM_NAME, length: this.config.keyLength },
      true,
      ['encrypt', 'decrypt']
    )

    const exportedKey = await crypto.subtle.exportKey('raw', this.key)
    localStorage.setItem('__enc_key__', this.arrayBufferToBase64(exportedKey))
  }

  isInitialized(): boolean {
    return this.key !== null
  }

  async encrypt(plaintext: string): Promise<EncryptedData> {
    if (!this.key) {
      throw new Error('Encryption service not initialized')
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const iv = this.generateRandomBytes(this.config.ivLength)
    const salt = this.generateRandomBytes(this.config.saltLength)

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM_NAME, iv: iv.buffer as ArrayBuffer },
      this.key,
      data
    )

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
    }
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption service not initialized')
    }

    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext)
    const iv = this.base64ToArrayBuffer(encryptedData.iv)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM_NAME, iv: iv.buffer as ArrayBuffer },
      this.key,
      ciphertext.buffer as ArrayBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  async encryptObject<T>(obj: T): Promise<EncryptedData> {
    const json = JSON.stringify(obj)
    return this.encrypt(json)
  }

  async decryptObject<T>(encryptedData: EncryptedData): Promise<T> {
    const json = await this.decrypt(encryptedData)
    return JSON.parse(json) as T
  }

  async encryptForStorage(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(value)
    localStorage.setItem(`__enc_${key}__`, JSON.stringify(encrypted))
  }

  async decryptFromStorage(key: string): Promise<string | null> {
    const stored = localStorage.getItem(`__enc_${key}__`)
    if (!stored) {
      return null
    }

    try {
      const encrypted: EncryptedData = JSON.parse(stored)
      return await this.decrypt(encrypted)
    } catch {
      return null
    }
  }

  async encryptObjectForStorage<T>(key: string, obj: T): Promise<void> {
    const encrypted = await this.encryptObject(obj)
    localStorage.setItem(`__enc_${key}__`, JSON.stringify(encrypted))
  }

  async decryptObjectFromStorage<T>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(`__enc_${key}__`)
    if (!stored) {
      return null
    }

    try {
      const encrypted: EncryptedData = JSON.parse(stored)
      return await this.decryptObject<T>(encrypted)
    } catch {
      return null
    }
  }

  removeFromStorage(key: string): void {
    localStorage.removeItem(`__enc_${key}__`)
  }

  clearAllEncryptedData(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('__enc_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest(HASH_ALGORITHM, data)
    return this.arrayBufferToBase64(hashBuffer)
  }

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const hash = await this.hashPassword(password)
    return hash === storedHash
  }

  async generateSecureRandom(length: number = 32): Promise<string> {
    const bytes = this.generateRandomBytes(length)
    return this.arrayBufferToBase64(bytes)
  }
}

export const encryptionService = new EncryptionService()

export async function initializeEncryption(password?: string): Promise<void> {
  if (password) {
    await encryptionService.initialize(password)
  } else {
    const hasKey = await encryptionService.initializeWithStoredKey()
    if (!hasKey) {
      await encryptionService.generateAndStoreKey()
    }
  }
}

export function isEncryptionReady(): boolean {
  return encryptionService.isInitialized()
}
