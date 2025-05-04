
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Mock data
const initialAssignments = [
  {
    id: '1',
    title: 'Vandskade inspektion',
    description: 'Komplet inspektion af vandskade i kælderområdet.',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employees: ['John Doe'],
  },
  {
    id: '2',
    title: 'Brandskade restaurering',
    description: 'Første vurdering af brandskade i lejlighed.',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'København Syd',
    car: 'Truck 3',
    employees: ['Jane Smith'],
  },
  {
    id: '3',
    title: 'Skimmelsvamp vurdering',
    description: 'Inspicer og vurder skimmelsvamp skade på køkkenvægge.',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense Øst',
    car: 'Van 2',
    employees: ['Mike Johnson', 'Anna Williams'],
  },
];

const MOCK_EMPLOYEES = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Mike Johnson' },
  { id: '4', name: 'Anna Williams' },
];

const MOCK_CARS = [
  { id: '1', name: 'Van 1' },
  { id: '2', name: 'Van 2' },
  { id: '3', name: 'Truck 3' },
  { id: '4', name: 'Sedan 1' },
];

// Type definition for assignments
interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  car: string;
  employees: string[]; // Changed from single employee to array of employees
}

// Type for grouped assignments
interface GroupedAssignments {
  [key: string]: Assignment[];
}

// Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return weekNum;
};

// Group assignments by date
const groupByDate = (assignments: Assignment[]) => {
  return assignments.reduce((groups, assignment) => {
    const date = assignment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(assignment);
    return groups;
  }, {});
};

const PlannerPage: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState<Omit<Assignment, 'employees'> & { employees: string[] }>({
    id: '',
    title: '',
    description: '',
    date: '',
    fromTime: '',
    toTime: '',
    location: '',
    car: '',
    employees: [],
  });

  const currentWeek = getCurrentWeek();
  const groupedAssignments: GroupedAssignments = groupByDate(assignments);
  
  const handleCreateNew = () => {
    setCurrentAssignment(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      date: '',
      fromTime: '',
      toTime: '',
      location: '',
      car: '',
      employees: [],
    });
    setSelectedEmployees([]);
    setDialogOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setSelectedEmployees(assignment.employees || []);
    setFormData({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      date: assignment.date,
      fromTime: assignment.fromTime,
      toTime: assignment.toTime,
      location: assignment.location,
      car: assignment.car,
      employees: assignment.employees || [],
    });
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeToggle = (employeeName: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeName)) {
        return prev.filter(name => name !== employeeName);
      } else {
        return [...prev, employeeName];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentAssignment) {
      // Update existing
      setAssignments(
        assignments.map((a) =>
          a.id === currentAssignment.id 
            ? { ...formData, employees: selectedEmployees } 
            : a
        )
      );
      toast({
        title: t("planner.assignmentUpdated"),
        description: t("planner.assignmentUpdatedMsg", { title: formData.title }),
      });
    } else {
      // Create new
      const newAssignment = {
        ...formData,
        id: Date.now().toString(),
        employees: selectedEmployees,
      };
      setAssignments([...assignments, newAssignment]);
      toast({
        title: t("planner.assignmentCreated"),
        description: t("planner.assignmentCreatedMsg", { title: formData.title }),
      });
    }
    
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader 
        title={t("navigation.planner")}
        description={t("planner.weekDescription", { week: currentWeek })}
      >
        {canCreate && (
          <Button 
            onClick={handleCreateNew}
            className="bg-polygon-red hover:bg-polygon-darkred"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("planner.newAssignment")}
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6">
        {Object.keys(groupedAssignments).length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-muted-foreground mb-4">{t("planner.noAssignments")}</p>
            {canCreate && (
              <Button onClick={handleCreateNew} className="bg-polygon-red hover:bg-polygon-darkred">
                <Plus className="mr-2 h-4 w-4" /> {t("planner.createFirstAssignment")}
              </Button>
            )}
          </Card>
        ) : (
          Object.entries(groupedAssignments)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, dateAssignments]) => (
              <Card key={date}>
                <CardHeader className="pb-3">
                  <CardTitle>
                    {new Date(date).toLocaleDateString('da-DK', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dateAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-md p-4 bg-white hover:border-polygon-red transition-colors"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <h3 className="font-medium text-lg">{assignment.title}</h3>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(assignment)}
                              className="h-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{assignment.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-polygon-red" />
                            <span>{assignment.fromTime} - {assignment.toTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-polygon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{assignment.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-polygon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            <div className="flex flex-wrap gap-1">
                              {assignment.employees.map((employee, index) => (
                                <div key={index}>
                                  <Badge variant="outline" className="bg-gray-100">
                                    {employee}
                                  </Badge>
                                  {index < assignment.employees.length - 1 && ', '}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-polygon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            <span>{assignment.car}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentAssignment ? t("planner.editAssignment") : t("planner.newAssignment")}
            </DialogTitle>
            <DialogDescription>
              {currentAssignment
                ? t("planner.updateDetails")
                : t("planner.addAssignment")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("planner.assignmentTitle")}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{t("planner.description")}</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t("planner.date")}</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">{t("planner.location")}</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromTime">{t("planner.from")}</Label>
                <Input
                  id="fromTime"
                  name="fromTime"
                  type="time"
                  value={formData.fromTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="toTime">{t("planner.to")}</Label>
                <Input
                  id="toTime"
                  name="toTime"
                  type="time"
                  value={formData.toTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="car">{t("planner.car")}</Label>
              <Select
                value={formData.car}
                onValueChange={(value) => handleSelectChange('car', value)}
                required
              >
                <SelectTrigger id="car">
                  <SelectValue placeholder={t("planner.selectCar")} />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CARS.map((car) => (
                    <SelectItem key={car.id} value={car.name}>
                      {car.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employees">{t("planner.employees")}</Label>
              <div className="border rounded-md p-3 space-y-2">
                {MOCK_EMPLOYEES.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployees.includes(employee.name)}
                      onCheckedChange={() => handleEmployeeToggle(employee.name)}
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {employee.name}
                    </label>
                  </div>
                ))}
              </div>
              {selectedEmployees.length === 0 && (
                <p className="text-sm text-red-500">{t("planner.selectAtLeastOneEmployee")}</p>
              )}
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
                className="bg-polygon-red hover:bg-polygon-darkred"
                disabled={selectedEmployees.length === 0}
              >
                {currentAssignment ? t("planner.saveChanges") : t("planner.createAssignment")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlannerPage;
