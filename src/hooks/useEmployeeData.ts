
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/context/TranslationContext";
import { Employee } from "@/types/employee";
import { fetchEmployees } from "@/services/employeeService";

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employees from Supabase
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: t('common.error'),
          description: t('employees.fetchError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [toast, t]);

  // Update the employees state when an employee is added, modified or deleted
  const updateEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
  };

  return {
    employees,
    updateEmployees,
    isLoading
  };
};
