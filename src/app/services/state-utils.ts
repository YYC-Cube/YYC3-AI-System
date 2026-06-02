/**
 * @file state-utils.ts
 * @description YYC³ 状态管理工具函数 - 状态操作辅助工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags [utils],[state-management],[helpers],[selectors]
 *
 * @brief 状态管理工具函数，提供状态操作辅助工具
 *
 * @details
 * - 状态选择器
 * - 状态更新器
 * - 状态持久化
 * - 状态同步
 */

import type { StateCreator, StoreApi, UseBoundStore } from 'zustand'

export type Selector<T, U> = (state: T) => U

export type Updater<T> = (state: T) => T

export interface StateSnapshot<T> {
  state: T
  timestamp: number
  version: string
}

export function createSelector<T, U>(selector: Selector<T, U>): Selector<T, U> {
  return selector
}

export function createDeepSelector<T, U>(selector: Selector<T, U>): Selector<T, U> {
  let lastResult: U | undefined
  let lastState: T | undefined

  return (state: T): U => {
    if (lastState === state) {
      return lastResult as U
    }

    const result = selector(state)
    lastState = state
    lastResult = result
    return result
  }
}

export function shallowEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false
  }

  const keys1 = Object.keys(obj1) as (keyof T)[]
  const keys2 = Object.keys(obj2) as (keyof T)[]

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false
  }

  return true
}

export function createShallowSelector<T, U>(selector: Selector<T, U>): Selector<T, U> {
  let lastResult: U | undefined

  return (state: T): U => {
    const result = selector(state)

    if (lastResult !== undefined && shallowEqual(result, lastResult)) {
      return lastResult
    }

    lastResult = result
    return result
  }
}

export function createStateSnapshot<T>(state: T, version = '1.0.0'): StateSnapshot<T> {
  return {
    state: JSON.parse(JSON.stringify(state)),
    timestamp: Date.now(),
    version,
  }
}

export function restoreFromSnapshot<T>(snapshot: StateSnapshot<T>): T {
  return JSON.parse(JSON.stringify(snapshot.state))
}

export function createPersistMiddleware<T>(
  storageKey: string,
  options?: {
    partialize?: (state: T) => Partial<T>
    version?: number
    migrate?: (persistedState: unknown, version: number) => T
  }
) {
  return (config: StateCreator<T>): StateCreator<T> => (set, get, api) => {
    const state = config(set, get, api)

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        const version = options?.version ?? 0

        if (parsed.version !== version && options?.migrate) {
          const migrated = options.migrate(parsed.state, parsed.version ?? 0)
          set(migrated)
        } else {
          set(parsed.state)
        }
      }
    } catch (error) {
      console.warn('Failed to restore state from storage:', error)
    }

    const originalSet = api.setState
    api.setState = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      originalSet(partial)

      try {
        const currentState = get()
        const stateToStore = options?.partialize
          ? options.partialize(currentState)
          : currentState

        localStorage.setItem(
          storageKey,
          JSON.stringify({
            state: stateToStore,
            version: options?.version ?? 0,
            timestamp: Date.now(),
          })
        )
      } catch (error) {
        console.warn('Failed to persist state:', error)
      }
    }

    return state
  }
}

export function createLoggerMiddleware<T>(name: string) {
  return (config: StateCreator<T>): StateCreator<T> => (set, get, api) => {
    const loggedSet: typeof set = (partial, replace) => {
      const prevState = get()
      if (replace === true) {
        set(partial as T | ((state: T) => T), true)
      } else {
        set(partial)
      }
      const nextState = get()

      if (process.env.NODE_ENV === 'development') {
        console.group(`[${name}] State Update`)
        console.log('Prev:', prevState)
        console.log('Next:', nextState)
        console.groupEnd()
      }
    }

    return config(loggedSet, get, api)
  }
}

export function createUndoRedoMiddleware<T extends object>(
  undoRedoService: { push: (state: T, action: string) => void }
) {
  return (config: StateCreator<T>): StateCreator<T> => (set, get, api) => {
    const wrappedSet: typeof set = (partial, replace) => {
      if (replace === true) {
        set(partial as T | ((state: T) => T), true)
      } else {
        set(partial)
      }
      const nextState = get()
      undoRedoService.push(nextState, 'state-update')
    }

    return config(wrappedSet, get, api)
  }
}

export function debounceStateUpdate<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T
}

export function throttleStateUpdate<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): T {
  let inThrottle = false

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }) as T
}

export function createComputedProperty<T extends object, K extends keyof T>(
  state: T,
  key: K,
  compute: (state: T) => T[K]
): T {
  let cachedValue: T[K] | undefined
  let isDirty = true

  return new Proxy(state, {
    get(target, prop) {
      if (prop === key) {
        if (isDirty) {
          cachedValue = compute(target)
          isDirty = false
        }
        return cachedValue
      }
      return target[prop as keyof T]
    },
    set(target, prop, value) {
      target[prop as keyof T] = value
      isDirty = true
      return true
    },
  })
}

export function mergeStates<T extends object>(base: T, ...updates: Partial<T>[]): T {
  return Object.assign({}, base, ...updates)
}

export function pickState<T extends object, K extends keyof T>(
  state: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    result[key] = state[key]
  }
  return result
}

export function omitState<T extends object, K extends keyof T>(
  state: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...state }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

export function createStateValidator<T extends object>(
  schema: Record<keyof T, (value: unknown) => boolean>
) {
  return (state: T): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    for (const [key, validator] of Object.entries(schema) as [keyof T, (value: unknown) => boolean][]) {
      if (!validator(state[key])) {
        errors.push(`Invalid value for ${String(key)}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export function createBatchUpdater<T>(
  store: UseBoundStore<StoreApi<T>>
): (updates: Array<(state: T) => Partial<T>>) => void {
  return (updates) => {
    store.setState((state) => {
      let newState = state
      for (const update of updates) {
        newState = { ...newState, ...update(newState) }
      }
      return newState
    })
  }
}

export function withEventBus<T extends object>(
  store: T,
  eventBus: { emit: (eventType: string, payload: unknown) => void },
  eventPrefix = 'state'
): T {
  return new Proxy(store, {
    set(target, property, value) {
      const oldValue = target[property as keyof T]
      target[property as keyof T] = value

      eventBus.emit(`${eventPrefix}:${String(property)}:changed`, {
        property: String(property),
        oldValue,
        newValue: value,
      })

      return true
    },
  })
}

export default {
  createSelector,
  createDeepSelector,
  createShallowSelector,
  shallowEqual,
  createStateSnapshot,
  restoreFromSnapshot,
  createPersistMiddleware,
  createLoggerMiddleware,
  createUndoRedoMiddleware,
  debounceStateUpdate,
  throttleStateUpdate,
  createComputedProperty,
  mergeStates,
  pickState,
  omitState,
  createStateValidator,
  createBatchUpdater,
  withEventBus,
}
