import { PublicClientApplication, AuthenticationResult, SilentRequest } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { supabase } from '@/integrations/supabase/client';

interface OneDriveConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
}

interface CaseOneDriveMapping {
  id: string;
  case_number: string;
  folder_id: string;
  folder_url: string;
  created_at: string;
  created_by: string;
}

export class OneDriveService {
  private msalInstance: PublicClientApplication | null = null;
  private graphClient: Client | null = null;
  private config: OneDriveConfig | null = null;

  constructor() {
    this.initializeConfig();
  }

  private async initializeConfig() {
    try {
      // In a real implementation, these would be stored in Supabase secrets
      // For now, we'll use placeholder values that need to be configured
      this.config = {
        clientId: process.env.AZURE_CLIENT_ID || 'YOUR_AZURE_CLIENT_ID',
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin
      };

      if (this.config.clientId !== 'YOUR_AZURE_CLIENT_ID') {
        this.msalInstance = new PublicClientApplication({
          auth: {
            clientId: this.config.clientId,
            authority: this.config.authority,
            redirectUri: this.config.redirectUri
          },
          cache: {
            cacheLocation: 'localStorage',
            storeAuthStateInCookie: false
          }
        });

        await this.msalInstance.initialize();
        this.setupGraphClient();
      }
    } catch (error) {
      console.error('Failed to initialize OneDrive service:', error);
    }
  }

  private setupGraphClient() {
    if (!this.msalInstance) return;

    this.graphClient = Client.init({
      authProvider: async (done) => {
        try {
          const account = this.msalInstance!.getAllAccounts()[0];
          if (!account) {
            throw new Error('No account found');
          }

          const silentRequest: SilentRequest = {
            scopes: ['Files.ReadWrite.All', 'Sites.ReadWrite.All'],
            account: account
          };

          const response = await this.msalInstance!.acquireTokenSilent(silentRequest);
          done(null, response.accessToken);
        } catch (error) {
          console.error('Failed to acquire token:', error);
          done(error as Error, null);
        }
      }
    });
  }

  async signIn(): Promise<boolean> {
    if (!this.msalInstance) {
      console.error('OneDrive service not properly initialized');
      return false;
    }

    try {
      const loginRequest = {
        scopes: ['Files.ReadWrite.All', 'Sites.ReadWrite.All'],
        prompt: 'select_account'
      };

      await this.msalInstance.loginPopup(loginRequest);
      this.setupGraphClient();
      return true;
    } catch (error) {
      console.error('OneDrive sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (!this.msalInstance) return;

    try {
      const account = this.msalInstance.getAllAccounts()[0];
      if (account) {
        await this.msalInstance.logoutPopup({ account });
      }
    } catch (error) {
      console.error('OneDrive sign-out failed:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.msalInstance?.getAllAccounts().length > 0;
  }

  async createCaseFolder(caseNumber: string): Promise<string | null> {
    if (!this.graphClient || !this.isAuthenticated()) {
      console.error('OneDrive not authenticated');
      return null;
    }

    try {
      // Create folder in the root of OneDrive
      const folderName = `Case_${caseNumber}`;
      const driveItem: any = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      };

      const createdFolder = await this.graphClient
        .api('/me/drive/root/children')
        .post(driveItem);

      // Save mapping to database
      const { error } = await supabase
        .from('case_onedrive_mappings')
        .insert({
          case_number: caseNumber,
          folder_id: createdFolder.id,
          folder_url: createdFolder.webUrl,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('Failed to save OneDrive mapping:', error);
        return null;
      }

      return createdFolder.id;
    } catch (error) {
      console.error('Failed to create OneDrive folder:', error);
      return null;
    }
  }

  async getCaseFolderUrl(caseNumber: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('case_onedrive_mappings')
        .select('folder_url')
        .eq('case_number', caseNumber)
        .single();

      if (error || !data) {
        return null;
      }

      return data.folder_url;
    } catch (error) {
      console.error('Failed to get case folder URL:', error);
      return null;
    }
  }

  async uploadFileToCase(caseNumber: string, file: File): Promise<boolean> {
    if (!this.graphClient || !this.isAuthenticated()) {
      console.error('OneDrive not authenticated');
      return false;
    }

    try {
      // Get or create case folder
      let folderId = await this.getCaseFolderId(caseNumber);
      if (!folderId) {
        folderId = await this.createCaseFolder(caseNumber);
        if (!folderId) {
          throw new Error('Failed to create case folder');
        }
      }

      // Upload file to the case folder
      const uploadSession = await this.graphClient
        .api(`/me/drive/items/${folderId}:/${file.name}:/createUploadSession`)
        .post({
          item: {
            '@microsoft.graph.conflictBehavior': 'rename'
          }
        });

      // For small files, we can upload directly
      if (file.size < 4 * 1024 * 1024) { // 4MB
        await this.graphClient
          .api(`/me/drive/items/${folderId}:/${file.name}:/content`)
          .put(file);
      } else {
        // For larger files, use upload session (implementation would be more complex)
        console.warn('Large file upload not fully implemented yet');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to upload file to OneDrive:', error);
      return false;
    }
  }

  private async getCaseFolderId(caseNumber: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('case_onedrive_mappings')
        .select('folder_id')
        .eq('case_number', caseNumber)
        .single();

      if (error || !data) {
        return null;
      }

      return data.folder_id;
    } catch (error) {
      console.error('Failed to get case folder ID:', error);
      return null;
    }
  }

  async getAllCaseMappings(): Promise<CaseOneDriveMapping[]> {
    try {
      const { data, error } = await supabase
        .from('case_onedrive_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get case mappings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get case mappings:', error);
      return [];
    }
  }

  // Utility method to validate case number format
  static validateCaseNumber(caseNumber: string): boolean {
    // Basic validation - adjust based on your case number format requirements
    return /^[A-Z0-9\-_]{3,20}$/i.test(caseNumber.trim());
  }

  // Get OneDrive service status
  getServiceStatus(): {
    configured: boolean;
    authenticated: boolean;
    clientId: string | null;
  } {
    return {
      configured: this.config?.clientId !== 'YOUR_AZURE_CLIENT_ID' && !!this.config?.clientId,
      authenticated: this.isAuthenticated(),
      clientId: this.config?.clientId || null
    };
  }
}

// Export a singleton instance
export const oneDriveService = new OneDriveService();