import { useWarehouseData } from './useWarehouseData';
import { useWarehouseActions } from './useWarehouseActions';
import { useWarehouseFormState } from './useWarehouseFormState';

export const useWarehouse = () => {
  const formState = useWarehouseFormState();
  const { items, loading, error, refetch, addLocalItem, updateLocalItem, deleteLocalItem } = useWarehouseData();
  const actions = useWarehouseActions(() => {
    formState.closeFormDialog();
    formState.closeDeleteDialog();
  }, { addLocalItem, updateLocalItem, deleteLocalItem });

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
