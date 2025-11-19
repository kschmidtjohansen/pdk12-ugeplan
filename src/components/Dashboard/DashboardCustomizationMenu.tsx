import React from 'react';
import { Settings, GripVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useDashboardCustomization } from '@/hooks/useDashboardCustomization';

interface DashboardCustomizationMenuProps {
  userId: string;
}

export const DashboardCustomizationMenu: React.FC<DashboardCustomizationMenuProps> = ({ userId }) => {
  const {
    layout,
    toggleWidgetVisibility,
    reorderWidgets,
    setGridSize,
    resetToDefault,
  } = useDashboardCustomization(userId);

  const [draggedWidget, setDraggedWidget] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const targetWidget = layout.widgets.find(w => w.id === targetWidgetId);
    if (targetWidget) {
      reorderWidgets(draggedWidget, targetWidget.order);
    }
    setDraggedWidget(null);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dashboard Customization</SheetTitle>
          <SheetDescription>
            Customize your dashboard layout by showing/hiding widgets, reordering them, or changing the grid size.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Widget Visibility */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Visible Widgets</h3>
            <div className="space-y-3">
              {layout.widgets
                .sort((a, b) => a.order - b.order)
                .map((widget) => (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, widget.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, widget.id)}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-move hover:bg-accent/50 transition-colors ${
                      draggedWidget === widget.id ? 'opacity-50' : ''
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Checkbox
                      id={widget.id}
                      checked={widget.visible}
                      onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                    />
                    <Label
                      htmlFor={widget.id}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {widget.label}
                    </Label>
                  </div>
                ))}
            </div>
          </div>

          <Separator />

          {/* Grid Size */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Grid Spacing</h3>
            <RadioGroup
              value={layout.gridSize}
              onValueChange={(value) => setGridSize(value as 'compact' | 'comfortable' | 'spacious')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="compact" />
                <Label htmlFor="compact" className="font-normal cursor-pointer">
                  Compact - Minimal spacing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="comfortable" />
                <Label htmlFor="comfortable" className="font-normal cursor-pointer">
                  Comfortable - Balanced spacing (default)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spacious" id="spacious" />
                <Label htmlFor="spacious" className="font-normal cursor-pointer">
                  Spacious - Maximum spacing
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={resetToDefault}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
