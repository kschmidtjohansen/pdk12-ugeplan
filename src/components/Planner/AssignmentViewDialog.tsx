import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Car as CarIcon, Users, FileText, ExternalLink, Edit } from 'lucide-react';
import { format } from 'date-fns';
import DragDropFileUpload from '@/components/FileUpload/DragDropFileUpload';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { oneDriveService } from '@/services/OneDriveService';
import { toast } from '@/hooks/use-toast';

interface AssignmentViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  onEdit?: (assignment: Assignment) => void;
  onFileUpload?: (files: File[]) => Promise<void>;
}

const AssignmentViewDialog: React.FC<AssignmentViewDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  cars,
  employees,
  onEdit,
  onFileUpload
}) => {
  const { canEditAssignments, canUploadFiles } = useAuth();
  const { t } = useTranslation();

  if (!assignment) return null;

  const assignedEmployeeNames = assignment.assignedEmployees?.map(emp => emp.name) || 
    assignment.employees?.map(empId => {
      const emp = employees.find(e => e.id === empId);
      return emp?.name || empId;
    }) || [];

  const assignedCar = typeof assignment.car === 'string' 
    ? cars.find(c => c.id === assignment.car)
    : assignment.car;

  const handleEditClick = () => {
    if (onEdit && assignment) {
      onEdit(assignment);
    }
  };

  const handleOpenOneDrive = async () => {
    if (!assignment.caseNumber) {
      toast({
        title: t('planner.error'),
        description: 'No case number associated with this assignment',
        variant: 'destructive'
      });
      return;
    }

    try {
      const folderUrl = await oneDriveService.getCaseFolderUrl(assignment.caseNumber);
      if (folderUrl) {
        window.open(folderUrl, '_blank');
      } else {
        toast({
          title: t('planner.error'),
          description: 'OneDrive folder not found for this case',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to open OneDrive folder:', error);
      toast({
        title: t('planner.error'),
        description: 'Failed to open OneDrive folder',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (onFileUpload) {
      await onFileUpload(files);
    }

    // Also upload to OneDrive if case number exists
    if (assignment.caseNumber && files.length > 0) {
      try {
        const uploadPromises = files.map(file => 
          oneDriveService.uploadFileToCase(assignment.caseNumber!, file)
        );
        await Promise.all(uploadPromises);
        
        toast({
          title: 'Success',
          description: `Files uploaded to OneDrive case folder`,
        });
      } catch (error) {
        console.error('Failed to upload to OneDrive:', error);
        toast({
          title: 'Warning',
          description: 'Files uploaded locally but OneDrive sync failed',
          variant: 'default'
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {assignment.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {assignment.published && (
                <Badge variant="default">
                  {t('planner.published')}
                </Badge>
              )}
              {canEditAssignments && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(assignment.date), 'PPP')} • {assignment.fromTime} - {assignment.toTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{assignment.location}</span>
                </div>
              </div>

              {assignment.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {assignment.description}
                  </p>
                </div>
              )}

              {assignment.caseNumber && (
                <div>
                  <h4 className="font-medium mb-2">Case Number</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{assignment.caseNumber}</Badge>
                    {oneDriveService.isAuthenticated() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenOneDrive}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in OneDrive
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assigned Employees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedEmployeeNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignedEmployeeNames.map((name, index) => (
                      <Badge key={index} variant="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No employees assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Assigned Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CarIcon className="h-5 w-5" />
                  Assigned Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedCar ? (
                  <div className="space-y-2">
                    <Badge variant="outline">{assignedCar.name}</Badge>
                    {typeof assignedCar === 'object' && 'number_plate' in assignedCar && (
                      <p className="text-sm text-muted-foreground">
                        {(assignedCar as Car).number_plate}
                      </p>
                    )}
                  </div>
                
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicle assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* File Upload Section */}
          {canUploadFiles && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle>{t('planner.files.attachments')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DragDropFileUpload
                    onFilesUploaded={async (attachments) => {
                      // The component will handle file upload, just pass through the files
                      const files = attachments.map(att => new File([], att.originalName, { type: att.fileType }));
                      await handleFileUpload(files);
                    }}
                    assignmentId={assignment.id}
                    userId={assignment.responsibleUserId || ''}
                    existingFiles={assignment.attachments}
                    maxFiles={10}
                    disabled={false}
                  />
                  
                  {/* Display existing attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Existing Files</h4>
                      <div className="space-y-2">
                        {assignment.attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <FileText className="h-4 w-4" />
                            <span className="flex-1 text-sm">{file.originalName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(file.size / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentViewDialog;