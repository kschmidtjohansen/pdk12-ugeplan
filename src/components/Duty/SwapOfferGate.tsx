import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDutySwapRequests } from '@/hooks/duty/useDutySwapRequests';
import { PendingSwapOffers } from './PendingSwapOffers';

/**
 * App-wide blocking prompt: incoming duty swap offers stay on screen on every
 * page until the user accepts or declines them (no close button, Escape ignored).
 */
export function SwapOfferGate() {
  const { incoming, refetch } = useDutySwapRequests();
  const pending = incoming.filter((r) => r.duty);
  const open = pending.length > 0;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="max-w-xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Du har et vagtbytte-forslag</AlertDialogTitle>
          <AlertDialogDescription>
            Accepter eller afslå forslaget for at fortsætte.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <PendingSwapOffers incoming={pending} outgoing={[]} onChanged={() => void refetch()} />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
