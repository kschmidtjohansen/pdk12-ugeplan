import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, X } from 'lucide-react';
import { OneDriveService } from '@/services/OneDriveService';

interface CaseNumberInputProps {
  value?: string;
  onChange: (value: string) => void;
  oneDriveService?: OneDriveService;
  className?: string;
  disabled?: boolean;
}

export const CaseNumberInput: React.FC<CaseNumberInputProps> = ({
  value = '',
  onChange,
  oneDriveService,
  className,
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

  const checkOneDriveFolder = async () => {
    if (!oneDriveService || !value || !isValidFormat) return;
    
    setIsValidating(true);
    try {
      const folderUrl = await oneDriveService.getCaseFolderUrl(value);
      setFolderExists(!!folderUrl);
    } catch (error) {
      console.error('Error checking OneDrive folder:', error);
      setFolderExists(false);
    } finally {
      setIsValidating(false);
    }
  };

  const createOneDriveFolder = async () => {
    if (!oneDriveService || !value || !isValidFormat) return;

    setIsValidating(true);
    try {
      const folderId = await oneDriveService.createCaseFolder(value);
      setFolderExists(!!folderId);
    } catch (error) {
      console.error('Error creating OneDrive folder:', error);
      setFolderExists(false);
    } finally {
      setIsValidating(false);
    }
  };

  const openOneDriveFolder = async () => {
    if (!oneDriveService || !value) return;

    try {
      const folderUrl = await oneDriveService.getCaseFolderUrl(value);
      if (folderUrl) {
        window.open(folderUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening OneDrive folder:', error);
    }
  };

  return (
    <div className={className}>
      <Label htmlFor="case-number">Case Number</Label>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1">
          <Input
            id="case-number"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter case number (e.g., CASE-2024-001)"
            disabled={disabled}
            className={`
              ${!isValidFormat && value ? 'border-destructive' : ''}
              ${isValidFormat ? 'border-success' : ''}
            `}
          />
          {!isValidFormat && value && (
            <p className="text-xs text-destructive mt-1">
              Case number must be 3-20 characters (letters, numbers, hyphens, underscores only)
            </p>
          )}
        </div>

        {/* OneDrive integration buttons */}
        {oneDriveService && isValidFormat && value && (
          <div className="flex items-center gap-2">
            {folderExists === null && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkOneDriveFolder}
                disabled={isValidating}
              >
                Check Folder
              </Button>
            )}
            
            {folderExists === true && (
              <>
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Linked
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openOneDriveFolder}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Button>
              </>
            )}
            
            {folderExists === false && (
              <>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Not Found
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={createOneDriveFolder}
                  disabled={isValidating}
                >
                  Create Folder
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};