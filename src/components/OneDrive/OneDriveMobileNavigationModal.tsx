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

  const handleOpenOneDriveApp = () => {
    // Attempt to open OneDrive app (opens app but not specific folder)
    try {
      window.location.href = 'ms-onedrive://';
      toast({
        title: "OneDrive app åbnet",
        description: "Følg vejledningen nedenfor for at finde mappen",
        duration: 4000
      });
    } catch (error) {
      console.error('Failed to open OneDrive app:', error);
      toast({
        title: "Kunne ikke åbne app",
        description: "Prøv at åbne OneDrive appen manuelt",
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
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <h4 className="font-medium text-sm mb-2 text-blue-900">📋 Link er kopieret til clipboard!</h4>
            <p className="text-sm text-blue-700">SharePoint linket er automatisk kopieret. Du kan nu følge trinene nedenfor.</p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-2">📱 Sådan finder du mappen:</h4>
            <ol className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">1.</span>
                <span>Åbn OneDrive appen (brug knappen nedenfor eller åbn manuelt)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">2.</span>
                <span>Gå til <strong>"Delt med mig"</strong> eller <strong>"Shared libraries"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">3.</span>
                <span>Find og åbn SharePoint biblioteket for jeres firma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-primary">4.</span>
                <span>Naviger til mappen: <span className="font-medium text-foreground bg-muted px-1 rounded">{caseNumber}</span></span>
              </li>
            </ol>
          </div>

          {folderPath && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium text-sm mb-2">📁 Mappe sti:</h4>
              <p className="text-sm text-muted-foreground font-mono break-all">{folderPath}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleOpenOneDriveApp} className="w-full">
              <FolderOpen className="w-4 h-4 mr-2" />
              Åbn OneDrive App
            </Button>
            
            <div className="flex gap-2">
              <Button onClick={handleCopyUrl} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Kopier Link Igen
              </Button>
              
              <Button onClick={handleOpenInBrowser} variant="outline" className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Åbn i Browser
              </Button>
            </div>
            
            <Button onClick={onClose} variant="secondary" className="w-full">
              Forstået
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}