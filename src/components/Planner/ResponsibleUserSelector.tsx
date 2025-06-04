
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  const eligibleUsers = employees.filter(employee => 
    employee.role === 'administrator' || employee.role === 'skadeleder'
  );

  // Find the selected user to display their name
  const selectedUser = eligibleUsers.find(user => user.id === selectedUserId);
  
  console.log('[ResponsibleUserSelector] Selected user ID:', selectedUserId);
  console.log('[ResponsibleUserSelector] Found selected user:', selectedUser);
  console.log('[ResponsibleUserSelector] Eligible users:', eligibleUsers);

  return (
    <div className="space-y-2">
      <Label>{t('planner.responsibleUser')}</Label>
      <Select value={selectedUserId} onValueChange={onUserSelect}>
        <SelectTrigger>
          <SelectValue 
            placeholder={t('planner.selectResponsibleUser')}
          >
            {selectedUser ? selectedUser.name : t('planner.selectResponsibleUser')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {eligibleUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResponsibleUserSelector;
