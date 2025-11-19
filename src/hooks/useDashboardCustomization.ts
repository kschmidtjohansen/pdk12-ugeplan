import { useState, useEffect } from 'react';

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  gridSize: 'compact' | 'comfortable' | 'spacious';
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'quick-access', label: 'Quick Access', visible: true, order: 0 },
  { id: 'metrics', label: 'System Metrics', visible: true, order: 1 },
  { id: 'mine-opgaver', label: 'Mine Opgaver', visible: true, order: 2 },
];

const getStorageKey = (userId: string) => `dashboardLayout_${userId}`;

export const useDashboardCustomization = (userId: string) => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(userId));
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
    }
    return {
      widgets: DEFAULT_WIDGETS,
      gridSize: 'comfortable'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(layout));
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
    }
  }, [layout, userId]);

  const toggleWidgetVisibility = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    }));
  };

  const reorderWidgets = (widgetId: string, newOrder: number) => {
    setLayout(prev => {
      const widgets = [...prev.widgets];
      const widgetIndex = widgets.findIndex(w => w.id === widgetId);
      
      if (widgetIndex === -1) return prev;
      
      const [widget] = widgets.splice(widgetIndex, 1);
      widgets.splice(newOrder, 0, widget);
      
      // Reassign order numbers
      return {
        ...prev,
        widgets: widgets.map((w, i) => ({ ...w, order: i }))
      };
    });
  };

  const setGridSize = (size: 'compact' | 'comfortable' | 'spacious') => {
    setLayout(prev => ({ ...prev, gridSize: size }));
  };

  const resetToDefault = () => {
    setLayout({
      widgets: DEFAULT_WIDGETS,
      gridSize: 'comfortable'
    });
  };

  const getVisibleWidgets = () => {
    return layout.widgets
      .filter(w => w.visible)
      .sort((a, b) => a.order - b.order);
  };

  return {
    layout,
    toggleWidgetVisibility,
    reorderWidgets,
    setGridSize,
    resetToDefault,
    getVisibleWidgets
  };
};
