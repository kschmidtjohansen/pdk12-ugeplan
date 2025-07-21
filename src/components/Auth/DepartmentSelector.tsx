
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
        console.log('Fetching departments...');
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching departments:', error);
        } else {
          console.log('Fetched departments:', data);
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
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded-md"></div>
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
    console.log('Selected department:', departmentCode);
    onChange(departmentCode);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 text-left bg-white border-2 border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-polygon-blue focus:border-polygon-blue transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'
        } ${!value ? 'text-gray-500 border-blue-300 bg-blue-50' : 'text-gray-900'}`}
      >
        <span className="text-base font-medium">
          {displayText}
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-md shadow-lg z-[100] max-h-60 overflow-auto">
          {departments.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No departments available
            </div>
          ) : (
            departments.map((department) => (
              <button
                key={department.id}
                type="button"
                onClick={() => handleSelect(department.code)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-900 border-b border-gray-100 last:border-b-0 ${
                  value === department.code ? 'bg-blue-50 text-blue-700 font-medium' : ''
                }`}
              >
                <div className="font-medium">{department.name}</div>
                <div className="text-sm text-gray-500">{department.code}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
