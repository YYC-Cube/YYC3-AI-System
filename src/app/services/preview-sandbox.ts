/**
 * @file preview-sandbox.ts
 * @description YYC³便携式智能 AI 系统 - 增强预览沙箱服务
 * Enhanced Preview Sandbox Service
 * Secure iframe sandbox with hot reload, multi-device simulation, and performance monitoring.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,preview,sandbox,hot-reload
 */

// Local type imports - no external dependencies

// ═════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════

export interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: number;
}

export interface PreviewMetrics {
  renderTime: number;
  fps: number;
  memoryUsage: number;
}

export interface PreviewDevice {
  id: string;
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
}

export type PreviewMode = 'realtime' | 'manual' | 'delayed' | 'smart';
export type PreviewLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'react'
  | 'markdown'
  | 'svg'
  | 'canvas'
  | 'json';

export interface SandboxConfig {
  /** Code to render */
  code: string;
  /** Language: html, css, javascript, react, markdown, svg, canvas, json */
  language: string;
  /** Preview mode */
  mode: PreviewMode;
  /** Debounce delay in ms */
  delay: number;
  /** Device configuration */
  device: PreviewDevice;
  /** Enable console capture */
  captureConsole: boolean;
  /** Enable error boundary */
  enableErrorBoundary: boolean;
  /** Enable performance monitoring */
  enablePerformance: boolean;
}

export interface SandboxResult {
  /** Generated HTML */
  html: string;
  /** Errors */
  errors: PreviewError[];
  /** Console entries */
  console: ConsoleEntry[];
  /** Performance metrics */
  metrics: PreviewMetrics;
  /** Bundle size in bytes */
  bundleSize: number;
}

export interface PreviewError {
  type: 'syntax' | 'runtime' | 'security' | 'network';
  message: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
}

// ═════════════════════════════════════════════════════
// Preview Sandbox Service
// ═════════════════════════════════════════════════════

class PreviewSandboxService {
  private iframe: HTMLIFrameElement | null = null;
  private consoleBuffer: ConsoleEntry[] = [];
  private errorBuffer: PreviewError[] = [];
  private hotReloadTimer: number | null = null;
  private observers: Map<string, Set<Function>> = new Map();

  /**
   * Create sandbox iframe
   */
  createSandbox(container: HTMLElement): HTMLIFrameElement {
    // Remove existing iframe
    const existing = container.querySelector('iframe');
    if (existing) {
      existing.remove();
    }

    // Create new iframe with sandbox attributes
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';

    container.appendChild(iframe);
    this.iframe = iframe;

    // Setup console capture
    this.setupConsoleCapture(iframe);

    // Setup error boundary
    this.setupErrorBoundary(iframe);

    return iframe;
  }

