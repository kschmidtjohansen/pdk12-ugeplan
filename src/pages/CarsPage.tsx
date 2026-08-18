import React, { useState, useMemo } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import CarsList from '@/components/Cars/CarsList';
import CarDialogs from '@/components/Cars/CarDialogs';
import CarMarkUnavailableDialog from '@/components/Cars/CarMarkUnavailableDialog';
import CarMarkAvailableDialog from '@/components/Cars/CarMarkAvailableDialog';
import CarScheduledUnavailabilityDialog from '@/components/Cars/CarScheduledUnavailabilityDialog';
import { useCars } from '@/hooks/car';
import { useCarUnavailability } from '@/hooks/car/useCarUnavailability';
import { isCarScheduledUnavailableToday, nextScheduledUnavailability } from '@/services/carUnavailabilityService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import FalckSubscriptionButton from '@/components/Cars/FalckSubscriptionButton';
import VWAssistanceButton from '@/components/Cars/VWAssistanceButton';
import ListPageShell from '@/components/shared/ListPageShell';
import ListSkeleton from '@/components/shared/ListSkeleton';
import SegmentedFilterBar, { FilterSegment } from '@/components/shared/SegmentedFilterBar';

type CarSegment = 'all' | 'available' | 'unavailable' | 'scheduled';

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const { t } = useTranslation();
  const [segment, setSegment] = useState<CarSegment>('all');
  const [search, setSearch] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteCar, setNoteCar] = useState<any>(null);


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
    return cars.map((c: any) => {
      const active = isCarScheduledUnavailableToday(periods, c.id);
      const upcoming = nextScheduledUnavailability(periods, c.id);
      return {
        ...c,
        _scheduledActive: active || null,
        _scheduledUpcoming: upcoming || null,
      };
    });
  }, [cars, periods]);

  const filteredCars = useMemo(() => {
    let list = enrichedCars;
    if (segment === 'available') list = list.filter((c: any) => c.is_available !== false);
    else if (segment === 'unavailable') list = list.filter((c: any) => c.is_available === false);
    else if (segment === 'scheduled') list = list.filter((c: any) => c._scheduledActive || c._scheduledUpcoming);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.car_number?.toLowerCase().includes(q) ||
          c.number_plate?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enrichedCars, segment, search]);

  const segments: FilterSegment[] = useMemo(() => {
    const available = enrichedCars.filter((c: any) => c.is_available !== false).length;
    const unavailable = enrichedCars.length - available;
    const scheduled = enrichedCars.filter((c: any) => c._scheduledActive || c._scheduledUpcoming).length;
    return [
      { key: 'all', label: t('common.all') || 'Alle', count: enrichedCars.length },
      { key: 'available', label: t('cars.available') || 'Tilgængelige', count: available },
      { key: 'unavailable', label: t('cars.unavailable') || 'Optaget', count: unavailable, highlight: unavailable > 0 },
      { key: 'scheduled', label: 'Planlagt værksted', count: scheduled },
    ];
  }, [enrichedCars, t]);

  return (
    <DataFetchErrorBoundary>
      <PullToRefresh onRefresh={async () => { await fetchCars(); }}>
        <TooltipProvider>
          <ListPageShell
            title={t('navigation.cars')}
            description={t('cars.pageDescription')}
            actions={
              <>
                <FalckSubscriptionButton isAdmin={isAdmin} />
                <VWAssistanceButton />
                {isAdmin && (
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="h-4 w-4" />
                    {t('cars.addNewCar')}
                  </Button>
                )}
              </>
            }
            filterBar={
              <SegmentedFilterBar
                segments={segments}
                activeKey={segment}
                onSegmentChange={(k) => setSegment(k as CarSegment)}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={t('cars.searchPlaceholder') || 'Søg bilnr, navn, nummerplade…'}
              />
            }
          >
            {loading ? (
              <ListSkeleton />
            ) : error ? (
              <div className="p-6">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg text-sm">
                  {error}
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-6">
                {filteredCars.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {t('cars.noResults')}
                  </div>
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
        </TooltipProvider>
      </PullToRefresh>
    </DataFetchErrorBoundary>
  );
};

export default CarsPage;
