
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import { Employee } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmployeesListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
}

const EmployeesList: React.FC<EmployeesListProps> = ({
  employees,
  onEdit,
  onDelete,
  onToggleLeave
}) => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();

  return (
    <TooltipProvider>
      <div className="bg-white shadow rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("employees.name")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("employees.contactInfo")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("employees.role")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("employees.jobTitle")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.status")}
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </span>
                          
                          {/* Display notes tooltip for employees on leave */}
                          {(isAdmin || isSkadeleder) && employee.onLeave && employee.notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle size={16} className="text-orange-500 ml-2 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{employee.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.email}</div>
                    <div className="text-sm text-gray-500">{employee.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t(`admin.roles.${employee.role}`)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.jobTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.onLeave ? (
                      <Badge variant="outline" className="border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-100">
                        {t("employees.onLeave")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
                        {t("common.active")}
                      </Badge>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEdit(employee)} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("common.edit")}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDelete(employee)} 
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("common.delete")}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onToggleLeave(employee)} 
                        className="text-amber-600 hover:text-amber-800 ml-2"
                      >
                        {employee.onLeave ? t("employees.markAvailable") : t("employees.markOnLeave")}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EmployeesList;
