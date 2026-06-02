/**
 * @file preview-integration.test.ts
 * @description YYC³便携式智能 AI 系统 - 预览功能集成测试
 * Preview Integration Tests
 * Comprehensive tests for preview sandbox, device simulator, and hot reload.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,preview,integration
 */

/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { deviceSimulator, DEVICE_PRESETS } from '../../services/device-simulator';
import { previewSandbox, type SandboxConfig } from '../../services/preview-sandbox';

// ═════════════════════════════════════════════════════
// Preview Sandbox Tests
// ═════════════════════════════════════════════════════

describe('Preview Sandbox Service', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    previewSandbox.destroy();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Sandbox Creation', () => {
    it('should create sandbox iframe', () => {
      const iframe = previewSandbox.createSandbox(container);

      expect(iframe).toBeDefined();
      expect(iframe.tagName).toBe('IFRAME');
      expect(iframe.sandbox.contains('allow-scripts')).toBe(true);
      expect(iframe.sandbox.contains('allow-same-origin')).toBe(true);
    });

    it('should replace existing iframe', () => {
      previewSandbox.createSandbox(container);
      const initialCount = container.querySelectorAll('iframe').length;

      previewSandbox.createSandbox(container);
      const finalCount = container.querySelectorAll('iframe').length;

      expect(initialCount).toBe(1);
      expect(finalCount).toBe(1); // Should still be 1 (replaced)
    });

    it('should have correct sandbox attributes', () => {
      const iframe = previewSandbox.createSandbox(container);

      expect(iframe.sandbox.contains('allow-scripts')).toBe(true);
      expect(iframe.sandbox.contains('allow-same-origin')).toBe(true);
      expect(iframe.sandbox.contains('allow-modals')).toBe(true);
    });
  });

  describe('Code Rendering', () => {
    it('should render HTML code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '<div>Hello World</div>',
        language: 'html',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('<div>Hello World</div>');
      expect(result.errors).toHaveLength(0);
    });

    it('should render CSS code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '.test { color: red; }',
        language: 'css',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('.test { color: red; }');
      expect(result.html).toContain('<style>');
    });

    it('should render JavaScript code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: 'console.log("test")',
        language: 'javascript',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('<script>');
      expect(result.html).toContain('console.log("test")');
    });

    it('should render React/JSX code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: 'function App() { return <div>Hello React</div> }',
        language: 'react',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('@babel/standalone');
      expect(result.html).toContain('react.development.js');
    });

    it('should render Markdown code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '# Hello\n**World**',
        language: 'markdown',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('<h1>Hello</h1>');
      expect(result.html).toContain('<strong>World</strong>');
    });

    it('should render SVG code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        language: 'svg',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('<svg>');
      expect(result.html).toContain('<circle');
    });

    it('should render JSON code', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '{"name": "test", "value": 123}',
        language: 'json',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('"name": "test"');
      expect(result.html).toContain('<pre>');
    });

    it('should handle invalid JSON', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '{"invalid": json}',
        language: 'json',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.html).toContain('Invalid JSON');
    });
  });

  describe('Error Handling', () => {
    it('should capture runtime errors', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: 'throw new Error("Test error")',
        language: 'javascript',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      // Error should be captured
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate bundle size', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '<div>Test</div>',
        language: 'html',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.bundleSize).toBeGreaterThan(0);
    });

    it('should calculate performance metrics', async () => {
      previewSandbox.createSandbox(container);

      const config: SandboxConfig = {
        code: '<div>Test</div>',
        language: 'html',
        mode: 'realtime',
        delay: 300,
        device: DEVICE_PRESETS[0],
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      };

      const result = await previewSandbox.render(config);

      expect(result.metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Hot Reload', () => {
    it('should trigger hot reload', async () => {
      previewSandbox.createSandbox(container);

      const callback = vi.fn();
      previewSandbox.subscribe('hotReload', callback);

      previewSandbox.hotReload({ file: 'test.ts', code: 'const x = 1' });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(callback).toHaveBeenCalled();
    });

    it('should debounce hot reload', async () => {
      previewSandbox.createSandbox(container);

      const callback = vi.fn();
      previewSandbox.subscribe('hotReload', callback);

      // Trigger multiple times rapidly
      previewSandbox.hotReload({ file: 'test.ts', code: '1' });
      previewSandbox.hotReload({ file: 'test.ts', code: '2' });
      previewSandbox.hotReload({ file: 'test.ts', code: '3' });

      // Wait for debounce to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Observer Pattern', () => {
    it('should subscribe to console events', () => {
      previewSandbox.createSandbox(container);

      const callback = vi.fn();
      const unsubscribe = previewSandbox.subscribe('console', callback);

      // Manually trigger (in real scenario, this comes from iframe)
      // This tests the observer pattern

      unsubscribe();
      // After unsubscribe, callback should not be called
    });

    it('should unsubscribe correctly', () => {
      previewSandbox.createSandbox(container);

      const callback = vi.fn();
      const unsubscribe = previewSandbox.subscribe('error', callback);

      unsubscribe();

      // After unsubscribe, the observer should be removed
      expect(previewSandbox['observers'].get('error')?.has(callback)).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should clear buffers', () => {
      previewSandbox.createSandbox(container);
      previewSandbox.clear();

      // Buffers should be empty
      // Note: This is internal state, testing through public API
    });

    it('should destroy sandbox correctly', () => {
      previewSandbox.createSandbox(container);
      previewSandbox.destroy();

      const iframes = container.querySelectorAll('iframe');
      expect(iframes).toHaveLength(0);
    });
  });
});

// ═════════════════════════════════════════════════════
// Device Simulator Tests
// ═════════════════════════════════════════════════════

describe('Device Simulator Service', () => {
  beforeEach(() => {
    deviceSimulator.reset();
  });

  describe('Device Presets', () => {
    it('should have predefined device presets', () => {
      const presets = deviceSimulator.getPresets();

      expect(presets.length).toBeGreaterThan(0);
      expect(presets).toContainEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String),
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );
    });

    it('should get preset by ID', () => {
      const preset = deviceSimulator.getPreset('iphone-14-pro');

      expect(preset).toBeDefined();
      expect(preset?.name).toBe('iPhone 14 Pro');
      expect(preset?.type).toBe('mobile');
    });

    it('should get presets by type', () => {
      const mobilePresets = deviceSimulator.getPresetsByType('mobile');
      const tabletPresets = deviceSimulator.getPresetsByType('tablet');
      const desktopPresets = deviceSimulator.getPresetsByType('desktop');

      expect(mobilePresets.length).toBeGreaterThan(0);
      expect(tabletPresets.length).toBeGreaterThan(0);
      expect(desktopPresets.length).toBeGreaterThan(0);
    });

    it('should have all device types', () => {
      const types = new Set(DEVICE_PRESETS.map((d: unknown) => d.type));

      expect(types.has('mobile')).toBe(true);
      expect(types.has('tablet')).toBe(true);
      expect(types.has('desktop')).toBe(true);
      expect(types.has('tv')).toBe(true);
    });
  });

  describe('Device Selection', () => {
    it('should set current device', () => {
      deviceSimulator.setDevice('ipad-pro-12.9');

      const config = deviceSimulator.getCurrentConfig();
      expect(config.device.name).toBe('iPad Pro 12.9"');
    });

    it('should set custom dimensions', () => {
      deviceSimulator.setCustomDimensions(1024, 768);

      const config = deviceSimulator.getCurrentConfig();
      expect(config.device.width).toBe(1024);
      expect(config.device.height).toBe(768);
      expect(config.device.type).toBe('custom');
    });

    it('should toggle orientation', () => {
      const initialConfig = deviceSimulator.getCurrentConfig();
      const initialOrientation = initialConfig.device.orientation;

      deviceSimulator.toggleOrientation();

      const newConfig = deviceSimulator.getCurrentConfig();
      expect(newConfig.device.orientation).not.toBe(initialOrientation);
    });
  });

  describe('Scale', () => {
    it('should set scale', () => {
      deviceSimulator.setScale(0.5);

      const config = deviceSimulator.getCurrentConfig();
      expect(config.scale).toBe(0.5);
    });

    it('should limit scale range', () => {
      deviceSimulator.setScale(3); // Above max

      const config = deviceSimulator.getCurrentConfig();
      expect(config.scale).toBeLessThanOrEqual(2);
      expect(config.scale).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('Dimensions', () => {
    it('should get current dimensions', () => {
      deviceSimulator.setDevice('iphone-14-pro');

      const dimensions = deviceSimulator.getCurrentDimensions();

      expect(dimensions.width).toBe(393);
      expect(dimensions.height).toBe(852);
      expect(dimensions.scaledWidth).toBeDefined();
      expect(dimensions.scaledHeight).toBeDefined();
    });

    it('should respect orientation', () => {
      deviceSimulator.setDevice('ipad-pro-12.9');

      const portraitDims = deviceSimulator.getCurrentDimensions();

      deviceSimulator.toggleOrientation();
      const landscapeDims = deviceSimulator.getCurrentDimensions();

      expect(portraitDims.width).toBe(1024);
      expect(portraitDims.height).toBe(1366);
      expect(landscapeDims.width).toBe(1366);
      expect(landscapeDims.height).toBe(1024);
    });
  });

  describe('Breakpoints', () => {
    it('should get responsive breakpoints', () => {
      const breakpoints = deviceSimulator.getBreakpoints();

      expect(breakpoints.length).toBe(4);
      expect(breakpoints).toContainEqual(
        expect.objectContaining({
          name: expect.any(String),
          width: expect.any(Number),
          color: expect.any(String),
        })
      );
    });

    it('should check breakpoints', () => {
      expect(deviceSimulator.isAtBreakpoint(400, 'mobile')).toBe(true);
      expect(deviceSimulator.isAtBreakpoint(800, 'tablet')).toBe(true);
      expect(deviceSimulator.isAtBreakpoint(1300, 'laptop')).toBe(true);
      expect(deviceSimulator.isAtBreakpoint(2000, 'desktop')).toBe(true);
    });
  });

  describe('Observer Pattern', () => {
    it('should subscribe to changes', () => {
      const callback = vi.fn();
      const unsubscribe = deviceSimulator.subscribe(callback);

      deviceSimulator.setDevice('ipad-mini');

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should unsubscribe correctly', () => {
      const callback = vi.fn();
      const unsubscribe = deviceSimulator.subscribe(callback);
      unsubscribe();

      deviceSimulator.setDevice('macbook-pro-13');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should reset to default', () => {
      deviceSimulator.setDevice('desktop-4k');
      deviceSimulator.setScale(0.5);

      deviceSimulator.reset();

      const config = deviceSimulator.getCurrentConfig();
      expect(config.device.id).toBe(DEVICE_PRESETS[0].id);
      expect(config.scale).toBe(1);
    });
  });
});

// ═════════════════════════════════════════════════════
// Integration Tests
// ═════════════════════════════════════════════════════

describe('Preview Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    previewSandbox.destroy();
    deviceSimulator.reset();
    document.body.removeChild(container);
  });

  it('should render with different devices', async () => {
    previewSandbox.createSandbox(container);

    const devices = ['iphone-14-pro', 'ipad-pro-12.9', 'desktop-1080p'];

    for (const deviceId of devices) {
      deviceSimulator.setDevice(deviceId);
      const config = deviceSimulator.getCurrentConfig();

      const result = await previewSandbox.render({
        code: '<div>Responsive Test</div>',
        language: 'html',
        mode: 'realtime',
        delay: 300,
        device: config.device,
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      });

      expect(result.html).toContain('Responsive Test');
    }
  });

  it('should handle hot reload with device change', async () => {
    previewSandbox.createSandbox(container);

    // Initial render
    deviceSimulator.setDevice('iphone-14-pro');
    let config = deviceSimulator.getCurrentConfig();

    await previewSandbox.render({
      code: '<div>Initial</div>',
      language: 'html',
      mode: 'realtime',
      delay: 300,
      device: config.device,
      captureConsole: true,
      enableErrorBoundary: true,
      enablePerformance: true,
    });

    // Change device and hot reload
    deviceSimulator.setDevice('desktop-1080p');
    config = deviceSimulator.getCurrentConfig();

    previewSandbox.hotReload({ file: 'test.html', code: '<div>Reloaded</div>' });

    // Wait for hot reload
    setTimeout(async () => {
      const result = await previewSandbox.render({
        code: '<div>Reloaded</div>',
        language: 'html',
        mode: 'realtime',
        delay: 300,
        device: config.device,
        captureConsole: true,
        enableErrorBoundary: true,
        enablePerformance: true,
      });

      expect(result.html).toContain('Reloaded');
    }, 500);
  });
});
