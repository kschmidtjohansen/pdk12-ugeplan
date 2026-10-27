import React from 'react';
import { cn } from '@/lib/utils';
import { PRODUCT_MARK_SRC, PRODUCT_NAME } from '@/config/product';

export interface PolyPlanMarkProps {
  size?: 24 | 28 | 32 | 36 | 40;
  /** Decorative when next to the visible "PolyPlan" word. */
  decorative?: boolean;
  className?: string;
}

/** PolyPlan product mark — renders the approved /favicon.svg master unchanged. */
const PolyPlanMark: React.FC<PolyPlanMarkProps> = ({ size = 32, decorative = false, className }) => (
  <img
    src={PRODUCT_MARK_SRC}
    width={size}
    height={size}
    alt={decorative ? '' : PRODUCT_NAME}
    aria-hidden={decorative || undefined}
    data-brand="polyplan-mark"
    className={cn('shrink-0 select-none rounded-[22%]', className)}
    style={{ width: size, height: size }}
    loading="eager"
    draggable={false}
  />
);

export default PolyPlanMark;
