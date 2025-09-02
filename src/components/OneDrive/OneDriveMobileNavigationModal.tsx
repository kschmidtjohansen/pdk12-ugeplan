import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OneDriveMobileNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber: string;
  sharePointUrl: string;
  folderPath?: string;
}

export function OneDriveMobileNavigationModal({
  isOpen,
  onClose,
  caseNumber,
  sharePointUrl,
  folderPath
}: OneDriveMobileNavigationModalProps) {
  const { toast } = useToast();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(sharePointUrl);
      toast({
        title: "Link kopieret",
        description: "OneDrive link er kopieret til clipboard",
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke kopiere link til clipboard",
        variant: "destructive"
      });
    }
  };

  const handleOpenInBrowser = () => {
    window.open(sharePointUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            OneDrive Mappe Navigation
          </DialogTitle>
          <DialogDescription>
            Sagsnummer: <span className="font-medium text-foreground">{caseNumber}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-2">Sådan finder du mappen:</h4>
            <ol className="text-sm space-y-1 text-muted-foreground">
              <li>1. Åbn OneDrive appen på din telefon</li>
              <li>2. Gå til "Delt med mig" eller "Shared libraries"</li>
              <li>3. Find og åbn SharePoint biblioteket</li>
              <li>4. Naviger til mappen for sagsnummer: <span className="font-medium text-foreground">{caseNumber}</span></li>
            </ol>
          </div>

          {folderPath && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium text-sm mb-2">Mappe sti:</h4>
              <p className="text-sm text-muted-foreground font-mono">{folderPath}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleCopyUrl} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Kopier SharePoint Link
            </Button>
            
            <Button onClick={handleOpenInBrowser} variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Åbn i Browser
            </Button>
            
            <Button onClick={onClose} className="w-full">
              Forstået
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}