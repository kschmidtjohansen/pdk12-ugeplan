
import React from 'react';
import { usePermissions } from '../context/AuthContext';
import CarsList from '@/components/Cars/CarsList';
import CarPageHeader from '@/components/Cars/CarPageHeader';
import CarDialogs from '@/components/Cars/CarDialogs';
import { useCars } from '@/hooks/useCars';

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

  return (
    <>
      <CarPageHeader 
        onCreateNew={handleCreateNew}
        isAdmin={isAdmin}
      />

      <CarsList 
        cars={cars} 
        canEdit={false} // Now only admins can edit, controlled in the component
        canViewFuelCardCode={canViewFuelCardCode} 
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
        currentCar={currentCar}
        canViewFuelCardCode={canViewFuelCardCode}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
};

export default CarsPage;
