import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Folder } from 'lucide-react';
import { OneDriveService } from '@/services/OneDriveService';
import { useToast } from '@/hooks/use-toast';

interface OneDriveFolderLinkProps {
  caseNumber: string;
  folderId?: string;
  className?: string;
}

const OneDriveFolderLink: React.FC<OneDriveFolderLinkProps> = ({
  caseNumber,
  folderId,
  className = ''
}) => {
  const { toast } = useToast();

  const handleOpenFolder = async () => {
    try {
      if (folderId) {
        // Open existing folder
        await OneDriveService.openFolder(folderId);
      } else {
        // Create and open new folder
        const folder = await OneDriveService.createCaseFolder(caseNumber);
        await OneDriveService.openFolder(folder.id);
      }
    } catch (error) {
      console.error('Failed to open OneDrive folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to open OneDrive folder. Please make sure you are authenticated.',
        variant: 'destructive'
      });
    }
  };

  if (!caseNumber) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenFolder}
      className={`gap-2 ${className}`}
    >
      <Folder className="h-4 w-4" />
      {folderId ? 'Open OneDrive Folder' : 'Create OneDrive Folder'}
      <ExternalLink className="h-3 w-3" />
    </Button>
  );
};

export default OneDriveFolderLink;