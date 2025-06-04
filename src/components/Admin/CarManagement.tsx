
import React from 'react';
import { CarData } from '@/components/Cars/types';
import { useTranslation } from '@/context/TranslationContext';

interface CarManagementProps {
  cars: CarData[];
  onCreateCar: () => void;
  onUpdateCar: () => void;
  onDeleteCar: () => void;
}

const CarManagement: React.FC<CarManagementProps> = ({
  cars,
  onCreateCar,
  onUpdateCar,
  onDeleteCar
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('admin.carManagement')}</h3>
      <div className="space-y-2">
        {cars.map((car) => (
          <div key={car.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{car.name}</p>
              <p className="text-sm text-muted-foreground">{car.number_plate}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateCar()}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
              >
                {t('common.edit')}
              </button>
              <button
                onClick={() => onDeleteCar()}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => onCreateCar()}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
        >
          {t('admin.addCar')}
        </button>
      </div>
    </div>
  );
};

export default CarManagement;
