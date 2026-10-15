import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import type { EmployeeFormData } from './types';

interface Props {
  formData: EmployeeFormData;
  onCheckboxChange: (field: string, checked: boolean) => void;
  isSubmitting: boolean;
}

const CertificatesSection: React.FC<Props> = ({ formData, onCheckboxChange, isSubmitting }) => {
  const { t } = useTranslation();
  return (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold">
              {t('employees.certificatesSection')}
            </Label>
            <div className="space-y-3 pl-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_asbestos_certificate" 
                  checked={formData.has_asbestos_certificate} 
                  onCheckedChange={checked => onCheckboxChange('has_asbestos_certificate', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_asbestos_certificate" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasAsbestosCertificate')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_pcb_certificate" 
                  checked={formData.has_pcb_certificate} 
                  onCheckedChange={checked => onCheckboxChange('has_pcb_certificate', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_pcb_certificate" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasPcbCertificate')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_trailer_license" 
                  checked={formData.has_trailer_license} 
                  onCheckedChange={checked => onCheckboxChange('has_trailer_license', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_trailer_license" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasTrailerLicense')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_forklift_license" 
                  checked={formData.has_forklift_license} 
                  onCheckedChange={checked => onCheckboxChange('has_forklift_license', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_forklift_license" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasForkliftLicense')}
                </Label>
              </div>
            </div>
          </div>
  );
};

export default CertificatesSection;
