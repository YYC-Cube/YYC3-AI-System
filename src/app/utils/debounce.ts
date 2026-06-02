/**
 * @file debounce.ts
 * @description YYC³便携式智能AI系统 - 防抖与节流工具
 * Debounce and Throttle Utilities
 * Provides performance optimization for frequent operations
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,performance,debounce,throttle
 */

export type DebounceFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

export type ThrottleFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

export interface DebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  interval?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface DebouncedState {
  pending: boolean;
  callCount: number;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions = {}
): DebounceFunction<T> & {
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
} {
  const { delay = 100, leading = false, trailing = true, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let result: ReturnType<T> | undefined;

  const invokeFunc = (time: number) => {
    const args = lastArgs;
    lastArgs = null;
    lastCallTime = time;
    result = func(...(args as Parameters<T>)) as ReturnType<T> | undefined;
    return result;
  };

  const startTimer = (pendingFunc: () => void, wait: number) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(pendingFunc, wait);
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - lastCallTime;
    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      (maxWait !== undefined && timeSinceLastCall >= maxWait)
    );
  };

  const trailingEdge = (time: number) => {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    return result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - lastCallTime;
    const timeWaiting = delay - timeSinceLastCall;
    return maxWait !== undefined ? Math.min(timeWaiting, maxWait - timeSinceLastCall) : timeWaiting;
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    startTimer(timerExpired, remainingWait(time));
    return undefined;
  };

  const leadingEdge = (time: number) => {
    lastCallTime = time;
    if (leading) {
      return invokeFunc(time);
    }
    startTimer(timerExpired, delay);
    return result;
  };

  const debounced = (...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(time);
      }
      if (maxWait !== undefined) {
        startTimer(timerExpired, delay);
        return invokeFunc(time);
      }
    }
    if (timeoutId === null) {
      startTimer(timerExpired, delay);
    }
    return result;
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = null;
    lastArgs = null;
    lastCallTime = 0;
  };

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      if (trailing && lastArgs) {
        return invokeFunc(Date.now());
      }
    }
    timeoutId = null;
    lastArgs = null;
    lastCallTime = 0;
    return result;
  };

  const pending = () => timeoutId !== null;

  (
    debounced as DebounceFunction<T> & {
      cancel: () => void;
      flush: () => void;
      pending: () => boolean;
    }
  ).cancel = cancel;
  (
    debounced as DebounceFunction<T> & {
      cancel: () => void;
      flush: () => void;
      pending: () => boolean;
    }
  ).flush = flush;
  (
    debounced as DebounceFunction<T> & {
      cancel: () => void;
      flush: () => void;
      pending: () => boolean;
    }
  ).pending = pending;

  return debounced as DebounceFunction<T> & {
    cancel: () => void;
    flush: () => void;
    pending: () => boolean;
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  options: ThrottleOptions = {}
): ThrottleFunction<T> & {
  cancel: () => void;
  flush: () => void;
} {
  const { interval = 100, leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const invokeFunc = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  const startTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && lastArgs) {
        invokeFunc();
      }
    }, interval);
  };

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    lastArgs = args;

    if (timeSinceLastCall >= interval) {
      lastCallTime = now;
      if (leading) {
        invokeFunc();
      }
      startTimer();
    } else if (!timeoutId && trailing) {
      startTimer();
    }
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = 0;
  };

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      invokeFunc();
      timeoutId = null;
    }
  };

  (
    throttled as ThrottleFunction<T> & {
      cancel: () => void;
      flush: () => void;
    }
  ).cancel = cancel;
  (
    throttled as ThrottleFunction<T> & {
      cancel: () => void;
      flush: () => void;
    }
  ).flush = flush;

  return throttled as ThrottleFunction<T> & {
    cancel: () => void;
    flush: () => void;
  };
}

export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): ThrottleFunction<T> & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      });
    }
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
  };

  (throttled as ThrottleFunction<T> & { cancel: () => void }).cancel = cancel;

  return throttled as ThrottleFunction<T> & { cancel: () => void };
}

export function createDebouncedState<T>(
  initialState: T,
  delay: number = 100
): {
  get: () => T;
  set: (value: T) => void;
  getImmediate: () => T;
  setImmediate: (value: T) => void;
  flush: () => void;
  cancel: () => void;
} {
  let immediateState = initialState;
  let debouncedState = initialState;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    debouncedState = immediateState;
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const set = (value: T) => {
    immediateState = value;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      debouncedState = immediateState;
      timeoutId = null;
    }, delay);
  };

  const setImmediate = (value: T) => {
    immediateState = value;
    debouncedState = value;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return {
    get: () => debouncedState,
    set,
    getImmediate: () => immediateState,
    setImmediate,
    flush,
    cancel,
  };
}

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number = 100
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: {
    resolve: (value: ReturnType<T>) => void;
    reject: (error: unknown) => void;
  } | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (pendingPromise) {
        pendingPromise.reject(new Error('Debounced: newer call superseded this one'));
      }

      pendingPromise = { resolve, reject };

      timeoutId = setTimeout(async () => {
        timeoutId = null;
        try {
          const result = await func(...args);
          if (pendingPromise) {
            pendingPromise.resolve(result as ReturnType<T>);
            pendingPromise = null;
          }
        } catch (error) {
          if (pendingPromise) {
            pendingPromise.reject(error);
            pendingPromise = null;
          }
        }
      }, delay);
    });
  };
}
