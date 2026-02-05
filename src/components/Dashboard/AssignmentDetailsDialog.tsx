 import React, { useState } from 'react';
 import { useTranslation } from '@/context/TranslationContext';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
 import { Assignment } from '@/types/assignment';
 import { Car as CarType } from '@/types/car';
import { Calendar, Clock, MapPin, Car, Users, UserCheck, Pencil, MessageSquare, Files, Image, FileText, ChevronDown, ChevronUp } from 'lucide-react';
 import AssignmentMessagesPanel from '@/components/Assignment/AssignmentMessagesPanel';
 import AssignmentFilesPanel from '@/components/Assignment/AssignmentFilesPanel';
import { useAssignmentFiles } from '@/hooks/assignment/useAssignmentFiles';
 
 interface AssignmentDetailsDialogProps {
   assignment: Assignment | null;
   isOpen: boolean;
   onClose: () => void;
   cars: CarType[];
   onEdit?: (assignment: Assignment) => void;
 }
 
 const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({
   assignment,
   isOpen,
   onClose,
   cars,
   onEdit
 }) => {
   const { t, currentLanguage } = useTranslation();
  const [showFiles, setShowFiles] = useState(false);
  const { imageCount, documentCount } = useAssignmentFiles(assignment?.id || null);
 
   if (!assignment) return null;
 
   // Get assigned employee IDs for messaging
   const assignedEmployeeIds = assignment.assignedEmployees?.map(e => e.id) 
     || assignment.employees 
     || [];
 
   // Helper to get car names from IDs
   const getCarNames = (): string[] => {
     const carNames: string[] = [];
     if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
       assignment.cars.forEach((carId: string) => {
         if (carId) {
           const car = cars.find(c => c.id === carId);
           if (car) {
             carNames.push(car.name);
           }
         }
       });
     } else if (assignment.car) {
       if (typeof assignment.car === 'string') {
         const car = cars.find(c => c.id === assignment.car);
         if (car) {
           carNames.push(car.name);
         }
       } else if (typeof assignment.car === 'object' && assignment.car.name) {
         carNames.push(assignment.car.name);
       }
     }
     return carNames;
   };
 
   const formatDate = (dateString: string) => {
     return new Date(dateString).toLocaleDateString(
       currentLanguage === 'da' ? 'da-DK' : 'en-GB',
       { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
     );
   };
 
   const carNames = getCarNames();
 
   return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
         <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-muted/30 to-transparent">
           <DialogTitle className="flex items-center justify-between gap-3 text-lg pr-14">
             <div className="flex items-center gap-2">
               <MapPin className="h-5 w-5 text-primary" />
               {assignment.location}
             </div>
             <div className="flex items-center gap-2">
               <Badge variant={assignment.published ? "default" : "secondary"}>
                 {assignment.published ? t('planner.published') : t('planner.notPublished')}
               </Badge>
               {onEdit && (
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => {
                     onEdit(assignment);
                     onClose();
                   }}
                   className="flex items-center gap-1"
                 >
                   <Pencil className="h-3.5 w-3.5" />
                   {t('common.edit')}
                 </Button>
               )}
             </div>
           </DialogTitle>
           <DialogDescription className="sr-only mt-1">
             {t('planner.assignmentDetails')}
           </DialogDescription>
         </DialogHeader>
 
        {/* Main content: 2-column layout */}
         <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" style={{ minHeight: '500px' }}>
          {/* Left column: Details */}
           <div className="flex-1 lg:w-3/5 flex flex-col min-h-0 lg:border-r">
            <ScrollArea className="flex-1">
               <div className="p-8 space-y-6">
                {/* Title */}
                 <div className="space-y-4">
                   <h3 className="text-2xl font-semibold tracking-tight">{assignment.title}</h3>
                  
                  {/* Description */}
                  {assignment.description && (
                     <div className="space-y-2.5">
                       <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('planner.description')}</h4>
                       <p className="text-sm leading-relaxed text-foreground/90">{assignment.description}</p>
                    </div>
                  )}
                </div>
 
                 <Separator className="my-2" />

                {/* Date and Time Section */}
                 <div className="space-y-4">
                   <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('planner.dateAndTime') || 'Dato og tid'}
                  </h4>
                   <div className="grid gap-4">
                     <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div className="text-sm">
                        <span className="font-medium">{t('planner.date')}: </span>
                        <span>{formatDate(assignment.date)}</span>
                      </div>
                    </div>
                    
                     <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                      <div className="text-sm">
                        <span className="font-medium">{t('planner.time')}: </span>
                        <span>{assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}</span>
                      </div>
                     </div>
                   </div>
                 </div>

                 <Separator className="my-2" />

                {/* Assignment Details Section */}
                 <div className="space-y-4">
                   <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('planner.assignmentDetails') || 'Opgave detaljer'}
                  </h4>
                   <div className="grid gap-4">
                    {/* Cars */}
                    {carNames.length > 0 && (
                       <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Car className="h-4 w-4 text-primary" />
                        <div className="flex items-center flex-wrap gap-2 text-sm">
                          <span className="font-medium">{t('planner.car')}:</span>
                          {carNames.map((carName, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {carName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responsible User */}
                    {assignment.responsibleUser && (
                       <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <UserCheck className="h-4 w-4 text-primary" />
                        <div className="text-sm">
                          <span className="font-medium">{t('planner.responsibleUser')}: </span>
                          <span>{assignment.responsibleUser.name}</span>
                        </div>
                      </div>
                    )}

                    {/* Assigned Employees */}
                    {((assignment.assignedEmployees && assignment.assignedEmployees.length > 0) || (assignment.employees && assignment.employees.length > 0)) && (
                       <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Users className="h-4 w-4 text-primary" />
                        <div className="flex items-center flex-wrap gap-2 text-sm">
                          <span className="font-medium">{t('planner.employees')}:</span>
                          {assignment.assignedEmployees && assignment.assignedEmployees.length > 0 ? (
                            assignment.assignedEmployees.map((employee) => (
                              <Badge key={employee.id} variant="outline" className="text-xs">
                                {employee.name}
                              </Badge>
                            ))
                          ) : assignment.employees && assignment.employees.length > 0 ? (
                            assignment.employees.map((employee, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {employee}
                              </Badge>
                            ))
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Files section - collapsible at the bottom of left column */}
             <div className="border-t bg-muted/20">
              <button
                onClick={() => setShowFiles(!showFiles)}
                 className="w-full flex items-center justify-between px-8 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Files className="h-4 w-4 text-primary" />
                  {t('planner.tabs.files')}
                  {(imageCount > 0 || documentCount > 0) && (
                    <span className="text-muted-foreground">
                      ({imageCount > 0 && <><Image className="h-3 w-3 inline mr-0.5" />{imageCount}</>}
                      {imageCount > 0 && documentCount > 0 && ' • '}
                      {documentCount > 0 && <><FileText className="h-3 w-3 inline mr-0.5" />{documentCount}</>})
                    </span>
                  )}
                </div>
                {showFiles ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              {showFiles && (
                 <div className="px-8 pb-6 max-h-72 overflow-y-auto">
                  <AssignmentFilesPanel assignmentId={assignment.id} />
                </div>
              )}
            </div>
          </div>

          {/* Right column: Messages sidebar */}
           <div className="lg:w-2/5 flex flex-col min-h-0 bg-gradient-to-b from-muted/40 to-muted/20">
             <div className="px-5 py-4 border-b bg-background/60 backdrop-blur-sm">
               <div className="flex items-center gap-2.5 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-primary" />
                {t('planner.tabs.messages')}
              </div>
            </div>
             <div className="flex-1 min-h-0 px-1">
              <AssignmentMessagesPanel
                assignmentId={assignment.id}
                assignmentTitle={assignment.title}
                assignedEmployeeIds={assignedEmployeeIds}
                responsibleUserId={assignment.responsibleUserId}
              />
            </div>
          </div>
        </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AssignmentDetailsDialog;