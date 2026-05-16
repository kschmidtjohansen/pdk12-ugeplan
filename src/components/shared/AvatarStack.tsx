import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface AvatarStackEmployee {
  id?: string;
  name: string;
}

interface AvatarStackProps {
  employees: AvatarStackEmployee[];
  max?: number;
  size?: number;
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((p) => p.charAt(0)).join('').toUpperCase();
  return initials || '?';
};

const AvatarStack: React.FC<AvatarStackProps> = ({
  employees,
  max = 3,
  size = 20,
  className,
}) => {
  if (!employees || employees.length === 0) return null;

  const visible = employees.slice(0, max);
  const overflow = employees.length - visible.length;

  const bubbleBase =
    'flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-semibold ring-2 ring-background';
  const sizeStyle = { width: size, height: size };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center', className)}>
            {visible.map((emp, i) => (
              <div
                key={emp.id ?? `${emp.name}-${i}`}
                className={bubbleBase}
                style={{ ...sizeStyle, marginLeft: i === 0 ? 0 : -4 }}
                aria-label={emp.name}
              >
                {getInitials(emp.name)}
              </div>
            ))}
            {overflow > 0 && (
              <div
                className={bubbleBase}
                style={{ ...sizeStyle, marginLeft: -4 }}
                aria-label={`+${overflow}`}
              >
                +{overflow}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="w-auto max-w-xs p-2">
          <ul className="space-y-1">
            {employees.map((emp, i) => (
              <li
                key={emp.id ?? `${emp.name}-${i}`}
                className="text-xs text-foreground flex items-center gap-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {emp.name || '?'}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AvatarStack;
