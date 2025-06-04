
import React from 'react';
import { Employee } from '@/types/employee';
import { useTranslation } from '@/context/TranslationContext';

interface EmployeeManagementTabsProps {
  employees: Employee[];
  onCreateEmployee: () => Promise<boolean>;
  onUpdateEmployee: () => Promise<boolean>;
  onDeleteEmployee: (employeeId: string) => Promise<boolean>;
}

const EmployeeManagementTabs: React.FC<EmployeeManagementTabsProps> = ({
  employees,
  onCreateEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('admin.employeeManagement')}</h3>
      <div className="space-y-2">
        {employees.map((employee) => (
          <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{employee.name}</p>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateEmployee()}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
              >
                {t('common.edit')}
              </button>
              <button
                onClick={() => onDeleteEmployee(employee.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => onCreateEmployee()}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
        >
          {t('admin.addEmployee')}
        </button>
      </div>
    </div>
  );
};

export default EmployeeManagementTabs;
