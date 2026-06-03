/**
 * @file syntax-highlighter.ts
 * @description Lazy-loaded SyntaxHighlighter — avoids static ESM deep path import
 */

import React from 'react';

export type SyntaxHighlighterProps = {
  language?: string;
  children?: string;
  style?: unknown;
  PreTag?: string;
  customStyle?: React.CSSProperties;
};

let _SyntaxHL: React.ComponentType<SyntaxHighlighterProps> | null = null;
let _loadPromise: Promise<void> | null = null;

export function getSyntaxHighlighter(): React.ComponentType<SyntaxHighlighterProps> | null {
  if (_SyntaxHL) return _SyntaxHL;
  if (!_loadPromise) {
    _loadPromise = import('react-syntax-highlighter')
      .then((mod) => {
        _SyntaxHL =
          ((mod as Record<string, unknown>).Prism as React.ComponentType<SyntaxHighlighterProps>) ||
          (mod.default as React.ComponentType<SyntaxHighlighterProps>);
      })
      .catch(() => {
        /* fallback to <pre><code> */
      });
  }
  return null;
}
