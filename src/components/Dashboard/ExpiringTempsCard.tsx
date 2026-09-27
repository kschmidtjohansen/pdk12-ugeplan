import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/context/TranslationContext';
import { getTempDaysLeft, isTempExpiringSoon, expiryLabel } from '@/utils/tempExpiry';

/** Vises kun for ledere, og kun når en vikar udløber inden for 3 dage. */
const ExpiringTempsCard: React.FC = () => {
  const { employees } = useEmployees();
  const { currentLanguage } = useTranslation();
  const isDa = currentLanguage === 'da';
  const expiring = useMemo(
    () => employees.filter(isTempExpiringSoon).sort((a, b) => (getTempDaysLeft(a) ?? 0) - (getTempDaysLeft(b) ?? 0)),
    [employees]
  );
  if (expiring.length === 0) return null;
  return (
    <Card className="border-warning/30 bg-warning-soft/40">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {expiring.length} {isDa ? (expiring.length === 1 ? 'vikar udløber snart' : 'vikarer udløber snart') : 'temporary staff expiring soon'}
            </p>
            <p className="text-sm text-muted-foreground">
              {expiring.map(e => `${e.name} (${expiryLabel(getTempDaysLeft(e) ?? 0, isDa).toLowerCase()})`).join(', ')}
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="min-h-11 shrink-0">
          <Link to="/employees">{isDa ? 'Forlæng' : 'Extend'}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExpiringTempsCard;
