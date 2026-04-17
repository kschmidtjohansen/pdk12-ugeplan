import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Assignment } from '@/types/assignment';
import { Car as CarType } from '@/types/car';
import { Calendar, Clock, MapPin, Car, Users, UserCheck, Pencil, MessageSquare, Files, Image, FileText, ChevronDown, ChevronUp, Download, Loader2, FileImage, FolderDown } from 'lucide-react';
import AssignmentMessagesPanel from '@/components/Assignment/AssignmentMessagesPanel';
import AssignmentFilesPanel from '@/components/Assignment/AssignmentFilesPanel';
import { useAssignmentFiles } from '@/hooks/assignment/useAssignmentFiles';
import { useAssignmentMessages } from '@/hooks/assignment/useAssignmentMessages';
import { useDepartment } from '@/context/DepartmentContext';
 
 interface AssignmentDetailsDialogProps {
   assignment: Assignment | null;
   isOpen: boolean;
   onClose: () => void;
   cars: CarType[];
   onEdit?: (assignment: Assignment) => void;
   /** All assignment IDs in the same case series (multi-day bookings).
    *  When provided, chat & files are shared across all days of the series. */
   siblingAssignmentIds?: string[];
 }
 
 const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({
   assignment,
   isOpen,
   onClose,
   cars,
   onEdit,
   siblingAssignmentIds
 }) => {
  const { t, currentLanguage } = useTranslation();
  const { isChatEnabled, isFilesEnabled } = useDepartment();
  const [showFiles, setShowFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Get assigned employee IDs for messaging - compute before hooks
  const assignedEmployeeIds = assignment?.assignedEmployees?.map(e => e.id) 
    || assignment?.employees 
    || [];
  
  // ALL hooks must be called before any conditional return
  const { imageCount, documentCount, files, downloadAll, generateImagePdfWithComments } = useAssignmentFiles(assignment?.id || null, siblingAssignmentIds);
  const { messages, exportMessages } = useAssignmentMessages(
    assignment?.id || null,
    assignment?.title,
    assignedEmployeeIds,
    assignment?.responsibleUserId,
    siblingAssignmentIds
  );

  // Safe to return early after all hooks are called
  if (!assignment) return null;

  // Handler with loading animation for messages export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportMessages();
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setIsExporting(false);
    }
  };

  // Handler with loading animation for PDF generation
  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      await generateImagePdfWithComments(assignment?.title);
    } finally {
      setGeneratingPdf(false);
    }
  };
 
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
       <DialogContent className={`${isChatEnabled ? 'max-w-5xl' : 'max-w-3xl'} max-h-[95dvh] flex flex-col p-0`}>
        <DialogHeader className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b bg-gradient-to-b from-muted/30 to-transparent">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-lg pr-14">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="break-words">{assignment.location}</span>
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
                    <span className="hidden sm:inline">{t('common.edit')}</span>
                  </Button>
                )}
              </div>
            </DialogTitle>
           <DialogDescription className="sr-only mt-1">
             {t('planner.assignmentDetails')}
           </DialogDescription>
         </DialogHeader>
 
        {/* Main content: 2-column layout */}
         <div className="lg:flex-1 flex flex-col lg:flex-row lg:min-h-0 lg:overflow-hidden">
          {/* Left column: Details */}
           <div className={`h-auto flex-shrink-0 lg:flex-1 lg:flex-shrink ${isChatEnabled ? 'lg:w-3/5 lg:border-r' : ''} flex flex-col lg:min-h-0`}>
             <div className="lg:flex-1 lg:overflow-y-auto">
                <div className="p-4 sm:p-8 space-y-6">
                {/* Title */}
                 <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{assignment.title}</h3>
                 </div>

                  <Separator className="my-2" />

                {/* Assignment Details Section - Cars, Employees, Responsible (shown FIRST before description on mobile) */}
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

                  <Separator className="my-2" />

                   {/* Description - shown after details */}
                   {assignment.description && (
                      <div className="space-y-2.5 pb-4 flex-shrink-0">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('planner.description')}</h4>
                       <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">{assignment.description}</p>
                     </div>
                   )}

                  {assignment.description && <Separator className="my-2" />}

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
              </div>
            </div>

            {/* Files section - collapsible at the bottom of left column */}
            {isFilesEnabled && (
              <div className="border-t bg-muted/20">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 py-4 gap-3">
                 <button
                   onClick={() => setShowFiles(!showFiles)}
                   className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                 >
                   <Files className="h-4 w-4 text-primary shrink-0" />
                   {t('planner.tabs.files')}
                   {(imageCount > 0 || documentCount > 0) && (
                     <span className="text-muted-foreground">
                       ({imageCount > 0 && <><Image className="h-3 w-3 inline mr-0.5" />{imageCount}</>}
                       {imageCount > 0 && documentCount > 0 && ' • '}
                       {documentCount > 0 && <><FileText className="h-3 w-3 inline mr-0.5" />{documentCount}</>})
                     </span>
                   )}
                   {showFiles ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />}
                 </button>
                 
                 <div className="flex flex-wrap items-center gap-2">
                   {imageCount > 0 && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={handleGeneratePdf}
                       disabled={generatingPdf}
                       className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                     >
                       {generatingPdf ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                           <span className="hidden sm:inline">{t('planner.files.generatingPdf')}</span>
                           <span className="sm:hidden">...</span>
                         </>
                       ) : (
                         <>
                           <FileImage className="h-4 w-4 mr-1.5" />
                           <span className="hidden sm:inline">{t('planner.files.downloadAsPdf')}</span>
                           <span className="sm:hidden">PDF</span>
                         </>
                       )}
                     </Button>
                   )}
                   {files.length > 0 && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={downloadAll}
                       className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                     >
                       <FolderDown className="h-4 w-4 mr-1.5" />
                       <span className="hidden sm:inline">{t('planner.files.downloadAll')}</span>
                       <span className="sm:hidden">Alle</span>
                     </Button>
                   )}
                 </div>
               </div>
                {showFiles && (
                  <div className="px-4 sm:px-8 pb-6 max-h-72 overflow-y-auto">
                  <AssignmentFilesPanel 
                    assignmentId={assignment.id} 
                    assignmentTitle={assignment.title || assignment.case_number || undefined}
                    hideHeader={true}
                    siblingAssignmentIds={siblingAssignmentIds}
                  />
                </div>
              )}
            </div>
            )}
          </div>

          {/* Right column: Messages sidebar */}
          {isChatEnabled && (
           <div className="lg:w-2/5 flex flex-col relative min-h-[300px] max-h-[50dvh] lg:h-auto lg:max-h-none lg:min-h-0 overflow-hidden border-t lg:border-t-0 bg-gradient-to-b from-muted/40 to-muted/20">
             <div className="px-3 sm:px-5 py-4 border-b bg-background/60 backdrop-blur-sm">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2.5 text-sm font-semibold">
                   <MessageSquare className="h-4 w-4 text-primary" />
                   {t('planner.tabs.messages')}
                 </div>
                 {messages.length > 0 && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={handleExport}
                     disabled={isExporting}
                     className="h-8 text-primary hover:text-primary hover:bg-primary/10 disabled:opacity-70"
                   >
                     {isExporting ? (
                       <>
                         <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                         <span className="hidden sm:inline">{t('planner.messages.exporting')}</span>
                         <span className="sm:hidden">...</span>
                       </>
                     ) : (
                       <>
                         <Download className="h-4 w-4 mr-1.5" />
                         <span className="hidden sm:inline">{t('planner.messages.exportMessages')}</span>
                         <span className="sm:hidden">Eksport</span>
                       </>
                     )}
                   </Button>
                 )}
               </div>
             </div>
             <div className="flex-1 min-h-0 px-1">
              <AssignmentMessagesPanel
                assignmentId={assignment.id}
                assignmentTitle={assignment.title}
                assignedEmployeeIds={assignedEmployeeIds}
                responsibleUserId={assignment.responsibleUserId}
                siblingAssignmentIds={siblingAssignmentIds}
              />
            </div>
           </div>
          )}
        </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AssignmentDetailsDialog;