import { supabase } from '@/integrations/supabase/client';
import { FileAttachment } from '@/types/assignment';

export class AssignmentFileService {
  private static BUCKET_NAME = 'assignment-files';
  private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  }

  static async uploadFile(
    file: File, 
    assignmentId: string, 
    userId: string
  ): Promise<FileAttachment> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop();
    const fileName = `${assignmentId}/${fileId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const fileAttachment: FileAttachment = {
      id: fileId,
      filename: fileName,
      originalName: file.name,
      fileType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId
    };

    return fileAttachment;
  }

  static async deleteFile(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  static async getFileUrl(fileName: string): Promise<string> {
    const { data } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (!data?.signedUrl) {
      throw new Error('Failed to generate file URL');
    }

    return data.signedUrl;
  }

  static async updateAssignmentFiles(
    assignmentId: string, 
    attachments: FileAttachment[]
  ): Promise<void> {
    const { error } = await supabase
      .from('assignments')
      .update({ attachment_files: attachments as any })
      .eq('id', assignmentId);

    if (error) {
      throw new Error(`Failed to update assignment files: ${error.message}`);
    }
  }

  static getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    return '📎';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}