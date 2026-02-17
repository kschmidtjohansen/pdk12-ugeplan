import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WarehouseTableRowProps } from './types';
import { useDepartment } from '@/context/DepartmentContext';

const useLocationLabel = (hallId: string | null, departmentId: string | null): string | null => {
  return React.useMemo(() => {
    if (!hallId || !departmentId) return null;
    try {
      const raw = localStorage.getItem(`location-data-${departmentId}`);
      if (!raw) return hallId;
      const locations = JSON.parse(raw);
      const found = Array.isArray(locations) ? locations.find((l: any) => l.id === hallId) : null;
      return found ? found.name : hallId;
    } catch {
      return hallId;
    }
  }, [hallId, departmentId]);
};

const WarehouseTableRow: React.FC<WarehouseTableRowProps> = ({ item, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const locationLabel = useLocationLabel(item.hall, selectedDepartmentId);

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
