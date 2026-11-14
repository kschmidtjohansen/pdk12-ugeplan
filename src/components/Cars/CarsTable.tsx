
import React from 'react';
import RowActions from '@/components/shared/RowActions';
import { Edit, Trash2, Check, X, ToggleLeft, ToggleRight, Info, Truck, Recycle, CalendarClock, Wrench, StickyNote } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface CarsTableProps {
  cars: CarData[];
  todayDrivers?: Map<string, string[]>;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
  onToggleAvailability: (car: CarData) => void;
  onSchedule?: (car: CarData) => void;
  onEditNote?: (car: CarData) => void;
}


const CarsTable: React.FC<CarsTableProps> = ({
  cars,
  todayDrivers,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete,
  onToggleAvailability,
  onSchedule,
  onEditNote,
}) => {

  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  
  return (
    <div className="overflow-x-auto">
      <Table aria-label={t('navigation.cars')}>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-border">
            <TableHead className="text-muted-foreground font-medium">{t('cars.carNumber')}</TableHead>
            <TableHead className="text-muted-foreground font-medium">{t('cars.vehicleName')}</TableHead>
            <TableHead className="text-muted-foreground font-medium">{t('cars.numberPlate')}</TableHead>
            {canViewFuelCardCode && <TableHead className="text-muted-foreground font-medium">{t('cars.fuelCardCode')}</TableHead>}
            <TableHead className="text-muted-foreground font-medium">{t('cars.hasTrailerHitch')}</TableHead>
            <TableHead className="text-muted-foreground font-medium">{t('cars.isAvailable')}</TableHead>
            <TableHead className="w-[104px] text-right text-muted-foreground font-medium">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id} className="border-border hover:bg-muted/50">
              <TableCell>
                <span className="font-mono text-sm font-semibold text-foreground">{car.car_number}</span>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-foreground">{car.name}</div>
                <div className="text-xs text-muted-foreground">
                  {todayDrivers?.get(car.id)?.length
                    ? `${t('cars.todayDriver')}: ${todayDrivers.get(car.id)?.join(', ')}`
                    : t('cars.notBookedToday')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{car.number_plate}</span>
                  {car.number_plate.toLowerCase().includes('trailer') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Truck className="h-4 w-4 text-warning" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('ui.trailer')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {car.number_plate.toLowerCase().includes('miljø') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Recycle className="h-4 w-4 text-success" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('ui.environmentalVan')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              {canViewFuelCardCode && (
                <TableCell>
                  <code className="bg-muted text-foreground px-2 py-1 rounded text-xs font-mono">{car.fuel_card_code}</code>
                </TableCell>
              )}
              <TableCell>
                {car.has_trailer_hitch ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-foreground">{t('common.yes')}</span>
                    {(car.towing_capacity_with_brakes || car.towing_capacity_without_brakes || car.total_weight) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-primary cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            {car.towing_capacity_with_brakes && (
                              <p>Med bremser: {car.towing_capacity_with_brakes} kg</p>
                            )}
                            {car.towing_capacity_without_brakes && (
                              <p>Uden bremser: {car.towing_capacity_without_brakes} kg</p>
                            )}
                            {car.total_weight && (
                              <p>Totalvægt: {car.total_weight} kg</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <X className="h-4 w-4 mr-2 text-muted-foreground/50" />
                    <span className="text-muted-foreground">{t('common.no')}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-2">
                  {car.is_available ? (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                      <span className="text-foreground">{t('common.available')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-destructive rounded-full mr-2"></div>
                      <span className="text-foreground">{t('common.unavailable')}</span>
                    </div>
                  )}
                  {(car as CarScheduleExtras)._scheduledActive && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-warning-soft text-warning-soft-foreground">
                      <Wrench className="h-3 w-3" />
                      {da ? 'Planlagt utilgængelig til' : 'Scheduled unavailable until'} {(car as CarScheduleExtras)._scheduledActive?.end_date}
                    </span>
                  )}
                  {!(car as CarScheduleExtras)._scheduledActive && (car as CarScheduleExtras)._scheduledUpcoming && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      {da ? 'Kommende periode fra' : 'Upcoming period from'} {(car as CarScheduleExtras)._scheduledUpcoming?.start_date}
                    </span>
                  )}
                  {car.notes && car.notes.trim() !== '' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-primary cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs whitespace-pre-wrap">{car.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <RowActions
                  subject={car.name}
                  primary={isAdmin
                    ? { key: 'edit', label: t('common.edit'), icon: Edit, onClick: () => onEdit(car) }
                    : onEditNote ? { key: 'note', label: t('ui.addEditNote'), icon: StickyNote, onClick: () => onEditNote(car) } : undefined}
                  items={isAdmin ? [
                    onEditNote && { key: 'note', label: t('ui.addEditNote'), icon: StickyNote, onClick: () => onEditNote(car) },
                    { key: 'avail', label: car.is_available ? t('cars.markUnavailable') : t('cars.markAvailable'), icon: car.is_available ? ToggleLeft : ToggleRight, onClick: () => onToggleAvailability(car) },
                    onSchedule && { key: 'schedule', label: t('ui.scheduleWorkshopVisit'), icon: Wrench, onClick: () => onSchedule(car) },
                    { key: 'delete', label: t('common.delete'), icon: Trash2, onClick: () => onDelete(car), destructive: true },
                  ] : []}
                />
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CarsTable;

type CarScheduleExtras = { _scheduledActive?: { end_date: string } | null; _scheduledUpcoming?: { start_date: string } | null; is_auxiliary?: boolean };
