
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Car, Clock, ArrowRight } from 'lucide-react';
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
      }
    ];

    if (userRole === 'administrator' || userRole === 'skadeleder') {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-right">
      {items.map((item, index) => (
        <Link key={index} to={item.link} className="block group">
          <Card className="h-full border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
            <CardContent className="p-4 py-[12px] px-[20px]">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${
                  item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  item.color === 'green' ? 'bg-green-50 text-green-600' :
                  item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
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
