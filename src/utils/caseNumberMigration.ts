import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to migrate case numbers from assignment titles to the case_number field
 * This function looks for patterns like "12-XXXXXX" in assignment titles and moves them to case_number field
 */

export interface MigrationResult {
  totalAssignments: number;
  migratedCount: number;
  errors: string[];
  migratedAssignments: Array<{
    id: string;
    title: string;
    extractedCaseNumber: string;
  }>;
}

/**
 * Extract case number from title using the pattern 12-XXXXXX
 */
const extractCaseNumber = (title: string): string | null => {
  const caseNumberRegex = /\b12-[A-Z0-9]{6}\b/i;
  const match = title.match(caseNumberRegex);
  return match ? match[0].toUpperCase() : null;
};

/**
 * Analyze existing assignments to see what can be migrated
 */
export const analyzeCaseNumbers = async (): Promise<{
  totalAssignments: number;
  potentialMigrations: Array<{
    id: string;
    title: string;
    extractedCaseNumber: string;
    currentCaseNumber: string | null;
  }>;
}> => {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, case_number')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const potentialMigrations = assignments
      ?.map(assignment => {
        const extractedCaseNumber = extractCaseNumber(assignment.title);
        return {
          id: assignment.id,
          title: assignment.title,
          extractedCaseNumber: extractedCaseNumber || '',
          currentCaseNumber: assignment.case_number
        };
      })
      .filter(item => 
        item.extractedCaseNumber && 
        (!item.currentCaseNumber || item.currentCaseNumber !== item.extractedCaseNumber)
      ) || [];

    return {
      totalAssignments: assignments?.length || 0,
      potentialMigrations
    };
  } catch (error) {
    console.error('Error analyzing case numbers:', error);
    throw error;
  }
};

/**
 * Migrate case numbers from titles to case_number field
 */
export const migrateCaseNumbers = async (dryRun: boolean = true): Promise<MigrationResult> => {
  const result: MigrationResult = {
    totalAssignments: 0,
    migratedCount: 0,
    errors: [],
    migratedAssignments: []
  };

  try {
    // Get all assignments that might need migration
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, case_number')
      .order('created_at', { ascending: false });

    if (error) throw error;

    result.totalAssignments = assignments?.length || 0;

    if (!assignments || assignments.length === 0) {
      return result;
    }

    // Process each assignment
    for (const assignment of assignments) {
      try {
        const extractedCaseNumber = extractCaseNumber(assignment.title);
        
        if (extractedCaseNumber && 
            (!assignment.case_number || assignment.case_number !== extractedCaseNumber)) {
          
          if (!dryRun) {
            // Actually update the database
            const { error: updateError } = await supabase
              .from('assignments')
              .update({ 
                case_number: extractedCaseNumber,
                updated_at: new Date().toISOString()
              })
              .eq('id', assignment.id);

            if (updateError) {
              result.errors.push(
                `Failed to update assignment ${assignment.id}: ${updateError.message}`
              );
              continue;
            }
          }

          result.migratedAssignments.push({
            id: assignment.id,
            title: assignment.title,
            extractedCaseNumber
          });
          result.migratedCount++;
        }
      } catch (error: any) {
        result.errors.push(
          `Error processing assignment ${assignment.id}: ${error.message}`
        );
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error in migrateCaseNumbers:', error);
    result.errors.push(`Migration failed: ${error.message}`);
    return result;
  }
};

/**
 * Clean up assignment titles by removing case numbers that are now in case_number field
 */
export const cleanupAssignmentTitles = async (dryRun: boolean = true): Promise<{
  cleanedCount: number;
  errors: string[];
  cleanedAssignments: Array<{
    id: string;
    oldTitle: string;
    newTitle: string;
  }>;
}> => {
  const result = {
    cleanedCount: 0,
    errors: [],
    cleanedAssignments: [] as Array<{
      id: string;
      oldTitle: string;
      newTitle: string;
    }>
  };

  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, case_number')
      .not('case_number', 'is', null);

    if (error) throw error;

    for (const assignment of assignments || []) {
      if (assignment.case_number && assignment.title.includes(assignment.case_number)) {
        const newTitle = assignment.title
          .replace(new RegExp(`\\b${assignment.case_number}\\b`, 'gi'), '')
          .replace(/^[\s\-]+|[\s\-]+$/g, '') // Remove leading/trailing spaces and dashes
          .trim();

        if (newTitle && newTitle !== assignment.title) {
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('assignments')
              .update({ 
                title: newTitle,
                updated_at: new Date().toISOString()
              })
              .eq('id', assignment.id);

            if (updateError) {
              result.errors.push(
                `Failed to clean title for assignment ${assignment.id}: ${updateError.message}`
              );
              continue;
            }
          }

          result.cleanedAssignments.push({
            id: assignment.id,
            oldTitle: assignment.title,
            newTitle
          });
          result.cleanedCount++;
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error in cleanupAssignmentTitles:', error);
    result.errors.push(`Title cleanup failed: ${error.message}`);
    return result;
  }
};