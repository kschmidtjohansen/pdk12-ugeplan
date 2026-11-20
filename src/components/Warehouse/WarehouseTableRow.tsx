import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Pencil, Check, MapPin } from 'lucide-react';
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
      <TableCell className="py-4 font-semibold text-foreground">{item.address}</TableCell>
      <TableCell className="font-mono text-sm text-primary-strong">{item.case_number || '-'}</TableCell>
      <TableCell>
        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          item.is_cleaned === 'ja' ? 'bg-success-soft text-success-soft-foreground' :
          item.is_cleaned === 'ikke_noedvendigt' ? 'bg-muted text-muted-foreground' :
          'bg-warning-soft text-warning-soft-foreground'
        }`}>
          {t(`warehouse.cleanedStatus.${item.is_cleaned}`)}
        </span>
      </TableCell>
      <TableCell>
        {locationLabel ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[8px] bg-info-soft px-2 py-1 text-xs font-semibold text-info-soft-foreground">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />{locationLabel}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="font-display text-lg font-bold tabular-nums">{item.quantity}</TableCell>
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
            primaryLabelled
            primary={{ key: 'delivered', label: t('warehouse.actions.markAsDelivered'), icon: Check, onClick: () => onDelete(item) }}
            items={[{ key: 'edit', label: t('common.edit'), icon: Pencil, onClick: () => onEdit(item) }]}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

export default WarehouseTableRow;
