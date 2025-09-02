import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FolderOpen, Loader2, AlertCircle } from 'lucide-react';
import { OneDriveUrlService } from '@/services/OneDriveUrlService';
import { useToast } from '@/hooks/use-toast';

interface OneDriveFolderButtonProps {
  caseNumber?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
}

export const OneDriveFolderButton: React.FC<OneDriveFolderButtonProps> = ({
  caseNumber,
  size = 'sm',
  variant = 'outline',
  className = '',
  showText = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenFolder = async () => {
    if (!caseNumber) {
      toast({
        title: "Mangler sagsnummer",
        description: "Der skal være et sagsnummer for at åbne OneDrive mappen",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const isConfigured = await OneDriveUrlService.isConfigured();
      
      if (!isConfigured) {
        toast({
          title: "OneDrive ikke konfigureret",
          description: "OneDrive integration er ikke konfigureret. Kontakt administrator.",
          variant: "destructive"
        });
        return;
      }

      const result = await OneDriveUrlService.openFolder(caseNumber);
      
      if (!result.success || !result.folderExists) {
        // Folder doesn't exist - show specific message
        toast({
          title: "OneDrive mappe ikke fundet",
          description: "Der blev ikke fundet en OneDrive mappe. Kontakt en skadeleder hvis dette er en fejl, ellers er sagen afsluttet.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Åbner OneDrive mappe",
        description: `Åbner mappe for sagsnummer: ${caseNumber}`,
      });
    } catch (error) {
      console.error('[OneDriveFolderButton] Error opening folder:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke åbne OneDrive mappen. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-7 w-7';
      case 'md': return 'h-10 w-10';
      case 'lg': return 'h-12 w-12';
      default: return 'h-7 w-7';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-5 w-5';
      case 'lg': return 'h-6 w-6';
      default: return 'h-4 w-4';
    }
  };

  if (!caseNumber) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${getButtonSize()} ${className} opacity-50 cursor-not-allowed`}
              disabled
            >
              <AlertCircle className={getIconSize()} />
              {showText && <span className="ml-2">OneDrive</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Intet sagsnummer - OneDrive ikke tilgængelig</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="sm"
            className={`${!showText ? getButtonSize() : ''} ${className} transition-colors bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-400 p-0`}
            onClick={handleOpenFolder}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className={`${getIconSize()} animate-spin`} />
            ) : (
              <FolderOpen className={`${getIconSize()} text-blue-600`} />
            )}
            {showText && (
              <span className="ml-2">OneDrive</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Åbn OneDrive mappe for {caseNumber}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};