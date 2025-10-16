import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { WarehouseTableRowProps } from './types';

const WarehouseTableRow: React.FC<WarehouseTableRowProps> = ({ item, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell className="font-medium">{item.address}</TableCell>
      <TableCell>{item.case_number || '-'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {item.is_cleaned ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">{t('warehouse.cleaned')}</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('warehouse.notCleaned')}</span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        {item.hall ? (
          <span className="text-sm">
            {item.hall === 'hal_1' ? t('warehouse.halls.hal1') : t('warehouse.halls.sortHal')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell className="max-w-xs truncate">{item.notes || '-'}</TableCell>
      {canEdit && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

export default WarehouseTableRow;
