/**
 * @file preview-engine.ts
 * @description YYC³便携式智能AI系统 - 预览引擎核心
 * Preview Engine Core
 * Handles code compilation, sandbox execution, and iframe rendering.
 * Supports HTML/CSS/JS/React/Markdown/SVG/Canvas with debounce,
 * error boundary, console capture, and performance metrics.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,preview,engine,compilation
 */

/* ── Types ── */
export type PreviewLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'react'
  | 'vue'
  | 'markdown'
  | 'svg'
  | 'canvas'
  | 'json';

export type PreviewMode = 'realtime' | 'manual' | 'delayed' | 'smart';

export type PreviewDevice = {
  id: string;
  name: string;
  width: number;
  height: number;
  ua?: string;
};

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface PreviewError {
  type: 'compile' | 'runtime' | 'timeout' | 'sandbox' | 'memory';
  message: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface PreviewMetrics {
  compileTime: number;
  renderTime: number;
  totalTime: number;
  codeSize: number;
  elementCount: number;
  updateCount: number;
  lastUpdate: number;
}

export interface HistoryEntry {
  id: string;
  code: string;
  language: PreviewLanguage;
  html: string;
  timestamp: number;
  device: string;
  metrics: PreviewMetrics;
}

/* ── Default Devices ── */
export const PREVIEW_DEVICES: PreviewDevice[] = [
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900 },
  { id: 'laptop', name: 'Laptop', width: 1280, height: 800 },
  { id: 'tablet', name: 'iPad', width: 768, height: 1024 },
  { id: 'tablet-landscape', name: 'iPad Landscape', width: 1024, height: 768 },
  { id: 'mobile', name: 'iPhone 14', width: 390, height: 844 },
  { id: 'mobile-se', name: 'iPhone SE', width: 375, height: 667 },
  { id: 'mobile-pro', name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { id: 'android', name: 'Pixel 7', width: 412, height: 915 },
];

/* ── Language detection ── */
export function detectLanguage(filename: string, code: string): PreviewLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'css' || ext === 'scss' || ext === 'less') return 'css';
  if (ext === 'md' || ext === 'mdx') return 'markdown';
  if (ext === 'svg') return 'svg';
  if (ext === 'json') return 'json';
  if (ext === 'vue') return 'vue';
  if (ext === 'tsx' || ext === 'jsx') return 'react';
  if (ext === 'ts') return 'typescript';
  if (ext === 'js') return 'javascript';
  // Content-based detection
  if (code.includes('import React') || code.includes("from 'react'") || code.includes('useState'))
    return 'react';
  if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
  if (code.includes('# ') && code.includes('\n')) return 'markdown';
  if (code.includes('<svg')) return 'svg';
  if (code.includes('canvas.getContext') || code.includes('CanvasRenderingContext'))
    return 'canvas';
  return 'javascript';
}

