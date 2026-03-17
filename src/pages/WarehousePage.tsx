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
      <div className="container mx-auto py-16 text-center">
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
    <div className="min-h-screen bg-muted/10">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-lg animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {t('warehouse.title')}
                </h1>
              </div>
            </div>
          </div>
        </div>

      <div className="space-y-6">
        {canEdit && (
          <div className="flex justify-end">
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('warehouse.addNew')}
            </Button>
          </div>
        )}

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
    </div>
    </DataFetchErrorBoundary>
  );
};

export default WarehousePage;
