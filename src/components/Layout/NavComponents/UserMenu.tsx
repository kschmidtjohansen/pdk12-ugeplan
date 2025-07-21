
import React, { useState, useEffect } from 'react';
import { LogIn, Settings, Camera, Lock, Crown } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { languageNames } from '../../../translations';
import PasswordChangeDialog from '../../Profile/PasswordChangeDialog';
import ProfilePictureDialog from '../../Profile/ProfilePictureDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from '@/context/AuthContext';

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
  const { isDemoMode, demoRole, setDemoRole } = useAuth();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  // Fetch user profile data including avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
          
          if (data && !error && data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (err) {
          console.log('Error fetching user profile:', err);
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
              <p className="text-sm font-medium leading-none">
                {user?.name}
                {isDemoMode && <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">DEMO</span>}
              </p>
              <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Demo Role Switching */}
          {isDemoMode && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                Demo Role
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={demoRole || 'administrator'} onValueChange={(value) => setDemoRole(value as UserRole)}>
                <DropdownMenuRadioItem value="administrator" className="cursor-pointer">
                  Administrator
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="skadeleder" className="cursor-pointer">
                  Skadeleder
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="servicemedarbejder" className="cursor-pointer">
                  Servicemedarbejder
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Profile Options */}
          <DropdownMenuLabel>{t('profile.profileSettings')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setProfilePictureDialogOpen(true)} className="cursor-pointer">
            <Camera className="mr-2 h-4 w-4" />
            <span>{t('profile.changeProfilePicture')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)} className="cursor-pointer">
            <Lock className="mr-2 h-4 w-4" />
            <span>{t('profile.changePassword')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Language Selector */}
          <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={currentLanguage} onValueChange={val => setLanguage(val as 'en' | 'da')}>
            {Object.entries(languageNames).map(([code, name]) => (
              <DropdownMenuRadioItem key={code} value={code} className="cursor-pointer">
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
        isOpen={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)} 
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
