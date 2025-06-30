
const planner = {
  title: 'Planner',
  description: 'Manage assignments and schedule employees',
  
  // Assignment list
  assignments: 'Assignments',
  noAssignments: 'No assignments found',
  noAssignmentsWeek: 'No assignments for this week',
  createNew: 'Create New Assignment',
  
  // Assignment details
  titlePlaceholder: 'Enter title',
  locationPlaceholder: 'Enter location',
  fromTime: 'From Time',
  toTime: 'To Time',
  location: 'Location',
  description: 'Description',
  descriptionPlaceholder: 'Enter description',
  selectEmployees: 'Select Employees',
  car: 'Car',
  selectCar: 'Select Car',
  responsibleUser: 'Responsible User',
  selectResponsibleUser: 'Select Responsible User',
  
  // Actions
  addAssignment: 'Add Assignment',
  editAssignment: 'Edit Assignment',
  copyAssignment: 'Copy Assignment',
  deleteAssignment: 'Delete Assignment',
  publish: 'Publish',
  showOnScreen: 'Show on Screen',
  
  // Messages
  assignmentCreated: 'Assignment Created',
  assignmentCreatedMsg: 'Assignment {title} has been created',
  assignmentUpdated: 'Assignment Updated',
  assignmentUpdatedMsg: 'Assignment {title} has been updated',
  assignmentDeleted: 'Assignment Deleted',
  assignmentDeletedMsg: 'Assignment has been deleted',
  errorCreatingAssignment: 'Error creating assignment',
  errorUpdatingAssignment: 'Error updating assignment',
  errorDeletingAssignment: 'Error deleting assignment',
  
  // Week view
  weekView: 'Week {week}, {year} ({start} - {end})',
  week: 'Week',
  
  // Status
  published: 'Published',
  notPublished: 'Not Published',
  
  // Confirmation dialogs
  deleteConfirm: 'Delete Assignment',
  deleteWarning: 'Are you sure you want to delete this assignment?',
  
  // Empty states
  addFirst: 'Add your first assignment',

  // Publishing messages
  assignmentPublished: 'Assignment Published',
  assignmentPublishedMsg: 'The assignment has been published successfully',
  dayPublished: 'Day Published',
  dayPublishedMsg: 'All assignments for {date} have been published',
  errorPublishingAssignment: 'Failed to publish assignment',
  errorPublishingDay: 'Failed to publish assignments for the day',
  
  // Required fields
  employees: 'Employees',
  date: 'Date',
  time: 'Time'
};

export default planner;
