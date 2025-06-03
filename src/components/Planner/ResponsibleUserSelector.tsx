
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { useEmployees } from '@/hooks/useEmployees';

interface ResponsibleUserSelectorProps {
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
}

const ResponsibleUserSelector: React.FC<ResponsibleUserSelectorProps> = ({
  selectedUserId,
  onUserSelect
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();

  // Filter employees to only show administrators and skadeleders
  const responsibleUsers = employees.filter(employee => 
    employee.role === 'administrator' || employee.role === 'skadeleder'
  );

  return (
    <Select value={selectedUserId || 'none'} onValueChange={onUserSelect}>
      <SelectTrigger>
        <SelectValue placeholder={t('planner.selectResponsibleUser')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t('planner.noResponsibleUser')}</SelectItem>
        {responsibleUsers.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ResponsibleUserSelector;
