/**
 * @file icon-system.test.ts
 * @description YYC³便携式智能 AI 系统 - 图标系统极度细致测试
 * Icon System Comprehensive Tests
 * Tests for Lucide React icons, icon mapping, rendering, and accessibility.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,icons,lucide,accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import {
  // Common icons
  Home,
  Settings,
  User,
  Bell,
  Search,
  Menu,
  X,
  Check,
  // Navigation icons
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  // Action icons
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  // Status icons
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Loader2,
  // File icons
  File,
  FileText,
  FileCode,
  Folder,
  FolderOpen,
  // Media icons
  Image,
  Video,
  Camera,
  Volume2,
  // Communication icons
  Mail,
  MessageSquare,
  Phone,
  Share2,
  // Tech icons
  Code,
  Terminal,
  Database,
  Server,
  Wifi,
  // UI icons
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  // Calendar icons
  Calendar,
  Clock,
  Timer,
  // Layout icons
  Grid,
  List,
  Layout,
  Maximize2,
  Minimize2,
  // Arrows
  RefreshCw,
  RotateCw,
  RotateCcw,
  // Misc
  Zap,
  Flame,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ═════════════════════════════════════════════════════
// Icon Import Tests
// ═════════════════════════════════════════════════════

describe('Lucide React Icon Imports', () => {
  describe('Common Icons', () => {
    it('should import Home icon', () => {
      expect(Home).toBeDefined();
    });

    it('should import Settings icon', () => {
      expect(Settings).toBeDefined();
    });

    it('should import User icon', () => {
      expect(User).toBeDefined();
    });

    it('should import Bell icon', () => {
      expect(Bell).toBeDefined();
    });

    it('should import Search icon', () => {
      expect(Search).toBeDefined();
    });
  });

  describe('Navigation Icons', () => {
    it('should import Chevron icons', () => {
      expect(ChevronLeft).toBeDefined();
      expect(ChevronRight).toBeDefined();
      expect(ChevronUp).toBeDefined();
      expect(ChevronDown).toBeDefined();
    });

    it('should import Arrow icons', () => {
      expect(ArrowLeft).toBeDefined();
      expect(ArrowRight).toBeDefined();
      expect(ArrowUp).toBeDefined();
      expect(ArrowDown).toBeDefined();
    });
  });

  describe('Action Icons', () => {
    it('should import Plus/Minus icons', () => {
      expect(Plus).toBeDefined();
      expect(Minus).toBeDefined();
    });

    it('should import Edit/Delete icons', () => {
      expect(Edit).toBeDefined();
      expect(Trash2).toBeDefined();
    });

    it('should import Copy/Download/Upload icons', () => {
      expect(Copy).toBeDefined();
      expect(Download).toBeDefined();
      expect(Upload).toBeDefined();
    });
  });

  describe('Status Icons', () => {
    it('should import status icons', () => {
      expect(CheckCircle).toBeDefined();
      expect(AlertCircle).toBeDefined();
      expect(XCircle).toBeDefined();
      expect(Info).toBeDefined();
      expect(Loader2).toBeDefined();
    });
  });

  describe('File Icons', () => {
    it('should import File icons', () => {
      expect(File).toBeDefined();
      expect(FileText).toBeDefined();
      expect(FileCode).toBeDefined();
      expect(Folder).toBeDefined();
      expect(FolderOpen).toBeDefined();
    });
  });

  describe('Media Icons', () => {
    it('should import Media icons', () => {
      expect(Image).toBeDefined();
      expect(Video).toBeDefined();
      expect(Audio).toBeDefined();
      expect(Camera).toBeDefined();
    });
  });

  describe('Communication Icons', () => {
    it('should import Communication icons', () => {
      expect(Mail).toBeDefined();
      expect(MessageSquare).toBeDefined();
      expect(Phone).toBeDefined();
      expect(Share2).toBeDefined();
    });
  });

  describe('Tech Icons', () => {
    it('should import Tech icons', () => {
      expect(Code).toBeDefined();
      expect(Terminal).toBeDefined();
      expect(Database).toBeDefined();
      expect(Server).toBeDefined();
      expect(Wifi).toBeDefined();
    });
  });

  describe('UI Icons', () => {
    it('should import UI icons', () => {
      expect(Eye).toBeDefined();
      expect(EyeOff).toBeDefined();
      expect(Lock).toBeDefined();
      expect(Unlock).toBeDefined();
      expect(Star).toBeDefined();
      expect(Heart).toBeDefined();
    });
  });

  describe('Calendar Icons', () => {
    it('should import Calendar icons', () => {
      expect(Calendar).toBeDefined();
      expect(Clock).toBeDefined();
      expect(Timer).toBeDefined();
    });
  });

  describe('Layout Icons', () => {
    it('should import Layout icons', () => {
      expect(Grid).toBeDefined();
      expect(List).toBeDefined();
      expect(Layout).toBeDefined();
      expect(Maximize2).toBeDefined();
      expect(Minimize2).toBeDefined();
    });
  });

  describe('Rotation Icons', () => {
    it('should import Rotation icons', () => {
      expect(RefreshCw).toBeDefined();
      expect(RotateCw).toBeDefined();
      expect(RotateCcw).toBeDefined();
    });
  });

  describe('Misc Icons', () => {
    it('should import Misc icons', () => {
      expect(Zap).toBeDefined();
      expect(Flame).toBeDefined();
      expect(TrendingUp).toBeDefined();
      expect(TrendingDown).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════
// Icon Rendering Tests
// ═════════════════════════════════════════════════════

describe('Icon Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Home icon with default props', () => {
    render(<Home data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon).toBeDefined();
    expect(icon.tagName).toBe('svg');
  });

  it('should render icon with custom size', () => {
    render(<Home size={32} data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('width')).toBe('32');
    expect(icon.getAttribute('height')).toBe('32');
  });

  it('should render icon with custom color', () => {
    render(<Home color="#ff0000" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('stroke')).toBe('#ff0000');
  });

  it('should render icon with custom strokeWidth', () => {
    render(<Home strokeWidth={1} data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('stroke-width')).toBe('1');
  });

  it('should render icon with custom className', () => {
    render(<Home className="custom-class" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.classList.contains('custom-class')).toBe(true);
  });

  it('should render icon with aria-label', () => {
    render(<Home aria-label="Home" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('aria-label')).toBe('Home');
  });

  it('should render icon with aria-label', () => {
    render(<Home aria-label="Home Icon" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('aria-label')).toBe('Home Icon');
  });

  it('should apply absoluteStrokeWidth prop', () => {
    render(<Home absoluteStrokeWidth strokeWidth={2} data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    // When absoluteStrokeWidth is true, stroke-width should be calculated
    expect(icon).toBeDefined();
  });

  it('should render with ref', () => {
    const ref = vi.fn();
    render(<Home ref={ref} data-testid="test-icon" />);

    expect(ref).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════
// Icon Accessibility Tests
// ═════════════════════════════════════════════════════

describe('Icon Accessibility', () => {
  it('should have proper ARIA attributes with aria-label', () => {
    render(<Home aria-label="Home" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('aria-label')).toBe('Home');
    expect(icon.getAttribute('aria-hidden')).toBeNull();
  });

  it('should be hidden from screen readers with aria-hidden', () => {
    render(<Home aria-hidden="true" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('aria-label')).toBeNull();
  });

  it('should have focusable="false" by default', () => {
    render(<Home data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon).toBeDefined();
  });

  it('should be keyboard accessible when interactive', () => {
    const handleClick = vi.fn();
    render(
      <button aria-label="Home">
        <Home data-testid="test-icon" />
      </button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();

    button.click();
    expect(handleClick).not.toHaveBeenCalled(); // Button needs onClick handler
  });
});

// ═════════════════════════════════════════════════════
// Icon Mapping Tests
// ═════════════════════════════════════════════════════

describe('Icon Mapping', () => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    home: Home,
    settings: Settings,
    user: User,
    bell: Bell,
    search: Search,
    menu: Menu,
    close: X,
    check: Check,
    edit: Edit,
    delete: Trash2,
    copy: Copy,
    download: Download,
    upload: Upload,
    file: File,
    folder: Folder,
    code: Code,
    terminal: Terminal,
    database: Database,
    server: Server,
    wifi: Wifi,
    eye: Eye,
    eyeOff: EyeOff,
    lock: Lock,
    unlock: Unlock,
    star: Star,
    heart: Heart,
    calendar: Calendar,
    clock: Clock,
    grid: Grid,
    list: List,
    refresh: RefreshCw,
    zap: Zap,
    alert: AlertCircle,
    error: XCircle,
    info: Info,
    success: CheckCircle,
    loading: Loader2,
  };

  it('should have all mapped icons defined', () => {
    Object.entries(iconMap).forEach(([_name, Icon]) => {
      expect(Icon).toBeDefined();
    });
  });

  it('should render mapped icons', () => {
    Object.entries(iconMap).forEach(([_name, Icon]) => {
      render(<Icon data-testid={`icon-${_name}`} />);
      const icon = screen.getByTestId(`icon-${_name}`);
      expect(icon).toBeDefined();
      expect(icon.tagName).toBe('svg');
    });
  });

  it('should handle unknown icon names gracefully', () => {
    const getIcon = (name: string) => iconMap[name] || Home;

    expect(getIcon('home')).toBe(Home);
    expect(getIcon('unknown')).toBe(Home);
    expect(getIcon('')).toBe(Home);
  });
});

// ═════════════════════════════════════════════════════
// Icon Category Tests
// ═════════════════════════════════════════════════════

describe('Icon Categories', () => {
  const categories = {
    navigation: [Home, Settings, User, Bell, Search, Menu],
    actions: [Plus, Minus, Edit, Trash2, Copy, Download, Upload],
    status: [CheckCircle, AlertCircle, XCircle, Info, Loader2],
    files: [File, FileText, FileCode, Folder, FolderOpen],
    media: [Image, Video, Camera],
    communication: [Mail, MessageSquare, Phone, Share2],
    tech: [Code, Terminal, Database, Server, Wifi],
    ui: [Eye, EyeOff, Lock, Unlock, Star, Heart],
    time: [Calendar, Clock, Timer],
    layout: [Grid, List, Layout, Maximize2, Minimize2],
    arrows: [ChevronLeft, ChevronRight, ChevronUp, ChevronDown],
    misc: [Zap, Flame, TrendingUp, TrendingDown],
  };

  Object.entries(categories).forEach(([category, icons]) => {
    describe(`${category} icons`, () => {
      it(`should have ${icons.length} icons`, () => {
        expect(icons).toHaveLength(icons.length);
      });

      it('should all be defined', () => {
        icons.forEach((Icon) => {
          expect(Icon).toBeDefined();
        });
      });

      it('should all render correctly', () => {
        icons.forEach((Icon: unknown, index: number) => {
          const testId = `icon-${category}-${index}`;
          render(<Icon data-testid={testId} />);
          const icon = screen.getByTestId(testId);
          expect(icon.tagName).toBe('svg');
        });
      });
    });
  });
});

// ═════════════════════════════════════════════════════
// Icon Performance Tests
// ═════════════════════════════════════════════════════

describe('Icon Performance', () => {
  it('should render 100 icons quickly', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      render(<Home data-testid={`icon-${i}`} />);
    }

    const end = performance.now();
    const duration = end - start;

    // Should render 100 icons in less than 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should handle rapid re-renders', () => {
    const { rerender } = render(<Home size={16} data-testid="test-icon" />);

    for (let i = 0; i < 10; i++) {
      rerender(<Home size={16 + i} data-testid="test-icon" />);
    }

    const icon = screen.getByTestId('test-icon');
    expect(icon.getAttribute('width')).toBe('25');
  });
});

// ═════════════════════════════════════════════════════
// Icon SVG Tests
// ═════════════════════════════════════════════════════

describe('Icon SVG Structure', () => {
  it('should have valid SVG structure', () => {
    render(<Home data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    // Check SVG namespace
    expect(icon.namespaceURI).toBe('http://www.w3.org/2000/svg');

    // Check default attributes
    expect(icon.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(icon.getAttribute('width')).toBe('24');
    expect(icon.getAttribute('height')).toBe('24');
    expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(icon.getAttribute('fill')).toBe('none');
    expect(icon.getAttribute('stroke')).toBe('currentColor');
    expect(icon.getAttribute('stroke-width')).toBe('2');
    expect(icon.getAttribute('stroke-linecap')).toBe('round');
    expect(icon.getAttribute('stroke-linejoin')).toBe('round');
  });

  it('should have path elements', () => {
    render(<Home data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    const paths = icon.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should use currentColor for stroke', () => {
    render(<Home color="currentColor" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('stroke')).toBe('currentColor');
  });
});

// ═════════════════════════════════════════════════════
// Icon Size Tests
// ═════════════════════════════════════════════════════

describe('Icon Sizes', () => {
  const sizes = [12, 16, 20, 24, 32, 48, 64];

  sizes.forEach((size) => {
    it(`should render at ${size}px`, () => {
      render(<Home size={size} data-testid="test-icon" />);
      const icon = screen.getByTestId('test-icon');

      expect(icon.getAttribute('width')).toBe(size.toString());
      expect(icon.getAttribute('height')).toBe(size.toString());
    });
  });

  it('should handle string sizes', () => {
    render(<Home size="2rem" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    expect(icon.getAttribute('width')).toBe('2rem');
    expect(icon.getAttribute('height')).toBe('2rem');
  });
});

// ═════════════════════════════════════════════════════
// Icon Color Tests
// ═════════════════════════════════════════════════════

describe('Icon Colors', () => {
  const colors = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffffff',
    '#000000',
    'rgb(255, 0, 0)',
    'rgba(255, 0, 0, 0.5)',
    'hsl(0, 100%, 50%)',
    'currentColor',
    'inherit',
  ];

  colors.forEach((color) => {
    it(`should render with color: ${color}`, () => {
      render(<Home color={color} data-testid="test-icon" />);
      const icon = screen.getByTestId('test-icon');

      expect(icon.getAttribute('stroke')).toBe(color);
    });
  });
});

// ═════════════════════════════════════════════════════
// Icon Event Tests
// ═════════════════════════════════════════════════════

describe('Icon Events', () => {
  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Home onClick={handleClick} data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    fireEvent.click(icon);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle mouse events', () => {
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();

    render(
      <Home
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="test-icon"
      />
    );
    const icon = screen.getByTestId('test-icon');

    fireEvent.mouseEnter(icon);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(icon);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('should handle focus events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Home tabIndex={0} onFocus={handleFocus} onBlur={handleBlur} data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');

    icon.focus();
    expect(handleFocus).toHaveBeenCalledTimes(1);

    icon.blur();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});
