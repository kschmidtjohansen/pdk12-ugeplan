import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { useToast } from '@/components/ui/use-toast';
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Car } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { Assignment } from '@/types/assignment';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useCars } from '@/hooks/car';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 20),
    to: addDays(new Date(), 20),
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { assignments } = useAssignmentsConsolidated({ filter: 'all' });
  const { cars } = useCars();

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  // Function to handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('admin.copiedToClipboard'),
      description: t('admin.copiedToClipboardMsg'),
    });
  };

  // Calculate total number of assignments
  const totalAssignments = assignments.length;

  // Calculate number of assignments for the selected date
  const assignmentsOnSelectedDate = assignments.filter(
    (assignment: Assignment) => assignment.date === format(selectedDate, 'yyyy-MM-dd')
  ).length;

        // FIXED: Calculate cars in use with proper array handling
        const carsInUseCount = assignments
          .filter(a => a.date === format(selectedDate, 'yyyy-MM-dd') && a.car)
          .reduce((uniqueCars, assignment) => {
            if (!assignment.car) return uniqueCars;
            
            if (Array.isArray(assignment.car)) {
              assignment.car.forEach(car => {
                const carId = typeof car === 'string' ? car : car.id;
                if (carId && !uniqueCars.includes(carId)) {
                  uniqueCars.push(carId);
                }
              });
            } else {
              const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car.id;
              if (carId && !uniqueCars.includes(carId)) {
                uniqueCars.push(carId);
              }
            }
            return uniqueCars;
          }, [] as string[]).length;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('admin.adminDashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.quickStats.totalAssignments')}</CardTitle>
            <CardDescription>{t('admin.quickStats.allAssignments')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.quickStats.assignmentsToday')}</CardTitle>
            <CardDescription>{t('admin.quickStats.todaysAssignments')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentsOnSelectedDate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.quickStats.availableCars')}</CardTitle>
            <CardDescription>{t('admin.quickStats.availableVehicles')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cars.filter(car => car.is_available).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.quickStats.carsInUse')}</CardTitle>
            <CardDescription>{t('admin.quickStats.vehiclesInUse')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carsInUseCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t('admin.dateSelection')}</h2>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'yyyy-MM-dd') : <span>{t('common.pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={range ? { before: range.from, after: range.to } : undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t('admin.dateRangeSelection')}</h2>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !range && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? (
                  range.to ? (
                    `${format(range.from, 'yyyy-MM-dd')} - ${format(range.to, 'yyyy-MM-dd')}`
                  ) : (
                    format(range.from, 'yyyy-MM-dd')
                  )
                ) : (
                  <span>{t('common.pickRange')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={selectedDate}
                selected={range}
                onSelect={setRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t('admin.supabaseCredentials')}</h2>
        <div className="space-y-2">
          <div>
            <Label htmlFor="supabase-url">{t('admin.supabaseUrl')}</Label>
            <div className="flex items-center">
              <Input
                id="supabase-url"
                className="mr-2"
                readOnly
                value={process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_SUPABASE_URL || '')}
              >
                {t('admin.copy')}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="supabase-anon-key">{t('admin.supabaseAnonKey')}</Label>
            <div className="flex items-center">
              <Input
                id="supabase-anon-key"
                className="mr-2"
                readOnly
                value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')}
              >
                {t('admin.copy')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
