import React, { useState, useMemo } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import CarsList from '@/components/Cars/CarsList';
import CarDialogs from '@/components/Cars/CarDialogs';
import CarMarkUnavailableDialog from '@/components/Cars/CarMarkUnavailableDialog';
import CarMarkAvailableDialog from '@/components/Cars/CarMarkAvailableDialog';
import { useCars } from '@/hooks/car';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import FalckSubscriptionButton from '@/components/Cars/FalckSubscriptionButton';
import ListPageShell from '@/components/shared/ListPageShell';
import SegmentedFilterBar, { FilterSegment } from '@/components/shared/SegmentedFilterBar';

type CarSegment = 'all' | 'available' | 'unavailable';

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const { t } = useTranslation();
  const [segment, setSegment] = useState<CarSegment>('all');
  const [search, setSearch] = useState('');

  const {
    cars, loading, error, currentCar, formData, setFormData,
    dialogOpen, setDialogOpen, deleteDialogOpen, setDeleteDialogOpen,
    unavailableDialogOpen, setUnavailableDialogOpen, availableDialogOpen, setAvailableDialogOpen,
    handleCreateNew, handleEdit, handleDelete, confirmDelete,
    handleInputChange, handleCheckboxChange, handleSubmit, handleToggleAvailability,
    fetchCars, markCarUnavailable, markCarAvailableKeepNote, markCarAvailableDeleteNote,
  } = useCars();

  const filteredCars = useMemo(() => {
    let list = cars;
    if (segment === 'available') list = list.filter((c: any) => c.is_available !== false);
    else if (segment === 'unavailable') list = list.filter((c: any) => c.is_available === false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.car_number?.toLowerCase().includes(q) ||
          c.license_plate?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cars, segment, search]);

  const segments: FilterSegment[] = useMemo(() => {
    const available = cars.filter((c: any) => c.is_available !== false).length;
    const unavailable = cars.length - available;
    return [
      { key: 'all', label: t('common.all') || 'Alle', count: cars.length },
      { key: 'available', label: t('cars.available') || 'Tilgængelige', count: available },
      { key: 'unavailable', label: t('cars.unavailable') || 'Optaget', count: unavailable, highlight: unavailable > 0 },
    ];
  }, [cars, t]);

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
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg text-sm">
                  {error}
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <CarsList
                  cars={filteredCars}
                  canEdit={false}
                  canViewFuelCardCode={canViewFuelCardCode}
                  isAdmin={isAdmin}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAvailability={handleToggleAvailability}
                />
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
        </TooltipProvider>
      </PullToRefresh>
    </DataFetchErrorBoundary>
  );
};

export default CarsPage;
