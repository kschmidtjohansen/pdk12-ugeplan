import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useWarehouse } from '@/hooks/warehouse';
import WarehouseList from '@/components/Warehouse/WarehouseList';
import WarehouseFormDialog from '@/components/Warehouse/WarehouseFormDialog';
import WarehouseDeleteDialog from '@/components/Warehouse/WarehouseDeleteDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ListPageShell from '@/components/shared/ListPageShell';

const WarehousePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isWarehouseEnabled } = useDepartment();
  const {
    items, loading, error, isFormOpen, editingItem, isDeleteOpen, deletingItem,
    openAddDialog, openEditDialog, closeFormDialog, openDeleteDialog, closeDeleteDialog,
    createItem, updateItem, deleteItem, loading: actionLoading,
  } = useWarehouse();

  const canEdit = user?.role === 'super_admin' || user?.role === 'administrator' || user?.role === 'skadeleder';

  const handleSubmit = async (data: any) => {
    if (editingItem) await updateItem(editingItem.id, data);
    else await createItem(data);
  };

  const handleDelete = async () => {
    if (deletingItem) await deleteItem(deletingItem.id);
  };

  if (!isWarehouseEnabled) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">{t('admin.features.featureDisabled')}</p>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
      <ListPageShell
        title={t('warehouse.title')}
        description={t('warehouse.description') || ''}
        actions={
          canEdit && (
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4" />
              {t('warehouse.addNew')}
            </Button>
          )
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-destructive">{t('warehouse.messages.loadError')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={t('warehouse.empty.title')}
              description={t('warehouse.empty.description')}
              icon={<Package className="h-12 w-12" />}
            />
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <WarehouseList
              items={items}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              canEdit={canEdit}
            />
          </div>
        )}
      </ListPageShell>

      <WarehouseFormDialog
        open={isFormOpen}
        onOpenChange={closeFormDialog}
        editingItem={editingItem}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />
      <WarehouseDeleteDialog
        open={isDeleteOpen}
        onOpenChange={closeDeleteDialog}
        item={deletingItem}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </DataFetchErrorBoundary>
  );
};

export default WarehousePage;
