/**
 * @file device-simulator.ts
 * @description YYC³便携式智能 AI 系统 - 多设备模拟器服务
 * Multi-Device Simulator Service
 * Simulate preview on different devices (mobile, tablet, desktop) with custom resolutions.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,preview,device,simulator
 */

// ═════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'custom';
export type DeviceOrientation = 'portrait' | 'landscape';

export interface DevicePreset {
  id: string;
  name: string;
  type: DeviceType;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  orientation: DeviceOrientation;
  icon: string;
}

export interface SimulatorConfig {
  device: DevicePreset;
  scale: number;
  showRulers: boolean;
  showGrid: boolean;
  highlightElements: boolean;
}

// ═════════════════════════════════════════════════════
// Device Presets
// ═════════════════════════════════════════════════════

export const DEVICE_PRESETS: DevicePreset[] = [
  // Mobile
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    type: 'mobile',
    width: 375,
    height: 667,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    orientation: 'portrait',
    icon: '📱',
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    type: 'mobile',
    width: 393,
    height: 852,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    orientation: 'portrait',
    icon: '📱',
  },
  {
    id: 'pixel-7',
    name: 'Pixel 7',
    type: 'mobile',
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
    orientation: 'portrait',
    icon: '📱',
  },

  // Tablet
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    type: 'tablet',
    width: 768,
    height: 1024,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
    orientation: 'portrait',
    icon: '📟',
  },
  {
    id: 'ipad-pro-12.9',
    name: 'iPad Pro 12.9"',
    type: 'tablet',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
    orientation: 'portrait',
    icon: '📟',
  },
  {
    id: 'surface-pro',
    name: 'Surface Pro',
    type: 'tablet',
    width: 912,
    height: 1368,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    orientation: 'portrait',
    icon: '📟',
  },

  // Desktop
  {
    id: 'macbook-pro-13',
    name: 'MacBook Pro 13"',
    type: 'desktop',
    width: 1280,
    height: 800,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    orientation: 'landscape',
    icon: '💻',
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16"',
    type: 'desktop',
    width: 1728,
    height: 1117,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    orientation: 'landscape',
    icon: '💻',
  },
  {
    id: 'desktop-1080p',
    name: 'Desktop 1080p',
    type: 'desktop',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    orientation: 'landscape',
    icon: '🖥️',
  },
  {
    id: 'desktop-4k',
    name: 'Desktop 4K',
    type: 'desktop',
    width: 3840,
    height: 2160,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    orientation: 'landscape',
    icon: '🖥️',
  },

  // TV
  {
    id: 'tv-1080p',
    name: 'TV 1080p',
    type: 'tv',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (SmartHub; TV Browser)',
    orientation: 'landscape',
    icon: '📺',
  },
  {
    id: 'tv-4k',
    name: 'TV 4K',
    type: 'tv',
    width: 3840,
    height: 2160,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (SmartHub; TV Browser)',
    orientation: 'landscape',
    icon: '📺',
  },
];

// ═════════════════════════════════════════════════════
// Device Simulator Service
// ═════════════════════════════════════════════════════

class DeviceSimulatorService {
  private currentDevice: DevicePreset = DEVICE_PRESETS[0];
  private currentOrientation: DeviceOrientation = 'portrait';
  private scale: number = 1;
  private observers: Set<Function> = new Set();

  /**
   * Get all device presets
   */
  getPresets(): DevicePreset[] {
    return DEVICE_PRESETS;
  }

  /**
   * Get preset by ID
   */
  getPreset(id: string): DevicePreset | undefined {
    return DEVICE_PRESETS.find((d) => d.id === id);
  }

  /**
   * Get presets by type
   */
  getPresetsByType(type: DeviceType): DevicePreset[] {
    return DEVICE_PRESETS.filter((d) => d.type === type);
  }

  /**
   * Set current device
   */
  setDevice(deviceId: string): void {
    const device = this.getPreset(deviceId);
    if (device) {
      this.currentDevice = device;
      this.currentOrientation = device.orientation;
      this.notifyObservers();
    }
  }

  /**
   * Set custom dimensions
   */
  setCustomDimensions(width: number, height: number): void {
    this.currentDevice = {
      id: 'custom',
      name: 'Custom',
      type: 'custom',
      width,
      height,
      pixelRatio: 1,
      userAgent: navigator.userAgent,
      orientation: width > height ? 'landscape' : 'portrait',
      icon: '📐',
    };
    this.notifyObservers();
  }

  /**
   * Toggle orientation
   */
  toggleOrientation(): void {
    this.currentOrientation = this.currentOrientation === 'portrait' ? 'landscape' : 'portrait';
    this.notifyObservers();
  }

  /**
   * Set scale
   */
  setScale(scale: number): void {
    this.scale = Math.max(0.1, Math.min(2, scale));
    this.notifyObservers();
  }

  /**
   * Get current dimensions
   */
  getCurrentDimensions(): {
    width: number;
    height: number;
    scaledWidth: number;
    scaledHeight: number;
  } {
    const { width, height } = this.currentDevice;
    const isPortrait = this.currentOrientation === 'portrait';

    return {
      width: isPortrait ? width : height,
      height: isPortrait ? height : width,
      scaledWidth: (isPortrait ? width : height) * this.scale,
      scaledHeight: (isPortrait ? height : width) * this.scale,
    };
  }

  /**
   * Get current config
   */
  getCurrentConfig(): SimulatorConfig {
    return {
      device: this.currentDevice,
      scale: this.scale,
      showRulers: true,
      showGrid: false,
      highlightElements: false,
    };
  }

  /**
   * Get responsive breakpoints
   */
  getBreakpoints(): { name: string; width: number; color: string }[] {
    return [
      { name: 'Mobile', width: 375, color: '#3b82f6' },
      { name: 'Tablet', width: 768, color: '#8b5cf6' },
      { name: 'Laptop', width: 1280, color: '#ec4899' },
      { name: 'Desktop', width: 1920, color: '#10b981' },
    ];
  }

  /**
   * Check if width matches breakpoint
   */
  isAtBreakpoint(width: number, breakpoint: string): boolean {
    const breakpoints: Record<string, number> = {
      mobile: 640,
      tablet: 768,
      laptop: 1024,
      desktop: 1280,
    };

    return width >= (breakpoints[breakpoint] || 0);
  }

  /**
   * Generate screenshot (placeholder)
   */
  async screenshot(): Promise<Blob | null> {
    // In production, this would capture the iframe content
    console.log('[DeviceSimulator] Screenshot requested');
    return null;
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: Function): () => void {
    this.observers.add(callback);
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Notify observers
   */
  private notifyObservers(): void {
    this.observers.forEach((callback) => callback(this.getCurrentConfig()));
  }

  /**
   * Reset to default
   */
  reset(): void {
    this.currentDevice = DEVICE_PRESETS[0];
    this.currentOrientation = 'portrait';
    this.scale = 1;
    this.notifyObservers();
  }
}

// ═════════════════════════════════════════════════════
// Singleton Instance
// ═════════════════════════════════════════════════════

export const deviceSimulator = new DeviceSimulatorService();
export default deviceSimulator;
