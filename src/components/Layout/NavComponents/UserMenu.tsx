
import React from 'react';
import { LogIn } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9 profile-avatar">
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
  );
};

export default UserMenu;
