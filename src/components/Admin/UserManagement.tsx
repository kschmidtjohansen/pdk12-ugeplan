
import React, { useState } from 'react';
import { User as UserIcon, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, UserRole } from '@/context/AuthContext';

// Mock users for display
const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@polygon.com",
    role: "administrator",
  },
  {
    id: "2",
    name: "Skadeleder User",
    email: "skadeleder@polygon.com",
    role: "skadeleder",
  },
  {
    id: "3",
    name: "Service User",
    email: "service@polygon.com",
    role: "servicemedarbejder",
  },
  {
    id: "4",
    name: "John Doe",
    email: "john.doe@polygon.com",
    role: "servicemedarbejder",
  },
  {
    id: "5",
    name: "Jane Smith",
    email: "jane.smith@polygon.com",
    role: "skadeleder",
  },
];

const USER_ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'skadeleder', label: 'Skadeleder' },
  { value: 'servicemedarbejder', label: 'Servicemedarbejder' },
];

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'servicemedarbejder' as UserRole,
  });

  const handleCreateUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'servicemedarbejder',
    });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (currentUser) {
      setUsers(users.filter(user => user.id !== currentUser.id));
      toast({
        title: "User deleted",
        description: `${currentUser.name}'s account has been removed.`,
      });
      setDeleteDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole,
    }));
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUser) {
      // Update existing
      setUsers(
        users.map((u) =>
          u.id === currentUser.id ? { ...u, ...formData } : u
        )
      );
      toast({
        title: "User updated",
        description: `${formData.name}'s information has been updated.`,
      });
    } else {
      // Create new
      const newUser = {
        ...formData,
        id: Date.now().toString(),
      };
      setUsers([...users, newUser]);
      toast({
        title: "User added",
        description: `${formData.name} has been added as a ${USER_ROLES.find(r => r.value === formData.role)?.label}.`,
      });
    }
    
    setUserDialogOpen(false);
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their permissions</CardDescription>
            </div>
            <Button 
              onClick={handleCreateUser}
              className="bg-polygon-blue hover:bg-polygon-darkblue"
            >
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 profile-avatar">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={`${
                      user.role === 'administrator' 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                        : user.role === 'skadeleder'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }`}>
                      {USER_ROLES.find(role => role.value === user.role)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Edit</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="h-8 w-8 p-0 text-destructive"
                        disabled={user.id === '1'} // Prevent deleting main admin
                      >
                        <span className="sr-only">Delete</span>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Add/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {currentUser
                ? 'Update user information and permissions.'
                : 'Create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitUser} className="space-y-4">
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
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
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
                onClick={() => setUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-polygon-blue hover:bg-polygon-darkblue"
              >
                {currentUser ? 'Save Changes' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentUser && (
                <>
                  You are about to delete <strong>{currentUser.name}</strong>'s account.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;
