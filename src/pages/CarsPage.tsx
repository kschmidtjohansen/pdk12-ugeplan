
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

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const { t } = useTranslation();
  const {
    cars,
    loading,
    error,
    currentCar,
    formData,
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
    markCarUnavailable,
    markCarAvailableKeepNote,
    markCarAvailableDeleteNote
  } = useCars();

  return (
    <DataFetchErrorBoundary>
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
          {/* Enhanced Header with Glassmorphism */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {t("navigation.cars")}
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  {t("cars.pageDescription")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button 
                    onClick={handleCreateNew}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('cars.addNewCar')}
                  </Button>
                )}
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <Car className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Cars Content */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
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
            onInputChange={handleInputChange}
            onCheckboxChange={handleCheckboxChange}
            onSubmit={handleSubmit}
            currentCar={currentCar}
            canViewFuelCardCode={canViewFuelCardCode}
            onConfirmDelete={confirmDelete}
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
    </DataFetchErrorBoundary>
  );
};

export default CarsPage;
