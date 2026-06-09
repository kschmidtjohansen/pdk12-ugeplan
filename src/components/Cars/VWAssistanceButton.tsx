import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Phone } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

const VWAssistanceButton: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-border bg-background hover:bg-accent text-foreground"
      >
        <Shield className="mr-2 h-4 w-4" />
        {t('cars.vwAssistance')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t('cars.vwAssistance')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('cars.vwPhoneLabel')}
              </label>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 mt-1">
                <Phone className="h-4 w-4 text-primary" />
                <a
                  href="tel:80203080"
                  className="text-lg font-mono text-primary hover:underline"
                >
                  {t('cars.vwPhoneNumber')}
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VWAssistanceButton;
