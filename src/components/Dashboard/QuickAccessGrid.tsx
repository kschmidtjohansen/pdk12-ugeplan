import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Car, Clock, Shield } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface QuickAccessItem {
  title: string;
  icon: React.ReactNode;
  link: string;
}

interface QuickAccessGridProps {
  userRole?: string;
}

const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({ userRole }) => {
  const { t } = useTranslation();

  const getQuickAccessItems = (): QuickAccessItem[] => {
    const baseItems: QuickAccessItem[] = [
      {
        title: t('dashboard.quickAccessGrid.planner.title'),
        icon: <Clock className="h-4 w-4" />,
        link: '/planner',
      },
      {
        title: t('dashboard.quickAccessGrid.vacation.title'),
        icon: <Calendar className="h-4 w-4" />,
        link: '/vacation',
      },
      {
        title: t('dashboard.quickAccessGrid.duty.title'),
        icon: <Shield className="h-4 w-4" />,
        link: '/duty',
      },
    ];

    if (userRole === 'super_admin' || userRole === 'administrator' || userRole === 'skadeleder') {
      baseItems.push(
        {
          title: t('dashboard.quickAccessGrid.employees.title'),
          icon: <Users className="h-4 w-4" />,
          link: '/employees',
        },
        {
          title: t('dashboard.quickAccessGrid.cars.title'),
          icon: <Car className="h-4 w-4" />,
          link: '/cars',
        }
      );
    }
    return baseItems;
  };

  const items = getQuickAccessItems();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {items.map((item, index) => (
        <Link key={index} to={item.link} className="block group">
          <Card className="h-full transition-colors duration-150 hover:bg-accent/60 hover:border-border">
            <CardContent className="p-2.5 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted text-foreground group-hover:bg-background group-hover:text-primary transition-colors shrink-0">
                {item.icon}
              </div>
              <h3 className="font-medium text-xs text-foreground truncate">
                {item.title}
              </h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default QuickAccessGrid;
