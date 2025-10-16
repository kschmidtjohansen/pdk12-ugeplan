import { useWarehouseData } from './useWarehouseData';
import { useWarehouseActions } from './useWarehouseActions';
import { useWarehouseFormState } from './useWarehouseFormState';

export const useWarehouse = () => {
  const formState = useWarehouseFormState();
  const { items, loading, error, refetch } = useWarehouseData();
  const actions = useWarehouseActions(() => {
    formState.closeFormDialog();
    formState.closeDeleteDialog();
  });

  return {
    items,
    loading,
    error,
    refetch,
    ...formState,
    ...actions,
  };
};

export { useWarehouseData, useWarehouseActions, useWarehouseFormState };
