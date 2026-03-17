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

const WarehousePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isWarehouseEnabled } = useDepartment();
  const {
    items,
    loading,
    error,
    isFormOpen,
    editingItem,
    isDeleteOpen,
    deletingItem,
    openAddDialog,
    openEditDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
    createItem,
    updateItem,
    deleteItem,
    loading: actionLoading,
  } = useWarehouse();

  const canEdit = user?.role === 'super_admin' || user?.role === 'administrator' || user?.role === 'skadeleder';

  const handleSubmit = async (data: any) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const handleDelete = async () => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);
    }
  };

  if (!isWarehouseEnabled) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-8 py-16 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">{t('admin.features.featureDisabled')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">{t('warehouse.messages.loadError')}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 lg:px-8 py-6 space-y-6">
        {/* Clean Card Header */}
        <div className="bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {t('warehouse.title')}
              </h1>
            </div>
            {canEdit && (
              <Button onClick={openAddDialog} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('warehouse.addNew')}
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={t('warehouse.empty.title')}
            description={t('warehouse.empty.description')}
            icon={<Package className="h-12 w-12" />}
          />
        ) : (
          <WarehouseList
            items={items}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            canEdit={canEdit}
          />
        )}

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
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default WarehousePage;
