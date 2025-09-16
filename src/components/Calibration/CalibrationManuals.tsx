import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText } from 'lucide-react';

export const CalibrationManuals: React.FC = () => {
  const openManuals = () => {
    window.open('/docs/kalibreringsmanualer.pdf', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kalibreringsmanualer for alt udstyr
          </CardTitle>
          <CardDescription>
            Komplet manual til kalibrering af fugtmålingsudstyr
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Denne manual indeholder detaljerede instruktioner til kalibrering af følgende udstyr:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Gann Uni 1</li>
            <li>• Lufft XA1000</li>
            <li>• Lufft XP200</li>
            <li>• Tramex MRH III</li>
            <li>• Og meget mere...</li>
          </ul>
          
          <div className="pt-4">
            <Button onClick={openManuals} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Åbn kalibreringsmanualer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vigtige bemærkninger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Kalibrering bør kun udføres af uddannet personale
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Sørg for at have passende måleudstyr og referencer tilgængelige
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              💡 Tips til kalibrering
            </p>
            <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• Hold sensoren så langt tilbage som muligt</li>
              <li>• Undgå at hånden påvirker måleresultatet</li>
              <li>• Kontroller at målinger er inden for producent tolerancer</li>
              <li>• Dokumenter alle observationer i bemærkningsfeltet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};