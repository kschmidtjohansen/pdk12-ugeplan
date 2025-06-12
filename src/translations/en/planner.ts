
const planner = {
  title: 'Planner',
  description: 'Plan and manage work assignments',
  
  // Basic actions
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  create: 'Create',
  
  // Assignment management
  assignments: 'Assignments',
  newAssignment: 'New Assignment',
  editAssignment: 'Edit Assignment',
  deleteAssignment: 'Delete Assignment',
  assignmentDetails: 'Assignment Details',
  noAssignments: 'No assignments found',
  
  // Form fields
  assignmentTitle: 'Case Number',
  assignmentDescription: 'Description',
  date: 'Date',
  time: 'Time',
  fromTime: 'From Time',
  toTime: 'To Time',
  location: 'Location',
  employees: 'Employees',
  cars: 'Cars',
  selectEmployee: 'Select Employee',
  selectCar: 'Select Car',
  
  // Status and actions
  published: 'Published',
  notPublished: 'Not Published',
  draft: 'Draft',
  publish: 'Publish',
  unpublish: 'Unpublish',
  duplicate: 'Duplicate',
  
  // Error messages
  fetchError: 'Error loading assignments',
  createError: 'Error creating assignment',
  updateError: 'Error updating assignment',
  deleteError: 'Error deleting assignment',
  errorCreatingAssignment: 'Error creating assignment',
  errorUpdatingAssignment: 'Error updating assignment',
  
  // Success messages
  assignmentCreated: 'Assignment created',
  assignmentUpdated: 'Assignment updated',
  assignmentDeleted: 'Assignment deleted',
  assignmentPublished: 'Assignment published',
  assignmentCreatedMsg: 'Assignment "{title}" created successfully',
  assignmentUpdatedMsg: 'Assignment "{title}" updated successfully',
  
  // Confirmation dialogs
  deleteConfirm: 'Delete Assignment',
  deleteWarning: 'Are you sure you want to delete this assignment? This action cannot be undone.',
  publishConfirm: 'Publish Assignment',
  publishWarning: 'Are you sure you want to publish this assignment?',
  
  // Time navigation
  today: 'Today',
  previousWeek: 'Previous Week',
  nextWeek: 'Next Week',
  week: 'Week',
  
  // Empty states
  noAssignmentsToday: 'No assignments for today',
  noAssignmentsWeek: 'No assignments this week',
  createFirst: 'Create your first assignment',
  
  // Additional planner-specific translations
  previousDays: 'Previous Days',
  nothingPlannedToday: 'Nothing planned for today',
  publishDayTasks: 'Publish Day Tasks',
  copyAssignment: 'Copy Assignment',
  createNew: 'Create New',
  weekView: 'Week {week}, {year} ({start} - {end})',
  selectDateForCopy: 'Select a new date for the copied assignment'
};

export default planner;
