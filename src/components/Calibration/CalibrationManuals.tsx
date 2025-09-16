import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

export const CalibrationManuals: React.FC = () => {
  const { t } = useTranslation();
  
  const openManuals = () => {
    window.open('/kalibreringsmanualer.pdf', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('calibration.manualsSection.title')}
          </CardTitle>
          <CardDescription>
            {t('calibration.manualsSection.cardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('calibration.manualsSection.introText')}
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• {t('calibration.manualsSection.equipment.gann')}</li>
            <li>• {t('calibration.manualsSection.equipment.lufftXA')}</li>
            <li>• {t('calibration.manualsSection.equipment.lufftXP')}</li>
            <li>• {t('calibration.manualsSection.equipment.tramex')}</li>
            <li>• {t('calibration.manualsSection.equipment.more')}</li>
          </ul>
          
          <div className="pt-4">
            <Button onClick={openManuals} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              {t('calibration.manualsSection.openManuals')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('calibration.manualsSection.importantNotes')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              {t('calibration.manualsSection.warningTitle')}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              {t('calibration.manualsSection.warningText')}
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              {t('calibration.manualsSection.tipsTitle')}
            </p>
            <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• {t('calibration.manualsSection.tips.tip1')}</li>
              <li>• {t('calibration.manualsSection.tips.tip2')}</li>
              <li>• {t('calibration.manualsSection.tips.tip3')}</li>
              <li>• {t('calibration.manualsSection.tips.tip4')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};