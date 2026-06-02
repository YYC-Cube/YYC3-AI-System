---
file: YYC3-P3-安全-安全加固.md
description: 安全加固方案 (输入/输出/数据/认证/网络/应用)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,security,hardening
---

# YYC³ P3-安全-安全加固

## 1. 输入安全

- 输入验证: Zod schema 校验所有用户输入
- 输入过滤: DOMPurify 清洗 HTML, 长度限制
- SQL 注入防护: 参数化查询, ORM prepared statements
- XSS 防护: React 自动转义, CSP header, dangerouslySetInnerHTML 禁用

## 2. 输出安全

- CSRF 防护: SameSite cookie, CSRF token
- 内容安全策略: CSP default-src 'self'; script-src 'self'
- 点击劫持: X-Frame-Options DENY
- 输出编码: HTML entity encoding

## 3. 数据安全

- 加密存储: AES-GCM 256bit (所有敏感数据)
- 数据脱敏: API key 显示 **\*\***, 日志脱敏
- 数据备份: 加密备份, 完整性校验
- 访问控制: 最小权限原则, RBAC

## 4. 认证安全

- 密码: PBKDF2 100K iterations 哈希
- 会话: HttpOnly + Secure + SameSite cookie
- Token: JWT RS256, 短期 access + 长期 refresh
- 多因素: TOTP 可选

## 5. 网络安全

- HTTPS: 全站 HTTPS, HSTS header
- 证书: 证书固定 (Certificate Pinning)
- 防火墙: Tauri allowlist 最小权限
- 请求限速: 100 req/min 速率限制

## 6. 应用安全

- 依赖安全: npm audit, 自动 Dependabot
- 漏洞扫描: OWASP ZAP 自动化扫描
- 安全审计: 代码审查检查清单
- 日志监控: 异常登录/操作告警
- 应急响应: 安全事件处理流程

## Tauri 安全配置

```json
{
  "security": { "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" },
  "allowlist": { "all": false, "fs": { "scope": ["$DOCUMENT/*"] } }
}
```
