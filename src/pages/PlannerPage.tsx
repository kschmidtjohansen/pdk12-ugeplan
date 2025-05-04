
import React, { useState } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { usePermissions } from '../context/AuthContext';
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

// Mock data
const initialAssignments = [
  {
    id: '1',
    title: 'Water damage inspection',
    description: 'Complete inspection of water damage in basement area.',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employee: 'John Doe',
  },
  {
    id: '2',
    title: 'Fire damage restoration',
    description: 'Initial assessment of fire damage in apartment.',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'Copenhagen South',
    car: 'Truck 3',
    employee: 'Jane Smith',
  },
  {
    id: '3',
    title: 'Mold assessment',
    description: 'Inspect and assess mold damage in kitchen walls.',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense East',
    car: 'Van 2',
    employee: 'Mike Johnson',
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
const groupByDate = (assignments) => {
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
  const { toast } = useToast();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    fromTime: '',
    toTime: '',
    location: '',
    car: '',
    employee: '',
  });

  const currentWeek = getCurrentWeek();
  const groupedAssignments = groupByDate(assignments);
  
  const handleCreateNew = () => {
    setCurrentAssignment(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      fromTime: '',
      toTime: '',
      location: '',
      car: '',
      employee: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (assignment) => {
    setCurrentAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      date: assignment.date,
      fromTime: assignment.fromTime,
      toTime: assignment.toTime,
      location: assignment.location,
      car: assignment.car,
      employee: assignment.employee,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentAssignment) {
      // Update existing
      setAssignments(
        assignments.map((a) =>
          a.id === currentAssignment.id ? { ...a, ...formData } : a
        )
      );
      toast({
        title: "Assignment updated",
        description: `${formData.title} has been updated.`,
      });
    } else {
      // Create new
      const newAssignment = {
        ...formData,
        id: Date.now().toString(),
      };
      setAssignments([...assignments, newAssignment]);
      toast({
        title: "Assignment created",
        description: `${formData.title} has been added to the schedule.`,
      });
    }
    
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader 
        title="Weekly Planner"
        description={`Week ${currentWeek} Schedule and Assignments`}
      >
        {canCreate && (
          <Button 
            onClick={handleCreateNew}
            className="bg-polygon-red hover:bg-polygon-darkred"
          >
            <Plus className="mr-2 h-4 w-4" /> New Assignment
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6">
        {Object.keys(groupedAssignments).length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-muted-foreground mb-4">No assignments scheduled</p>
            {canCreate && (
              <Button onClick={handleCreateNew} className="bg-polygon-red hover:bg-polygon-darkred">
                <Plus className="mr-2 h-4 w-4" /> Create First Assignment
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
                    {new Date(date).toLocaleDateString('en-GB', {
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{assignment.employee}</span>
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
              {currentAssignment ? 'Edit Assignment' : 'New Assignment'}
            </DialogTitle>
            <DialogDescription>
              {currentAssignment
                ? 'Update the details for this assignment.'
                : 'Add a new assignment to the weekly schedule.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
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
                <Label htmlFor="date">Date</Label>
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
                <Label htmlFor="location">Location</Label>
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
                <Label htmlFor="fromTime">From</Label>
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
                <Label htmlFor="toTime">To</Label>
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
              <Label htmlFor="car">Car</Label>
              <Select
                value={formData.car}
                onValueChange={(value) => handleSelectChange('car', value)}
                required
              >
                <SelectTrigger id="car">
                  <SelectValue placeholder="Select a car" />
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
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formData.employee}
                onValueChange={(value) => handleSelectChange('employee', value)}
                required
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_EMPLOYEES.map((employee) => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {currentAssignment ? 'Save Changes' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlannerPage;
