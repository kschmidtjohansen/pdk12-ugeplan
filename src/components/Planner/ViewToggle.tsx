import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

export type ViewMode = 'kanban' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  const { t } = useTranslation();

  return (
    <ToggleGroup 
      type="single" 
      value={viewMode} 
      onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
      className="bg-muted rounded-lg p-1"
    >
      <ToggleGroupItem 
        value="kanban" 
        aria-label={t('planner.kanbanView')}
        className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-sm"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        {t('planner.kanbanView')}
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="list" 
        aria-label={t('planner.listView')}
        className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-sm"
      >
        <List className="h-4 w-4 mr-2" />
        {t('planner.listView')}
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ViewToggle;
