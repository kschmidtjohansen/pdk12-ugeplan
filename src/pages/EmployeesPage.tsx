
import React, { useState } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { usePermissions } from '../context/AuthContext';
import { 
  Card, 
  CardContent, 
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
import { Plus, Edit, Mail, Phone, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data
const initialEmployees = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@polygon.com',
    phone: '+45 12 34 56 78',
    jobTitle: 'Senior Technician',
    role: 'skadeleder',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@polygon.com',
    phone: '+45 23 45 67 89',
    jobTitle: 'Technician',
    role: 'servicemedarbejder',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@polygon.com',
    phone: '+45 34 56 78 90',
    jobTitle: 'Project Manager',
    role: 'administrator',
  },
  {
    id: '4',
    name: 'Anna Williams',
    email: 'anna.williams@polygon.com',
    phone: '+45 45 67 89 01',
    jobTitle: 'Junior Technician',
    role: 'servicemedarbejder',
  },
];

const USER_ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'skadeleder', label: 'Skadeleder' },
  { value: 'servicemedarbejder', label: 'Servicemedarbejder' },
];

const EmployeesPage: React.FC = () => {
  const { isAdmin, canEdit } = usePermissions();
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: '',
  });

  const handleCreateNew = () => {
    setCurrentEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
    });
    setDialogOpen(true);
  };

  const handleEdit = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      jobTitle: employee.jobTitle,
      role: employee.role,
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

  const handleSelectChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentEmployee) {
      // Update existing
      setEmployees(
        employees.map((e) =>
          e.id === currentEmployee.id ? { ...e, ...formData } : e
        )
      );
      toast({
        title: "Employee updated",
        description: `${formData.name}'s information has been updated.`,
      });
    } else {
      // Create new
      const newEmployee = {
        ...formData,
        id: Date.now().toString(),
      };
      setEmployees([...employees, newEmployee]);
      toast({
        title: "Employee added",
        description: `${formData.name} has been added to the department.`,
      });
    }
    
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader 
        title="Employees"
        description="Department employees and their roles"
      >
        {isAdmin && (
          <Button 
            onClick={handleCreateNew}
            className="bg-polygon-red hover:bg-polygon-darkred"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Role</TableHead>
                {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.jobTitle}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                      employee.role === 'administrator' 
                        ? 'bg-blue-100 text-blue-800' 
                        : employee.role === 'skadeleder'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {USER_ROLES.find(role => role.value === employee.role)?.label}
                    </span>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Edit</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {currentEmployee
                ? 'Update the employee information.'
                : 'Add a new employee to the department.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select
                value={formData.role}
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
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
                {currentEmployee ? 'Save Changes' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmployeesPage;
