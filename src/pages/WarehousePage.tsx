import React, { useMemo, useState } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useWarehouse } from '@/hooks/warehouse';
import { useLocations } from '@/hooks/warehouse/useLocations';
import WarehouseList from '@/components/Warehouse/WarehouseList';
import WarehouseFormDialog from '@/components/Warehouse/WarehouseFormDialog';
import WarehouseDeleteDialog from '@/components/Warehouse/WarehouseDeleteDialog';

import ListSkeleton from '@/components/shared/ListSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ListPageShell from '@/components/shared/ListPageShell';
import SegmentedFilterBar from '@/components/shared/SegmentedFilterBar';

const WarehousePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isWarehouseEnabled, selectedDepartmentId } = useDepartment();
  const { locations } = useLocations(selectedDepartmentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [cleanedFilter, setCleanedFilter] = useState<string>('all');
  const [hallFilter, setHallFilter] = useState<string>('all');
  const {
    items, loading, error, isFormOpen, editingItem, isDeleteOpen, deletingItem,
    openAddDialog, openEditDialog, closeFormDialog, openDeleteDialog, closeDeleteDialog,
    createItem, updateItem, deleteItem, loading: actionLoading,
  } = useWarehouse();

  const canEdit = user?.role === 'super_admin' || user?.role === 'administrator' || user?.role === 'skadeleder';

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (cleanedFilter !== 'all' && item.is_cleaned !== cleanedFilter) return false;
      if (hallFilter !== 'all' && item.hall !== hallFilter) return false;
      if (!q) return true;
      return [item.address, item.case_number, item.notes]
        .some((field) => field?.toLowerCase().includes(q));
    });
  }, [items, searchQuery, cleanedFilter, hallFilter]);

  const countFor = (key: string) =>
    key === 'all' ? items.length : items.filter((i) => i.is_cleaned === key).length;

  const segments = [
    { key: 'all', label: t('common.all'), count: items.length },
    { key: 'ja', label: t('warehouse.cleanedStatus.ja'), count: countFor('ja') },
    { key: 'nej', label: t('warehouse.cleanedStatus.nej'), count: countFor('nej') },
    { key: 'ikke_noedvendigt', label: t('warehouse.cleanedStatus.ikke_noedvendigt'), count: countFor('ikke_noedvendigt') },
  ];

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
        filterBar={
          <SegmentedFilterBar
            segments={segments}
            activeKey={cleanedFilter}
            onSegmentChange={(key) => setCleanedFilter(key)}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('warehouse.searchPlaceholder')}
            trailing={
              locations.length > 0 && (
                <Select value={hallFilter} onValueChange={setHallFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder={t('warehouse.fields.hall')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('warehouse.allLocations')}</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.key} value={loc.key}>{loc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
          />
        }
      >
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="p-6">
            <p className="text-destructive">{t('warehouse.messages.loadError')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={items.length === 0 ? t('warehouse.empty.title') : t('warehouse.noResults.title')}
              description={items.length === 0 ? t('warehouse.empty.description') : t('warehouse.noResults.description')}
              icon={items.length === 0 ? <Package className="h-12 w-12" /> : <Search className="h-12 w-12" />}
            />
          </div>
        ) : (
          <div className="p-3 sm:p-6">
            <WarehouseList
              items={filteredItems}
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
