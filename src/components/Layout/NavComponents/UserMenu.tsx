
import React, { useState, useEffect } from 'react';
import { LogIn, Settings, Camera, Lock } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { languageNames } from '../../../translations';
import PasswordChangeDialog from '../../Profile/PasswordChangeDialog';
import ProfilePictureDialog from '../../Profile/ProfilePictureDialog';
import { supabase } from '@/integrations/supabase/client';

interface UserMenuProps {
  user: any;
  currentLanguage: string;
  setLanguage: (lang: any) => void;
  handleLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  user, 
  currentLanguage, 
  setLanguage, 
  handleLogout 
}) => {
  const { t } = useTranslation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Fetch user profile data including avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            // Check if avatar_url exists in the response
            if ('avatar_url' in data) {
              setAvatarUrl(data.avatar_url);
            }
          }
        } catch (err) {
          // Silently handle the case where avatar_url column doesn't exist yet
          console.log('Avatar URL column not yet available');
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9 profile-avatar">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Profile Options */}
          <DropdownMenuLabel>{t('profile.profileSettings')}</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => setProfilePictureDialogOpen(true)}
            className="cursor-pointer"
          >
            <Camera className="mr-2 h-4 w-4" />
            <span>{t('profile.changeProfilePicture')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setPasswordDialogOpen(true)}
            className="cursor-pointer"
          >
            <Lock className="mr-2 h-4 w-4" />
            <span>{t('profile.changePassword')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Language Selector */}
          <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={currentLanguage} onValueChange={(val) => setLanguage(val as 'en' | 'da')}>
            {Object.entries(languageNames).map(([code, name]) => (
              <DropdownMenuRadioItem 
                key={code} 
                value={code}
                className="cursor-pointer"
              >
                {name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogIn className="mr-2 h-4 w-4 rotate-180" />
            <span>{t('common.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordChangeDialog 
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <ProfilePictureDialog
        open={profilePictureDialogOpen}
        onOpenChange={setProfilePictureDialogOpen}
        currentAvatarUrl={avatarUrl}
        userName={user?.name || ''}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </>
  );
};

export default UserMenu;
