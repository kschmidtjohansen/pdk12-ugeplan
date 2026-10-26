import React from 'react';
import { useDepartment } from '@/context/DepartmentContext';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { Building2, Layers } from 'lucide-react';

/**
 * Compact pill bar shown on the dashboard so users can quickly switch
 * between sub-departments without opening the user menu.
 * - Only renders when the user has more than one accessible sub-department.
 * - "Alle" pill is available whenever there is more than one sub-department.
 */
const SubDepartmentQuickSwitcher: React.FC<{ showDepartments?: boolean }> = ({ showDepartments = false }) => {
  const { t } = useTranslation();
  const {
    userDepartments,
    selectedDepartmentId,
    switchDepartment,
    userSubDepartments,
    selectedSubDepartmentId,
    setSelectedSubDepartmentId,
  } = useDepartment();

  const showDeptRow = showDepartments && userDepartments.length > 1;
  const showSubRow = !!userSubDepartments && userSubDepartments.length >= 1;
  if (!showDeptRow && !showSubRow) return null;

  const pillClass = (active: boolean) => cn(
    'shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
    active
      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
      : 'bg-card text-foreground border-border hover:bg-accent/40'
  );

  const renderPill = (id: string | null, label: string) => {
    const active = (selectedSubDepartmentId || '') === (id || '');
    return (
      <button key={id ?? 'all'} type="button" aria-pressed={active} onClick={() => setSelectedSubDepartmentId(id)} className={pillClass(active)}>
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-1">
      {showDeptRow && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 py-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 pr-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>{t('common.department') || 'Afdeling'}</span>
          </div>
          {userDepartments.map((dept) => {
            const active = dept.id === selectedDepartmentId;
            return (
              <button key={dept.id} type="button" aria-pressed={active} onClick={() => { if (!active) switchDepartment(dept.id); }} className={pillClass(active)}>
                {dept.name}
              </button>
            );
          })}
        </div>
      )}
      {showSubRow && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 py-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 pr-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{t('common.subDepartment') || 'Underafdeling'}</span>
          </div>
          {userSubDepartments.length > 1 && renderPill(null, t('common.all') || 'Alle')}
          {userSubDepartments.map((sub) => renderPill(sub.id, sub.name))}
        </div>
      )}
    </div>
  );
};

export default SubDepartmentQuickSwitcher;
