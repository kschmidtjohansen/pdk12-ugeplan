
import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from '@/context/TranslationContext';
import { UserRole, useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { validateAndSanitizePhone, getPhoneValidationError } from '@/utils/phoneValidation';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

interface UserFormDialogProps {
  currentUser: AdminUser | null;
  formData: {
    name: string;
    email: string;
    phone: string;
    jobTitle: string;
    role: UserRole;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRoleChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface SubDepartment {
  id: string;
  name: string;
  department_id: string;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  currentUser,
  formData,
  handleInputChange,
  handleRoleChange,
  handleSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [skipDepartment, setSkipDepartment] = useState(false);
  
  // Multi-department state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedSubDeptMap, setSelectedSubDeptMap] = useState<Record<string, string[]>>({});
  const [allSubDepartments, setAllSubDepartments] = useState<Record<string, SubDepartment[]>>({});
  
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const isSuperAdmin = authUser?.role === 'super_admin';
  const canSkipDepartment = formData.role === 'super_admin';

  // Reset skipDepartment when role changes away from super_admin
  useEffect(() => {
    if (formData.role !== 'super_admin') {
      setSkipDepartment(false);
    }
  }, [formData.role]);

  // Pre-select active department when creating a new user
  useEffect(() => {
    if (!currentUser && selectedDepartmentId && selectedDeptIds.length === 0) {
      setSelectedDeptIds([selectedDepartmentId]);
    }
  }, [currentUser, selectedDepartmentId]);

  // Load departments
  useEffect(() => {
    const fetchDepts = async () => {
      let query = supabase.from('departments').select('id, name').order('name');
      
      if (!isSuperAdmin) {
        const { data: access } = await supabase
          .from('user_access')
          .select('department_id')
          .eq('user_id', authUser?.id || '');
        
        const deptIds = access?.map(a => a.department_id) || [];
        if (deptIds.length > 0) {
          query = query.in('id', deptIds);
        }
      }

      const { data } = await query;
      setDepartments(data || []);
    };
    fetchDepts();
  }, [authUser?.id, isSuperAdmin]);

  // Load sub-departments for all selected departments
  useEffect(() => {
    if (selectedDeptIds.length === 0) {
      setAllSubDepartments({});
      return;
    }
    const fetchSubs = async () => {
      const { data } = await supabase
        .from('sub_departments')
        .select('id, name, department_id')
        .in('department_id', selectedDeptIds)
        .order('name');
      
      const grouped: Record<string, SubDepartment[]> = {};
      for (const sub of data || []) {
        if (!grouped[sub.department_id]) grouped[sub.department_id] = [];
        grouped[sub.department_id].push(sub);
      }
      setAllSubDepartments(grouped);
    };
    fetchSubs();
  }, [selectedDeptIds]);

  // Load existing user access when editing
  useEffect(() => {
    if (!currentUser) return;
    const fetchAccess = async () => {
      const { data } = await supabase
        .from('user_access')
        .select('department_id, sub_department_id')
        .eq('user_id', currentUser.id);
      
      if (data && data.length > 0) {
        const deptIds = [...new Set(data.map(a => a.department_id))];
        setSelectedDeptIds(deptIds);
        setSkipDepartment(false);
        
        const subMap: Record<string, string[]> = {};
        for (const row of data) {
          if (row.sub_department_id) {
            if (!subMap[row.department_id]) subMap[row.department_id] = [];
            subMap[row.department_id].push(row.sub_department_id);
          }
        }
        setSelectedSubDeptMap(subMap);
      } else if (currentUser.role === 'super_admin') {
        // Existing super_admin with no departments = skip department
        setSkipDepartment(true);
      }
    };
    fetchAccess();
  }, [currentUser?.id]);

  const toggleDept = (deptId: string) => {
    setSelectedDeptIds(prev => {
      if (prev.includes(deptId)) {
        // Remove dept and its sub-departments
        setSelectedSubDeptMap(m => {
          const copy = { ...m };
          delete copy[deptId];
          return copy;
        });
        return prev.filter(id => id !== deptId);
      }
      return [...prev, deptId];
    });
  };

  const toggleSubDept = (deptId: string, subId: string) => {
    setSelectedSubDeptMap(prev => {
      const current = prev[deptId] || [];
      const updated = current.includes(subId)
        ? current.filter(id => id !== subId)
        : [...current, subId];
      return { ...prev, [deptId]: updated };
    });
  };

  const saveUserAccess = async (userId: string) => {
    // Delete existing access
    await supabase.from('user_access').delete().eq('user_id', userId);

    if (skipDepartment) {
      // Clear home_department_id for department-less users
      await supabase
        .from('profiles')
        .update({ home_department_id: null })
        .eq('id', userId);
      return;
    }

    if (selectedDeptIds.length === 0) return;

    // Insert new access records
    const records: { user_id: string; department_id: string; sub_department_id?: string }[] = [];
    
    for (const deptId of selectedDeptIds) {
      const subIds = selectedSubDeptMap[deptId] || [];
      if (subIds.length > 0) {
        for (const subId of subIds) {
          records.push({ user_id: userId, department_id: deptId, sub_department_id: subId });
        }
      } else {
        records.push({ user_id: userId, department_id: deptId });
      }
    }

    if (records.length > 0) {
      await supabase.from('user_access').insert(records);
    }

    // Update home_department_id to first selected
    await supabase
      .from('profiles')
      .update({ home_department_id: selectedDeptIds[0] })
      .eq('id', userId);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setPhoneError('');
    
    try {
      const phoneValidation = validateAndSanitizePhone(formData.phone);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number');
        setIsSubmitting(false);
        return;
      }

      if (!skipDepartment && selectedDeptIds.length === 0) {
        setErrorMessage(t('admin.userManagement.selectAtLeastOneDept'));
        setIsSubmitting(false);
        return;
      }
      
      if (!currentUser) {
        if (!isPasswordValid) {
          setErrorMessage('Password must meet all requirements: at least 8 characters with uppercase, lowercase, and number');
          setIsSubmitting(false);
          return;
        }
        
        const sanitizedPhone = phoneValidation.sanitized;
        
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: { 
            email: formData.email, 
            password: password,
            name: formData.name,
            role: formData.role,
            userData: {
              phone: sanitizedPhone,
              job_title: formData.jobTitle
            }
          }
        });
        
        if (error) throw new Error(error.message || "Failed to create user");
        if (data?.error) throw new Error(data.error);
        if (!data?.user) throw new Error("No user data returned from creation");
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (formData.role !== 'servicemedarbejder') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', data.user.id);
          if (roleError) throw new Error('User created but role update failed');
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: sanitizedPhone,
            job_title: formData.jobTitle || null,
          })
          .eq('id', data.user.id);

        if (profileError && import.meta.env.DEV) console.warn('[UserFormDialog] Profile update warning:', profileError);

        await saveUserAccess(data.user.id);
        
        toast({
          title: t('common.success'),
          description: t('admin.userManagement.createSuccess')
        });
        onClose();
        setIsSubmitting(false);
        return;
      }
      
      if (currentUser) {
        await saveUserAccess(currentUser.id);
        await handleSubmit(e);
      }
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[UserFormDialog] Error saving user:', error);
      
      let errorMsg = 'An unexpected error occurred';
      if (error instanceof Error) errorMsg = error.message;
      
      if (errorMsg.includes('User already registered') || errorMsg.includes('email address has already been registered')) {
        errorMsg = 'A user with this email already exists';
      } else if (errorMsg.includes('Invalid email')) {
        errorMsg = 'Please enter a valid email address';
      } else if (errorMsg.includes('Password')) {
        errorMsg = 'Password does not meet requirements';
      } else if (errorMsg.includes('phone') || errorMsg.includes('check_phone_format')) {
        errorMsg = 'Phone number format is invalid.';
      } else if (errorMsg.includes('rate limit')) {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to send a request')) {
        errorMsg = 'Network error. Please check your connection and try again.';
      }
      
      setErrorMessage(errorMsg);
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
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
      
      <form onSubmit={handleFormSubmit}>
        <div className="grid gap-4 py-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {phoneError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{phoneError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{t('admin.userManagement.fullName')}</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">{t('admin.userManagement.email')}</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="col-span-3" required disabled={!!currentUser} />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">{t('admin.userManagement.phone')}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => { handleInputChange(e); setPhoneError(''); }}
              className="col-span-3"
              placeholder="e.g., +45 12 34 56 78"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jobTitle" className="text-right">{t('admin.userManagement.position')}</Label>
            <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className="col-span-3" />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">{t('admin.userManagement.role')}</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('admin.userManagement.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">{t('admin.roles.super_admin')}</SelectItem>
                  )}
                  <SelectItem value="administrator">{t('admin.roles.administrator')}</SelectItem>
                  <SelectItem value="skadeleder">{t('admin.roles.skadeleder')}</SelectItem>
                  <SelectItem value="servicemedarbejder">{t('admin.roles.servicemedarbejder')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Skip department checkbox for super_admin */}
          {canSkipDepartment && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-1" />
              <div className="col-span-3 space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-department"
                    checked={skipDepartment}
                    onCheckedChange={(checked) => {
                      setSkipDepartment(!!checked);
                      if (checked) {
                        setSelectedDeptIds([]);
                        setSelectedSubDeptMap({});
                      }
                    }}
                  />
                  <Label htmlFor="skip-department" className="font-medium cursor-pointer text-sm">
                    {t('admin.userManagement.skipDepartment')}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  {t('admin.userManagement.skipDepartmentNote')}
                </p>
              </div>
            </div>
          )}

          {/* Hovedafdelinger (multi-select checkboxes) */}
          {!skipDepartment && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-1">{t('admin.userManagement.departments')}</Label>
              <div className="col-span-3 space-y-1 max-h-[200px] overflow-y-auto border rounded-md p-2">
                {departments.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('admin.departments.empty')}</p>
                )}
                {departments.map(dept => (
                  <div key={dept.id}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept.id}`}
                        checked={selectedDeptIds.includes(dept.id)}
                        onCheckedChange={() => toggleDept(dept.id)}
                      />
                      <Label htmlFor={`dept-${dept.id}`} className="font-medium cursor-pointer text-sm">
                        {dept.name}
                      </Label>
                    </div>
                    {/* Sub-departments for this dept */}
                    {selectedDeptIds.includes(dept.id) && (allSubDepartments[dept.id] || []).length > 0 && (
                      <div className="ml-6 mt-1 mb-2 space-y-1">
                        {(allSubDepartments[dept.id] || []).map(sub => (
                          <div key={sub.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`sub-${sub.id}`}
                              checked={(selectedSubDeptMap[dept.id] || []).includes(sub.id)}
                              onCheckedChange={() => toggleSubDept(dept.id, sub.id)}
                            />
                            <Label htmlFor={`sub-${sub.id}`} className="font-normal cursor-pointer text-sm">
                              {sub.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!currentUser && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="password" className="text-right pt-2">{t('common.password')}</Label>
              <div className="col-span-3">
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!currentUser}
                  autoComplete="new-password"
                  showStrengthIndicator={true}
                  onValidationChange={setIsPasswordValid}
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={isSubmitting || (!currentUser && !isPasswordValid)}>
            {isSubmitting ? t('common.loading') : currentUser ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default UserFormDialog;
