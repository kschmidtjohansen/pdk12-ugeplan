import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
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
      {incoming.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              {t('duty.pendingSwapOffers')}
              <Badge variant="secondary">{incoming.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incoming.map((req) => {
              const duty = req.duty;
              if (!duty) return null;
              const dateStr = format(new Date(duty.duty_date), 'EEEE d. MMMM yyyy', { locale });
              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={req.requester?.avatar_url || undefined} />
                      <AvatarFallback>{req.requester?.name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {t('duty.swapOfferFrom', { name: req.requester?.name ?? '—' })}
                        </span>
                        <Badge variant="outline" className="gap-1">
                          {dutyIcon(duty.duty_type)}
                          {dutyLabel(duty.duty_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{dateStr}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(req.id)}
                    disabled={loading}
                  >
                    {t('duty.acceptSwap')}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {outgoing.length > 0 && (
        <Card>
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
                    onClick={() => cancelSwapRequest(req.id)}
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
    </div>
  );
}
