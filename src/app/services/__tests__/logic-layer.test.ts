/**
 * @file logic-layer.test.ts
 * @description YYC³ 逻辑层单元测试 - 确保业务逻辑可靠性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [test],[logic-layer],[undo-redo],[event-bus],[error-handler]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('逻辑层服务测试', () => {
  describe('撤销/重做服务', () => {
    let undoRedoService: import('../undo-redo-service').UndoRedoService<{ value: number }>;

    beforeEach(async () => {
      const { createUndoRedoService } = await import('../undo-redo-service');
      undoRedoService = createUndoRedoService<{ value: number }>({
        maxHistorySize: 5,
        enablePersistence: false,
      });
    });

    afterEach(() => {
      undoRedoService.clear();
    });

    it('应该正确推送状态到历史记录', () => {
      undoRedoService.push({ value: 1 }, 'increment');
      undoRedoService.push({ value: 2 }, 'increment');

      expect(undoRedoService.canUndo()).toBe(true);
      expect(undoRedoService.getHistory().length).toBe(2);
    });

    it('应该正确执行撤销操作', () => {
      undoRedoService.push({ value: 1 }, 'set');
      undoRedoService.push({ value: 2 }, 'increment');

      const result = undoRedoService.undo();

      expect(result).toEqual({ value: 1 });
      expect(undoRedoService.canRedo()).toBe(true);
    });

    it('应该正确执行重做操作', () => {
      undoRedoService.push({ value: 1 }, 'set');
      undoRedoService.push({ value: 2 }, 'increment');
      undoRedoService.undo();

      const result = undoRedoService.redo();

      expect(result).toEqual({ value: 2 });
      expect(undoRedoService.canRedo()).toBe(false);
    });

    it('应该正确限制历史记录大小', () => {
      for (let i = 0; i < 10; i++) {
        undoRedoService.push({ value: i }, `step-${i}`);
      }

      expect(undoRedoService.getHistory().length).toBe(5);
    });

    it('应该正确清除历史记录', () => {
      undoRedoService.push({ value: 1 }, 'set');
      undoRedoService.push({ value: 2 }, 'increment');

      undoRedoService.clear();

      expect(undoRedoService.canUndo()).toBe(false);
      expect(undoRedoService.canRedo()).toBe(false);
    });

    it('应该正确跳转到指定历史记录', () => {
      undoRedoService.push({ value: 1 }, 'step1');
      undoRedoService.push({ value: 2 }, 'step2');
      undoRedoService.push({ value: 3 }, 'step3');

      const result = undoRedoService.jumpTo(0);

      expect(result).toEqual({ value: 1 });
    });

    it('应该正确搜索历史记录', () => {
      undoRedoService.push({ value: 1 }, 'create file');
      undoRedoService.push({ value: 2 }, 'update file');
      undoRedoService.push({ value: 3 }, 'delete file');

      const results = undoRedoService.searchHistory('file');

      expect(results.length).toBe(3);
    });

    it('应该正确订阅状态变化', () => {
      const listener = vi.fn();
      undoRedoService.subscribe(listener);

      undoRedoService.push({ value: 1 }, 'test');

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('事件总线系统', () => {
    let eventBus: import('../event-bus').EventBus;

    beforeEach(async () => {
      const { createEventBus } = await import('../event-bus');
      eventBus = createEventBus({
        enableHistory: true,
        debug: false,
      });
    });

    afterEach(() => {
      eventBus.clear();
      eventBus.clearHistory();
    });

    it('应该正确订阅和发布事件', () => {
      const handler = vi.fn();
      eventBus.on('test-event', handler);

      eventBus.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('应该正确取消订阅', () => {
      const handler = vi.fn();
      const subscriptionId = eventBus.on('test-event', handler);

      eventBus.off(subscriptionId);
      eventBus.emit('test-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该正确处理一次性订阅', () => {
      const handler = vi.fn();
      eventBus.once('test-event', handler);

      eventBus.emit('test-event', { data: 'test1' });
      eventBus.emit('test-event', { data: 'test2' });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('应该正确记录事件历史', () => {
      eventBus.emit('event1', { data: 'test1' });
      eventBus.emit('event2', { data: 'test2' });

      const history = eventBus.getHistory();

      expect(history.length).toBe(2);
      expect(history[0].eventType).toBe('event1');
    });

    it('应该正确获取统计信息', () => {
      eventBus.on('event1', () => {});
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});

      const stats = eventBus.getStats();

      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.eventTypes).toContain('event1');
      expect(stats.eventTypes).toContain('event2');
    });

    it('应该正确检查是否有订阅者', () => {
      expect(eventBus.hasSubscribers('test-event')).toBe(false);

      eventBus.on('test-event', () => {});

      expect(eventBus.hasSubscribers('test-event')).toBe(true);
    });

    it('应该正确处理优先级', () => {
      const results: number[] = [];

      eventBus.on('test', () => results.push(1), { priority: 1 });
      eventBus.on('test', () => results.push(2), { priority: 2 });
      eventBus.on('test', () => results.push(3), { priority: 0 });

      eventBus.emit('test', {});

      expect(results).toEqual([2, 1, 3]);
    });

    it('应该正确处理异步事件', async () => {
      const results: number[] = [];

      eventBus.on('test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(1);
      });

      await eventBus.emitAsync('test', {});

      expect(results).toEqual([1]);
    });
  });

  describe('错误处理框架', () => {
    let errorHandler: import('../error-handler').ErrorHandler;

    beforeEach(async () => {
      const { ErrorHandler } = await import('../error-handler');
      errorHandler = new ErrorHandler({
        enableLogging: true,
        enableRecovery: true,
        maxLogSize: 10,
      });
    });

    afterEach(() => {
      errorHandler.clearLog();
    });

    it('应该正确处理标准错误', () => {
      const error = new Error('Test error');
      const appError = errorHandler.handle(error);

      expect(appError.message).toBe('Test error');
      expect(appError.category).toBeDefined();
      expect(appError.severity).toBeDefined();
    });

    it('应该正确分类网络错误', () => {
      const error = new Error('network connection failed');
      const appError = errorHandler.handle(error);

      expect(appError.code).toBe('NETWORK_ERROR');
      expect(appError.category).toBe('network');
    });

    it('应该正确分类存储错误', () => {
      const error = new Error('storage quota exceeded');
      const appError = errorHandler.handle(error);

      expect(appError.code).toBe('STORAGE_QUOTA_EXCEEDED');
      expect(appError.category).toBe('storage');
    });

    it('应该正确创建自定义错误', () => {
      const appError = errorHandler.createError('CUSTOM_ERROR', 'Custom error message', {
        category: 'validation',
        severity: 'low',
        userMessage: '这是一个自定义错误',
      });

      expect(appError.code).toBe('CUSTOM_ERROR');
      expect(appError.message).toBe('Custom error message');
      expect(appError.userMessage).toBe('这是一个自定义错误');
    });

    it('应该正确记录错误日志', () => {
      errorHandler.handle(new Error('Error 1'));
      errorHandler.handle(new Error('Error 2'));

      const log = errorHandler.getErrorLog();

      expect(log.length).toBe(2);
    });

    it('应该正确标记错误为已解决', () => {
      const appError = errorHandler.handle(new Error('Test error'));

      errorHandler.markResolved(appError.id);

      const unresolved = errorHandler.getUnresolvedErrors();
      expect(unresolved.length).toBe(0);
    });

    it('应该正确包装异步函数', async () => {
      const result = await errorHandler.wrapAsync(async () => {
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('应该正确处理异步函数中的错误', async () => {
      const result = await errorHandler.wrapAsync(async () => {
        throw new Error('Async error');
      });

      expect('code' in (result as object)).toBe(true);
    });
  });

  describe('状态管理工具函数', () => {
    it('应该正确创建浅比较选择器', async () => {
      const { createShallowSelector } = await import('../state-utils');

      const state = { a: 1, b: 2 };
      const selector = createShallowSelector((s: typeof state) => s);

      const result1 = selector(state);
      const result2 = selector(state);

      expect(result1).toBe(result2);
    });

    it('应该正确创建状态快照', async () => {
      const { createStateSnapshot, restoreFromSnapshot } = await import('../state-utils');

      const state = { value: 1, nested: { a: 2 } };
      const snapshot = createStateSnapshot(state);

      expect(snapshot.state).toEqual(state);
      expect(snapshot.timestamp).toBeGreaterThan(0);

      const restored = restoreFromSnapshot(snapshot);
      expect(restored).toEqual(state);
    });

    it('应该正确合并状态', async () => {
      const { mergeStates } = await import('../state-utils');

      const base = { a: 1, b: 2 };
      const result = mergeStates(base, { a: 3 }, { c: 4 });

      expect(result).toEqual({ a: 3, b: 2, c: 4 });
    });

    it('应该正确选取状态属性', async () => {
      const { pickState } = await import('../state-utils');

      const state = { a: 1, b: 2, c: 3 };
      const result = pickState(state, ['a', 'c']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('应该正确省略状态属性', async () => {
      const { omitState } = await import('../state-utils');

      const state = { a: 1, b: 2, c: 3 };
      const result = omitState(state, ['b']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('应该正确进行浅比较', async () => {
      const { shallowEqual } = await import('../state-utils');

      expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('应该正确创建状态验证器', async () => {
      const { createStateValidator } = await import('../state-utils');

      const validator = createStateValidator({
        value: (v: unknown) => typeof v === 'number',
        name: (v: unknown) => typeof v === 'string',
      });

      const valid = validator({ value: 1, name: 'test' });
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);

      const invalid = validator({ value: 'not a number', name: 'test' });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBe(1);
    });

    it('应该正确防抖状态更新', async () => {
      const { debounceStateUpdate } = await import('../state-utils');

      vi.useFakeTimers();

      const fn = vi.fn();
      const debounced = debounceStateUpdate(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('应该正确节流状态更新', async () => {
      const { throttleStateUpdate } = await import('../state-utils');

      vi.useFakeTimers();

      const fn = vi.fn();
      const throttled = throttleStateUpdate(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttled();

      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});

describe('集成测试', () => {
  it('撤销/重做服务与事件总线集成', async () => {
    const { createUndoRedoService } = await import('../undo-redo-service');
    const { createEventBus } = await import('../event-bus');

    const eventBus = createEventBus();
    const undoRedoService = createUndoRedoService<{ value: number }>({
      enablePersistence: false,
    });

    const historyListener = vi.fn();
    eventBus.on('state:restored', historyListener);

    undoRedoService.push({ value: 1 }, 'init');
    undoRedoService.push({ value: 2 }, 'update');

    const restored = undoRedoService.undo();

    eventBus.emit('state:restored', { state: restored });

    expect(historyListener).toHaveBeenCalled();
    expect(restored).toEqual({ value: 1 });
  });

  it('错误处理与事件总线集成', async () => {
    const { ErrorHandler } = await import('../error-handler');
    const { createEventBus } = await import('../event-bus');

    const eventBus = createEventBus();
    const errorListener = vi.fn();
    eventBus.on('error:occurred', errorListener);

    const errorHandler = new ErrorHandler({
      onUnhandledError: (error) => {
        eventBus.emit('error:occurred', { error });
      },
    });

    errorHandler.handle(new Error('Test error'));

    expect(errorListener).toHaveBeenCalled();
  });
});
