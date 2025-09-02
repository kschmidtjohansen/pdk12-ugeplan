
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-right">
      {items.map((item, index) => (
        <Link key={index} to={item.link} className="block group">
          <Card className="h-full glass-effect hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 interactive-scale border-0 bg-card/60">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl backdrop-blur-sm border ${
                  item.color === 'blue' ? 'bg-blue-500/10 text-blue-600 border-blue-200/50 shadow-lg shadow-blue-500/20' :
                  item.color === 'green' ? 'bg-green-500/10 text-green-600 border-green-200/50 shadow-lg shadow-green-500/20' :
                  item.color === 'purple' ? 'bg-purple-500/10 text-purple-600 border-purple-200/50 shadow-lg shadow-purple-500/20' :
                  'bg-orange-500/10 text-orange-600 border-orange-200/50 shadow-lg shadow-orange-500/20'
                } transition-all duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-card-foreground group-hover:text-primary transition-colors duration-300">
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
