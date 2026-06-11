import React from 'react';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

/**
 * Compact pill bar shown on the dashboard so users can quickly switch
 * between sub-departments without opening the user menu.
 * - Only renders when the user has more than one accessible sub-department.
 * - "Alle" pill is only available to Administrator / Super Admin.
 */
const SubDepartmentQuickSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const {
    userSubDepartments,
    selectedSubDepartmentId,
    setSelectedSubDepartmentId,
  } = useDepartment();

  if (!userSubDepartments || userSubDepartments.length < 2) return null;

  const renderPill = (id: string | null, label: string) => {
    const active = (selectedSubDepartmentId || '') === (id || '');
    return (
      <button
        key={id ?? 'all'}
        type="button"
        onClick={() => setSelectedSubDepartmentId(id)}
        className={cn(
          'shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
          active
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-card text-foreground border-border hover:bg-accent/40'
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 py-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 pr-1">
        <Layers className="h-3.5 w-3.5" />
        <span>{t('common.subDepartment') || 'Underafdeling'}</span>
      </div>
      {isAdmin && renderPill(null, t('common.all') || 'Alle')}
      {userSubDepartments.map((sub) => renderPill(sub.id, sub.name))}
    </div>
  );
};

export default SubDepartmentQuickSwitcher;
