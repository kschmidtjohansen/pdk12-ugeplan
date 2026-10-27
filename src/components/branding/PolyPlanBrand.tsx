import React from 'react';
import { cn } from '@/lib/utils';
import { PRODUCT_NAME } from '@/config/product';
import PolyPlanMark, { PolyPlanMarkProps } from './PolyPlanMark';

interface PolyPlanBrandProps {
  size?: PolyPlanMarkProps['size'];
  /** Shows only the mark (e.g. collapsed sidebar); mark then carries the accessible name. */
  markOnly?: boolean;
  wordmarkClassName?: string;
  className?: string;
}

/** PolyPlan product lockup: approved P mark + "PolyPlan" wordmark. Single source of truth. */
const PolyPlanBrand: React.FC<PolyPlanBrandProps> = ({ size = 32, markOnly = false, wordmarkClassName, className }) => {
  if (markOnly) return <PolyPlanMark size={size} className={className} />;
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} data-brand="polyplan-lockup">
      <PolyPlanMark size={size} decorative />
      <span className={cn('font-semibold tracking-tight text-foreground', wordmarkClassName)}>{PRODUCT_NAME}</span>
    </span>
  );
};

export default PolyPlanBrand;
