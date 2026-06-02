/**
 * @file ErrorBoundary.tsx
 * @description YYC³便携式智能AI系统 - 全局错误边界组件
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree, logs errors,
 * and displays a fallback UI instead of crashing the whole app.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,error-boundary,error-handling,recovery
 */

import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { toast } from 'sonner'

import { ErrorCategory, ErrorSeverity } from '../services/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  copied: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    console.error('[ErrorBoundary] Caught error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      category: ErrorCategory.RUNTIME,
      severity: ErrorSeverity.HIGH,
      timestamp: Date.now(),
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  handleCopyError = async (): Promise<void> => {
    const { error, errorInfo, errorId } = this.state
    if (!error) return

    const errorDetails = `
Error ID: ${errorId}
Error Message: ${error.message}
Error Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorDetails)
      this.setState({ copied: true })
      toast.success('错误信息已复制到剪贴板')
      setTimeout(() => this.setState({ copied: false }), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId, copied } = this.state
    const { children, fallback, showDetails = true } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      const isDark = document.documentElement.classList.contains('dark')
      const theme = {
        bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
        card: isDark ? 'bg-slate-800/90' : 'bg-white',
        border: isDark ? 'border-slate-700' : 'border-slate-200',
        text: isDark ? 'text-slate-100' : 'text-slate-900',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
        button: isDark
          ? 'bg-indigo-600 hover:bg-indigo-700'
          : 'bg-indigo-500 hover:bg-indigo-600',
        buttonSecondary: isDark
          ? 'bg-slate-700 hover:bg-slate-600'
          : 'bg-slate-100 hover:bg-slate-200',
      }

      return (
        <div
          className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}
        >
          <div
            className={`${theme.card} backdrop-blur-xl border ${theme.border} rounded-2xl shadow-2xl max-w-2xl w-full p-8`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>
                应用遇到了错误
              </h1>

              <p className={`${theme.textMuted} mb-6 max-w-md`}>
                很抱歉，应用遇到了意外错误。您可以尝试刷新页面或返回首页。
              </p>

              {errorId && (
                <p className={`text-xs ${theme.textMuted} mb-4 font-mono`}>
                  错误ID: {errorId}
                </p>
              )}

              <div className="flex gap-3 mb-6">
                <button
                  onClick={this.handleReload}
                  className={`flex items-center gap-2 px-6 py-2.5 ${theme.button} text-white rounded-lg font-medium transition-colors`}
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新页面
                </button>
                <button
                  onClick={this.handleGoHome}
                  className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonSecondary} ${theme.text} rounded-lg font-medium transition-colors`}
                >
                  <Home className="w-4 h-4" />
                  返回首页
                </button>
              </div>

              {showDetails && error && (
                <div className="w-full mt-4">
                  <details className="text-left">
                    <summary
                      className={`cursor-pointer ${theme.textMuted} text-sm hover:underline flex items-center gap-2`}
                    >
                      <Bug className="w-4 h-4" />
                      查看错误详情
                    </summary>
                    <div className="mt-4 space-y-3">
                      <div
                        className={`${isDark ? 'bg-slate-900' : 'bg-slate-100'} p-4 rounded-lg overflow-auto max-h-60`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${theme.textMuted}`}>
                            错误信息
                          </span>
                          <button
                            onClick={this.handleCopyError}
                            className={`flex items-center gap-1 text-xs ${theme.textMuted} hover:${theme.text} transition-colors`}
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                复制
                              </>
                            )}
                          </button>
                        </div>
                        <pre
                          className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'} whitespace-pre-wrap break-words font-mono`}
                        >
                          {error.message}
                        </pre>
                      </div>

                      {error.stack && (
                        <div
                          className={`${isDark ? 'bg-slate-900' : 'bg-slate-100'} p-4 rounded-lg overflow-auto max-h-40`}
                        >
                          <span className={`text-xs font-medium ${theme.textMuted} block mb-2`}>
                            堆栈跟踪
                          </span>
                          <pre
                            className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} whitespace-pre-wrap break-words font-mono`}
                          >
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {errorInfo?.componentStack && (
                        <div
                          className={`${isDark ? 'bg-slate-900' : 'bg-slate-100'} p-4 rounded-lg overflow-auto max-h-40`}
                        >
                          <span className={`text-xs font-medium ${theme.textMuted} block mb-2`}>
                            组件堆栈
                          </span>
                          <pre
                            className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} whitespace-pre-wrap break-words font-mono`}
                          >
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}
