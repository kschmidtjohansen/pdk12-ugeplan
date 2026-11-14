import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Pencil, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WarehouseTableRowProps } from './types';
import RowActions from '@/components/shared/RowActions';
import { useDepartment } from '@/context/DepartmentContext';
import { useLocations } from '@/hooks/warehouse/useLocations';

const WarehouseTableRow: React.FC<WarehouseTableRowProps> = ({ item, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const { getLocationLabel } = useLocations(selectedDepartmentId);
  const locationLabel = getLocationLabel(item.hall);

  return (
    <TableRow>
      <TableCell className="font-medium">{item.address}</TableCell>
      <TableCell>{item.case_number || '-'}</TableCell>
      <TableCell>
        <span className={`text-sm ${
          item.is_cleaned === 'ja' ? 'text-success' : 
          item.is_cleaned === 'ikke_noedvendigt' ? 'text-info' : 
          'text-muted-foreground'
        }`}>
          {t(`warehouse.cleanedStatus.${item.is_cleaned}`)}
        </span>
      </TableCell>
      <TableCell>
        {locationLabel ? (
          <span className="text-sm">{locationLabel}</span>
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
          <RowActions
            subject={item.address}
            primary={{ key: 'delivered', label: t('warehouse.actions.markAsDelivered'), icon: CheckCircle, onClick: () => onDelete(item) }}
            items={[{ key: 'edit', label: t('common.edit'), icon: Pencil, onClick: () => onEdit(item) }]}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

export default WarehouseTableRow;
