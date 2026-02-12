import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Edit, Check, X } from 'lucide-react';

interface LocationItem {
  key: string;
  label: string;
}

const LocationManagement: React.FC = () => {
  const { t } = useTranslation();
  
  // These are the current warehouse hall values from the database
  const locations: LocationItem[] = [
    { key: 'hal_1', label: t('warehouse.halls.hal1') || 'Hal 1' },
    { key: 'sort_hal', label: t('warehouse.halls.sortHal') || 'Sort Hal' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t('admin.tabs.locations') || 'Lokationer'}
        </CardTitle>
        <CardDescription>
          {t('admin.locations.description') || 'Oversigt over lagerlokationer. Kontakt administrator for at tilføje nye lokationer.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.key}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{location.label}</p>
                  <p className="text-xs text-muted-foreground">ID: {location.key}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationManagement;
