import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/context/TranslationContext';
import WarehouseTableRow from './WarehouseTableRow';
import { WarehouseListProps } from './types';

const WarehouseTable: React.FC<WarehouseListProps> = ({ items, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">{t('warehouse.fields.address')}</TableHead>
            <TableHead className="font-semibold">{t('warehouse.fields.caseNumber')}</TableHead>
            <TableHead className="font-semibold">{t('warehouse.fields.isCleaned')}</TableHead>
            <TableHead className="font-semibold">{t('warehouse.fields.hall')}</TableHead>
            <TableHead className="font-semibold">{t('warehouse.fields.quantity')}</TableHead>
            <TableHead className="font-semibold">{t('warehouse.fields.notes')}</TableHead>
            {canEdit && <TableHead className="font-semibold text-right">{t('common.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <WarehouseTableRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WarehouseTable;
