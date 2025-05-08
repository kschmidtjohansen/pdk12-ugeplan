
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import CarsList from '@/components/Cars/CarsList';
import CarPageHeader from '@/components/Cars/CarPageHeader';
import CarDialogs from '@/components/Cars/CarDialogs';
import { useCars } from '@/hooks/useCars';
import { convertCarToCarData } from '@/types/car';

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const {
    cars,
    currentCar,
    formData,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleCreateNew,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit
  } = useCars();

  // Convert cars to CarData format for the components that still use it
  const carsData = cars.map(convertCarToCarData);

  return (
    <>
      <CarPageHeader 
        onCreateNew={handleCreateNew}
        isAdmin={isAdmin}
      />

      <CarsList 
        cars={carsData} 
        canEdit={false} // Now only admins can edit, controlled in the component
        canViewFuelCardCode={canViewFuelCardCode} 
        isAdmin={isAdmin}
        onEdit={(carData) => {
          // Find the original Car object that matches this CarData
          const originalCar = cars.find(car => car.id === carData.id);
          if (originalCar) {
            handleEdit(originalCar);
          }
        }}
        onDelete={(carData) => {
          // Find the original Car object that matches this CarData
          const originalCar = cars.find(car => car.id === carData.id);
          if (originalCar) {
            handleDelete(originalCar);
          }
        }}
      />

      <CarDialogs
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        formData={formData}
        onInputChange={handleInputChange}
        onCheckboxChange={handleCheckboxChange}
        onSubmit={handleSubmit}
        currentCar={currentCar ? convertCarToCarData(currentCar) : null}
        canViewFuelCardCode={canViewFuelCardCode}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
};

export default CarsPage;
