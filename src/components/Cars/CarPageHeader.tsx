
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface CarPageHeaderProps {
  onCreateNew: () => void;
  isAdmin: boolean;
}

const CarPageHeader: React.FC<CarPageHeaderProps> = ({ onCreateNew, isAdmin }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('cars.title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('cars.description')}</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={onCreateNew}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> {t('cars.addNewCar')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CarPageHeader;
