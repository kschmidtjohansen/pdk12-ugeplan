
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ProfilePictureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
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
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
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

    // Create preview URL and show cropper
    const url = URL.createObjectURL(file);
    setSelectedImageSrc(url);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsLoading(true);
    setShowCropper(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create unique filename
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldFileName = currentAvatarUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      // Upload new file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: t('profile.profilePictureUpdated'),
        description: t('profile.profilePictureSuccess'),
      });

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
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
        setSelectedImageSrc(null);
      }
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Delete from storage if exists
      if (currentAvatarUrl) {
        const fileName = currentAvatarUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${fileName}`]);
        }
      }

      // Update user profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t('profile.profilePictureRemoved'),
        description: t('profile.profilePictureRemovedSuccess'),
      });

      onAvatarUpdate(null);
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
    setShowCropper(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }
    onOpenChange(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }
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

        {showCropper && selectedImageSrc ? (
          <ImageCropper
            imageSrc={selectedImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentAvatarUrl || undefined} />
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
              
              {currentAvatarUrl && (
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureDialog;
