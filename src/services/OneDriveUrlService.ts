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

  static async generateFolderUrl(caseNumber: string): Promise<{ url: string | null; folderExists: boolean }> {
    if (!caseNumber) return { url: null, folderExists: false };

    const settings = await this.getSettings();
    if (!settings) return { url: null, folderExists: false };

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
      let folderExists = false;

      if (customMapping) {
        // Use custom folder mapping
        if (customMapping.folder_url) {
          // If we have a direct URL, assume it exists
          return { url: customMapping.folder_url, folderExists: true };
        } else {
          // Use custom folder name
          folderName = customMapping.custom_folder_name;
          folderExists = true; // Custom mapping exists, so folder should exist
        }
      } else {
        // Try to discover folder automatically
        const discoveredFolders = await this.discoverFolders();
        const matchingFolder = discoveredFolders.find(folder => folder.caseNumber === formattedCaseNumber);
        
        if (matchingFolder) {
          folderName = matchingFolder.folderName;
          folderExists = true;
        } else {
          // Use default pattern but mark as potentially not existing
          folderName = settings.folder_naming_pattern.replace('{case_number}', formattedCaseNumber);
          folderExists = false; // Folder may not exist
        }
      }
      
      // Construct full SharePoint URL
      const baseUrl = settings.base_sharepoint_url.replace(/\/$/, ''); // Remove trailing slash
      const folderPath = settings.main_folder_path.replace(/\/$/, ''); // Remove trailing slash
      
      // Create the full URL - encode folder name for URL safety
      const encodedFolderName = encodeURIComponent(folderName);
      const sharePointUrl = `${baseUrl}${folderPath}/${encodedFolderName}`;
      
      return { url: sharePointUrl, folderExists };
    } catch (error) {
      console.error('[OneDriveUrlService] Error generating URL:', error);
      return { url: null, folderExists: false };
    }
  }

  /**
   * Extract case number from folder name using pattern matching
   * Handles patterns like "12-012859 - Bøgevang 25, 7100 Vejle"
   */
  static extractCaseNumber(folderName: string): string | null {
    // Pattern to match case numbers like 12-012859 at the start of folder names
    const caseNumberRegex = /^(12-\d{6})/;
    const match = folderName.match(caseNumberRegex);
    return match ? match[1] : null;
  }

  /**
   * Discover folders from OneDrive that match the case number pattern
   * This would typically integrate with Microsoft Graph API or SharePoint API
   * For now, returns a mock structure for demonstration
   */
  static async discoverFolders(): Promise<{caseNumber: string, folderName: string, folderUrl: string}[]> {
    // In a real implementation, this would call Microsoft Graph API or SharePoint API
    // to list folders and find ones matching the pattern "12-XXXXXX - Address, Postcode City"
    
    console.log('[OneDriveUrlService] Discovering folders - this would call Microsoft Graph API');
    
    // Mock discovered folders for demonstration
    // In production, replace with actual API calls
    const mockDiscoveredFolders = [
      {
        caseNumber: '12-012859',
        folderName: '12-012859 - Bøgevang 25, 7100 Vejle',
        folderUrl: 'https://yourcompany.sharepoint.com/sites/YourSite/Shared Documents/12 Sager/12-012859 - Bøgevang 25, 7100 Vejle'
      },
      {
        caseNumber: '12-024578',
        folderName: '12-024578 - Hovedgaden 15, 8000 Aarhus',
        folderUrl: 'https://yourcompany.sharepoint.com/sites/YourSite/Shared Documents/12 Sager/12-024578 - Hovedgaden 15, 8000 Aarhus'
      }
    ];

    return mockDiscoveredFolders;
  }

  /**
   * Auto-map discovered folders to existing assignments
   */
  static async suggestMappings(): Promise<{caseNumber: string, folderName: string, folderUrl: string, hasAssignment: boolean}[]> {
    const discoveredFolders = await this.discoverFolders();
    
    // Check which case numbers have existing assignments
    const { data: assignments } = await supabase
      .from('assignments')
      .select('case_number')
      .not('case_number', 'is', null);

    const existingCaseNumbers = new Set(assignments?.map(a => a.case_number) || []);

    return discoveredFolders.map(folder => ({
      ...folder,
      hasAssignment: existingCaseNumbers.has(folder.caseNumber)
    }));
  }

  static async openFolder(caseNumber: string): Promise<{ success: boolean; folderExists: boolean; isMobile?: boolean; url?: string; showModal?: boolean }> {
    const result = await this.generateFolderUrl(caseNumber);
    if (!result.url) return { success: false, folderExists: false };

    // Return folder existence status so the calling component can handle appropriately
    if (!result.folderExists) {
      return { success: false, folderExists: false };
    }

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Hybrid approach: Try to open OneDrive app first, then show modal with navigation help
      try {
        // Try to open OneDrive app (this opens the app but not the specific folder)
        const oneDriveAppUrl = 'ms-onedrive://';
        window.location.href = oneDriveAppUrl;
        
        // Copy URL to clipboard for backup
        await navigator.clipboard.writeText(result.url);
        
        // Return success with modal flag to show navigation instructions
        return { 
          success: true, 
          folderExists: result.folderExists, 
          isMobile: true, 
          url: result.url,
          showModal: true 
        };
      } catch (error) {
        console.error('[OneDriveUrlService] Mobile hybrid approach failed:', error);
        // Fallback: open in browser
        window.open(result.url, '_blank', 'noopener,noreferrer');
        return { success: true, folderExists: result.folderExists, isMobile: true, url: result.url };
      }
    } else {
      // Desktop - open in new tab
      window.open(result.url, '_blank', 'noopener,noreferrer');
      return { success: true, folderExists: result.folderExists, isMobile: false };
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