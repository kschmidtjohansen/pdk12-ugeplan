import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2, UserMinus, UserCheck, HardHat, Truck, Forklift, FlaskConical, GraduationCap } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';

interface MobileEmployeeCardProps {
  employee: Employee;
  vacations: Vacation[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave?: (employee: Employee) => void;
  onTraining?: (employee: Employee) => void;
}

const MobileEmployeeCard: React.FC<MobileEmployeeCardProps> = ({ employee, vacations, onEdit, onDelete, onToggleLeave, onTraining }) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();

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

  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{employee.name}</h3>
              {employee.jobTitle && (
                <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(employee)} className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
              {onTraining && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTraining(employee)}
                  className="h-8 w-8 p-0 text-yellow-600"
                  aria-label="Kursus"
                >
                  <GraduationCap className="h-4 w-4" />
                </Button>
              )}
              {onToggleLeave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLeave(employee)}
                  className={`h-8 w-8 p-0 ${employee.onLeave ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {employee.onLeave ? <UserCheck className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onDelete(employee)} className="h-8 w-8 p-0 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('employees.contact')}</p>
              <div className="space-y-1 mt-1">
                <div className="flex items-center text-sm">
                  <Mail className="h-3 w-3 mr-1.5 text-muted-foreground" />
                  <span className="text-foreground truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    <span className="text-foreground">{employee.phone}</span>
                  </div>
                )}
              </div>
            </div>
            {isAdmin && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('employees.role')}</p>
                <div className="mt-1">
                  <StatusBadge variant={getRoleVariant(employee.role)}>
                    {getRoleLabel(employee.role)}
                  </StatusBadge>
                </div>
                
              </div>
            )}
          </div>

          {/* Certificates */}
          {(employee.has_asbestos_certificate || employee.has_pcb_certificate || employee.has_trailer_license || employee.has_forklift_license) && (
            <div className="flex items-center gap-2">
              {employee.has_asbestos_certificate && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <HardHat className="h-3.5 w-3.5" />
                  <span>{t('employees.asbestosCertificate')}</span>
                </div>
              )}
              {employee.has_pcb_certificate && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <FlaskConical className="h-3.5 w-3.5" />
                  <span>{t('employees.pcbCertificate')}</span>
                </div>
              )}
              {employee.has_trailer_license && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Truck className="h-3.5 w-3.5" />
                </div>
              )}
              {employee.has_forklift_license && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Forklift className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <StatusBadge variant={availabilityInfo.badgeVariant}>
              {availabilityInfo.statusText}
            </StatusBadge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileEmployeeCard;
