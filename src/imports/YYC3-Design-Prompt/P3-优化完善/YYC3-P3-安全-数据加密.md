---
file: YYC3-P3-安全-数据加密.md
description: 数据加密方案 (AES-GCM + PBKDF2 + Web Crypto API)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,security,encryption
---

# YYC³ P3-安全-数据加密

## 加密配置

| 参数      | 值       |
| --------- | -------- |
| 算法      | AES-GCM  |
| 密钥长度  | 256 bit  |
| IV 长度   | 12 bytes |
| Salt 长度 | 16 bytes |
| 密钥派生  | PBKDF2   |
| 哈希      | SHA-256  |
| 迭代次数  | 100,000  |

## 核心 API (src/storage/encryption.ts)

```typescript
// 密钥派生
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
// 加密
async function encrypt(data: string, password: string): Promise<{ encrypted; salt; iv }>;
// 解密
async function decrypt(
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<string>;
// 随机密码生成
function generateRandomPassword(length: number = 32): string;
```

## 加密场景

1. **API Key**: encrypt 后存储到 IndexedDB, 显示时 decrypt
2. **DB 连接密码**: 同上, 加密存储连接配置
3. **备份文件**: AES-GCM 加密整个 dump 文件
4. **笔记内容**: 可选加密, isEncrypted flag

## 密钥管理

- 主密钥: 用户密码 -> PBKDF2 -> AES key
- 存储: tauri-plugin-keychain (macOS/Windows), tauri-plugin-secret (Linux)
- 轮换: 支持重新加密 (旧密码解密 -> 新密码加密)

## 安全原则

- 密钥永不明文存储
- Salt/IV 随机生成, 不复用
- 日志不记录任何密文/密钥
- 内存中的密钥用后及时清除
