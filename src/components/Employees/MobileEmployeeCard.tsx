import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2, UserMinus, UserCheck, HardHat, Truck, Forklift, FlaskConical, GraduationCap, Thermometer, HeartPulse } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import TempExpiryBadge from '@/components/Employees/TempExpiryBadge';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';

interface MobileEmployeeCardProps {
  employee: Employee;
  vacations: Vacation[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave?: (employee: Employee) => void;
  onTraining?: (employee: Employee) => void;
  isOnTraining?: boolean;
  isSick?: boolean;
  canSeeSickReason?: boolean;
  onToggleSick?: (employee: Employee) => void;
}

const MobileEmployeeCard: React.FC<MobileEmployeeCardProps> = ({ employee, vacations, onEdit, onDelete, onToggleLeave, onTraining, isOnTraining, isSick, canSeeSickReason, onToggleSick }) => {
  const { isAdmin } = usePermissions();
  const { t, currentLanguage } = useTranslation();

  const getInitials = (name: string): string => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return t('employees.super_admin');
      case 'administrator': return t('employees.administrator');
      case 'skadeleder': return t('employees.skadeleder');
      case 'fugttekniker': return t('employees.fugttekniker');
      case 'servicemedarbejder': return t('employees.servicemedarbejder');
      case 'vikar': return t('employees.vikar');
      default: return role;
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'warning' as const;
      case 'administrator': return 'info' as const;
      case 'skadeleder': return 'purple' as const;
      case 'fugttekniker': return 'info' as const;
      case 'servicemedarbejder': return 'success' as const;
      default: return 'default' as const;
    }
  };

  const availabilityInfo = getEmployeeAvailabilityStatus(employee, new Date(), [], vacations, t);

  const statusBadge = isSick ? (
    <StatusBadge dot variant={canSeeSickReason ? 'destructive' : 'warning'}>
      {canSeeSickReason ? t('ui.sick') : t('ui.absent')}
    </StatusBadge>
  ) : isOnTraining ? (
    <StatusBadge dot variant="warning">{currentLanguage === 'da' ? 'Kursus' : 'Training'}</StatusBadge>
  ) : (
    <StatusBadge dot variant={availabilityInfo.badgeVariant}>{availabilityInfo.statusText}</StatusBadge>
  );

  const hasCertificates = employee.has_asbestos_certificate || employee.has_pcb_certificate || employee.has_trailer_license || employee.has_forklift_license;

  return (
    <article className="min-w-0 px-3 py-3 sm:px-4" data-testid="mobile-employee-card" aria-label={employee.name}>
      {/* 1. Identitet + status */}
      <div className="flex items-start gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={employee.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted text-foreground">{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-semibold leading-snug text-foreground break-words">{employee.name}</h3>
            <div className="shrink-0">{statusBadge}</div>
          </div>
          {employee.jobTitle && <p className="text-sm text-muted-foreground break-words">{employee.jobTitle}</p>}
          <TempExpiryBadge employee={employee} />
        </div>
      </div>

      {/* 2. Metadata */}
      <dl className="mt-2 grid grid-cols-1 gap-x-3 text-sm pl-[52px]">
        <dt className="sr-only">{t('employees.contact')}</dt>
        <dd className="min-w-0">
          <a href={`mailto:${employee.email}`} className="flex min-h-11 items-center gap-1.5 break-all text-foreground underline-offset-4 hover:underline focus-visible:underline">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />{employee.email}
          </a>
        </dd>
        {employee.phone && (
          <dd className="min-w-0">
            <a href={`tel:${employee.phone}`} className="flex min-h-11 items-center gap-1.5 tabular-nums text-foreground underline-offset-4 hover:underline focus-visible:underline">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />{employee.phone}
            </a>
          </dd>
        )}
        {(isAdmin || hasCertificates) && (
          <dd className="flex flex-wrap items-center gap-1.5 pt-1">
            {isAdmin && (
              <StatusBadge variant={getRoleVariant(employee.role)}>
                <span className="sr-only">{t('employees.role')}: </span>{getRoleLabel(employee.role)}
              </StatusBadge>
            )}
            {employee.has_asbestos_certificate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><HardHat className="h-3.5 w-3.5 text-primary" aria-hidden />{t('employees.asbestosCertificate')}</span>
            )}
            {employee.has_pcb_certificate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden />{t('employees.pcbCertificate')}</span>
            )}
            {employee.has_trailer_license && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Truck className="h-3.5 w-3.5 text-primary" aria-hidden />{currentLanguage === 'da' ? 'Trailer' : 'Trailer'}</span>
            )}
            {employee.has_forklift_license && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Forklift className="h-3.5 w-3.5 text-primary" aria-hidden />{currentLanguage === 'da' ? 'Truck' : 'Forklift'}</span>
            )}
          </dd>
        )}
      </dl>

      {/* 3. Handlinger — kun administratorer; ombrydes i stedet for vandret overflow */}
      {isAdmin && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-2" role="group" aria-label={t('common.actions')}>
          <Button variant="ghost" size="sm" onClick={() => onEdit(employee)} className="h-11 min-h-11 w-11 p-0" aria-label={t('common.edit')}>
            <Edit className="h-4 w-4" />
          </Button>
          {onTraining && (
            <Button variant="ghost" size="sm" onClick={() => onTraining(employee)} className="h-11 min-h-11 w-11 p-0 text-warning" aria-label={currentLanguage === 'da' ? 'Kursus' : 'Training'}>
              <GraduationCap className="h-4 w-4" />
            </Button>
          )}
          {onToggleLeave && (
            <Button variant="ghost" size="sm" onClick={() => onToggleLeave(employee)} aria-label={t('employees.statusLabel')} className={`h-11 min-h-11 w-11 p-0 ${employee.onLeave ? 'text-success' : 'text-warning'}`}>
              {employee.onLeave ? <UserCheck className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
            </Button>
          )}
          {onToggleSick && (
            <Button variant="ghost" size="sm" onClick={() => onToggleSick(employee)} className={`h-11 min-h-11 px-2 ${isSick ? 'text-success' : 'text-destructive'}`}>
              {isSick ? <HeartPulse className="h-4 w-4" /> : <Thermometer className="h-4 w-4" />}
              <span className="ml-1 text-xs">{currentLanguage === 'da' ? (isSick ? 'Rask' : 'Syg') : (isSick ? 'Well' : 'Sick')}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onDelete(employee)} className="ml-auto h-11 min-h-11 w-11 p-0 text-destructive" aria-label={t('common.delete')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </article>
  );
};

export default MobileEmployeeCard;
