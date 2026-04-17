import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

interface SeriesActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'edit' | 'delete';
  onSingleDay: () => void;
  onEntireSeries: () => void;
}

type SeriesChoice = 'single' | 'series';

const SeriesActionDialog: React.FC<SeriesActionDialogProps> = ({
  open,
  onOpenChange,
  mode,
  onSingleDay,
  onEntireSeries,
}) => {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<SeriesChoice>('single');

  // Reset to safe default whenever dialog opens
  useEffect(() => {
    if (open) setChoice('single');
  }, [open]);

  const handleConfirm = () => {
    if (choice === 'single') {
      onSingleDay();
    } else {
      onEntireSeries();
    }
  };

  const options: Array<{
    value: SeriesChoice;
    label: string;
    description: string;
  }> = [
    {
      value: 'single',
      label: t('planner.series.onlyThisDay'),
      description: t('planner.series.onlyThisDayDescription'),
    },
    {
      value: 'series',
      label: t('planner.series.entireSeries'),
      description: t('planner.series.entireSeriesDescription'),
    },
  ];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'delete'
              ? t('planner.series.deleteTitle')
              : t('planner.series.editTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === 'delete'
              ? t('planner.series.deleteDescription')
              : t('planner.series.editDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={choice}
          onValueChange={(v) => setChoice(v as SeriesChoice)}
          className="gap-2 py-2"
        >
          {options.map((opt) => {
            const isSelected = choice === opt.value;
            return (
              <Label
                key={opt.value}
                htmlFor={`series-opt-${opt.value}`}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  'hover:bg-accent/50',
                  isSelected
                    ? 'border-primary bg-accent/40 ring-1 ring-primary'
                    : 'border-border'
                )}
              >
                <RadioGroupItem
                  value={opt.value}
                  id={`series-opt-${opt.value}`}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-none">
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </Label>
            );
          })}
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button
            variant={mode === 'delete' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {t('planner.series.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SeriesActionDialog;
