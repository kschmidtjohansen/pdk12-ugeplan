 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import { da } from 'date-fns/locale';
import JSZip from 'jszip';
 
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
   uploadFile: (file: File, folderName?: string) => Promise<void>;
   downloadFile: (file: AssignmentFile) => Promise<void>;
  downloadFileAsBlob: (file: AssignmentFile) => Promise<Blob | null>;
  downloadFolder: (folderName: string) => Promise<void>;
  downloadAll: () => Promise<void>;
   deleteFile: (file: AssignmentFile) => Promise<void>;
   createFolder: (folderName: string) => void;
  getFilePreviewUrl: (file: AssignmentFile) => Promise<string | null>;
   refetch: () => Promise<void>;
 }
 
 export const useAssignmentFiles = (assignmentId: string | null): UseAssignmentFilesReturn => {
   const [files, setFiles] = useState<AssignmentFile[]>([]);
   const [folders, setFolders] = useState<string[]>([]);
   const [loading, setLoading] = useState(false);
 
  // Calculate image and document counts
  const imageCount = files.filter(f => f.mime_type?.startsWith('image/')).length;
  const documentCount = files.filter(f => !f.mime_type?.startsWith('image/')).length;

   const fetchFiles = useCallback(async () => {
     if (!assignmentId) return;
 
     setLoading(true);
     try {
       const { data: filesData, error } = await supabase
         .from('assignment_files')
         .select('*')
         .eq('assignment_id', assignmentId)
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
       console.error('[useAssignmentFiles] Error fetching files:', error);
     } finally {
       setLoading(false);
     }
   }, [assignmentId]);
 
   const uploadFile = useCallback(async (file: File, folderName?: string) => {
     if (!assignmentId) return;
 
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         toast.error('Du skal være logget ind for at uploade filer');
         return;
       }
 
       // Create a unique path for the file
       const fileExt = file.name.split('.').pop();
       const timestamp = Date.now();
       const filePath = `${assignmentId}/${folderName || 'general'}/${timestamp}-${file.name}`;
 
       // Upload to storage
       const { error: uploadError } = await supabase.storage
         .from('assignment-files')
         .upload(filePath, file);
 
       if (uploadError) throw uploadError;
 
       // Create database record
       const { error: dbError } = await supabase
         .from('assignment_files')
         .insert({
           assignment_id: assignmentId,
           user_id: user.id,
           file_name: file.name,
           file_path: filePath,
           folder_name: folderName || null,
           file_size: file.size,
           mime_type: file.type
         });
 
       if (dbError) throw dbError;
 
       await fetchFiles();
       toast.success('Fil uploadet');
     } catch (error) {
       console.error('[useAssignmentFiles] Error uploading file:', error);
       toast.error('Kunne ikke uploade fil');
     }
   }, [assignmentId, fetchFiles]);
 
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
       console.error('[useAssignmentFiles] Error downloading file:', error);
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
      console.error('[useAssignmentFiles] Error downloading file as blob:', error);
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
      console.error('[useAssignmentFiles] Error downloading folder:', error);
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
      console.error('[useAssignmentFiles] Error downloading all files:', error);
      toast.error('Kunne ikke downloade filer');
    }
  }, [files, downloadFileAsBlob]);

   const deleteFile = useCallback(async (file: AssignmentFile) => {
     try {
       // Delete from storage
       const { error: storageError } = await supabase.storage
         .from('assignment-files')
         .remove([file.file_path]);
 
       if (storageError) {
         console.warn('[useAssignmentFiles] Storage deletion warning:', storageError);
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
       console.error('[useAssignmentFiles] Error deleting file:', error);
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
        console.error('[useAssignmentFiles] Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[useAssignmentFiles] Error getting preview URL:', error);
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
 
   // Set up realtime subscription
   useEffect(() => {
     if (!assignmentId) return;
 
     fetchFiles();
 
     const channel = supabase
       .channel(`assignment-files-${assignmentId}`)
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'assignment_files',
           filter: `assignment_id=eq.${assignmentId}`
         },
         () => {
           fetchFiles();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [assignmentId, fetchFiles]);
 
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
     refetch: fetchFiles
   };
 };