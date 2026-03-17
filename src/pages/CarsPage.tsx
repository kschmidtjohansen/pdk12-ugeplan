
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
import { Car, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import FalckSubscriptionButton from '@/components/Cars/FalckSubscriptionButton';

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
    markCarAvailableDeleteNote
  } = useCars();

  return (
    <DataFetchErrorBoundary>
    <PullToRefresh onRefresh={async () => { await fetchCars(); }}>
    <TooltipProvider>
      <div className="min-h-screen w-full bg-background">
        <div className="w-full px-3 sm:px-4 lg:px-8 py-6 space-y-6">
          {/* Clean Card Header */}
          <div className="bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {t("navigation.cars")}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("cars.pageDescription")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FalckSubscriptionButton isAdmin={isAdmin} />
                {isAdmin && (
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('cars.addNewCar')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Cars Content */}
          <div className="bg-card rounded-xl border border-border/40 shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
                  {error}
                </div>
              </div>
            ) : (
              <div className="p-6">
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
