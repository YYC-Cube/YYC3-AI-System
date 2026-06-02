/**
 * @file aspect-ratio.tsx
 * @description YYC³便携式智能AI系统 - 宽高比UI组件
 * Aspect Ratio UI Component
 * 基于Radix UI的宽高比组件，用于保持元素比例
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-20
 * @updated 2026-03-20
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui-component,aspect-ratio,radix-ui,layout
 */

'use client';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
