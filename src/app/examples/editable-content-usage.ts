/**
 * @file editable-content-usage.ts
 * @description YYC³便携式智能AI系统 - 可编辑内容使用示例
 * Usage examples for EditableContentManager and CollabService
 * Open-source design: User-controlled data, no external dependencies
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags examples,usage,editable-content,collaboration
 */

import { collabService, type CollabConfig } from '../services/collab-service';

export function addCustomItem(): void {
  const items = JSON.parse(localStorage.getItem('editable-items') || '[]');

  items.push({
    id: `custom-${Date.now()}`,
    key: 'my-api-endpoint',
    label: '我的API端点',
    category: 'endpoints',
    type: 'endpoint',
    value: 'https://api.example.com/v1',
    description: '自定义API服务端点',
    isSecret: false,
    isRequired: false,
    validation: {
      pattern: '^https?://.*',
      message: '请输入有效的URL',
    },
    lastModified: Date.now(),
    version: 1,
    syncStatus: 'synced',
  });

  localStorage.setItem('editable-items', JSON.stringify(items));
}

export async function connectToCollabServer(): Promise<void> {
  const config: CollabConfig = {
    serverUrl: 'wss://your-websocket-server.com',
    roomName: 'my-project-room',
    userId: 'user-123',
    userName: '张三',
    userColor: '#FF6B6B',
    onConnectionChange: (status) => {
      console.log('连接状态:', status);
    },
    onUserJoin: (user) => {
      console.log('用户加入:', user.name);
    },
    onUserLeave: (userId) => {
      console.log('用户离开:', userId);
    },
    onUserUpdate: (user) => {
      console.log('用户更新:', user.name, user.presence);
    },
    onError: (error) => {
      console.error('连接错误:', error);
    },
  };

  const success = await collabService.connect(config);

  if (success) {
    console.log('协同编辑连接成功');
  }
}

export function useCollabFeatures(): void {
  const text = collabService.getText('shared-document');

  if (text) {
    text.insert(0, 'Hello, World!');

    text.observe((event) => {
      console.log('文档变化:', event.changes);
    });
  }

  collabService.updateCursor(10, 5);

  collabService.updateSelection({ line: 5, column: 0 }, { line: 5, column: 20 });

  collabService.updatePresence('typing');
}

export function exportImportExample(): void {
  const items = JSON.parse(localStorage.getItem('editable-items') || '[]');

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    items: items.map((item: any) => ({
      ...item,
      value: item.isSecret ? '***' : item.value,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'yyc3-config-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function validateItem(item: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.key || item.key.trim() === '') {
    errors.push('键名不能为空');
  }

  if (!item.label || item.label.trim() === '') {
    errors.push('标签不能为空');
  }

  if (item.isRequired && (!item.value || item.value.trim() === '')) {
    errors.push('必填项不能为空');
  }

  if (item.validation?.pattern) {
    const regex = new RegExp(item.validation.pattern);
    if (!regex.test(item.value)) {
      errors.push(item.validation.message || '格式不正确');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 开源精神说明
 * Open-source spirit explanation
 *
 * 本系统遵循以下开源原则：
 * This system follows these open-source principles:
 *
 * 1. 数据主权
 *    - 所有数据存储在用户本地
 *    - 不收集任何用户信息
 *    - 用户完全控制自己的数据
 *
 * 2. 透明性
 *    - 所有代码开源可见
 *    - 无隐藏的后门或数据收集
 *    - 用户可以审查所有功能
 *
 * 3. 用户控制
 *    - 用户自行配置API密钥
 *    - 用户选择协同服务器
 *    - 用户决定数据存储位置
 *
 * 4. 安全设计
 *    - 敏感信息本地加密存储
 *    - 不传输数据到第三方服务器
 *    - 用户负责自己的安全认证
 *
 * 5. 协同为本
 *    - 支持多人实时协同编辑
 *    - 基于CRDT技术实现冲突解决
 *    - 用户可选择自己的协同服务器
 */
