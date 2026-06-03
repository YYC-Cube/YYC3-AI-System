/**
 * @file slices/index.ts
 * @description YYC³ Store Slices Barrel Export
 * 按领域拆分 store.ts 的切片，便于独立维护和测试
 */

export { createChatSlice } from './chatSlice';
export type { ChatSliceState } from './chatSlice';

export { createThemeSlice } from './themeSlice';
export type { ThemeSliceState } from './themeSlice';

export { createPanelSlice } from './panelSlice';
export type { PanelSliceState } from './panelSlice';
