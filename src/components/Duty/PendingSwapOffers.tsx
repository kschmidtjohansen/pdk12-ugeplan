import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Phone, Car, ArrowLeftRight, X } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import type { DutySwapRequestWithDuty } from '@/hooks/duty/useDutySwapRequests';

interface Props {
  incoming: DutySwapRequestWithDuty[];
  outgoing: DutySwapRequestWithDuty[];
  onChanged?: () => void;
}

export function PendingSwapOffers({ incoming, outgoing, onChanged }: Props) {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const { acceptSwapRequest, cancelSwapRequest, declineSwapRequest, loading } = useDutyActions(onChanged);
  const [alreadyTakenOpen, setAlreadyTakenOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<DutySwapRequestWithDuty | null>(null);

  if (incoming.length === 0 && outgoing.length === 0) return null;

  const dutyIcon = (type: string) =>
    type === 'skadeleder_vagt' ? <Phone className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  const dutyLabel = (type: string) =>
    type === 'skadeleder_vagt' ? t('duty.skadelederVagt') : t('duty.kørevagt');

  const handleAccept = async (id: string) => {
    const result = await acceptSwapRequest(id);
    if (result.status === 'already_taken' || result.status === 'expired' || result.status === 'not_invited') {
      setAlreadyTakenOpen(true);
    }
  };

  const handleDecline = async () => {
    const req = declineTarget;
    setDeclineTarget(null);
    if (!req) return;
    await declineSwapRequest(req.id, {
      requesterId: req.requested_by,
      dutyType: req.duty?.duty_type,
      dutyDate: req.duty?.duty_date,
    });
  };


  return (
    <div className="space-y-3">
      {incoming.map((req) => {
        const duty = req.duty;
        if (!duty) return null;
        const dateStr = format(new Date(duty.duty_date), 'EEEE d. MMMM', { locale });
        return (
          <section key={req.id} aria-label={t('duty.pendingSwapOffers')} className="facet-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-warning-soft text-warning-soft-foreground">
              <ArrowLeftRight className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">{t('duty.pendingSwapOffers')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('duty.swapOfferFrom', { name: req.requester?.name ?? '—' })} · {dutyLabel(duty.duty_type)} {dateStr}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button className="rounded-full" onClick={() => handleAccept(req.id)} disabled={loading}>
                {t('duty.acceptSwap')}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setDeclineTarget(req)} disabled={loading}>
                {t('duty.declineSwap')}
              </Button>
            </div>
          </section>
        );
      })}

      {outgoing.length > 0 && (
        <Card className="facet-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              {t('duty.myOpenSwapOffers')}
              <Badge variant="secondary">{outgoing.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outgoing.map((req) => {
              const duty = req.duty;
              if (!duty) return null;
              const dateStr = format(new Date(duty.duty_date), 'EEEE d. MMMM yyyy', { locale });
              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="gap-1">
                      {dutyIcon(duty.duty_type)}
                      {dutyLabel(duty.duty_type)}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{dateStr}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.candidate_ids.length} {req.candidate_ids.length === 1 ? 'kandidat' : 'kandidater'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelTarget(req.id)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('duty.cancelSwapOffer')}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={alreadyTakenOpen} onOpenChange={setAlreadyTakenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('duty.swapAlreadyTaken')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('duty.swapAlreadyTaken')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlreadyTakenOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('duty.cancelSwapTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('duty.cancelSwapDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { const id = cancelTarget; setCancelTarget(null); if (id) await cancelSwapRequest(id); }}>
              {t('duty.cancelSwapOffer')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!declineTarget} onOpenChange={(o) => !o && setDeclineTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('duty.declineSwapTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('duty.declineSwapDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDecline}>
              {t('duty.declineSwap')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

