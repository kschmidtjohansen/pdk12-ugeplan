import React, { useState, useMemo } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import CarsList from '@/components/Cars/CarsList';
import CarDialogs from '@/components/Cars/CarDialogs';
import CarMarkUnavailableDialog from '@/components/Cars/CarMarkUnavailableDialog';
import CarMarkAvailableDialog from '@/components/Cars/CarMarkAvailableDialog';
import CarScheduledUnavailabilityDialog from '@/components/Cars/CarScheduledUnavailabilityDialog';
import CarNoteDialog from '@/components/Cars/CarNoteDialog';

import { useCars } from '@/hooks/car';
import { useCarUnavailability } from '@/hooks/car/useCarUnavailability';
import { isCarScheduledUnavailableToday, nextScheduledUnavailability } from '@/services/carUnavailabilityService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

import FalckSubscriptionButton from '@/components/Cars/FalckSubscriptionButton';
import VWAssistanceButton from '@/components/Cars/VWAssistanceButton';
import ListPageShell from '@/components/shared/ListPageShell';
import ListSkeleton from '@/components/shared/ListSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { FilterSegment } from '@/components/shared/SegmentedFilterBar';
import ModuleListTools, { ModuleContext } from '@/components/shared/ModuleListTools';
import EmptyState from '@/components/shared/EmptyState';
import { useDepartment } from '@/context/DepartmentContext';
import { filterCars } from '@/utils/moduleListFilters';
import type { Car } from '@/types/car';
import type { CarUnavailability } from '@/services/carUnavailabilityService';

interface EnrichedCar extends Car {
  _scheduledActive?: CarUnavailability | null;
  _scheduledUpcoming?: CarUnavailability | null;
}

