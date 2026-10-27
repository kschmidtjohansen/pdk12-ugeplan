import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/types/assignment';
import type { CalendarDragMode } from '@/utils/calendarDrag';

export function CalendarLane({ id, children, className }: { id: string; children: React.ReactNode; className: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} data-calendar-lane={id} className={cn(className, isOver && 'ring-1 ring-inset ring-primary')}>{children}</div>;
}

function ResizeHandle({ task, employeeId, mode, label, disabled }: { task: Assignment; employeeId: string; mode: 'start' | 'end'; label: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `${task.id}:${employeeId}:${mode}`, data: { task, employeeId, mode }, disabled });
  return <Button ref={setNodeRef} variant="ghost" {...attributes} {...listeners} aria-label={label} title={label}
    className={cn('absolute z-10 left-1/2 -translate-x-1/2 h-3 min-h-3 w-11 p-0 cursor-ns-resize touch-pan-x touch-pan-y rounded-none', mode === 'start' ? 'top-0' : 'bottom-0')}
    onClick={e => e.stopPropagation()}><span className="h-0.5 w-6 bg-current opacity-60 pointer-events-none" /></Button>;
}

export function CalendarTask({ task, employeeId, disabled, style, className, children, onClick, startLabel, endLabel }: {
  task: Assignment; employeeId: string; disabled: boolean; style: React.CSSProperties; className: string;
  children: React.ReactNode; onClick: () => void; startLabel: string; endLabel: string;
}) {
  const mode: CalendarDragMode = 'move';
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${task.id}:${employeeId}:move`, data: { task, employeeId, mode }, disabled });
  return <div data-calendar-task={task.id} style={style} className={cn(className, isDragging && 'opacity-40')} onContextMenu={event => { if (isDragging) event.preventDefault(); }}>
    <Button ref={setNodeRef} variant="ghost" {...attributes} {...listeners} onClick={onClick}
      className={cn('h-full min-h-0 w-full block whitespace-normal rounded-none px-1.5 py-2 text-left text-inherit hover:bg-transparent touch-pan-x touch-pan-y', !disabled && 'cursor-grab active:cursor-grabbing')}>
      {children}
    </Button>
    {!disabled && <><ResizeHandle task={task} employeeId={employeeId} mode="start" label={startLabel} disabled={disabled} /><ResizeHandle task={task} employeeId={employeeId} mode="end" label={endLabel} disabled={disabled} /></>}
  </div>;
}