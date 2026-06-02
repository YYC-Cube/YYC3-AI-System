/**
 * @file i18n-types.ts
 * @description YYC³便携式智能AI系统 - 国际化类型定义
 * 国际化类型定义
 * 定义 I18n 翻译对象的类型结构，避免 any 使用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags types,i18n,translations
 */

import type { I18nTranslations } from '../utils/type-helpers'

/**
 * 完整的 I18n 翻译对象类型
 * 这里定义所有支持的翻译键类型
 * 注意：此类型应该与实际的翻译数据保持同步
 */
export type I18nStrings = I18nTranslations & {
  // Code Review Panel
  crTitle: string
  crSubtitle: string
  crAddComment: string
  crReply: string
  crResolve: string
  crReopen: string
  crDelete: string
  crPlaceholder: string
  crResolved: string
  crOpen: string
  crPending: string
  crApproved: string
  crChangesRequested: string
  crNoComments: string
  crThread: string
  crShowResolved: string
  crHideResolved: string
  crJumpToLine: string
  crJumpedToLine: string
  // 应用基础信息
  appName: string
  appVersion: string

  // 通用按钮和操作
  btnSave: string
  btnCancel: string
  btnOK: string
  btnYes: string
  btnNo: string
  btnDelete: string
  btnEdit: string
  btnCopy: string
  btnPaste: string
  btnRefresh: string
  btnSettings: string
  depEdit: string
  endLine: string
  history: string

  // 主题
  themeLight: string
  themeDark: string
  themeMidnight: string
  themeForest: string
  themeSunset: string

  // 语言
  langZh: string
  langEn: string
  langJa: string
  langKo: string

  // 面板和布局
  panelAIChat: string
  panelCodeEditor: string
  panelPreview: string
  panelTaskBoard: string
  panelDatabase: string
  panelAPI: string
  panelTerminal: string

  // 任务看板
  tbAiInfer: string
  tbNoChat: string
  tbNoInferred: string
  tbInferred: string
  tbInferError: string
  tbTasks: string
  tbTimeline: string
  tbDay: string
  tbWeek: string
  tbMonth: string
  tbDragResize: string
  tbDueDateUpdated: string
  tbStartDateUpdated: string
  tbCritical: string
  tbHigh: string
  tbMedium: string
  tbLow: string
  tbCriticalPath: string
  tbAiOptimize: string

  // 工作区相关
  wbUndo: string
  wbRedo: string
  wbCut: string
  wbCopy: string
  wbPaste: string
  wbSelectAll: string

  // 多实例管理器相关
  miTitle: string
  miWindows: string
  miWorkspaces: string
  miSessions: string
  miNoSessions: string
  miMessages: string
  miRefresh: string
  miClear: string
  miCleared: string
  miNoMessages: string

  // 设置相关
  stGeneral: string
  stEditor: string
  stTheme: string
  stLanguage: string
  stShortcuts: string
  stAI: string
  stDatabase: string
  stMinimap: string

  // Model Settings 相关
  msInUse: string
  msEdit: string
  msSave: string
  msDiagRunAll: string
  msDiagSuggestion: string
  msAutoDetect: string
  msScanning: string
  msConnected: string
  msDisconnected: string
  msOllamaEndpoint: string

  // AI 相关
  icGenerate: string
  icOptimize: string
  icRefactor: string
  icExplain: string
  icReview: string

  // 消息相关
  msTitle: string
  msBody: string
  msAttachments: string

  // 运行时相关
  rtRun: string
  rtStop: string
  rtRestart: string
  rtDebug: string
  rtExport: string

  // 状态相关
  statusTodo: string
  statusInProgress: string
  statusReview: string
  statusDone: string
  statusBlocked: string

  // 优先级相关
  priorityCritical: string
  priorityHigh: string
  priorityMedium: string
  priorityLow: string

  // 其他翻译键...
  // 根据实际需要继续添加
}

/**
 * 部分的 I18n 翻译对象类型
 * 用于测试和部分更新场景
 */
export type PartialI18nStrings = Partial<I18nStrings>

/**
 * I18n 翻译键类型
 * 用于确保翻译键的有效性
 */
export type I18nKey = keyof I18nStrings

/**
 * 嵌套的 I18n 翻译类型
 * 用于支持嵌套的翻译结构
 */
