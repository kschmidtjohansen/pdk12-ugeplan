
import React from 'react';
import { Search, Users, Car, Clock, Calendar, Settings } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { NavigationItem } from '@/types/navigation';

interface NavigationItemsProps {
  hasVacationNotifications: boolean;
}

const NavigationItems: React.FC<NavigationItemsProps> = ({ hasVacationNotifications }) => {
  const { t } = useTranslation();
  
  const navigationItems: NavigationItem[] = [
    { 
      path: '/dashboard', 
      name: t('navigation.dashboard'), 
      translationKey: 'navigation.dashboard', 
      icon: <Search className="h-5 w-5" /> 
    },
    { 
      path: '/planner', 
      name: t('navigation.planner'), 
      translationKey: 'navigation.planner', 
      icon: <Clock className="h-5 w-5" /> 
    },
    { 
      path: '/employees', 
      name: t('navigation.employees'), 
      translationKey: 'navigation.employees', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      path: '/cars', 
      name: t('navigation.cars'), 
      translationKey: 'navigation.cars', 
      icon: <Car className="h-5 w-5" /> 
    },
    { 
      path: '/vacation', 
      name: t('navigation.vacation'), 
      translationKey: 'navigation.vacation', 
      icon: <Calendar className="h-5 w-5" />,
      hasNotification: hasVacationNotifications 
    },
    { 
      path: '/admin', 
      name: t('navigation.admin'), 
      translationKey: 'navigation.admin', 
      icon: <Settings className="h-5 w-5" />, 
      adminOnly: true 
    },
  ];
  
  return navigationItems;
};

export default NavigationItems;
