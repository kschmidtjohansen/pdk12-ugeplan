
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '../../context/TranslationContext';

interface VacationActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacation: Vacation | null;
  actionType: "approve" | "reject";
  note: string;
  setNote: (note: string) => void;
  onSubmit: () => void;
}

const VacationActionDialog: React.FC<VacationActionDialogProps> = ({
  open,
  onOpenChange,
  vacation,
  actionType,
  note,
  setNote,
  onSubmit
}) => {
  const { t } = useTranslation();
  const isRejection = actionType === 'reject';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRejection ? t("vacation.rejectRequest") : t("vacation.approveRequest")}
          </DialogTitle>
          <DialogDescription>
            {isRejection ? t("vacation.rejectReasonDesc") : t("vacation.approveNoteDesc")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">
              {isRejection ? t("vacation.rejectionReason") : t("vacation.noteOptional")}
              {!isRejection && <span className="text-sm text-muted-foreground ml-1">({t("common.optional")})</span>}
            </Label>
            <Textarea 
              id="note" 
              value={note} 
              onChange={e => setNote(e.target.value)}
              placeholder={isRejection 
                ? t("vacation.rejectionReasonPlaceholder") 
                : t("vacation.approveNotePlaceholder")
              } 
              required={isRejection}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              type="submit" 
              className={isRejection 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"
              }
            >
              {isRejection ? t("vacation.rejectRequestBtn") : t("vacation.approveRequestBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VacationActionDialog;
