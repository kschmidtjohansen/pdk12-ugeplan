import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import JSZip from 'jszip';
// Note: pdf-lib (~600 kB) is dynamically imported inside generatePdf()
// to keep it out of the initial bundle.

export interface AssignmentFile {
  id: string;
  assignment_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  folder_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  comment: string | null;
  uploader?: {
    id: string;
    name: string;
  };
}

interface GroupedFiles {
  [folderName: string]: AssignmentFile[];
}

interface UseAssignmentFilesReturn {
  files: AssignmentFile[];
  groupedFiles: GroupedFiles;
  folders: string[];
  loading: boolean;
  imageCount: number;
  documentCount: number;
  uploadFile: (file: File, folderName?: string, comment?: string) => Promise<void>;
  downloadFile: (file: AssignmentFile) => Promise<void>;
  downloadFileAsBlob: (file: AssignmentFile) => Promise<Blob | null>;
  downloadFolder: (folderName: string) => Promise<void>;
  downloadAll: () => Promise<void>;
  deleteFile: (file: AssignmentFile) => Promise<void>;
  createFolder: (folderName: string) => void;
  getFilePreviewUrl: (file: AssignmentFile) => Promise<string | null>;
  updateFileComment: (fileId: string, comment: string) => Promise<void>;
  generateImagePdfWithComments: (assignmentTitle?: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAssignmentFiles = (
  assignmentId: string | null,
  siblingAssignmentIds?: string[]
): UseAssignmentFilesReturn => {
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate image and document counts
  const imageCount = files.filter(f => f.mime_type?.startsWith('image/')).length;
  const documentCount = files.filter(f => !f.mime_type?.startsWith('image/')).length;

  // Effective IDs to read from: all sibling days of the case, or just this assignment.
  // We always WRITE to `assignmentId` (the currently opened day).
  const effectiveIds = siblingAssignmentIds && siblingAssignmentIds.length > 0
    ? siblingAssignmentIds
    : assignmentId
      ? [assignmentId]
      : [];
  const effectiveIdsKey = effectiveIds.join(',');

  const fetchFiles = useCallback(async () => {
    if (effectiveIds.length === 0) return;

    setLoading(true);
    try {
      const { data: filesData, error } = await supabase
        .from('assignment_files')
        .select('*')
        .in('assignment_id', effectiveIds)
        .order('folder_name', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(filesData?.map(f => f.user_id) || [])];
      
      // Fetch uploader profiles
      let profilesMap: Record<string, { id: string; name: string }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, { id: string; name: string }>);
        }
      }

      const filesWithUploaders = (filesData || []).map(f => ({
        ...f,
        uploader: profilesMap[f.user_id] || { id: f.user_id, name: 'Ukendt' }
      }));

      setFiles(filesWithUploaders);

      // Extract unique folder names
      const uniqueFolders = [...new Set(
        filesWithUploaders
          .map(f => f.folder_name)
          .filter((name): name is string => !!name)
      )];
      setFolders(uniqueFolders);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error fetching files:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIdsKey]);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const uploadFile = useCallback(async (file: File, folderName?: string, comment?: string) => {
    if (!assignmentId) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Filen er for stor. Maksimal størrelse er 20MB.');
      return;
    }

    try {
      // Suppress global RealtimeChangeNotifier for own action
      window.dispatchEvent(new Event('supabase-own-action'));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Du skal være logget ind for at uploade filer');
        return;
      }

      // Create a unique path for the file
      // Sanitize filename for storage path (keep original in DB for display)
      const timestamp = Date.now();
      const sanitizedName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');
      const filePath = `${assignmentId}/${folderName || 'general'}/${timestamp}-${sanitizedName}`;

      // Fallback mime_type if browser doesn't provide one (e.g. some PDFs)
      const mimeType = file.type || 'application/octet-stream';

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('assignment-files')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Upload fejlede: ${uploadError.message}`, { duration: 8000 });
        return;
      }

      // Create database record with comment
      const { error: dbError } = await supabase
        .from('assignment_files')
        .insert({
          assignment_id: assignmentId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          folder_name: folderName || null,
          file_size: file.size,
          mime_type: mimeType,
          comment: comment || null
        });

      if (dbError) {
        toast.error(`Kunne ikke gemme fil: ${dbError.message}`, { duration: 8000 });
        // Clean up orphaned storage file
        await supabase.storage.from('assignment-files').remove([filePath]);
        return;
      }

      // Verify file was actually saved
      const { count } = await supabase
        .from('assignment_files')
        .select('id', { count: 'exact', head: true })
        .eq('file_path', filePath);

      if (!count) {
        toast.error('Filen blev ikke gemt korrekt — prøv igen', { duration: 8000 });
        return;
      }

      await fetchFiles();
      toast.success(`${file.name} uploadet`);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error uploading file:', error);
      toast.error(`Kunne ikke uploade fil: ${error?.message || 'Ukendt fejl'}`, { duration: 8000 });
    }
  }, [assignmentId, fetchFiles]);

  const updateFileComment = useCallback(async (fileId: string, comment: string) => {
    // Client-side length validation (matches DB CHECK constraint)
    if (comment && comment.length > 2000) {
      toast.error('Kommentaren er for lang (max 2000 tegn)');
      return;
    }
    try {
      const { error } = await supabase
        .from('assignment_files')
        .update({ comment: comment || null })
        .eq('id', fileId);

      if (error) throw error;

      await fetchFiles();
      toast.success('Kommentar opdateret');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error updating comment:', error);
      toast.error('Kunne ikke opdatere kommentar');
    }
  }, [fetchFiles]);

  const downloadFile = useCallback(async (file: AssignmentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-files')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error downloading file:', error);
      toast.error('Kunne ikke downloade fil');
    }
  }, []);

  const downloadFileAsBlob = useCallback(async (file: AssignmentFile): Promise<Blob | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-files')
        .download(file.file_path);

      if (error) throw error;
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error downloading file as blob:', error);
      return null;
    }
  }, []);

  const downloadFolder = useCallback(async (folderName: string) => {
    const folderFiles = files.filter(f => 
      folderName === '__uncategorized__' 
        ? !f.folder_name 
        : f.folder_name === folderName
    );
    
    if (folderFiles.length === 0) {
      toast.error('Ingen filer i mappen');
      return;
    }

    toast.info('Forbereder download...');

    try {
      const zip = new JSZip();
      
      for (const file of folderFiles) {
        const blob = await downloadFileAsBlob(file);
        if (blob) {
          zip.file(file.file_name, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const displayName = folderName === '__uncategorized__' ? 'Løse filer' : folderName;
      
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${displayName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download færdig');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error downloading folder:', error);
      toast.error('Kunne ikke downloade mappe');
    }
  }, [files, downloadFileAsBlob]);

  const downloadAll = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Ingen filer at downloade');
      return;
    }

    toast.info('Forbereder download af alle filer...');

    try {
      const zip = new JSZip();
      
      for (const file of files) {
        const folderPath = file.folder_name || 'Løse filer';
        const blob = await downloadFileAsBlob(file);
        if (blob) {
          const folder = zip.folder(folderPath);
          folder?.file(file.file_name, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alle-filer.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download færdig');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error downloading all files:', error);
      toast.error('Kunne ikke downloade filer');
    }
  }, [files, downloadFileAsBlob]);

  const generateImagePdfWithComments = useCallback(async (assignmentTitle?: string) => {
    const imageFiles = files.filter(f => 
      f.mime_type?.startsWith('image/') && 
      (f.mime_type?.includes('jpeg') || f.mime_type?.includes('jpg') || f.mime_type?.includes('png'))
    );

    if (imageFiles.length === 0) {
      toast.error('Ingen billeder at eksportere');
      return;
    }

    toast.info('Genererer PDF...');

    try {
      // Lazy-load pdf-lib only when actually generating a PDF (~600 kB)
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      let skippedCount = 0;

      for (const file of imageFiles) {
        try {
          const blob = await downloadFileAsBlob(file);
          if (!blob) {
            skippedCount++;
            continue;
          }

          const imageBytes = await blob.arrayBuffer();
          
          let image;
          try {
            if (file.mime_type?.includes('png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }
          } catch (embedError) {
            if (import.meta.env.DEV) console.warn('[useAssignmentFiles] Could not embed image:', file.file_name, embedError);
            skippedCount++;
            continue;
          }

          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          // Title at top
          if (assignmentTitle) {
            page.drawText(assignmentTitle, {
              x: margin,
              y: pageHeight - margin,
              size: 14,
              font: fontBold,
              color: rgb(0.2, 0.2, 0.2),
            });
          }

          // Calculate image dimensions to fit
          const maxImageWidth = contentWidth;
          const maxImageHeight = 450;
          
          const imageAspectRatio = image.width / image.height;
          let drawWidth = maxImageWidth;
          let drawHeight = drawWidth / imageAspectRatio;
          
          if (drawHeight > maxImageHeight) {
            drawHeight = maxImageHeight;
            drawWidth = drawHeight * imageAspectRatio;
          }

          const imageX = margin + (contentWidth - drawWidth) / 2;
          const imageY = pageHeight - margin - 30 - drawHeight;

          // Draw image
          page.drawImage(image, {
            x: imageX,
            y: imageY,
            width: drawWidth,
            height: drawHeight,
          });

          // Draw comment below image
          const commentY = imageY - 25;
          const commentText = file.comment || 'Ingen kommentar';
          
          page.drawText('Kommentar:', {
            x: margin,
            y: commentY,
            size: 10,
            font: fontBold,
            color: rgb(0.3, 0.3, 0.3),
          });

          // Wrap comment text if needed
          const maxCharsPerLine = 80;
          const commentLines = [];
          let currentLine = '';
          const words = commentText.split(' ');
          
          for (const word of words) {
            if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
              currentLine = (currentLine + ' ' + word).trim();
            } else {
              if (currentLine) commentLines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) commentLines.push(currentLine);

          commentLines.slice(0, 4).forEach((line, idx) => {
            page.drawText(line, {
              x: margin + 70,
              y: commentY - (idx * 14),
              size: 10,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });

          // Draw metadata
          const metaY = commentY - (Math.min(commentLines.length, 4) * 14) - 20;
          const uploadDate = format(new Date(file.created_at), 'dd. MMM yyyy', { locale: da });
          const metaText = `Uploadet: ${uploadDate} • ${file.uploader?.name || 'Ukendt'}`;
          
          page.drawText(metaText, {
            x: margin,
            y: metaY,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });

          // File name
          page.drawText(file.file_name, {
            x: margin,
            y: metaY - 14,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });

        } catch (fileError) {
          if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error processing file:', file.file_name, fileError);
          skippedCount++;
        }
      }

      if (pdfDoc.getPageCount() === 0) {
        toast.error('Ingen billeder kunne eksporteres');
        return;
      }

      const pdfBytes = await pdfDoc.save();
      
      // Create blob from Uint8Array using spread to avoid TypeScript buffer issues
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billeder-${assignmentTitle || 'eksport'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (skippedCount > 0) {
        toast.success(`PDF genereret (${skippedCount} billede(r) sprunget over)`);
      } else {
        toast.success('PDF genereret');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error generating PDF:', error);
      toast.error('Kunne ikke generere PDF');
    }
  }, [files, downloadFileAsBlob]);

  const deleteFile = useCallback(async (file: AssignmentFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('assignment-files')
        .remove([file.file_path]);

      if (storageError) {
        if (import.meta.env.DEV) console.warn('[useAssignmentFiles] Storage deletion warning:', storageError);
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('assignment_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      await fetchFiles();
      toast.success('Fil slettet');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error deleting file:', error);
      toast.error('Kunne ikke slette fil');
    }
  }, [fetchFiles]);

  const createFolder = useCallback((folderName: string) => {
    if (!folderName.trim()) return;
    if (!folders.includes(folderName.trim())) {
      setFolders(prev => [...prev, folderName.trim()]);
    }
  }, [folders]);

  const getFilePreviewUrl = useCallback(async (file: AssignmentFile): Promise<string | null> => {
    try {
      // Only generate URLs for images
      if (!file.mime_type?.startsWith('image/')) {
        return null;
      }

      const { data, error } = await supabase.storage
        .from('assignment-files')
        .createSignedUrl(file.file_path, 3600); // 1 hour expiry

      if (error) {
        if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentFiles] Error getting preview URL:', error);
      return null;
    }
  }, []);

  // Group files by folder
  const groupedFiles = files.reduce((acc, file) => {
    const folder = file.folder_name || '__uncategorized__';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(file);
    return acc;
  }, {} as GroupedFiles);

  // Set up realtime subscription — listen across the whole table and filter
  // client-side so we receive changes for every sibling assignment in the series.
  useEffect(() => {
    if (effectiveIds.length === 0) return;

    fetchFiles();

    const idSet = new Set(effectiveIds);
    const channel = supabase
      .channel(`assignment-files-${effectiveIdsKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignment_files',
        },
        (payload) => {
          const newId = (payload.new as { assignment_id?: string } | null)?.assignment_id;
          const oldId = (payload.old as { assignment_id?: string } | null)?.assignment_id;
          if ((newId && idSet.has(newId)) || (oldId && idSet.has(oldId))) {
            fetchFiles();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIdsKey, fetchFiles]);

  return {
    files,
    groupedFiles,
    folders,
    loading,
    imageCount,
    documentCount,
    uploadFile,
    downloadFile,
    downloadFileAsBlob,
    downloadFolder,
    downloadAll,
    deleteFile,
    createFolder,
    getFilePreviewUrl,
    updateFileComment,
    generateImagePdfWithComments,
    refetch: fetchFiles
  };
};
