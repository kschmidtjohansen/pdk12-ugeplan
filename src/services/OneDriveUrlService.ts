import { supabase } from '@/integrations/supabase/client';

interface OneDriveSettings {
  id: string;
  base_sharepoint_url: string;
  main_folder_path: string;
  folder_naming_pattern: string;
  is_active: boolean;
}

export class OneDriveUrlService {
  private static settings: OneDriveSettings | null = null;
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getSettings(): Promise<OneDriveSettings | null> {
    const now = Date.now();
    
    // Use cached settings if they're fresh
    if (this.settings && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.settings;
    }

    try {
      const { data, error } = await supabase
        .from('onedrive_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[OneDriveUrlService] Error fetching settings:', error);
        return null;
      }

      this.settings = data;
      this.lastFetch = now;
      return data;
    } catch (error) {
      console.error('[OneDriveUrlService] Error:', error);
      return null;
    }
  }

  static async generateFolderUrl(caseNumber: string): Promise<string | null> {
    if (!caseNumber) return null;

    const settings = await this.getSettings();
    if (!settings) return null;

    try {
      // Clean and format case number
      const formattedCaseNumber = caseNumber.trim();
      
      // First check for custom folder mapping
      const { data: customMapping } = await supabase
        .from('case_folder_mappings')
        .select('custom_folder_name, folder_url')
        .eq('case_number', formattedCaseNumber)
        .single();

      let folderName: string;
      let fullUrl: string;

      if (customMapping) {
        // Use custom folder mapping
        if (customMapping.folder_url) {
          // If we have a direct URL, use it
          return customMapping.folder_url;
        } else {
          // Use custom folder name
          folderName = customMapping.custom_folder_name;
        }
      } else {
        // Use default pattern
        folderName = settings.folder_naming_pattern.replace('{case_number}', formattedCaseNumber);
      }
      
      // Construct full SharePoint URL
      const baseUrl = settings.base_sharepoint_url.replace(/\/$/, ''); // Remove trailing slash
      const folderPath = settings.main_folder_path.replace(/\/$/, ''); // Remove trailing slash
      
      // Create the full URL - encode folder name for URL safety
      const encodedFolderName = encodeURIComponent(folderName);
      const sharePointUrl = `${baseUrl}${folderPath}/${encodedFolderName}`;
      
      return sharePointUrl;
    } catch (error) {
      console.error('[OneDriveUrlService] Error generating URL:', error);
      return null;
    }
  }

  static async openFolder(caseNumber: string): Promise<void> {
    const url = await this.generateFolderUrl(caseNumber);
    if (!url) return;

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open in SharePoint mobile app first, fallback to browser
      const sharePointAppUrl = url.replace('https://', 'ms-sharepoint://');
      
      // Create a temporary link to try mobile app
      const tempLink = document.createElement('a');
      tempLink.href = sharePointAppUrl;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      
      // Try mobile app, fallback to browser after 1 second
      tempLink.click();
      
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
        document.body.removeChild(tempLink);
      }, 1000);
    } else {
      // Desktop - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  static async isConfigured(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings !== null;
  }

  static clearCache(): void {
    this.settings = null;
    this.lastFetch = 0;
  }

  static async testConnection(baseUrl: string, folderPath: string): Promise<boolean> {
    try {
      // Basic URL validation
      const url = new URL(baseUrl);
      return url.hostname.includes('sharepoint.com') && folderPath.length > 0;
    } catch {
      return false;
    }
  }
}