import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import PageHeader from '../components/Layout/PageHeader';
import { useAuth, usePermissions } from '../context/AuthContext';
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

// Mock data
type VacationStatus = 'pending' | 'approved' | 'rejected';

interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: VacationStatus;
  createdAt: Date;
  notes?: string;
}

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
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const [vacations, setVacations] = useState(initialVacations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState('all');
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
        title: "Missing dates",
        description: "Please select both start and end dates",
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
      title: "Vacation request submitted",
      description: "Your request has been sent for approval.",
    });
    
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
        ? "Vacation request rejected" 
        : "Vacation request approved",
      description: `${actionVacation.employeeName}'s request has been ${actionVacation.status === 'rejected' ? 'rejected' : 'approved'}.`,
    });
    
    setNoteDialogOpen(false);
  };

  const filteredVacations = vacations.filter(v => {
    if (activeTab === 'approved') return v.status === 'approved';
    if (activeTab === 'pending') return v.status === 'pending';
    if (activeTab === 'mine') return v.employeeId === user?.id;
    return true;
  });

  return (
    <>
      <PageHeader 
        title="Vacation"
        description="Apply for and manage vacation time"
      >
        <Button 
          onClick={handleCreateNew}
          className="bg-polygon-red hover:bg-polygon-darkred"
        >
          <Plus className="mr-2 h-4 w-4" /> Apply for Vacation
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="mine">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredVacations.length === 0 ? (
              <Card className="text-center p-8">
                <p className="text-muted-foreground">No vacation requests found</p>
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
                          {vacation.status.charAt(0).toUpperCase() + vacation.status.slice(1)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col">
                          <dt className="font-medium text-gray-500">Date Range</dt>
                          <dd>
                            {format(vacation.startDate, 'PPP')} - {format(vacation.endDate, 'PPP')}
                          </dd>
                        </div>
                        <div className="flex flex-col">
                          <dt className="font-medium text-gray-500">Reason</dt>
                          <dd>{vacation.reason}</dd>
                        </div>
                        {vacation.notes && (
                          <div className="flex flex-col">
                            <dt className="font-medium text-gray-500">Notes</dt>
                            <dd>{vacation.notes}</dd>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <dt className="font-medium text-gray-500">Requested on</dt>
                          <dd>{format(vacation.createdAt, 'PPP')}</dd>
                        </div>
                      </dl>
                    </CardContent>
                    {isAdmin && vacation.status === 'pending' && (
                      <CardFooter className="flex justify-between border-t pt-4 pb-4">
                        <Button
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRejectClick(vacation)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveClick(vacation)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
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
            <DialogTitle>Apply for Vacation</DialogTitle>
            <DialogDescription>
              Select your vacation dates and provide a reason.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
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
                        <span>Select vacation dates</span>
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
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for your vacation request"
                required
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-polygon-red hover:bg-polygon-darkred"
              >
                Submit Request
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
                ? 'Reject Vacation Request' 
                : 'Approve Vacation Request'}
            </DialogTitle>
            <DialogDescription>
              {actionVacation?.status === 'rejected' 
                ? 'Please provide a reason for rejecting this request.' 
                : 'You can add an optional note to this approval.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">
                {actionVacation?.status === 'rejected' ? 'Reason for rejection' : 'Note (optional)'}
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  actionVacation?.status === 'rejected'
                    ? "Explain why this request is being rejected"
                    : "Add any additional notes to this approval"
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
                Cancel
              </Button>
              <Button 
                type="submit"
                className={actionVacation?.status === 'rejected' 
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
                }
              >
                {actionVacation?.status === 'rejected' ? 'Reject Request' : 'Approve Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VacationPage;
