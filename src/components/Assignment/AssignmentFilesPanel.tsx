 import React, { useState, useRef } from 'react';
import { useAssignmentFiles, AssignmentFile } from '@/hooks/assignment/useAssignmentFiles';
 import { useTranslation } from '@/context/TranslationContext';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
  Files,
  X,
  ZoomIn,
  FolderDown,
  Filter
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
  const [filterFolder, setFilterFolder] = useState<string>('__all__');
   const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<AssignmentFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const { 
     files, 
     groupedFiles, 
     folders,
     loading, 
    imageCount,
    documentCount,
     uploadFile, 
     downloadFile, 
     deleteFile,
    createFolder,
    getFilePreviewUrl,
    downloadFolder,
    downloadAll
   } = useAssignmentFiles(assignmentId);
 
   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const fileList = e.target.files;
     if (!fileList || fileList.length === 0) return;
 
     setUploading(true);
     for (const file of Array.from(fileList)) {
      const folderToUse = selectedFolder === '__none__' ? undefined : selectedFolder || undefined;
      await uploadFile(file, folderToUse);
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
 
  const handlePreviewImage = async (file: AssignmentFile) => {
    setPreviewImage(file);
    const url = await getFilePreviewUrl(file);
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewUrl(null);
  };

   const getFileIcon = (mimeType: string | null) => {
     if (!mimeType) return <File className="h-4 w-4" />;
     if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-primary" />;
     if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-destructive" />;
     if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-primary" />;
     if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-4 w-4 text-secondary-foreground" />;
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
  
  const isImageFile = (mimeType: string | null) => mimeType?.startsWith('image/') || false;

  // Get filtered files based on filter selection
  const getFilteredContent = () => {
    if (filterFolder === '__all__') {
      // Show all files with their folder path
      return { type: 'flat' as const, files: files };
    } else if (filterFolder === '__uncategorized__') {
      return { type: 'flat' as const, files: groupedFiles['__uncategorized__'] || [] };
    } else {
      return { type: 'flat' as const, files: groupedFiles[filterFolder] || [] };
    }
  };

  const filteredContent = getFilteredContent();
 
   return (
     <div className="flex flex-col h-full">
       {/* Header with actions */}
       <div className="flex items-center justify-between pb-3 border-b">
         <div className="flex items-center gap-2">
           <Files className="h-5 w-5 text-primary" />
           <h3 className="font-medium">{t('planner.files.title')}</h3>
          {(imageCount > 0 || documentCount > 0) && (
            <span className="text-xs text-muted-foreground">
              ({imageCount > 0 && `📷 ${imageCount}`}{imageCount > 0 && documentCount > 0 && ' • '}{documentCount > 0 && `📄 ${documentCount}`})
            </span>
          )}
         </div>
         <div className="flex items-center gap-2">
          {files.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAll}
              className="flex items-center gap-1"
            >
              <FolderDown className="h-4 w-4" />
              {t('planner.files.downloadAll')}
            </Button>
          )}
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter dropdown */}
          <Select value={filterFolder} onValueChange={setFilterFolder}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle filer</SelectItem>
              <SelectItem value="__uncategorized__">Løse filer</SelectItem>
              {allFolders.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-border" />

          {/* Upload folder selector */}
            <Select value={selectedFolder || '__none__'} onValueChange={(val) => setSelectedFolder(val === '__none__' ? '' : val)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('planner.files.noFolder')} />
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="__none__">{t('planner.files.noFolder')}</SelectItem>
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
        ) : filterFolder !== '__all__' ? (
          /* Filtered view - flat list */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {filterFolder === '__uncategorized__' ? 'Løse filer' : filterFolder}
              </div>
              {filteredContent.files.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFolder(filterFolder)}
                  className="h-7 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download mappe
                </Button>
              )}
            </div>
            <div className="ml-6 space-y-1">
              {filteredContent.files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  isImage={isImageFile(file.mime_type)}
                  onDownload={downloadFile}
                  onDelete={deleteFile}
                  onPreview={handlePreviewImage}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  getFilePreviewUrl={getFilePreviewUrl}
                />
              ))}
              {filteredContent.files.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Ingen filer i denne mappe</p>
              )}
            </div>
          </div>
         ) : (
          /* All files - grouped view */
          <div className="space-y-3">
             {/* Files with folders */}
             {Object.entries(groupedFiles)
               .filter(([folder]) => folder !== '__uncategorized__')
               .sort(([a], [b]) => a.localeCompare(b))
               .map(([folder, folderFiles]) => (
                 <div key={folder} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {folder}
                      <span className="text-xs">({folderFiles.length})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFolder(folder)}
                      className="h-7 text-xs opacity-0 group-hover:opacity-100 hover:opacity-100"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                   </div>
                   <div className="ml-6 space-y-1">
                     {folderFiles.map((file) => (
                       <FileItem
                         key={file.id}
                         file={file}
                        isImage={isImageFile(file.mime_type)}
                         onDownload={downloadFile}
                         onDelete={deleteFile}
                        onPreview={handlePreviewImage}
                         getFileIcon={getFileIcon}
                         formatFileSize={formatFileSize}
                         formatDate={formatDate}
                        getFilePreviewUrl={getFilePreviewUrl}
                       />
                     ))}
                   </div>
                 </div>
               ))}
 
             {/* Uncategorized files */}
             {groupedFiles['__uncategorized__'] && groupedFiles['__uncategorized__'].length > 0 && (
               <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Løse filer
                    <span className="text-xs">({groupedFiles['__uncategorized__'].length})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFolder('__uncategorized__')}
                    className="h-7 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                 </div>
                 <div className="ml-6 space-y-1">
                   {groupedFiles['__uncategorized__'].map((file) => (
                     <FileItem
                       key={file.id}
                       file={file}
                      isImage={isImageFile(file.mime_type)}
                       onDownload={downloadFile}
                       onDelete={deleteFile}
                      onPreview={handlePreviewImage}
                       getFileIcon={getFileIcon}
                       formatFileSize={formatFileSize}
                       formatDate={formatDate}
                      getFilePreviewUrl={getFilePreviewUrl}
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

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">{previewImage?.file_name}</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closePreview}>
                  <X className="h-4 w-4" />
                </Button>
            </div>
          </DialogHeader>
          <div className="px-4 pb-4 flex items-center justify-center">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt={previewImage?.file_name} 
                className="max-w-full max-h-[70vh] object-contain rounded-md"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <div className="px-4 pb-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => previewImage && downloadFile(previewImage)}>
              <Download className="h-4 w-4 mr-2" />
              {t('planner.files.downloadFile')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
     </div>
   );
 };
 
 // Sub-component for file items
 interface FileItemProps {
   file: AssignmentFile;
  isImage: boolean;
   onDownload: (file: AssignmentFile) => Promise<void>;
   onDelete: (file: AssignmentFile) => Promise<void>;
  onPreview: (file: AssignmentFile) => void;
   getFileIcon: (mimeType: string | null) => React.ReactNode;
   formatFileSize: (bytes: number | null) => string;
   formatDate: (dateString: string) => string;
  getFilePreviewUrl: (file: AssignmentFile) => Promise<string | null>;
 }
 
 const FileItem: React.FC<FileItemProps> = ({
   file,
  isImage,
   onDownload,
   onDelete,
  onPreview,
   getFileIcon,
   formatFileSize,
  formatDate,
  getFilePreviewUrl
 }) => {
   const { t } = useTranslation();
   const [deleting, setDeleting] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  // Load thumbnail for images
  React.useEffect(() => {
    if (isImage && !thumbnailUrl && !thumbnailLoading) {
      setThumbnailLoading(true);
      getFilePreviewUrl(file).then(url => {
        setThumbnailUrl(url);
        setThumbnailLoading(false);
      });
    }
  }, [isImage, file, getFilePreviewUrl, thumbnailUrl, thumbnailLoading]);
 
   const handleDelete = async () => {
     setDeleting(true);
     await onDelete(file);
     setDeleting(false);
   };
 
   return (
    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 group">
      {/* Thumbnail or Icon */}
      {isImage && thumbnailUrl ? (
        <button 
          onClick={() => onPreview(file)}
          className="relative flex-shrink-0 w-16 h-12 rounded overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all cursor-pointer"
        >
          <img 
            src={thumbnailUrl} 
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4 text-white" />
          </div>
        </button>
      ) : isImage && thumbnailLoading ? (
        <div className="flex-shrink-0 w-16 h-12 rounded overflow-hidden border bg-muted flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          {getFileIcon(file.mime_type)}
        </div>
      )}
      
      {/* File Info */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p 
          className={cn(
            "text-sm font-medium truncate",
            isImage && "cursor-pointer hover:text-primary"
          )}
          onClick={isImage ? () => onPreview(file) : undefined}
        >
          {file.file_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file_size)} • {formatDate(file.created_at)} • {file.uploader?.name}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
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