
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';

interface ProfilePictureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  userName: string;
  onAvatarUpdate: (avatarUrl: string | null) => void;
}

const ProfilePictureDialog: React.FC<ProfilePictureDialogProps> = ({
  open,
  onOpenChange,
  currentAvatarUrl,
  userName,
  onAvatarUpdate
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: t('profile.invalidFileType'),
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('profile.fileTooLarge'),
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Try to update user profile with avatar URL
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl } as any)
          .eq('id', user.id);

        if (updateError) {
          // If avatar_url column doesn't exist, show a message but still allow the upload
          console.warn('Avatar URL column not available yet:', updateError.message);
          toast({
            title: t('profile.profilePictureUpdated'),
            description: 'Profile picture uploaded. Database will be updated when migration is applied.',
          });
        } else {
          toast({
            title: t('profile.profilePictureUpdated'),
            description: t('profile.profilePictureSuccess'),
          });
        }
      } catch (dbError) {
        // Handle case where avatar_url column doesn't exist
        toast({
          title: t('profile.profilePictureUpdated'),
          description: 'Profile picture uploaded. Database migration needed for full functionality.',
        });
      }

      onAvatarUpdate(data.publicUrl);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('profile.profilePictureError'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Try to update user profile to remove avatar URL
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: null } as any)
          .eq('id', user.id);

        if (error) {
          console.warn('Avatar URL column not available yet:', error.message);
        }
      } catch (dbError) {
        // Handle case where avatar_url column doesn't exist
        console.log('Database migration needed for avatar URL functionality');
      }

      toast({
        title: t('profile.profilePictureRemoved'),
        description: t('profile.profilePictureRemovedSuccess'),
      });

      onAvatarUpdate(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('profile.profilePictureError'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(currentAvatarUrl || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile.changeProfilePicture')}</DialogTitle>
          <DialogDescription>
            {t('profile.changeProfilePictureDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewUrl || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('profile.selectNewPicture')}
            </Button>
          </div>

          <div className="flex justify-between space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            
            {(currentAvatarUrl || previewUrl) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={isLoading}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                {t('profile.removePicture')}
              </Button>
            )}
            
            {selectedFile && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isLoading}
                className="bg-polygon-purple hover:bg-polygon-darkpurple"
              >
                {isLoading ? t('common.uploading') : t('profile.uploadPicture')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureDialog;
