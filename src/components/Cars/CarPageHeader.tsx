
import React from 'react';
import PageHeader from '../Layout/PageHeader';
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
    <PageHeader 
      title={t('cars.title')}
      description={t('cars.description')}
    >
      {isAdmin && (
        <Button 
          onClick={onCreateNew}
          className="bg-polygon-blue hover:bg-polygon-darkblue"
        >
          <Plus className="mr-2 h-4 w-4" /> {t('cars.addVehicle')}
        </Button>
      )}
    </PageHeader>
  );
};

export default CarPageHeader;
