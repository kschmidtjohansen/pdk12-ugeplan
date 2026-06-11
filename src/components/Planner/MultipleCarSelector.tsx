
import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X, Car, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Car as CarType } from '../../types/car';
import { Assignment } from '../../types/assignment';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

type CarAvailability = 'full' | 'partial' | 'none';

interface MultipleCarSelectorProps {
  cars: CarType[];
  selectedCarIds: string[];
  onCarToggle: (carId: string) => void;
  currentDate: string;
  assignments?: Assignment[];
  currentAssignmentId?: string;
  allSelectedDates?: Date[];
}

type ConflictPayload = {
  carId: string;
  carName: string;
  conflictingAssignments: string[];
  conflictDates?: string[];
};

const MultipleCarSelector: React.FC<MultipleCarSelectorProps> = ({
  cars,
  selectedCarIds,
  onCarToggle,
  currentDate,
  assignments = [],
  currentAssignmentId,
  allSelectedDates = []
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  // Pending conflict: set immediately when a conflicting car is clicked.
  // The picker (Popover/Drawer) is closed first, and only AFTER it has fully
  // unmounted do we promote it to `dialog` and show the AlertDialog. This
  // guarantees the dropdown can never overlap the confirm dialog.
  const [pending, setPending] = useState<ConflictPayload | null>(null);
  const [dialog, setDialog] = useState<ConflictPayload | null>(null);
  const promoteTimer = useRef<number | null>(null);

  // When a pending conflict exists, close the picker and (after it unmounts)
  // open the AlertDialog.
  React.useEffect(() => {
    if (!pending) return;
    if (open) setOpen(false);
    if (promoteTimer.current) window.clearTimeout(promoteTimer.current);
    // Allow the popover/drawer exit animation + portal unmount to complete.
    promoteTimer.current = window.setTimeout(() => {
      setDialog(pending);
      setPending(null);
      promoteTimer.current = null;
    }, 180);
    return () => {
      if (promoteTimer.current) {
        window.clearTimeout(promoteTimer.current);
        promoteTimer.current = null;
      }
    };
  }, [pending, open]);

  // The picker is only allowed open when there is no conflict in flight.
  const pickerOpen = open && !pending && !dialog;

  // Build list of date strings from allSelectedDates
  const selectedDateStrings = useMemo(() => {
    if (allSelectedDates.length > 0) {
      return allSelectedDates.map(d => format(d, 'yyyy-MM-dd'));
    }
    return currentDate ? [currentDate] : [];
  }, [allSelectedDates, currentDate]);

  const isCarBookedOnDate = (carId: string, dateStr: string): boolean => {
    const otherAssignments = currentAssignmentId
      ? assignments.filter(a => a.id !== currentAssignmentId)
      : assignments;

    return otherAssignments.some(assignment => {
      if (assignment.date !== dateStr) return false;
      const carIds = assignment.cars || (assignment.car ? [typeof assignment.car === 'string' ? assignment.car : assignment.car.id] : []);
      return carIds.includes(carId);
    });
  };

  const carAvailabilityMap = useMemo(() => {
    const map = new Map<string, CarAvailability>();
    if (selectedDateStrings.length === 0) return map;

    for (const car of cars) {
      if (!car.is_available) {
        map.set(car.id, 'none');
        continue;
      }
      let conflictCount = 0;
      for (const dateStr of selectedDateStrings) {
        if (isCarBookedOnDate(car.id, dateStr)) {
          conflictCount++;
        }
      }
      if (conflictCount === 0) {
        map.set(car.id, 'full');
      } else if (conflictCount < selectedDateStrings.length) {
        map.set(car.id, 'partial');
      } else {
        map.set(car.id, 'none');
      }
    }
    return map;
  }, [cars, selectedDateStrings, assignments, currentAssignmentId]);

  const getConflictDates = (carId: string): string[] => {
    return selectedDateStrings.filter(dateStr => isCarBookedOnDate(carId, dateStr));
  };

  const selectedCars = cars.filter(car => selectedCarIds.includes(car.id));
  const selectedCount = selectedCarIds.length;

  const getButtonText = () => {
    if (selectedCount === 0) return t('planner.selectCars');
    if (selectedCount === 1) return selectedCars[0]?.name || t('planner.selectCars');
    return t('planner.carsSelected', { count: selectedCount });
  };

  const handleCarClick = (car: CarType) => {
    if (!car.is_available) return;

    const isSelected = selectedCarIds.includes(car.id);
    if (isSelected) {
      onCarToggle(car.id);
      return;
    }

    const availability = carAvailabilityMap.get(car.id) || 'full';

    if (availability !== 'full') {
      const conflictDates = getConflictDates(car.id);
      const conflictingAssignmentNames = assignments
        .filter(a => {
          if (a.id === currentAssignmentId) return false;
          if (!conflictDates.includes(a.date)) return false;
          const carIds = a.cars || (a.car ? [typeof a.car === 'string' ? a.car : a.car.id] : []);
          return carIds.includes(car.id);
        })
        .map(a => a.title || a.case_number || t('planner.assignment'));

      setPending({
        carId: car.id,
        carName: car.name,
        conflictingAssignments: [...new Set(conflictingAssignmentNames)],
        conflictDates,
      });
      return;
    }

    onCarToggle(car.id);
  };

  const getAvailabilityDot = (availability: CarAvailability) => {
    switch (availability) {
      case 'full':
        return <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />;
      case 'partial':
        return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />;
      case 'none':
        return <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
    }
  };

  const getAvailabilityLabel = (car: CarType, availability: CarAvailability): string => {
    if (!car.is_available) return t('cars.unavailable');
    switch (availability) {
      case 'full': return t('cars.available');
      case 'partial': return t('planner.partiallyBooked');
      case 'none': return t('planner.carAlreadyInUse');
    }
  };

  const renderCarList = () => (
    <>
      <div className={isMobile ? "pb-2 border-b border-border" : "p-3 pb-2 border-b border-border"}>
        <h4 className="font-medium text-sm">{t('planner.selectCars')}</h4>
      </div>
      <div className={isMobile ? "space-y-1 pt-2" : "p-3 space-y-1"}>
        {cars.filter(car => car.show_in_planner !== false).map((car) => {
          const isSelected = selectedCarIds.includes(car.id);
          const isGenerallyAvailable = car.is_available;
          const availability = carAvailabilityMap.get(car.id) || 'full';
          const canSelect = isGenerallyAvailable;

          return (
            <div
              key={car.id}
              className={`flex items-center space-x-3 p-3 rounded-md hover:bg-accent/50 cursor-pointer transition-colors border border-transparent hover:border-border ${
                !canSelect ? 'opacity-60' : ''
              }`}
              onClick={(e) => { e.stopPropagation(); handleCarClick(car); }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                disabled={!canSelect}
                className="rounded border-border text-primary focus:ring-primary pointer-events-none"
              />
              <div className={`flex-1 text-sm ${!canSelect ? 'text-muted-foreground' : ''}`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Car className="h-4 w-4 flex-shrink-0" />
                    {isGenerallyAvailable && selectedDateStrings.length > 0 && getAvailabilityDot(availability)}
                    <span className="font-medium truncate">{car.name}</span>
                    {car.car_number && (
                      <span className="text-muted-foreground text-xs">({car.car_number})</span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {!isGenerallyAvailable ? (
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                        {t('cars.unavailable')}
                      </Badge>
                    ) : selectedDateStrings.length > 0 ? (
                      <Badge variant="outline" className={`text-xs max-w-[120px] truncate ${
                        availability === 'full'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                          : availability === 'partial'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                      }`}>
                        {getAvailabilityLabel(car, availability)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                        {t('cars.available')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-between h-11 px-4 py-2"
    >
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4" />
        <span>{getButtonText()}</span>
      </div>
    </Button>
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('planner.cars')}</label>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCars.map((car) => (
            <Badge key={car.id} variant="secondary" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {car.name}
              <button
                type="button"
                onClick={() => onCarToggle(car.id)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {isMobile ? (
        <Drawer open={pickerOpen} onOpenChange={(o) => { if (!pending && !dialog) setOpen(o); else if (!o) setOpen(false); }}>
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t('planner.cars')}</DrawerTitle>
            </DrawerHeader>
            <div
              className="max-h-[70dvh] overflow-y-auto px-4 pb-4"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {renderCarList()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover modal={true} open={pickerOpen} onOpenChange={(o) => { if (!pending && !dialog) setOpen(o); else if (!o) setOpen(false); }}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent
            className="w-96 p-0 z-[60] bg-popover border shadow-lg flex flex-col max-h-[min(70vh,var(--radix-popover-content-available-height))]"
            sideOffset={4}
            collisionPadding={8}
          >
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              {renderCarList()}
            </div>
          </PopoverContent>
        </Popover>
      )}

      <AlertDialog
        open={!!dialog}
        onOpenChange={(o) => { if (!o) setDialog(null); }}
      >
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('planner.carBookingConflict')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>{dialog?.carName}</strong> {t('planner.carAlreadyInUse')}
                </p>
                {dialog && dialog.conflictingAssignments.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1">{t('planner.conflictingTasks')}:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {dialog.conflictingAssignments.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                    {dialog.conflictDates && dialog.conflictDates.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ({dialog.conflictDates.length} {t('planner.datesSelected', { count: dialog.conflictDates.length })})
                      </p>
                    )}
                  </div>
                )}
                <p className="text-foreground">{t('planner.confirmDoubleBooking')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => {
                if (dialog) onCarToggle(dialog.carId);
                setDialog(null);
              }}
            >
              {t('planner.useAnywayButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MultipleCarSelector;
