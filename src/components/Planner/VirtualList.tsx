import React, { useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  /** Stable key extractor */
  getKey: (item: T, index: number) => string;
  /** Renderer per item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Estimated row height in pixels (used before measurement) */
  estimateSize?: number;
  /** Row gap (added to measured size to render proper spacing) */
  gap?: number;
  /** Below this number of items, fall back to plain rendering (no virtualization overhead) */
  threshold?: number;
  /** Overscan rows */
  overscan?: number;
  /** Class for the wrapper */
  className?: string;
}

/**
 * Window-virtualized list. Below `threshold` items it renders normally
 * (preserves SSR/CLS behavior for short lists). Above threshold it uses
 * `useWindowVirtualizer` with dynamic `measureElement` to support variable
 * row heights (e.g. expandable DaySection).
 */
function VirtualList<T>({
  items,
  getKey,
  renderItem,
  estimateSize = 120,
  gap = 24,
  threshold = 10,
  overscan = 4,
  className,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const shouldVirtualize = items.length > threshold;

  const virtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? items.length : 0,
    estimateSize: () => estimateSize + gap,
    overscan,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    getItemKey: (index) => getKey(items[index], index),
  });

  if (!shouldVirtualize) {
    return (
      <div ref={parentRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
        {items.map((item, index) => (
          <React.Fragment key={getKey(item, index)}>{renderItem(item, index)}</React.Fragment>
        ))}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const scrollMargin = virtualizer.options.scrollMargin;

  return (
    <div ref={parentRef} className={className} style={{ position: 'relative', height: totalSize, width: '100%' }}>
      {virtualItems.map((vRow) => {
        const item = items[vRow.index];
        return (
          <div
            key={vRow.key as string}
            data-index={vRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${vRow.start - scrollMargin}px)`,
              paddingBottom: gap,
            }}
          >
            {renderItem(item, vRow.index)}
          </div>
        );
      })}
    </div>
  );
}

export default VirtualList;
