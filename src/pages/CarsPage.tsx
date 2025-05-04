
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Car } from 'lucide-react';
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
const initialCars = [
  {
    id: '1',
    name: 'Van 1',
    carNumber: 'PG-001',
    numberPlate: 'AB 12 345',
    fuelCardCode: '123456',
  },
  {
    id: '2',
    name: 'Van 2',
    carNumber: 'PG-002',
    numberPlate: 'CD 23 456',
    fuelCardCode: '234567',
  },
  {
    id: '3',
    name: 'Truck 3',
    carNumber: 'PG-003',
    numberPlate: 'EF 34 567',
    fuelCardCode: '345678',
  },
  {
    id: '4',
    name: 'Sedan 1',
    carNumber: 'PG-004',
    numberPlate: 'GH 45 678',
    fuelCardCode: '456789',
  },
];

const CarsPage: React.FC = () => {
  const { canEdit, canViewFuelCardCode, isAdmin } = usePermissions();
  const { toast } = useToast();
  const [cars, setCars] = useState(initialCars);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCar, setCurrentCar] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    carNumber: '',
    numberPlate: '',
    fuelCardCode: '',
  });

  const handleCreateNew = () => {
    setCurrentCar(null);
    setFormData({
      name: '',
      carNumber: '',
      numberPlate: '',
      fuelCardCode: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (car) => {
    setCurrentCar(car);
    setFormData({
      name: car.name,
      carNumber: car.carNumber,
      numberPlate: car.numberPlate,
      fuelCardCode: car.fuelCardCode,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentCar) {
      // Update existing
      setCars(
        cars.map((c) =>
          c.id === currentCar.id ? { ...c, ...formData } : c
        )
      );
      toast({
        title: "Vehicle updated",
        description: `${formData.name}'s information has been updated.`,
      });
    } else {
      // Create new
      const newCar = {
        ...formData,
        id: Date.now().toString(),
      };
      setCars([...cars, newCar]);
      toast({
        title: "Vehicle added",
        description: `${formData.name} has been added to the fleet.`,
      });
    }
    
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader 
        title="Cars"
        description="Department vehicles and their details"
      >
        {isAdmin && (
          <Button 
            onClick={handleCreateNew}
            className="bg-polygon-red hover:bg-polygon-darkred"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Car Number</TableHead>
                <TableHead>Number Plate</TableHead>
                {canViewFuelCardCode && <TableHead>Fuel Card Code</TableHead>}
                {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{car.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{car.carNumber}</TableCell>
                  <TableCell>{car.numberPlate}</TableCell>
                  {canViewFuelCardCode && (
                    <TableCell>
                      <code className="bg-gray-100 p-1 rounded">{car.fuelCardCode}</code>
                    </TableCell>
                  )}
                  {canEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(car)}
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
              {currentCar ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <DialogDescription>
              {currentCar
                ? 'Update the vehicle information.'
                : 'Add a new vehicle to the department fleet.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vehicle Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="carNumber">Car Number</Label>
              <Input
                id="carNumber"
                name="carNumber"
                value={formData.carNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberPlate">Number Plate</Label>
              <Input
                id="numberPlate"
                name="numberPlate"
                value={formData.numberPlate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {canViewFuelCardCode && (
              <div className="space-y-2">
                <Label htmlFor="fuelCardCode">Fuel Card Code</Label>
                <Input
                  id="fuelCardCode"
                  name="fuelCardCode"
                  value={formData.fuelCardCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}
            
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
                {currentCar ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CarsPage;
