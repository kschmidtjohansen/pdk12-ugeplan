import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WarehouseTableRowProps } from './types';

const WarehouseTableRow: React.FC<WarehouseTableRowProps> = ({ item, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell className="font-medium">{item.address}</TableCell>
      <TableCell>{item.case_number || '-'}</TableCell>
      <TableCell>
        <span className={`text-sm ${
          item.is_cleaned === 'ja' ? 'text-green-600' : 
          item.is_cleaned === 'ikke_noedvendigt' ? 'text-blue-600' : 
          'text-muted-foreground'
        }`}>
          {t(`warehouse.cleanedStatus.${item.is_cleaned}`)}
        </span>
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
      <TableCell className="max-w-xs">
        {item.notes ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate block cursor-help">
                  {item.notes}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <p className="whitespace-normal break-words">{item.notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {canEdit && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
              className="gap-2 hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {t('warehouse.actions.markAsDelivered')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

export default WarehouseTableRow;
