/**
 * @file Overlay.tsx
 * @description YYC³便携式智能AI系统 - 统一覆盖层/模态基础组件
 * Shared overlay/modal primitive that standardizes z-index, backdrop,
 * ESC-to-close, and click-outside behavior for all hand-written modals.
 *
 * Use this instead of raw `fixed inset-0 bg-black/50 z-50` patterns.
 * Provides incremental migration path from hand-written modals to shadcn Dialog.
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-07-11
 * @updated 2026-07-11
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,overlay,modal,primitive,standardization
 */

import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { cn } from '@/app/utils/cn';

/** Standardized z-index layers for overlays */
const Z_INDEX = {
  /** Standard modal/dialog */
  modal: 'z-50',
  /** Command palette, elevated panels */
  elevated: 'z-[60]',
  /** Toast, global error (sonner manages its own) */
  toast: 'z-[100]',
} as const;

export type OverlayLayer = keyof typeof Z_INDEX;

export interface OverlayProps {
  /** Whether the overlay is visible */
  open: boolean;
  /** Called when the user requests to close (ESC key, backdrop click, X button) */
  onClose: () => void;
  /** Overlay content */
  children: ReactNode;
  /** Z-index layer */
  layer?: OverlayLayer;
  /** Backdrop opacity (default: 50) */
  backdropOpacity?: 20 | 30 | 40 | 50 | 60;
  /** Whether clicking the backdrop closes the overlay (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing ESC closes the overlay (default: true) */
  closeOnEscape?: boolean;
  /** Whether to show the close (X) button (default: false) */
  showCloseButton?: boolean;
  /** Additional className for the backdrop */
  className?: string;
  /** Additional className for the content container */
  contentClassName?: string;
}

/**
 * Unified overlay/modal primitive.
 *
 * Replaces hand-written `fixed inset-0 bg-black/50 z-50 flex items-center justify-center`
 * patterns with consistent z-index, backdrop, and keyboard handling.
 *
 * @example
 * ```tsx
 * <Overlay open={isOpen} onClose={handleClose} showCloseButton>
 *   <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg">
 *     <h2>My Modal</h2>
 *     <p>Content here</p>
 *   </div>
 * </Overlay>
 * ```
 */
export function Overlay({
  open,
  onClose,
  children,
  layer = 'modal',
  backdropOpacity = 50,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = false,
  className,
  contentClassName,
}: OverlayProps) {
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        Z_INDEX[layer],
        `bg-black/${backdropOpacity}`,
        'backdrop-blur-sm',
        className
      )}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      )}
      <div
        className={cn('relative', contentClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export { Z_INDEX };
