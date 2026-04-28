import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Car, Clock, ArrowRight, Shield } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface QuickAccessItem {
  title: string;
  icon: React.ReactNode;
  description: string;
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
        icon: <Clock className="h-5 w-5" />,
        description: t('dashboard.quickAccessGrid.planner.description'),
        link: '/planner',
      },
      {
        title: t('dashboard.quickAccessGrid.vacation.title'),
        icon: <Calendar className="h-5 w-5" />,
        description: t('dashboard.quickAccessGrid.vacation.description'),
        link: '/vacation',
      },
      {
        title: t('dashboard.quickAccessGrid.duty.title'),
        icon: <Shield className="h-5 w-5" />,
        description: t('dashboard.quickAccessGrid.duty.description'),
        link: '/duty',
      },
    ];

    if (userRole === 'super_admin' || userRole === 'administrator' || userRole === 'skadeleder') {
      baseItems.push(
        {
          title: t('dashboard.quickAccessGrid.employees.title'),
          icon: <Users className="h-5 w-5" />,
          description: t('dashboard.quickAccessGrid.employees.description'),
          link: '/employees',
        },
        {
          title: t('dashboard.quickAccessGrid.cars.title'),
          icon: <Car className="h-5 w-5" />,
          description: t('dashboard.quickAccessGrid.cars.description'),
          link: '/cars',
        }
      );
    }
    return baseItems;
  };

  const items = getQuickAccessItems();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item, index) => (
        <Link key={index} to={item.link} className="block group">
          <Card className="h-full transition-colors duration-150 hover:bg-accent/60 hover:border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-1.5 rounded-md bg-muted text-foreground group-hover:bg-background group-hover:text-primary transition-colors">
                  {item.icon}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="font-medium text-sm text-foreground mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default QuickAccessGrid;
