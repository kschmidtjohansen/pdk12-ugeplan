
import React from 'react';
import { Search, Users, Car, Clock, Calendar, Settings, Wrench, FileText, Plus, BookOpen } from 'lucide-react';
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
    { 
      path: '/fugtafdelingen', 
      name: t('navigation.fugtafdelingen'), 
      translationKey: 'navigation.fugtafdelingen', 
      icon: <Wrench className="h-5 w-5" />, 
      skadelederVisible: true,
      children: [
        {
          path: '/fugtafdelingen/rapporter',
          name: t('navigation.rapporter'),
          translationKey: 'navigation.rapporter',
          icon: <FileText className="h-4 w-4" />
        },
        {
          path: '/fugtafdelingen/ny-rapport',
          name: t('navigation.nyRapport'),
          translationKey: 'navigation.nyRapport',
          icon: <Plus className="h-4 w-4" />
        },
        {
          path: '/fugtafdelingen/manualer',
          name: t('navigation.manualer'),
          translationKey: 'navigation.manualer',
          icon: <BookOpen className="h-4 w-4" />
        }
      ]
    },
  ];
  
  return <>{navigationItems}</>;
};

// Create a utility function to get navigation items
export const getNavigationItems = (hasVacationNotifications: boolean): NavigationItem[] => {
  const { t } = useTranslation();
  
  return [
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
    { 
      path: '/fugtafdelingen', 
      name: t('navigation.fugtafdelingen'), 
      translationKey: 'navigation.fugtafdelingen', 
      icon: <Wrench className="h-5 w-5" />, 
      skadelederVisible: true,
      children: [
        {
          path: '/fugtafdelingen/rapporter',
          name: t('navigation.rapporter'),
          translationKey: 'navigation.rapporter',
          icon: <FileText className="h-4 w-4" />
        },
        {
          path: '/fugtafdelingen/ny-rapport',
          name: t('navigation.nyRapport'),
          translationKey: 'navigation.nyRapport',
          icon: <Plus className="h-4 w-4" />
        },
        {
          path: '/fugtafdelingen/manualer',
          name: t('navigation.manualer'),
          translationKey: 'navigation.manualer',
          icon: <BookOpen className="h-4 w-4" />
        }
      ]
    },
  ];
};

export default NavigationItems;
