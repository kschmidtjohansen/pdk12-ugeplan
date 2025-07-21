import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';

export interface Department {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface DepartmentSelectorProps {
  value: string;
  onChange: (departmentCode: string) => void;
  disabled?: boolean;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching departments:', error);
        } else {
          setDepartments(data || []);
        }
      } catch (error) {
        console.error('Error in fetchDepartments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">{t('departments.selectDepartment')}</div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  const selectedDepartment = departments.find(dept => dept.code === value);
  const displayText = selectedDepartment ? selectedDepartment.name : t('departments.selectDepartment');

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (departmentCode: string) => {
    onChange(departmentCode);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">{t('departments.selectDepartment')}</div>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`w-full flex items-center justify-between text-left px-3 py-2 text-foreground bg-transparent border-0 cursor-pointer hover:text-primary transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-base font-medium">
            {displayText}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
            {departments.map((department) => (
              <button
                key={department.id}
                type="button"
                onClick={() => handleSelect(department.code)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-foreground"
              >
                {department.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};