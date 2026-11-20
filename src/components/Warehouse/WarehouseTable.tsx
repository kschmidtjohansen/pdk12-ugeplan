import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/context/TranslationContext';
import WarehouseTableRow from './WarehouseTableRow';
import { WarehouseListProps } from './types';

const WarehouseTable: React.FC<WarehouseListProps> = ({ items, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('warehouse.fields.address')}</TableHead>
            <TableHead>{t('warehouse.fields.caseNumber')}</TableHead>
            <TableHead>{t('warehouse.fields.isCleaned')}</TableHead>
            <TableHead>{t('warehouse.fields.hall')}</TableHead>
            <TableHead>{t('warehouse.fields.quantity')}</TableHead>
            <TableHead>{t('warehouse.fields.notes')}</TableHead>
            {canEdit && <TableHead className="text-right">{t('common.actions')}</TableHead>}
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
