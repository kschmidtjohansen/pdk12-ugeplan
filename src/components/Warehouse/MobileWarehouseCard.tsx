import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { MobileWarehouseCardProps } from './types';
import { useDepartment } from '@/context/DepartmentContext';

const formatLocationFallback = (id: string) =>
  id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const useLocationLabel = (hallId: string | null, departmentId: string | null): string | null => {
  return React.useMemo(() => {
    if (!hallId || !departmentId) return null;
    try {
      const raw = localStorage.getItem(`location-data-${departmentId}`);
      if (!raw) return formatLocationFallback(hallId);
      const locations = JSON.parse(raw);
      const found = Array.isArray(locations) ? locations.find((l: any) => (l.key || l.id) === hallId) : null;
      return found ? (found.label || found.name) : formatLocationFallback(hallId);
    } catch {
      return formatLocationFallback(hallId);
    }
  }, [hallId, departmentId]);
};

const MobileWarehouseCard: React.FC<MobileWarehouseCardProps> = ({ item, onEdit, onDelete, canEdit }) => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const locationLabel = useLocationLabel(item.hall, selectedDepartmentId);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('warehouse.fields.address')}</p>
            <p className="text-base font-semibold">{item.address}</p>
          </div>
          
          {item.case_number && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('warehouse.fields.caseNumber')}</p>
              <p className="text-base">{item.case_number}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('warehouse.fields.isCleaned')}</p>
              <span className={`text-sm ${
                item.is_cleaned === 'ja' ? 'text-green-600' : 
                item.is_cleaned === 'ikke_noedvendigt' ? 'text-blue-600' : 
                'text-muted-foreground'
              }`}>
                {t(`warehouse.cleanedStatus.${item.is_cleaned}`)}
              </span>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('warehouse.fields.quantity')}</p>
              <p className="text-base font-semibold mt-1">{item.quantity}</p>
            </div>
          </div>
          
          {locationLabel && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('warehouse.fields.hall')}</p>
              <p className="text-base">{locationLabel}</p>
            </div>
          )}
          
          {item.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('warehouse.fields.notes')}</p>
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </div>
          )}
          
          {canEdit && (
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(item)}
                className="w-full gap-2 hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                {t('warehouse.actions.markAsDelivered')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="w-full gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t('warehouse.actions.edit')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileWarehouseCard;