type CarSegment = 'all' | 'available' | 'unavailable' | 'scheduled';

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const { t, currentLanguage } = useTranslation();
  const { selectedDepartment } = useDepartment();
  const da = currentLanguage === 'da';
  const resetFilters = () => { setSegment('all'); setSearch(''); };
  const [segment, setSegment] = useState<CarSegment>('all');
  const [search, setSearch] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteCar, setNoteCar] = useState<Car | null>(null);


  const {
    cars, loading, error, currentCar, formData, setFormData,
    dialogOpen, setDialogOpen, deleteDialogOpen, setDeleteDialogOpen,
    unavailableDialogOpen, setUnavailableDialogOpen, availableDialogOpen, setAvailableDialogOpen,
    scheduleDialogOpen, setScheduleDialogOpen, handleScheduleUnavailability,
    handleCreateNew, handleEdit, handleDelete, confirmDelete,
    handleInputChange, handleCheckboxChange, handleSubmit, handleToggleAvailability,
    fetchCars, markCarUnavailable, markCarAvailableKeepNote, markCarAvailableDeleteNote,
  } = useCars();

  const { periods } = useCarUnavailability();

  // Merge scheduled unavailability info into car data (for badges/labels)
  const enrichedCars = useMemo(() => {
    return cars.map((c: Car): EnrichedCar => {
      const active = isCarScheduledUnavailableToday(periods, c.id);
      const upcoming = nextScheduledUnavailability(periods, c.id);
      return {
        ...c,
        _scheduledActive: active || null,
        _scheduledUpcoming: upcoming || null,
      };
    });
  }, [cars, periods]);

  const filteredCars = useMemo(() => filterCars(enrichedCars, segment, search), [enrichedCars, segment, search]);

  const segments: FilterSegment[] = useMemo(() => {
    const available = enrichedCars.filter((c: EnrichedCar) => c.is_available !== false).length;
    const unavailable = enrichedCars.length - available;
    const scheduled = enrichedCars.filter((c: EnrichedCar) => c._scheduledActive || c._scheduledUpcoming).length;
    return [
      { key: 'all', label: t('common.all') || 'Alle', count: enrichedCars.length },
      { key: 'available', label: da ? 'Ledig status' : 'Available status', count: available },
      { key: 'unavailable', label: da ? 'Ikke-ledig status' : 'Unavailable status', count: unavailable, highlight: unavailable > 0 },
      { key: 'scheduled', label: da ? 'Planlagte perioder' : 'Scheduled periods', count: scheduled },
    ];
  }, [enrichedCars, t, da]);

  return (
    <DataFetchErrorBoundary>
      <TooltipProvider>
          <ListPageShell workspace
            title={t('navigation.cars')}
            description={t('cars.pageDescription')}
            actions={
              <>
                <FalckSubscriptionButton isAdmin={isAdmin} />
                <VWAssistanceButton />
                {isAdmin && (
                  <Button onClick={handleCreateNew} size="sm" className="min-h-11">
                    <Plus className="h-4 w-4" />
                    {t('cars.addNewCar')}
                  </Button>
                )}
              </>
            }
            filterBar={
              <>
                <ModuleContext department={selectedDepartment?.name} />
                <ModuleListTools segments={segments} active={segment} onSelect={k => setSegment(k as CarSegment)} search={search} onSearch={setSearch}
                  placeholder={t('cars.searchPlaceholder')} count={filteredCars.length} total={cars.length} onReset={resetFilters} />
                <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>{da ? 'Utilgængelig i planlagt periode i dag' : 'Scheduled unavailable today'} <strong className="text-warning-soft-foreground tabular-nums">{enrichedCars.filter(c => c._scheduledActive).length}</strong></span>
                  <span>{da ? 'Kommende perioder' : 'Upcoming periods'} <strong className="text-foreground tabular-nums">{enrichedCars.filter(c => c._scheduledUpcoming).length}</strong></span>
                </div>
              </>
            }
          >
            {loading ? (
              <ListSkeleton />
            ) : error ? (
              <div className="py-4">
                <ErrorState description={error} onRetry={fetchCars} />
              </div>
            ) : (
              <div className="py-4">
                {filteredCars.length === 0 ? (
                  <EmptyState title={cars.length ? (da ? 'Ingen biler matcher' : 'No matching vehicles') : (da ? 'Ingen biler i afdelingen' : 'No vehicles in this department')}
                    description={cars.length ? (da ? 'Prøv en anden status eller søgning.' : 'Try another status or search.') : undefined}
                    action={cars.length ? { label: da ? 'Ryd filtre' : 'Clear filters', onClick: resetFilters } : undefined} />
                ) : (
                  <CarsList
                    cars={filteredCars}
                    canEdit={false}
                    canViewFuelCardCode={canViewFuelCardCode}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleAvailability={handleToggleAvailability}
                    onSchedule={handleScheduleUnavailability}
                    onEditNote={(car) => { setNoteCar(car); setNoteDialogOpen(true); }}
                  />

                )}
              </div>
            )}
          </ListPageShell>

          <CarDialogs
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            deleteDialogOpen={deleteDialogOpen}
            setDeleteDialogOpen={setDeleteDialogOpen}
            formData={formData}
            setFormData={setFormData}
            onInputChange={handleInputChange}
            onCheckboxChange={handleCheckboxChange}
            onSubmit={handleSubmit}
            currentCar={currentCar}
            canViewFuelCardCode={canViewFuelCardCode}
            onConfirmDelete={confirmDelete}
            cars={cars}
          />

          <CarMarkUnavailableDialog
            open={unavailableDialogOpen}
            onOpenChange={setUnavailableDialogOpen}
            car={currentCar}
            onConfirm={markCarUnavailable}
          />

          <CarMarkAvailableDialog
            open={availableDialogOpen}
            onOpenChange={setAvailableDialogOpen}
            car={currentCar}
            onConfirmKeepNote={markCarAvailableKeepNote}
            onConfirmDeleteNote={markCarAvailableDeleteNote}
          />

          <CarScheduledUnavailabilityDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            car={currentCar}
          />

          <CarNoteDialog
            open={noteDialogOpen}
            onOpenChange={setNoteDialogOpen}
            car={noteCar}
            onSaved={fetchCars}
          />

      </TooltipProvider>
    </DataFetchErrorBoundary>
  );
};

export default CarsPage;
