
import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import PageHeader from '../components/Layout/PageHeader';
import { useAuth, usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Vacation, VacationStatus } from '../types/vacation';

// Mock data
const initialVacations: Vacation[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'John Doe',
    startDate: new Date('2025-05-15'),
    endDate: new Date('2025-05-20'),
    reason: 'Annual leave',
    status: 'approved',
    createdAt: new Date('2025-04-01'),
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Jane Smith',
    startDate: new Date('2025-06-10'),
    endDate: new Date('2025-06-15'),
    reason: 'Family vacation',
    status: 'pending',
    createdAt: new Date('2025-04-15'),
  },
  {
    id: '3',
    employeeId: '3',
    employeeName: 'Mike Johnson',
    startDate: new Date('2025-07-05'),
    endDate: new Date('2025-07-12'),
    reason: 'Summer holiday',
    status: 'rejected',
    createdAt: new Date('2025-04-20'),
    notes: 'Too many people already on vacation during this period',
  },
];

const VacationPage: React.FC = () => {
  const { user } = useAuth();
  const { canApproveVacation, canViewAllVacations, isServicemedarbejder } = usePermissions();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const [vacations, setVacations] = useState(initialVacations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState(isServicemedarbejder ? 'mine' : 'all');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [actionVacation, setActionVacation] = useState<Vacation | null>(null);
  const [note, setNote] = useState('');

  const handleCreateNew = () => {
    setDate({ from: undefined, to: undefined });
    setReason('');
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date.from || !date.to) {
      toast({
        title: t("vacation.missingDates"),
        description: t("vacation.selectBothDates"),
        variant: "destructive",
      });
      return;
    }
    
    const newVacation: Vacation = {
      id: Date.now().toString(),
      employeeId: user?.id || '',
      employeeName: user?.name || '',
      startDate: date.from,
      endDate: date.to,
      reason,
      status: 'pending',
      createdAt: new Date(),
    };
    
    setVacations([...vacations, newVacation]);
    
    toast({
      title: t("vacation.requestSubmitted"),
      description: t("vacation.requestSent"),
    });

    // Generate notification for administrators
    if (user?.role !== 'administrator') {
      const formattedStartDate = format(date.from, 'dd/MM/yyyy');
      const formattedEndDate = format(date.to, 'dd/MM/yyyy');
      
      addNotification({
        type: 'vacation',
        title: t("notifications.newVacationRequest"),
        message: t("notifications.newVacationRequestMsg", {
          name: user?.name,
          from: formattedStartDate,
          to: formattedEndDate
        }),
        link: '/vacation'
      });
    }
    
    setDialogOpen(false);
  };

  const handleApproveClick = (vacation: Vacation) => {
    setActionVacation(vacation);
    setNote('');
    setNoteDialogOpen(true);
  };

  const handleRejectClick = (vacation: Vacation) => {
    setActionVacation({...vacation, status: 'rejected'});
    setNote('');
    setNoteDialogOpen(true);
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionVacation) return;
    
    setVacations(vacations.map(v => {
      if (v.id === actionVacation.id) {
        return {
          ...v,
          status: actionVacation.status === 'rejected' ? 'rejected' : 'approved',
          notes: note || undefined,
        };
      }
      return v;
    }));
    
    toast({
      title: actionVacation.status === 'rejected' 
        ? t("vacation.requestRejected")
        : t("vacation.requestApproved"),
      description: t(
        actionVacation.status === 'rejected' 
          ? "vacation.requestRejectedMsg"
          : "vacation.requestApprovedMsg",
        { name: actionVacation.employeeName }
      ),
    });
    
    setNoteDialogOpen(false);
  };

  const filteredVacations = vacations.filter(v => {
    if (activeTab === 'approved') return v.status === 'approved';
    if (activeTab === 'pending') return v.status === 'pending';
    if (activeTab === 'mine') return v.employeeId === user?.id;
    return true;
  });

  // For service employees, only show the "mine" tab
  const getAvailableTabs = () => {
    if (isServicemedarbejder) {
      return (
        <TabsList className="grid grid-cols-1 w-full max-w-md">
          <TabsTrigger value="mine">{t("vacation.tabs.mine")}</TabsTrigger>
        </TabsList>
      );
    }
    
    return (
      <TabsList className="grid grid-cols-4 w-full max-w-md">
        <TabsTrigger value="all">{t("vacation.tabs.all")}</TabsTrigger>
        <TabsTrigger value="pending">{t("vacation.tabs.pending")}</TabsTrigger>
        <TabsTrigger value="approved">{t("vacation.tabs.approved")}</TabsTrigger>
        <TabsTrigger value="mine">{t("vacation.tabs.mine")}</TabsTrigger>
      </TabsList>
    );
  };

  return (
    <>
      <PageHeader 
        title={t("navigation.vacation")}
        description={t("vacation.pageDescription")}
      >
        <Button 
          onClick={handleCreateNew}
          className="bg-polygon-purple hover:bg-polygon-darkpurple"
        >
          <Plus className="mr-2 h-4 w-4" /> {t("vacation.applyForVacation")}
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Tabs defaultValue={isServicemedarbejder ? 'mine' : 'all'} value={activeTab} onValueChange={setActiveTab}>
          {getAvailableTabs()}

          <TabsContent value={activeTab} className="mt-6">
            {filteredVacations.length === 0 ? (
              <Card className="text-center p-8">
                <p className="text-muted-foreground">{t("vacation.noRequests")}</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredVacations.map((vacation) => (
                  <Card key={vacation.id} className={cn(
                    "overflow-hidden",
                    vacation.status === 'approved' && "border-green-500",
                    vacation.status === 'rejected' && "border-polygon-red",
                    vacation.status === 'pending' && "border-amber-500"
                  )}>
                    <CardHeader className={cn(
                      "pb-3",
                      vacation.status === 'approved' && "bg-green-50",
                      vacation.status === 'rejected' && "bg-red-50",
                      vacation.status === 'pending' && "bg-amber-50"
                    )}>
                      <CardTitle className="flex justify-between items-start">
                        <span>{vacation.employeeName}</span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          vacation.status === 'approved' && "bg-green-100 text-green-800",
                          vacation.status === 'rejected' && "bg-red-100 text-red-800",
                          vacation.status === 'pending' && "bg-amber-100 text-amber-800"
                        )}>
                          {t(`vacation.status.${vacation.status}`)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col">
                          <dt className="font-medium text-gray-500">{t("vacation.dateRange")}</dt>
                          <dd>
                            {format(vacation.startDate, 'PPP')} - {format(vacation.endDate, 'PPP')}
                          </dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="font-medium text-gray-500">{t("vacation.reason")}</dt>
                          <dd>{vacation.reason}</dd>
                        </div>
                        {vacation.notes && (
                          <div className="flex flex-col">
                            <dt className="font-medium text-gray-500">{t("vacation.notes")}</dt>
                            <dd>{vacation.notes}</dd>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <dt className="font-medium text-gray-500">{t("vacation.requestedOn")}</dt>
                          <dd>{format(vacation.createdAt, 'PPP')}</dd>
                        </div>
                      </dl>
                    </CardContent>
                    {/* Only admins can approve/reject */}
                    {canApproveVacation && vacation.status === 'pending' && (
                      <CardFooter className="flex justify-between border-t pt-4 pb-4">
                        <Button
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRejectClick(vacation)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          {t("vacation.reject")}
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveClick(vacation)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {t("vacation.approve")}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Apply for vacation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("vacation.applyForVacation")}</DialogTitle>
            <DialogDescription>
              {t("vacation.selectDatesAndReason")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("vacation.dateRange")}</Label>
              <div className="flex flex-col">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>{t("vacation.selectVacationDates")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      numberOfMonths={2}
                      disabled={(date) => date < addDays(new Date(), 1)}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">{t("vacation.reason")}</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("vacation.reasonPlaceholder")}
                required
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit"
                className="bg-polygon-purple hover:bg-polygon-darkpurple"
              >
                {t("vacation.submitRequest")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject note dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionVacation?.status === 'rejected' 
                ? t("vacation.rejectRequest")
                : t("vacation.approveRequest")}
            </DialogTitle>
            <DialogDescription>
              {actionVacation?.status === 'rejected' 
                ? t("vacation.rejectReasonDesc")
                : t("vacation.approveNoteDesc")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">
                {actionVacation?.status === 'rejected' 
                  ? t("vacation.rejectionReason")
                  : t("vacation.noteOptional")}
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  actionVacation?.status === 'rejected'
                    ? t("vacation.rejectionReasonPlaceholder")
                    : t("vacation.approveNotePlaceholder")
                }
                required={actionVacation?.status === 'rejected'}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNoteDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit"
                className={actionVacation?.status === 'rejected' 
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
                }
              >
                {actionVacation?.status === 'rejected' 
                  ? t("vacation.rejectRequestBtn")
                  : t("vacation.approveRequestBtn")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VacationPage;
