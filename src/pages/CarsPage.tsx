
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
    loading,
    error,
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
          canEdit={false} // Now only admins can edit, controlled in the component
          canViewFuelCardCode={canViewFuelCardCode} 
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
    </>
  );
};

export default CarsPage;
