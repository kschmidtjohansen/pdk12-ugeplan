
import React from 'react';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import CarsList from '@/components/Cars/CarsList';
import CarPageHeader from '@/components/Cars/CarPageHeader';
import CarDialogs from '@/components/Cars/CarDialogs';
import CarMarkUnavailableDialog from '@/components/Cars/CarMarkUnavailableDialog';
import CarMarkAvailableDialog from '@/components/Cars/CarMarkAvailableDialog';
import { useCars } from '@/hooks/car';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Car } from 'lucide-react';

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
    <TooltipProvider>
      <div className="space-y-8">
        {/* Enhanced Page Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-large animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t("navigation.cars")}
              </h1>
              <p className="text-blue-100 text-lg">
                {t("cars.pageDescription")}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="p-3 rounded-xl bg-white/10">
                <Car className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Cars Header with Actions */}
        <div className="animate-slide-in-right">
          <CarPageHeader 
            onCreateNew={handleCreateNew}
            isAdmin={isAdmin}
          />
        </div>

        {/* Cars Content */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl shadow-soft">
              {error}
            </div>
          ) : (
            <CarsList 
              cars={cars} 
              canEdit={false}
              canViewFuelCardCode={canViewFuelCardCode} 
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
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
    </TooltipProvider>
  );
};

export default CarsPage;
