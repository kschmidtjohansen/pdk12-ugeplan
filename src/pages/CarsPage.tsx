import React from 'react';
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
import PageHeader from '@/components/Layout/PageHeader';

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const { t } = useTranslation();
  const {
    cars,
    loading,
    error,
    currentCar,
    formData,
    setFormData,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    unavailableDialogOpen,
    setUnavailableDialogOpen,
    availableDialogOpen,
    setAvailableDialogOpen,
    handleCreateNew,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit,
    handleToggleAvailability,
    fetchCars,
    markCarUnavailable,
    markCarAvailableKeepNote,
    markCarAvailableDeleteNote,
  } = useCars();

  return (
    <DataFetchErrorBoundary>
      <PullToRefresh onRefresh={async () => { await fetchCars(); }}>
        <TooltipProvider>
          <div className="min-h-screen w-full bg-background">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-5">
              <PageHeader
                title={t('navigation.cars')}
                description={t('cars.pageDescription')}
              >
                <FalckSubscriptionButton isAdmin={isAdmin} />
                {isAdmin && (
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="h-4 w-4" />
                    {t('cars.addNewCar')}
                  </Button>
                )}
              </PageHeader>

              <div className="rounded-xl border border-border bg-card shadow-xs">
                {loading ? (
                  <div className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary"></div>
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
                      cars={cars}
                      canEdit={false}
                      canViewFuelCardCode={canViewFuelCardCode}
                      isAdmin={isAdmin}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  </div>
                )}
              </div>

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
            </div>
          </div>
        </TooltipProvider>
      </PullToRefresh>
    </DataFetchErrorBoundary>
  );
};

export default CarsPage;
