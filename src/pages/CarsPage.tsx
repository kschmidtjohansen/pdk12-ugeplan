
import React from 'react';
import { usePermissions } from '../context/AuthContext';
import CarsList from '@/components/Cars/CarsList';
import CarPageHeader from '@/components/Cars/CarPageHeader';
import CarDialogs from '@/components/Cars/CarDialogs';
import CarMarkUnavailableDialog from '@/components/Cars/CarMarkUnavailableDialog';
import CarMarkAvailableDialog from '@/components/Cars/CarMarkAvailableDialog';
import { useCars } from '@/hooks/car';
import { TooltipProvider } from '@/components/ui/tooltip';

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
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
      <CarPageHeader 
        onCreateNew={handleCreateNew}
        isAdmin={isAdmin}
      />

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-polygon-blue"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
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
      
      {/* New dialogs for car availability management */}
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
  );
};

export default CarsPage;
