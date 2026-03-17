
import React from 'react';
import { Link } from 'react-router-dom';
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
      { title: t('dashboard.quickAccessGrid.planner.title'), icon: <Clock className="h-5 w-5" />, description: t('dashboard.quickAccessGrid.planner.description'), link: '/planner' },
      { title: t('dashboard.quickAccessGrid.vacation.title'), icon: <Calendar className="h-5 w-5" />, description: t('dashboard.quickAccessGrid.vacation.description'), link: '/vacation' },
      { title: t('dashboard.quickAccessGrid.duty.title'), icon: <Shield className="h-5 w-5" />, description: t('dashboard.quickAccessGrid.duty.description'), link: '/duty' },
    ];

    if (userRole === 'super_admin' || userRole === 'administrator' || userRole === 'skadeleder') {
      baseItems.push(
        { title: t('dashboard.quickAccessGrid.employees.title'), icon: <Users className="h-5 w-5" />, description: t('dashboard.quickAccessGrid.employees.description'), link: '/employees' },
        { title: t('dashboard.quickAccessGrid.cars.title'), icon: <Car className="h-5 w-5" />, description: t('dashboard.quickAccessGrid.cars.description'), link: '/cars' },
      );
    }
    return baseItems;
  };

  const items = getQuickAccessItems();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map((item, index) => (
        <Link key={index} to={item.link} className="block group">
          <div className="glass-card card-hover-glow rounded-lg border p-4 h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {item.icon}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default QuickAccessGrid;
