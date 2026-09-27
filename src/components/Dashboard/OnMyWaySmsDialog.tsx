import React, { useEffect, useMemo, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSquare } from 'lucide-react';

const PRESETS = [10, 15, 20, 30, 45, 60];
const STORAGE_KEY = 'onMyWayEtaMinutes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string | null;
  senderFirstName?: string;
  isDa: boolean;
}

const buildMessage = (minutes: number, caseNumber: string | null | undefined, sender: string, isDa: boolean) => {
  const caseText = caseNumber ? (isDa ? ` (sag ${caseNumber})` : ` (case ${caseNumber})`) : '';
  return isDa
    ? `Hej, jeg er på vej fra Polygon Skadeservice${caseText} og forventer at være hos dig om ca. ${minutes} minutter. Mvh ${sender}`.trim()
    : `Hi, I am on my way from Polygon Skadeservice${caseText} and expect to arrive in about ${minutes} minutes. Best regards ${sender}`.trim();
};

const OnMyWaySmsDialog: React.FC<Props> = ({ isOpen, onClose, caseNumber, senderFirstName = '', isDa }) => {
  const isMobile = useIsMobile();
  const [minutes, setMinutes] = useState(15);
  const [message, setMessage] = useState('');
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);
    const initial = Number.isFinite(stored) && stored > 0 && stored <= 240 ? stored : 15;
    setMinutes(initial);
    setEdited(false);
    setMessage(buildMessage(initial, caseNumber, senderFirstName, isDa));
  }, [isOpen, caseNumber, senderFirstName, isDa]);

  const applyMinutes = (value: number) => {
    setMinutes(value);
    if (!edited) setMessage(buildMessage(value, caseNumber, senderFirstName, isDa));
  };

  const arrival = useMemo(
    () => (minutes > 0 ? format(addMinutes(new Date(), minutes), 'HH:mm') : null),
    [minutes]
  );

  const handleSend = () => {
    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
    try {
      localStorage.setItem(STORAGE_KEY, String(minutes));
    } catch {
      /* ignore */
    }
    onClose();
  };

  const title = isDa ? 'SMS: På vej' : 'SMS: On my way';
  const description = isDa
    ? 'Vælg forventet ankomst, og tjek beskeden før du åbner beskeder.'
    : 'Pick the estimated arrival and review the message before opening messages.';

  const body = (
    <div className="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0">
      <div className="space-y-2">
        <Label>{isDa ? 'Forventet ankomst' : 'Estimated arrival'}</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={minutes === p ? 'brand' : 'outline'}
              className="min-h-11 min-w-[56px]"
              onClick={() => applyMinutes(p)}
            >
              {p} min
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={240}
            inputMode="numeric"
            value={minutes}
            onChange={e => applyMinutes(Math.max(1, Math.min(240, parseInt(e.target.value, 10) || 1)))}
            className="h-11 w-24"
            aria-label={isDa ? 'Minutter' : 'Minutes'}
          />
          <span className="text-sm text-muted-foreground">
            {isDa ? 'minutter' : 'minutes'}
            {arrival && ` · ${isDa ? 'ca.' : 'approx.'} ${arrival}`}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="on-my-way-message">{isDa ? 'Besked' : 'Message'}</Label>
        <Textarea
          id="on-my-way-message"
          value={message}
          maxLength={500}
          rows={5}
          onChange={e => {
            setEdited(true);
            setMessage(e.target.value);
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="min-h-11 flex-1" onClick={onClose}>
          {isDa ? 'Annullér' : 'Cancel'}
        </Button>
        <Button
          variant="brand"
          className="min-h-11 flex-1"
          disabled={!message.trim()}
          onClick={handleSend}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {isDa ? 'Åbn beskeder' : 'Open messages'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};

export default OnMyWaySmsDialog;
