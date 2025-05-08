
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/context/TranslationContext";
import { Employee } from "@/types/employee";
import { fetchEmployees } from "@/services/employeeService";
import { useAuth } from "@/context/AuthContext";

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees from Supabase
  useEffect(() => {
    let isMounted = true;
    
    const loadEmployees = async () => {
      // Don't try to fetch if not authenticated
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchEmployees();
        
        if (isMounted) {
          setEmployees(data);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        
        if (isMounted) {
          setError(error.message || 'Error fetching employees');
          
          toast({
            title: t('common.error'),
            description: t('employees.fetchError'),
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEmployees();
    
    return () => {
      isMounted = false;
    };
  }, [toast, t, isAuthenticated]);

  // Update the employees state when an employee is added, modified or deleted
  const updateEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
  };

  return {
    employees,
    updateEmployees,
    isLoading,
    error
  };
};