  /**
   * Render code in sandbox
   */
  async render(config: SandboxConfig): Promise<SandboxResult> {
    const startTime = performance.now();

    try {
      // Compile code to HTML
      const html = await this.compileCode(config);

      // Update iframe
      this.updateContent(html);

      // Calculate metrics
      const metrics = this.calculateMetrics(startTime);

      return {
        html,
        errors: [...this.errorBuffer],
        console: [...this.consoleBuffer],
        metrics,
        bundleSize: new Blob([html]).size,
      };
    } catch (error) {
      const previewError: PreviewError = {
        type: 'runtime',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      this.errorBuffer.push(previewError);

      return {
        html: '',
        errors: [previewError],
        console: [],
        metrics: { renderTime: 0, fps: 0, memoryUsage: 0 },
        bundleSize: 0,
      };
    }
  }

  /**
   * Hot reload - update content without full refresh
   */
  hotReload(changes: { file: string; code: string }): void {
    if (!this.iframe) return;

    console.log('[PreviewSandbox] Hot reload:', changes.file);

    // Debounce hot reload
    if (this.hotReloadTimer) {
      window.clearTimeout(this.hotReloadTimer);
    }

    this.hotReloadTimer = window.setTimeout(() => {
      this.injectCode(changes.code);
      this.notifyObservers('hotReload', { file: changes.file, timestamp: Date.now() });
    }, 300);
  }

  /**
   * Inject CSS/JS without full reload
   */
  private injectCode(code: string): void {
    if (!this.iframe?.contentDocument) return;

    const doc = this.iframe.contentDocument;

    // Detect code type
    if (code.includes('{') && code.includes('}')) {
      // CSS
      const style = doc.createElement('style');
      style.textContent = code;
      doc.head.appendChild(style);
    } else {
      // JS
      const script = doc.createElement('script');
      script.textContent = code;
      doc.body.appendChild(script);
    }
  }

  /**
   * Setup console capture from iframe
   */
  private setupConsoleCapture(iframe: HTMLIFrameElement): void {
    // Listen for console messages from iframe
    window.addEventListener('message', (event) => {
      if (event.source !== iframe.contentWindow) return;

      if (event.data?.type === 'console') {
        const entry: ConsoleEntry = {
          level: event.data.level,
          message: event.data.message,
          timestamp: Date.now(),
        };
        this.consoleBuffer.push(entry);
        this.notifyObservers('console', entry);
      }

      if (event.data?.type === 'error') {
        const error: PreviewError = {
          type: 'runtime',
          message: event.data.message,
          timestamp: Date.now(),
        };
        this.errorBuffer.push(error);
        this.notifyObservers('error', error);
      }

      if (event.data?.type === 'metrics') {
        this.notifyObservers('metrics', event.data.metrics);
      }
    });
  }

  /**
   * Setup error boundary
   */
  private setupErrorBoundary(iframe: HTMLIFrameElement): void {
    iframe.addEventListener('error', (event) => {
      const error: PreviewError = {
        type: 'runtime',
        message: event instanceof ErrorEvent ? event.message : 'Unknown error',
        line: event instanceof ErrorEvent ? event.lineno : undefined,
        column: event instanceof ErrorEvent ? event.colno : undefined,
        timestamp: Date.now(),
      };
      this.errorBuffer.push(error);
      this.notifyObservers('error', error);
    });
  }

  /**
   * Compile code to HTML based on language
   */
  private async compileCode(config: SandboxConfig): Promise<string> {
    const { code, language } = config;

    switch (language) {
      case 'html':
        return this.compileHtml(code);

      case 'css':
        return this.compileCss(code);

      case 'javascript':
        return this.compileJavaScript(code);

      case 'react':
        return this.compileReact(code);

      case 'markdown':
        return this.compileMarkdown(code);

      case 'svg':
        return this.compileSvg(code);

      case 'canvas':
        return this.compileCanvas(code);

      case 'json':
        return this.compileJson(code);

      default:
        return this.compileHtml(code);
    }
  }

  /**
   * Compile HTML
   */
  private compileHtml(code: string): string {
    // Auto-add DOCTYPE if missing
    if (!code.trim().startsWith('<!DOCTYPE')) {
      return `<!DOCTYPE html>\n${code}`;
    }
    return code;
  }

  /**
   * Compile CSS - wrap in HTML
   */
  private compileCss(code: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>${code}</style>
</head>
<body>
  <div class="preview-container">
    <p>CSS Preview - Add HTML to see styles applied</p>
  </div>
</body>
</html>`;
  }

  /**
   * Compile JavaScript - wrap in HTML
   */
  private compileJavaScript(code: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>JavaScript Preview</title>
</head>
<body>
  <div id="app"></div>
  <script>
    try {
      ${code}
    } catch (error) {
      console.error('Preview Error:', error)
      window.parent.postMessage({ type: 'error', message: error.message }, '*')
    }
  </script>
</body>
</html>`;
  }

  /**
   * Compile React/JSX - transform with Babel standalone
   */
  private compileReact(code: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>React Preview</title>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      const { useState, useEffect, useMemo, useCallback, useRef } = React;
      
      ${code}
      
      // Auto-render if component exported
      if (typeof App !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      }
    } catch (error) {
      console.error('React Preview Error:', error);
      window.parent.postMessage({ type: 'error', message: error.message }, '*');
    }
  </script>
</body>
</html>`;
  }

  /**
   * Compile Markdown - transform to HTML
   */
  private compileMarkdown(code: string): string {
    // Simple markdown to HTML conversion
    const html = code
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[(.*)\]\((.*)\)/gim, '<a href="$2">$1</a>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    a { color: #0366d6; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  /**
   * Compile SVG - wrap in HTML
   */
  private compileSvg(code: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>SVG Preview</title>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f4f4f4; }
    svg { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  }

  /**
   * Compile Canvas - wrap in HTML
   */
  private compileCanvas(code: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Canvas Preview</title>
  <style>
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f4f4f4; }
    canvas { border: 1px solid #ccc; background: white; }
  </style>
</head>
<body>
  <canvas id="canvas" width="800" height="600"></canvas>
  <script>
    try {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      
      ${code}
    } catch (error) {
      console.error('Canvas Preview Error:', error);
      window.parent.postMessage({ type: 'error', message: error.message }, '*');
    }
  </script>
</body>
</html>`;
  }

  /**
   * Compile JSON - display formatted
   */
  private compileJson(code: string): string {
    try {
      const formatted = JSON.stringify(JSON.parse(code), null, 2);
      return `<!DOCTYPE html>
<html>
<head>
  <title>JSON Preview</title>
  <style>
    body { font-family: 'Fira Code', monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    pre { margin: 0; }
  </style>
</head>
<body>
  <pre>${formatted}</pre>
</body>
</html>`;
    } catch (error) {
      return `<!DOCTYPE html>
<html>
<head>
  <title>JSON Error</title>
  <style>
    body { font-family: sans-serif; padding: 20px; color: #f44336; }
  </style>
</head>
<body>
  <h3>Invalid JSON</h3>
  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
</body>
</html>`;
    }
  }

  /**
   * Update iframe content
   */
  private updateContent(html: string): void {
    if (!this.iframe) return;

    const doc = this.iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(startTime: number): PreviewMetrics {
    const renderTime = performance.now() - startTime;
    const perfWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number } };

    return {
      renderTime,
      fps: renderTime > 0 ? Math.round(1000 / renderTime) : 0,
      memoryUsage: perfWithMemory.memory ? perfWithMemory.memory.usedJSHeapSize : 0,
    };
  }

  /**
   * Observer pattern for events
   */
  subscribe(event: string, callback: Function): () => void {
    if (!this.observers.has(event)) {
      this.observers.set(event, new Set());
    }
    this.observers.get(event)!.add(callback);

    return () => {
      this.observers.get(event)?.delete(callback);
    };
  }

  /**
   * Notify observers
   */
  private notifyObservers(event: string, data: unknown): void {
    this.observers.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * Clear buffers
   */
  clear(): void {
    this.consoleBuffer = [];
    this.errorBuffer = [];
  }

  /**
   * Destroy sandbox
   */
  destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.clear();
    this.observers.clear();
    if (this.hotReloadTimer) {
      window.clearTimeout(this.hotReloadTimer);
    }
  }
}

// ═════════════════════════════════════════════════════
// Singleton Instance
// ═════════════════════════════════════════════════════

export const previewSandbox = new PreviewSandboxService();
export default previewSandbox;
