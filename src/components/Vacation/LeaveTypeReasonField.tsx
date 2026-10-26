import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { LEAVE_TYPES, buildLeaveReason, parseLeaveReason } from './leaveType';

interface Props {
  reason: string;
  setReason: (reason: string) => void;
}

/** Required leave type (Ferie/Feriefridag/Afspadsering) plus optional note, stored together in `reason`. */
const LeaveTypeReasonField: React.FC<Props> = ({ reason, setReason }) => {
  const { type, note } = parseLeaveReason(reason);
  return (
    <>
      <div className="space-y-2">
        <Label id="leave-type-label">Type af fri *</Label>
        <div role="radiogroup" aria-labelledby="leave-type-label" className="grid grid-cols-3 gap-2">
          {LEAVE_TYPES.map((lt) => {
            const active = type === lt;
            return (
              <button
                key={lt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setReason(buildLeaveReason(lt, note))}
                className={cn(
                  'min-h-11 rounded-md border px-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-accent'
                )}
              >
                {lt}
              </button>
            );
          })}
        </div>
        {!type && <p className="text-xs text-muted-foreground">Vælg om du søger om ferie, feriefridag eller afspadsering.</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Bemærkning (valgfri)</Label>
        <Textarea id="reason" value={note} onChange={(e) => setReason(buildLeaveReason(type, e.target.value))} />
      </div>
    </>
  );
};

export default LeaveTypeReasonField;
