---
file: YYC3-变量-项目信息.md
description: YYC³ AI 提示词系统 - 项目信息变量词库
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: variables,project-information,yyc3-standards
---

# YYC³ 变量词库 - 项目信息

## 1. 项目基本信息

| 变量名                    | 默认值                                    | 说明                   |
| ------------------------- | ----------------------------------------- | ---------------------- |
| `{{PROJECT_NAME}}`        | YYC³ AI Code                              | 项目名称               |
| `{{PROJECT_SLUG}}`        | yyc3-ai-code                              | 项目标识（kebab-case） |
| `{{PROJECT_VERSION}}`     | 1.0.0                                     | 项目版本号             |
| `{{PROJECT_DESCRIPTION}}` | YYC³ AI Code - 多联式低码编程实时预览系统 | 项目描述               |

## 2. 团队信息

| 变量名                | 默认值                       | 说明     |
| --------------------- | ---------------------------- | -------- |
| `{{TEAM_NAME}}`       | YanYuCloudCube Team          | 团队名称 |
| `{{CONTACT_EMAIL}}`   | admin@0379.email             | 联系邮箱 |
| `{{CONTACT_WEBSITE}}` | https://github.com/YYC-Cube/ | 官方网站 |

## 3. 品牌标识

> **注意**: 品牌变量的权威定义在 `YYC3-变量-品牌标识.md`，此处仅为引用。

| 变量名                  | 默认值                                                                           | 说明                      |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| `{{BRAND_NAME}}`        | YYC³ Family AI                                                                   | 品牌名称 (→ 见品牌标识)   |
| `{{BRAND_SLOGAN_CN}}`   | 言传千行代码 &#124; 语枢万物智能                                                 | 中文标语 (→ 见品牌标识)   |
| `{{BRAND_SLOGAN_EN}}`   | Words Initiate Quadrants, Language Serves as Core for Future                     | 英文标语 (→ 见品牌标识)   |
| `{{BRAND_SUBTITLE_CN}}` | 万象归元于云枢 &#124; 深栈智启新纪元                                             | 中文副标题 (→ 见品牌标识) |
| `{{BRAND_SUBTITLE_EN}}` | All things converge in cloud pivot; Deep stacks ignite a new era of intelligence | 英文副标题 (→ 见品牌标识) |

## 4. 许可证信息

| 变量名                 | 默认值              | 说明       |
| ---------------------- | ------------------- | ---------- |
| `{{LICENSE}}`          | MIT                 | 许可证类型 |
| `{{COPYRIGHT_YEAR}}`   | 2026                | 版权年份   |
| `{{COPYRIGHT_HOLDER}}` | YanYuCloudCube Team | 版权持有人 |

## 5. 配置参数

| 变量名              | 默认值    | 说明                     |
| ------------------- | --------- | ------------------------ |
| `{{PORT}}`          | 3201      | 开发服务器端口           |
| `{{HOST}}`          | localhost | 开发服务器主机           |
| `{{API_TIMEOUT}}`   | 30000     | API 请求超时时间（毫秒） |
| `{{CACHE_TTL}}`     | 3600      | 缓存生存时间（秒）       |
| `{{MAX_FILE_SIZE}}` | 10485760  | 最大文件大小（字节）     |

## 6. 目录路径

| 变量名               | 默认值          | 说明         |
| -------------------- | --------------- | ------------ |
| `{{SRC_DIR}}`        | src             | 源代码目录   |
| `{{PUBLIC_DIR}}`     | public          | 公共资源目录 |
| `{{PACKAGES_DIR}}`   | packages        | 包目录       |
| `{{CORE_PACKAGE}}`   | packages/core   | 核心包路径   |
| `{{UI_PACKAGE}}`     | packages/ui     | UI 包路径    |
| `{{SHARED_PACKAGE}}` | packages/shared | 共享包路径   |
