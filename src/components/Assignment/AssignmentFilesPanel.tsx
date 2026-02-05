 import React, { useState, useRef } from 'react';
 import { useTranslation } from '@/context/TranslationContext';
 import { useAssignmentFiles, AssignmentFile } from '@/hooks/assignment/useAssignmentFiles';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { 
   Dialog, 
   DialogContent, 
   DialogHeader, 
   DialogTitle,
   DialogFooter 
 } from '@/components/ui/dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { 
   FolderPlus, 
   Upload, 
   Download, 
   Trash2, 
   File, 
   Image, 
   FileText,
   Folder,
   Files
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { da, enGB } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 interface AssignmentFilesPanelProps {
   assignmentId: string;
 }
 
 const AssignmentFilesPanel: React.FC<AssignmentFilesPanelProps> = ({
   assignmentId
 }) => {
   const { t, currentLanguage } = useTranslation();
   const [showFolderDialog, setShowFolderDialog] = useState(false);
   const [newFolderName, setNewFolderName] = useState('');
   const [selectedFolder, setSelectedFolder] = useState<string>('');
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const { 
     files, 
     groupedFiles, 
     folders,
     loading, 
     uploadFile, 
     downloadFile, 
     deleteFile,
     createFolder 
   } = useAssignmentFiles(assignmentId);
 
   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const fileList = e.target.files;
     if (!fileList || fileList.length === 0) return;
 
     setUploading(true);
     for (const file of Array.from(fileList)) {
       await uploadFile(file, selectedFolder || undefined);
     }
     setUploading(false);
     
     // Reset file input
     if (fileInputRef.current) {
       fileInputRef.current.value = '';
     }
   };
 
   const handleCreateFolder = () => {
     if (newFolderName.trim()) {
       createFolder(newFolderName.trim());
       setSelectedFolder(newFolderName.trim());
       setNewFolderName('');
       setShowFolderDialog(false);
     }
   };
 
   const getFileIcon = (mimeType: string | null) => {
     if (!mimeType) return <File className="h-4 w-4" />;
     if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-green-500" />;
     if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
     if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
     if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-4 w-4 text-green-600" />;
     return <File className="h-4 w-4" />;
   };
 
   const formatFileSize = (bytes: number | null) => {
     if (!bytes) return '';
     if (bytes < 1024) return `${bytes} B`;
     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
   };
 
   const formatDate = (dateString: string) => {
     const date = new Date(dateString);
     const locale = currentLanguage === 'da' ? da : enGB;
     return format(date, 'dd MMM yyyy', { locale });
   };
 
   // Get all folder names including existing and user-created ones
   const allFolders = [...new Set([...folders, ...Object.keys(groupedFiles).filter(f => f !== '__uncategorized__')])];
 
   return (
     <div className="flex flex-col h-full">
       {/* Header with actions */}
       <div className="flex items-center justify-between pb-3 border-b">
         <div className="flex items-center gap-2">
           <Files className="h-5 w-5 text-primary" />
           <h3 className="font-medium">{t('planner.files.title')}</h3>
         </div>
         <div className="flex items-center gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowFolderDialog(true)}
             className="flex items-center gap-1"
           >
             <FolderPlus className="h-4 w-4" />
             {t('planner.files.createFolder')}
           </Button>
         </div>
       </div>
 
       {/* Upload section */}
       <div className="py-3 border-b space-y-2">
         <div className="flex items-center gap-2">
           <Select value={selectedFolder} onValueChange={setSelectedFolder}>
             <SelectTrigger className="w-[200px]">
               <SelectValue placeholder={t('planner.files.folderPlaceholder')} />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="">Ingen mappe</SelectItem>
               {allFolders.map((folder) => (
                 <SelectItem key={folder} value={folder}>
                   {folder}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
           <input
             type="file"
             ref={fileInputRef}
             onChange={handleFileSelect}
             className="hidden"
             multiple
             accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
           />
           <Button
             onClick={() => fileInputRef.current?.click()}
             disabled={uploading}
             className="flex items-center gap-1"
           >
             <Upload className="h-4 w-4" />
             {uploading ? 'Uploader...' : t('planner.files.uploadFile')}
           </Button>
         </div>
       </div>
 
       {/* Files List */}
       <ScrollArea className="flex-1 py-4">
         {loading ? (
           <div className="flex items-center justify-center h-32">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
           </div>
         ) : files.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
             <Files className="h-8 w-8 mb-2 opacity-50" />
             <p className="text-sm">{t('planner.files.noFiles')}</p>
           </div>
         ) : (
           <div className="space-y-4">
             {/* Files with folders */}
             {Object.entries(groupedFiles)
               .filter(([folder]) => folder !== '__uncategorized__')
               .sort(([a], [b]) => a.localeCompare(b))
               .map(([folder, folderFiles]) => (
                 <div key={folder} className="space-y-2">
                   <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                     <Folder className="h-4 w-4" />
                     {folder}
                   </div>
                   <div className="ml-6 space-y-1">
                     {folderFiles.map((file) => (
                       <FileItem
                         key={file.id}
                         file={file}
                         onDownload={downloadFile}
                         onDelete={deleteFile}
                         getFileIcon={getFileIcon}
                         formatFileSize={formatFileSize}
                         formatDate={formatDate}
                       />
                     ))}
                   </div>
                 </div>
               ))}
 
             {/* Uncategorized files */}
             {groupedFiles['__uncategorized__'] && groupedFiles['__uncategorized__'].length > 0 && (
               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                   <File className="h-4 w-4" />
                   Løse filer
                 </div>
                 <div className="ml-6 space-y-1">
                   {groupedFiles['__uncategorized__'].map((file) => (
                     <FileItem
                       key={file.id}
                       file={file}
                       onDownload={downloadFile}
                       onDelete={deleteFile}
                       getFileIcon={getFileIcon}
                       formatFileSize={formatFileSize}
                       formatDate={formatDate}
                     />
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}
       </ScrollArea>
 
       {/* Create Folder Dialog */}
       <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{t('planner.files.createFolder')}</DialogTitle>
           </DialogHeader>
           <div className="py-4">
             <Input
               value={newFolderName}
               onChange={(e) => setNewFolderName(e.target.value)}
               placeholder={t('planner.files.folderPlaceholder')}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleCreateFolder();
               }}
             />
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
               {t('common.cancel')}
             </Button>
             <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
               {t('common.create')}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
 // Sub-component for file items
 interface FileItemProps {
   file: AssignmentFile;
   onDownload: (file: AssignmentFile) => Promise<void>;
   onDelete: (file: AssignmentFile) => Promise<void>;
   getFileIcon: (mimeType: string | null) => React.ReactNode;
   formatFileSize: (bytes: number | null) => string;
   formatDate: (dateString: string) => string;
 }
 
 const FileItem: React.FC<FileItemProps> = ({
   file,
   onDownload,
   onDelete,
   getFileIcon,
   formatFileSize,
   formatDate
 }) => {
   const { t } = useTranslation();
   const [deleting, setDeleting] = useState(false);
 
   const handleDelete = async () => {
     setDeleting(true);
     await onDelete(file);
     setDeleting(false);
   };
 
   return (
     <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group">
       {getFileIcon(file.mime_type)}
       <div className="flex-1 min-w-0">
         <p className="text-sm font-medium truncate">{file.file_name}</p>
         <p className="text-xs text-muted-foreground">
           {formatFileSize(file.file_size)} • {formatDate(file.created_at)} • {file.uploader?.name}
         </p>
       </div>
       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <Button
           variant="ghost"
           size="icon"
           className="h-8 w-8"
           onClick={() => onDownload(file)}
           title={t('planner.files.downloadFile')}
         >
           <Download className="h-4 w-4" />
         </Button>
         <Button
           variant="ghost"
           size="icon"
           className="h-8 w-8 text-destructive hover:text-destructive"
           onClick={handleDelete}
           disabled={deleting}
           title={t('planner.files.deleteFile')}
         >
           <Trash2 className="h-4 w-4" />
         </Button>
       </div>
     </div>
   );
 };
 
 export default AssignmentFilesPanel;