import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Upload, File, Camera } from 'lucide-react';
import { FileAttachment } from '@/types/assignment';
import { AssignmentFileService } from '@/services/assignmentFileService';

interface DragDropFileUploadProps {
  onFilesUploaded: (files: FileAttachment[]) => void;
  assignmentId: string;
  userId: string;
  existingFiles?: FileAttachment[];
  onFileDelete?: (fileId: string) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({
  onFilesUploaded,
  assignmentId,
  userId,
  existingFiles = [],
  onFileDelete,
  maxFiles = 10,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return;
    
    if (existingFiles.length + acceptedFiles.length > maxFiles) {
      alert(t('planner.files.tooManyFiles', { max: maxFiles }));
      return;
    }

    setIsUploading(true);
    const uploadedFiles: FileAttachment[] = [];

    for (const file of acceptedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 100);

        const uploadedFile = await AssignmentFileService.uploadFile(file, assignmentId, userId);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        uploadedFiles.push(uploadedFile);
        
        // Remove progress after a short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1000);

      } catch (error) {
        console.error('Upload failed:', error);
        alert(t('planner.files.uploadError', { filename: file.name }));
      }
    }

    onFilesUploaded(uploadedFiles);
    setIsUploading(false);
  }, [assignmentId, userId, existingFiles.length, maxFiles, disabled, isUploading, onFilesUploaded, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    disabled: disabled || isUploading,
    maxFiles
  });

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        onDrop(Array.from(files));
      }
    };
    input.click();
  };

  const handleFileDelete = async (file: FileAttachment) => {
    if (!onFileDelete) return;
    
    try {
      await AssignmentFileService.deleteFile(file.filename);
      onFileDelete(file.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert(t('planner.files.deleteError', { filename: file.originalName }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`p-6 border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:border-primary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <div {...getRootProps()} className="text-center space-y-4">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {isDragActive 
                ? t('planner.files.dropHere')
                : t('planner.files.dragDrop')
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('planner.files.supportedTypes')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('planner.files.maxSize')}
            </p>
          </div>

          <div className="flex justify-center space-x-2">
            <Button type="button" variant="outline" disabled={disabled || isUploading}>
              <File className="mr-2 h-4 w-4" />
              {t('planner.files.browse')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                handleCameraCapture();
              }}
              disabled={disabled || isUploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              {t('planner.files.camera')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([filename, progress]) => (
        <Card key={filename} className="p-4">
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{filename}</p>
              <Progress value={progress} className="mt-1" />
            </div>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        </Card>
      ))}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('planner.files.attachedFiles')}</h4>
          {existingFiles.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg">
                    {AssignmentFileService.getFileIcon(file.fileType)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {AssignmentFileService.formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {onFileDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFileDelete(file)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropFileUpload;
