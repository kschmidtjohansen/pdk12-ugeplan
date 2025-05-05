
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
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';

// Mock users for display with extended properties
const mockUsers: (User & Partial<Employee>)[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@polygon.com",
    role: "administrator",
    phone: "+45 12 34 56 78",
    jobTitle: "System Administrator"
  },
  {
    id: "2",
    name: "Skadeleder User",
    email: "skadeleder@polygon.com",
    role: "skadeleder",
    phone: "+45 23 45 67 89",
    jobTitle: "Team Leader"
  },
  {
    id: "3",
    name: "Service User",
    email: "service@polygon.com",
    role: "servicemedarbejder",
    phone: "+45 34 56 78 90",
    jobTitle: "Field Technician"
  },
  {
    id: "4",
    name: "John Doe",
    email: "john.doe@polygon.com",
    role: "servicemedarbejder",
    phone: "+45 45 67 89 01",
    jobTitle: "Junior Technician"
  },
  {
    id: "5",
    name: "Jane Smith",
    email: "jane.smith@polygon.com",
    role: "skadeleder",
    phone: "+45 56 78 90 12",
    jobTitle: "Senior Team Leader"
  },
];

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<(User & Partial<Employee>)[]>(mockUsers);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<(User & Partial<Employee>) | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder' as UserRole,
  });

  // Helper function to get role label
  const getRoleLabel = (role: UserRole): string => {
    return t(`admin.roles.${role}`);
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

  const handleCreateUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
    });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: User & Partial<Employee>) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: User & Partial<Employee>) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (currentUser) {
      setUsers(users.filter(user => user.id !== currentUser.id));
      toast({
        title: t('admin.userManagement.userDeleted'),
        description: t('admin.userManagement.userDeletedMsg', { name: currentUser.name }),
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
        title: t('admin.userManagement.userUpdated'),
        description: t('admin.userManagement.userUpdateMsg', { name: formData.name }),
      });
    } else {
      // Create new
      const newUser = {
        ...formData,
        id: Date.now().toString(),
      };
      setUsers([...users, newUser]);
      toast({
        title: t('admin.userManagement.userAdded'),
        description: t('admin.userManagement.userAddedMsg', {
          name: formData.name, 
          role: getRoleLabel(formData.role)
        }),
      });
    }
    
    setUserDialogOpen(false);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.userManagement.title')}</CardTitle>
              <CardDescription>{t('admin.userManagement.description')}</CardDescription>
            </div>
            <Button 
              onClick={handleCreateUser}
              className="bg-polygon-blue hover:bg-polygon-darkblue"
            >
              {t('admin.userManagement.addUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.userManagement.name')}</TableHead>
                <TableHead>{t('admin.userManagement.email')}</TableHead>
                <TableHead>{t('admin.userManagement.role')}</TableHead>
                <TableHead className="w-[100px]">{t('admin.userManagement.actions')}</TableHead>
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
                    <StatusBadge variant={
                      user.role === 'administrator' 
                        ? 'info' 
                        : user.role === 'skadeleder'
                          ? 'success'
                          : 'default'
                      }>
                      {getRoleLabel(user.role)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">{t('common.edit')}</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="h-8 w-8 p-0 text-destructive"
                        disabled={user.id === '1'} // Prevent deleting main admin
                      >
                        <span className="sr-only">{t('common.delete')}</span>
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
              {currentUser ? t('admin.userManagement.editUser') : t('admin.userManagement.addNewUser')}
            </DialogTitle>
            <DialogDescription>
              {currentUser
                ? t('admin.userManagement.updateInfo')
                : t('admin.userManagement.createAccount')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.userManagement.fullName')}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
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
              <Label htmlFor="phone">{t('employees.phone')}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t('employees.jobTitle')}</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">{t('admin.userManagement.role')}</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={t('admin.userManagement.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">
                    {t('admin.roles.administrator')}
                  </SelectItem>
                  <SelectItem value="skadeleder">
                    {t('admin.roles.skadeleder')}
                  </SelectItem>
                  <SelectItem value="servicemedarbejder">
                    {t('admin.roles.servicemedarbejder')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUserDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit"
                className="bg-polygon-blue hover:bg-polygon-darkblue"
              >
                {currentUser ? t('common.save') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.userManagement.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {currentUser && (
                <>
                  {t('admin.userManagement.deleteWarning', { name: <strong>{currentUser.name}</strong> })}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;
