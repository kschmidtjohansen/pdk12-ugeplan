
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
  color: string;
}

interface QuickAccessGridProps {
  userRole?: string;
}

const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({ userRole }) => {
  const { t } = useTranslation();

  const getQuickAccessItems = (): QuickAccessItem[] => {
    const baseItems = [
      {
        title: t('dashboard.quickAccessGrid.planner.title'),
        icon: <Clock className="h-6 w-6" />,
        description: t('dashboard.quickAccessGrid.planner.description'),
        link: '/planner',
        color: 'blue'
      },
      {
        title: t('dashboard.quickAccessGrid.vacation.title'),
        icon: <Calendar className="h-6 w-6" />,
        description: t('dashboard.quickAccessGrid.vacation.description'),
        link: '/vacation',
        color: 'green'
      },
      {
        title: t('dashboard.quickAccessGrid.duty.title'),
        icon: <Shield className="h-6 w-6" />,
        description: t('dashboard.quickAccessGrid.duty.description'),
        link: '/duty',
        color: 'indigo'
      }
    ];

    if (userRole === 'super_admin' || userRole === 'administrator' || userRole === 'skadeleder') {
      baseItems.push({
        title: t('dashboard.quickAccessGrid.employees.title'),
        icon: <Users className="h-6 w-6" />,
        description: t('dashboard.quickAccessGrid.employees.description'),
        link: '/employees',
        color: 'purple'
      }, {
        title: t('dashboard.quickAccessGrid.cars.title'),
        icon: <Car className="h-6 w-6" />,
        description: t('dashboard.quickAccessGrid.cars.description'),
        link: '/cars',
        color: 'orange'
      });
    }
    return baseItems;
  };

  const items = getQuickAccessItems();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item, index) => (
        <Link key={index} to={item.link} className="block group">
          <Card className="h-full transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 hover:border-primary/30 animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  item.color === 'green' ? 'bg-green-50 text-green-600' :
                  item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                  item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  'bg-orange-50 text-orange-600'
                }`}>
                  {item.icon}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-base mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
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
