import fs from 'fs';
import path from 'path';

export interface ChangelogEntry {
  version?: string;
  date: string;
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  category: string;
  description: string;
  details?: string[];
}

export class ChangelogManager {
  private changelogPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  }

  /**
   * Automatically adds an entry to the changelog
   */
  addEntry(entry: ChangelogEntry): void {
    try {
      const changelog = this.readChangelog();
      const newEntry = this.formatEntry(entry);
      
      // Find the [Unreleased] section and add the entry
      const unreleasedIndex = changelog.indexOf('## [Unreleased]');
      if (unreleasedIndex === -1) {
        throw new Error('Could not find [Unreleased] section in changelog');
      }

      // Find the appropriate subsection or create it
      const sectionHeader = `### ${this.capitalizeFirst(entry.type)}`;
      let sectionIndex = changelog.indexOf(sectionHeader, unreleasedIndex);
      
      if (sectionIndex === -1) {
        // Create new section
        const nextSectionIndex = changelog.indexOf('###', unreleasedIndex + 1);
        const insertIndex = nextSectionIndex === -1 
          ? changelog.indexOf('\n---', unreleasedIndex)
          : nextSectionIndex;
          
        const newSection = `\n${sectionHeader}\n${newEntry}\n`;
        changelog.splice(insertIndex, 0, newSection);
      } else {
        // Add to existing section
        const nextSectionIndex = changelog.indexOf('###', sectionIndex + 1);
        const insertIndex = nextSectionIndex === -1 
          ? changelog.indexOf('\n---', sectionIndex)
          : nextSectionIndex;
          
        changelog.splice(insertIndex, 0, newEntry);
      }

      this.writeChangelog(changelog);
      console.log(`[Changelog] Added entry: ${entry.category} - ${entry.description}`);
    } catch (error) {
      console.error('[Changelog] Failed to add entry:', error);
    }
  }

  /**
   * Adds multiple entries at once
   */
  addEntries(entries: ChangelogEntry[]): void {
    entries.forEach(entry => this.addEntry(entry));
  }

  /**
   * Creates a changelog entry for code changes
   */
  static createEntry(
    type: ChangelogEntry['type'],
    category: string,
    description: string,
    details?: string[]
  ): ChangelogEntry {
    return {
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      description,
      details
    };
  }

  /**
   * Auto-detects changes based on file modifications and creates appropriate entries
   */
  static autoDetectChanges(modifiedFiles: string[]): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];

    for (const file of modifiedFiles) {
      // Detect component changes
      if (file.includes('/components/') && file.endsWith('.tsx')) {
        const componentName = path.basename(file, '.tsx');
        entries.push(this.createEntry(
          'changed',
          'UI Components',
          `Enhanced ${componentName} component functionality`
        ));
      }

      // Detect service changes
      if (file.includes('/services/') && file.endsWith('.ts')) {
        const serviceName = path.basename(file, '.ts');
        entries.push(this.createEntry(
          'added',
          'Backend Services',
          `Implemented ${serviceName} service`
        ));
      }

      // Detect hook changes
      if (file.includes('/hooks/') && file.endsWith('.ts')) {
        const hookName = path.basename(file, '.ts');
        entries.push(this.createEntry(
          'added',
          'Custom Hooks',
          `Added ${hookName} hook for state management`
        ));
      }

      // Detect type changes
      if (file.includes('/types/') && file.endsWith('.ts')) {
        const typeName = path.basename(file, '.ts');
        entries.push(this.createEntry(
          'changed',
          'Type System',
          `Updated ${typeName} type definitions`
        ));
      }

      // Detect page changes
      if (file.includes('/pages/') && file.endsWith('.tsx')) {
        const pageName = path.basename(file, '.tsx').replace('Page', '');
        entries.push(this.createEntry(
          'changed',
          'User Interface',
          `Improved ${pageName} page functionality`
        ));
      }

      // Detect integration changes
      if (file.includes('OneDrive') || file.includes('Microsoft')) {
        entries.push(this.createEntry(
          'added',
          'External Integrations',
          'Microsoft OneDrive integration for case file management'
        ));
      }

      // Detect database changes
      if (file.includes('migration') || file.includes('supabase')) {
        entries.push(this.createEntry(
          'changed',
          'Database',
          'Database schema updates and optimizations'
        ));
      }
    }

    return entries;
  }

  private readChangelog(): string[] {
    try {
      return fs.readFileSync(this.changelogPath, 'utf-8').split('\n');
    } catch (error) {
      console.error('[Changelog] Could not read changelog file:', error);
      return [];
    }
  }

  private writeChangelog(lines: string[]): void {
    try {
      fs.writeFileSync(this.changelogPath, lines.join('\n'), 'utf-8');
    } catch (error) {
      console.error('[Changelog] Could not write changelog file:', error);
    }
  }

  private formatEntry(entry: ChangelogEntry): string {
    const details = entry.details ? 
      entry.details.map(detail => `  - ${detail}`).join('\n') : '';
    
    return `- **${entry.category}**: ${entry.description}${details ? '\n' + details : ''}`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Export utility functions for easy use
export const changelog = new ChangelogManager();

export const addChangelogEntry = (
  type: ChangelogEntry['type'],
  category: string,
  description: string,
  details?: string[]
) => {
  const entry = ChangelogManager.createEntry(type, category, description, details);
  changelog.addEntry(entry);
};

// Auto-detect and add entries for current implementation
export const updateChangelogForCurrentChanges = () => {
  const currentChanges: ChangelogEntry[] = [
    ChangelogManager.createEntry(
      'added',
      'Assignment Management',
      'Enhanced assignment dialog with view and edit modes',
      [
        'Servicemedarbejder users can now view all assignments',
        'Separate view mode for read-only access with file upload capability',
        'Edit mode restricted to administrator and skadeleder roles'
      ]
    ),
    ChangelogManager.createEntry(
      'added',
      'File Management',
      'Comprehensive file upload and attachment system',
      [
        'File upload available to all authenticated users',
        'Integration with Supabase storage for secure file handling',
        'Support for multiple file types including images and documents'
      ]
    ),
    ChangelogManager.createEntry(
      'added',
      'Microsoft OneDrive Integration',
      'Complete OneDrive integration for case file management',
      [
        'Automatic folder creation based on case numbers',
        'File synchronization between local storage and OneDrive',
        'Case number validation and folder linking system',
        'Microsoft Graph API integration with secure authentication'
      ]
    ),
    ChangelogManager.createEntry(
      'added',
      'Database Schema',
      'Extended database schema for enhanced functionality',
      [
        'Added case_number and onedrive_folder_id columns to assignments',
        'Created case_onedrive_mappings table for folder management',
        'Enhanced RLS policies for proper access control'
      ]
    ),
    ChangelogManager.createEntry(
      'changed',
      'User Permissions',
      'Refined permission system for better access control',
      [
        'canUploadFiles permission for all authenticated users',
        'canViewAssignments permission for universal assignment viewing',
        'canEditAssignments permission restricted to admin and skadeleder'
      ]
    ),
    ChangelogManager.createEntry(
      'changed',
      'User Experience',
      'Improved assignment interaction workflow',
      [
        'Assignment cards now open in view mode by default',
        'Clear distinction between viewing and editing capabilities',
        'Streamlined file upload process with progress indicators'
      ]
    )
  ];

  changelog.addEntries(currentChanges);
};