/* ── Markdown → HTML (simple) ── */
function markdownToHtml(md: string): string {
  let html = md;
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold/italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

/* ── Base HTML template for iframe ── */
function createBaseHtml(
  bodyContent: string,
  styles: string = '',
  scripts: string = '',
  isDark: boolean = true
): string {
  return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  body { background: ${isDark ? '#0a0f1f' : '#ffffff'}; color: ${isDark ? '#e2e8f0' : '#1e293b'}; }
  body.dark { background: #0a0f1f; color: #e2e8f0; }
  h1 { font-size: 2em; font-weight: 700; margin-bottom: 0.5em; }
  h2 { font-size: 1.5em; font-weight: 600; margin-bottom: 0.5em; }
  h3 { font-size: 1.25em; font-weight: 600; margin-bottom: 0.4em; }
  p { line-height: 1.7; margin-bottom: 1em; }
  a { color: #818cf8; text-decoration: none; }
  a:hover { text-decoration: underline; }
  ul, ol { padding-left: 1.5em; margin-bottom: 1em; }
  li { margin-bottom: 0.3em; }
  code { font-family: 'JetBrains Mono', 'Fira Code', monospace; background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
  pre { background: ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.03)'}; border-radius: 8px; padding: 1em; overflow-x: auto; margin-bottom: 1em; }
  pre code { background: none; padding: 0; }
  strong { font-weight: 700; }
  img { max-width: 100%; border-radius: 8px; }
  .error-display { background: #1e0608; border: 1px solid #7f1d1d; border-radius: 8px; padding: 16px; margin: 16px; color: #fca5a5; font-family: monospace; font-size: 13px; white-space: pre-wrap; }
  .error-display .title { color: #ef4444; font-weight: 700; margin-bottom: 8px; }
  ${styles}
</style>
</head>
<body>
${bodyContent}
<script>
// Console capture
(function() {
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;
  function send(type, args) {
    try {
      window.parent.postMessage({ type: 'console', level: type, message: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }, '*');
    } catch(e) {}
  }
  console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
  console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
  console.error = function() { send('error', arguments); origError.apply(console, arguments); };
  console.info = function() { send('info', arguments); origInfo.apply(console, arguments); };
  window.onerror = function(msg, url, line, col, err) {
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
  };
  window.addEventListener('unhandledrejection', function(e) {
    send('error', ['Unhandled Promise: ' + e.reason]);
  });
})();
// Element count report
setTimeout(function() {
  try {
    window.parent.postMessage({ type: 'metrics', elementCount: document.querySelectorAll('*').length }, '*');
  } catch(e) {}
}, 100);
</script>
${scripts}
</body>
</html>`;
}

/* ── Compile code to iframe HTML ── */
export function compileToHtml(
  code: string,
  language: PreviewLanguage,
  isDark: boolean
): { html: string; error: PreviewError | null } {
  try {
    switch (language) {
      case 'html':
        return { html: createBaseHtml(code, '', '', isDark), error: null };

      case 'css':
        return {
          html: createBaseHtml(
            `<div class="css-preview">
              <h2>CSS Preview</h2>
              <div class="demo-box">Box 1</div>
              <div class="demo-box alt">Box 2</div>
              <button class="demo-btn">Button</button>
              <p class="demo-text">Sample text paragraph for styling preview.</p>
              <div class="demo-grid"><div>A</div><div>B</div><div>C</div><div>D</div></div>
            </div>`,
            `.css-preview { padding: 20px; } .demo-box { width: 100px; height: 100px; background: #6366f1; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; margin: 8px; } .demo-btn { padding: 8px 16px; border: none; border-radius: 6px; background: #818cf8; color: white; cursor: pointer; margin: 8px; } .demo-text { margin: 12px 0; } .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; } .demo-grid div { padding: 16px; background: rgba(99,102,241,0.15); border-radius: 6px; text-align: center; } ${code}`,
            '',
            isDark
          ),
          error: null,
        };

      case 'javascript':
      case 'typescript':
        return {
          html: createBaseHtml(
            '<div id="app"></div><div id="output" style="padding: 16px; font-family: monospace; font-size: 13px; white-space: pre-wrap;"></div>',
            '',
            `<script>
try {
  const __output = document.getElementById('output');
  const __origLog = console.log;
  console.log = function() {
    const msg = Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    __output.innerHTML += '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">' + msg + '</div>';
    __origLog.apply(console, arguments);
  };
  ${code}
} catch(e) {
  document.getElementById('output').innerHTML = '<div class="error-display"><div class="title">Runtime Error</div>' + e.message + '</div>';
  console.error(e.message);
}
</script>`,
            isDark
          ),
          error: null,
        };

      case 'react': {
        // Simulated React rendering — show the component source with mock rendering
        const componentMatch = code.match(/(?:export\s+)?(?:default\s+)?function\s+(\w+)/);
        const componentName = componentMatch?.[1] || 'Component';
        return {
          html: createBaseHtml(
            `<div id="root" style="padding: 20px;">
              <div style="background: ${isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)'}; border: 1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'}; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <div style="width:8px;height:8px;border-radius:50%;background:#818cf8;"></div>
                  <span style="font-size:14px;font-weight:700;color:${isDark ? '#818cf8' : '#6366f1'};">&lt;${componentName} /&gt;</span>
                  <span style="font-size:11px;color:${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};">React Component</span>
                </div>
                <div style="font-family:monospace;font-size:11px;background:${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)'};border-radius:8px;padding:12px;overflow-x:auto;max-height:300px;overflow-y:auto;white-space:pre;color:${isDark ? '#a5f3fc' : '#0e7490'};">${escapeHtml(code.slice(0, 1500))}</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="background:${isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)'};border:1px solid ${isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)'};border-radius:8px;padding:12px;">
                  <div style="font-size:10px;color:${isDark ? '#6ee7b7' : '#059669'};font-weight:600;margin-bottom:4px;">JSX Elements</div>
                  <div style="font-size:18px;font-weight:700;color:${isDark ? '#e2e8f0' : '#1e293b'};">${(code.match(/<\w+/g) || []).length}</div>
                </div>
                <div style="background:${isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)'};border:1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)'};border-radius:8px;padding:12px;">
                  <div style="font-size:10px;color:${isDark ? '#fcd34d' : '#d97706'};font-weight:600;margin-bottom:4px;">Hooks Used</div>
                  <div style="font-size:18px;font-weight:700;color:${isDark ? '#e2e8f0' : '#1e293b'};">${(code.match(/use\w+/g) || []).length}</div>
                </div>
              </div>
            </div>`,
            '',
            '',
            isDark
          ),
          error: null,
        };
      }

      case 'markdown':
        return {
          html: createBaseHtml(
            `<article style="max-width:720px;margin:0 auto;padding:32px;">${markdownToHtml(code)}</article>`,
            'article h1 { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; } article h2 { border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.2em; }',
            '',
            isDark
          ),
          error: null,
        };

      case 'svg':
        return {
          html: createBaseHtml(
            `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">${code}</div>`,
            'svg { max-width: 100%; height: auto; }',
            '',
            isDark
          ),
          error: null,
        };

      case 'canvas':
        return {
          html: createBaseHtml(
            '<canvas id="canvas" width="600" height="400" style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;display:block;margin:20px auto;"></canvas>',
            '',
            `<script>
try {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ${code}
} catch(e) {
  document.body.innerHTML += '<div class="error-display"><div class="title">Canvas Error</div>' + e.message + '</div>';
}
</script>`,
            isDark
          ),
          error: null,
        };

      case 'json':
        try {
          const parsed = JSON.parse(code);
          const formatted = JSON.stringify(parsed, null, 2);
          return {
            html: createBaseHtml(
              `<pre style="padding:20px;font-size:13px;"><code>${escapeHtml(formatted)}</code></pre>`,
              '',
              '',
              isDark
            ),
            error: null,
          };
        } catch (e) {
          return {
            html: createBaseHtml(
              `<div class="error-display"><div class="title">JSON Parse Error</div>${(e as Error).message}</div>`,
              '',
              '',
              isDark
            ),
            error: { type: 'compile', message: (e as Error).message },
          };
        }

      default:
        return {
          html: createBaseHtml(
            `<pre style="padding:20px;font-size:13px;"><code>${escapeHtml(code)}</code></pre>`,
            '',
            '',
            isDark
          ),
          error: null,
        };
    }
  } catch (err) {
    const error: PreviewError = {
      type: 'compile',
      message: (err as Error).message || 'Unknown compilation error',
    };
    return {
      html: createBaseHtml(
        `<div class="error-display"><div class="title">Compilation Error</div>${escapeHtml(error.message)}</div>`,
        '',
        '',
        isDark
      ),
      error,
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Debounce utility ── */
 
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
   
  const debounced = ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T & { cancel: () => void };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return debounced;
}

/* ── Mock code samples for demo ── */
export const SAMPLE_CODES: Record<PreviewLanguage, string> = {
  html: `<!DOCTYPE html>
<div style="max-width: 480px; margin: 40px auto; font-family: Inter, sans-serif;">
  <h1 style="background: linear-gradient(135deg, #818cf8, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
    YYC\u00B3 PortAISys
  </h1>
  <p style="color: #94a3b8; line-height: 1.8;">
    Portable Intelligent AI System \u2014 Design to Code in Real-Time.
  </p>
  <div style="display: flex; gap: 8px; margin-top: 16px;">
    <button style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
      Get Started
    </button>
    <button style="padding: 10px 20px; background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; cursor: pointer;">
      Learn More
    </button>
  </div>
</div>`,

  css: `.demo-box {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
  transition: transform 0.3s ease;
}
.demo-box:hover {
  transform: scale(1.05);
}
.demo-btn {
  background: linear-gradient(135deg, #06b6d4, #818cf8) !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}
.demo-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.4);
}
.demo-grid div {
  background: rgba(99,102,241,0.2) !important;
  font-weight: 600;
  color: #818cf8;
}`,

  javascript: `// YYC\u00B3 PortAISys - Interactive Demo
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

console.log("=== YYC\u00B3 PortAISys Preview Engine ===");
console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(\`  F(\${i}) = \${fibonacci(i)}\`);
}

// Object example
const project = {
  name: "YYC\u00B3 PortAISys",
  version: "2.0.0",
  features: ["Real-time Preview", "AI Code Intel", "Multi-Collab"],
  stats: { components: 42, lines: 8400, tests: 128 }
};
console.log("\\nProject Info:");
console.log(project);

// Array operations
const scores = [92, 85, 78, 95, 88, 73, 96, 81];
console.log(\`\\nAvg score: \${(scores.reduce((a,b) => a+b) / scores.length).toFixed(1)}\`);
console.log(\`Max: \${Math.max(...scores)}, Min: \${Math.min(...scores)}\`);`,

  typescript: `// TypeScript Example
interface User {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

const users: User[] = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'editor' },
];

console.log("Users:", users);
console.log("Admins:", users.filter(u => u.role === 'admin'));`,

  react: `import React, { useState, useEffect } from 'react'

export default function GlassCard() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    document.title = \`Count: \${count}\`
  }, [count])

  return (
    <div className="glass-card">
      <h2>YYC\u00B3 Glass Component</h2>
      <p>Interactive counter with Liquid Glass styling</p>
      <div className="counter">
        <button onClick={() => setCount(c => c - 1)}>-</button>
        <span>{count}</span>
        <button onClick={() => setCount(c => c + 1)}>+</button>
      </div>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle Theme ({theme})
      </button>
    </div>
  )
}`,

  vue: `<template>
  <div class="glass-card">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const title = ref('YYC\u00B3 Vue Component')
const message = ref('Liquid Glass Vue Preview')
const count = ref(0)
const increment = () => count.value++
</script>`,

  markdown: `# YYC\u00B3 PortAISys Documentation

## Overview

**YYC\u00B3 PortAISys** is a Portable Intelligent AI System designed for real-time code-to-design workflows.

### Key Features

- **Real-time Preview** \u2014 See changes instantly as you type
- **AI Code Intelligence** \u2014 Smart suggestions and auto-completion
- **Multi-user Collaboration** \u2014 Real-time co-editing with CRDT
- **Liquid Glass Design** \u2014 Beautiful frosted-glass aesthetic

### Quick Start

\`\`\`typescript
import { useAppStore } from './store'

function App() {
  const { theme, language } = useAppStore()
  return <IDELayout />
}
\`\`\`

### Architecture

The system follows a layered architecture:

1. **User Interaction Layer** \u2014 React components
2. **Logic Layer** \u2014 State management (Zustand)
3. **AI Layer** \u2014 Code intelligence engine
4. **Data Layer** \u2014 Persistence and sync

> *\u201CAll things converge in cloud pivot; Deep stacks ignite a new era of intelligence.\u201D*`,

  svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#6366f1" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="400" height="300" rx="16" fill="#0a0f1f"/>
  <rect x="40" y="40" width="120" height="80" rx="12" fill="url(#grad1)" filter="url(#shadow)" opacity="0.9"/>
  <rect x="180" y="40" width="180" height="80" rx="12" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.3)" stroke-width="1"/>
  <text x="100" y="85" text-anchor="middle" fill="white" font-family="sans-serif" font-size="14" font-weight="700">YYC\u00B3</text>
  <text x="270" y="75" text-anchor="middle" fill="#818cf8" font-family="sans-serif" font-size="12">PortAISys</text>
  <text x="270" y="95" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="10">Design \u2192 Code</text>
  <circle cx="100" cy="200" r="50" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" stroke-width="1.5"/>
  <circle cx="250" cy="200" r="40" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" stroke-width="1.5"/>
  <line x1="150" y1="200" x2="210" y2="200" stroke="#475569" stroke-width="1" stroke-dasharray="4"/>
  <text x="100" y="205" text-anchor="middle" fill="#6ee7b7" font-family="sans-serif" font-size="11">AI Engine</text>
  <text x="250" y="205" text-anchor="middle" fill="#fcd34d" font-family="sans-serif" font-size="11">Preview</text>
</svg>`,

  canvas: `// YYC\u00B3 Canvas Demo - Particle System
ctx.fillStyle = '#0a0f1f';
ctx.fillRect(0, 0, 600, 400);

// Grid
ctx.strokeStyle = 'rgba(255,255,255,0.03)';
for (let x = 0; x < 600; x += 20) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke();
}
for (let y = 0; y < 400; y += 20) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke();
}

// Particles
const particles = [];
for (let i = 0; i < 40; i++) {
  particles.push({
    x: Math.random() * 600,
    y: Math.random() * 400,
    r: 2 + Math.random() * 4,
    color: ['#818cf8', '#06b6d4', '#6ee7b7', '#fcd34d'][Math.floor(Math.random() * 4)],
  });
}

particles.forEach(p => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
  ctx.fill();
});

// Connections
ctx.globalAlpha = 0.08;
ctx.strokeStyle = '#818cf8';
particles.forEach((a, i) => {
  particles.slice(i + 1).forEach(b => {
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 120) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  });
});

// Title
ctx.globalAlpha = 1;
ctx.font = '700 24px Inter, sans-serif';
ctx.fillStyle = '#818cf8';
ctx.fillText('YYC\u00B3 Canvas Preview', 180, 380);`,

  json: `{
  "name": "yyc3-portaisys",
  "version": "2.0.0",
  "description": "Portable Intelligent AI System",
  "features": [
    "Real-time Preview Engine",
    "AI Code Intelligence",
    "Multi-user Collaboration",
    "Visual Canvas Editor",
    "CI/CD Pipeline",
    "ER Diagram Designer"
  ],
  "architecture": {
    "frontend": "React 18 + TypeScript",
    "state": "Zustand + Immer",
    "styling": "Tailwind CSS v4",
    "editor": "Monaco Editor",
    "realtime": "Yjs CRDT + WebSocket"
  }
}`,
};
