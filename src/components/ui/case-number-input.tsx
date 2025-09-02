import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, X } from 'lucide-react';
import { OneDriveService } from '@/services/OneDriveService';

interface CaseNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CaseNumberInput: React.FC<CaseNumberInputProps> = ({
  value = '',
  onChange,
  placeholder = "Enter case number",
  className = '',
  disabled = false
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [folderExists, setFolderExists] = useState<boolean | null>(null);

  const isValidFormat = OneDriveService.validateCaseNumber(value);

  const handleValueChange = (newValue: string) => {
    // Convert to uppercase and clean the input
    const cleanValue = newValue.toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
    onChange(cleanValue);
    setFolderExists(null); // Reset folder status when value changes
  };

  return (
    <div className={className}>
      <Input
        value={value}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          font-mono
          ${!isValidFormat && value ? 'border-destructive' : ''}
          ${isValidFormat ? 'border-success' : ''}
        `}
        maxLength={20}
      />
      {!isValidFormat && value && (
        <p className="text-xs text-destructive mt-1">
          Case number must be 3-20 characters (letters, numbers, hyphens, underscores only)
        </p>
      )}
    </div>
  );
};