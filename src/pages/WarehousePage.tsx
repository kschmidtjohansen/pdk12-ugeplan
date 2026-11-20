import React, { useMemo, useState } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useWarehouse } from '@/hooks/warehouse';
import { useLocations } from '@/hooks/warehouse/useLocations';
import WarehouseList from '@/components/Warehouse/WarehouseList';
import WarehouseFormDialog from '@/components/Warehouse/WarehouseFormDialog';
import WarehouseDeleteDialog from '@/components/Warehouse/WarehouseDeleteDialog';

import ListSkeleton from '@/components/shared/ListSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ListPageShell from '@/components/shared/ListPageShell';
import FacetKpi from '@/components/shared/FacetKpi';
import { SlidingSegments } from '@/components/ui/sliding-segments';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { formatListCount } from '@/components/shared/listCount';

const WarehousePage = () => {
  const { t, currentLanguage } = useTranslation();
  const { canManageWarehouse, canViewWarehouse } = usePermissions();
  const { isWarehouseEnabled, selectedDepartmentId, selectedDepartment } = useDepartment();
  const { locations } = useLocations(selectedDepartmentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [cleanedFilter, setCleanedFilter] = useState<string>('all');
  const [hallFilter, setHallFilter] = useState<string>('all');
  const {
    items, loading, error, isFormOpen, editingItem, isDeleteOpen, deletingItem,
    openAddDialog, openEditDialog, closeFormDialog, openDeleteDialog, closeDeleteDialog,
    createItem, updateItem, deleteItem, loading: actionLoading,
  } = useWarehouse();

  const canEdit = canManageWarehouse;

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

  const da = currentLanguage !== 'en';
  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const filtered = cleanedFilter !== 'all' || hallFilter !== 'all' || !!searchQuery.trim();
  const resetFilters = () => { setSearchQuery(''); setCleanedFilter('all'); setHallFilter('all'); };

  const handleSubmit = async (data) => {
    if (editingItem) await updateItem(editingItem.id, data);
    else await createItem(data);
  };

  const handleDelete = async () => {
    if (deletingItem) await deleteItem(deletingItem.id);
  };

  if (!isWarehouseEnabled || !canViewWarehouse) {
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
        eyebrow={selectedDepartment?.name}
        meta={loading ? undefined : formatListCount(filteredItems.length, items.length, cleanedFilter !== 'all' || hallFilter !== 'all' || !!searchQuery.trim(), currentLanguage !== 'en')}
        actions={
          canEdit && (
            <Button onClick={openAddDialog} className="rounded-full">
              <Plus className="h-4 w-4" />
              {t('warehouse.addNew')}
            </Button>
          )
        }
        filterBar={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FacetKpi label={da ? 'Paller og møbelkasser' : 'Pallets and boxes'} value={totalUnits} sub={da ? 'på lager i alt' : 'in storage in total'} />
              <FacetKpi label={da ? 'Opbevaringer' : 'Storages'} value={items.length} sub={da ? 'sager med indbo' : 'cases with contents'}
                onClick={() => setCleanedFilter('all')} active={cleanedFilter === 'all' && filtered} />
              <FacetKpi label={da ? 'Ikke rengjort' : 'Not cleaned'} value={countFor('nej')} sub={da ? 'venter på rengøring' : 'waiting for cleaning'}
                onClick={() => setCleanedFilter((f) => (f === 'nej' ? 'all' : 'nej'))} active={cleanedFilter === 'nej'} />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-[26rem]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('warehouse.searchPlaceholder')}
                  aria-label={t('warehouse.searchPlaceholder')} className="h-11 rounded-full bg-card pl-10 shadow-flade" />
              </div>
              {locations.length > 0 && (
                <SlidingSegments
                  ariaLabel={t('warehouse.fields.hall')}
                  value={hallFilter}
                  onChange={setHallFilter}
                  className="max-w-full overflow-x-auto"
                  segments={[{ key: 'all', label: t('warehouse.allLocations'), dot: null }, ...locations.map((loc) => ({ key: loc.key, label: loc.label, dot: null }))]}
                />
              )}
              <Select value={cleanedFilter} onValueChange={setCleanedFilter}>
                <SelectTrigger className="h-11 w-[200px] rounded-full bg-card shadow-flade sm:h-10" aria-label={t('warehouse.fields.isCleaned')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{da ? 'Alle (rengjort?)' : 'All (cleaned?)'}</SelectItem>
                  {(['ja', 'nej', 'ikke_noedvendigt'] as const).map((k) => (
                    <SelectItem key={k} value={k}>{t(`warehouse.cleanedStatus.${k}`)} ({countFor(k)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filtered && (
                <Button variant="ghost" className="h-10 gap-1 rounded-full" onClick={resetFilters}>
                  <X className="h-3.5 w-3.5" />
                  {da ? `Ryd filtre · ${filteredItems.length} af ${items.length}` : `Clear filters · ${filteredItems.length} of ${items.length}`}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="p-3 sm:p-6">
            <ErrorState title={t('warehouse.messages.loadError')} description={error} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={items.length === 0 ? t('warehouse.empty.title') : t('warehouse.noResults.title')}
              description={items.length === 0 ? t('warehouse.empty.description') : t('warehouse.noResults.description')}
              icon={items.length === 0 ? <Package /> : <Search />}
              variant={items.length === 0 ? 'empty' : 'filtered'}
              action={items.length === 0
                ? (canEdit ? { label: t('warehouse.addNew'), onClick: openAddDialog } : undefined)
                : { label: currentLanguage === 'en' ? 'Clear filters' : 'Ryd filtre', onClick: resetFilters }}
            />
          </div>
        ) : (
          <div>
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
