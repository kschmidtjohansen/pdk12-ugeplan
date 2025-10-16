import { useState } from 'react';
import { WarehouseItem } from '@/types/warehouse';

export const useWarehouseFormState = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<WarehouseItem | null>(null);

  const openAddDialog = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (item: WarehouseItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const openDeleteDialog = (item: WarehouseItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setDeletingItem(null);
  };

  return {
    isFormOpen,
    editingItem,
    isDeleteOpen,
    deletingItem,
    openAddDialog,
    openEditDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
  };
};
