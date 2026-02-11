
const planner = {
  title: 'Planner',
  description: 'Description',
  
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
  selectEmployees: 'Select Employees',
  car: 'Car',
  selectCar: 'Select Car',
  responsibleUser: 'Responsible User',
  selectResponsibleUser: 'Select Responsible User',
  noResponsibleUser: 'No responsible user',
  
  // Actions
  addAssignment: 'Add Assignment',
  editAssignment: 'Edit Assignment',
  copyAssignment: 'Copy Assignment',
  deleteAssignment: 'Delete Assignment',
  publish: 'Publish',
  publishDayTasks: 'Publish Day Tasks',
  showOnScreen: 'Show on Screen',
  newAssignment: 'New Assignment',
  
  // Messages
  assignmentCreated: 'Assignment Created',
  assignmentCreatedMsg: 'Assignment {title} has been created',
  assignmentsCreated: 'Assignments Created',
  assignmentCreatedMultipleDays: 'Assignment "{title}" created across {count} days',
  assignmentsCreatedAcrossDays: 'Created {count} assignments across {days} days',
  assignmentsCreatedPartialFail: 'Created {success} of {total} assignments. {failed} failed.',
  assignmentsUpdatedAcrossDays: 'Updated and created assignments across {days} days',
  assignmentsUpdatedPartialFail: 'Updated 1 and created {success} of {total} additional assignments. {failed} failed.',
  assignmentUpdated: 'Assignment Updated',
  assignmentUpdatedMsg: 'Assignment {title} has been updated',
  assignmentDeleted: 'Assignment Deleted',
  assignmentDeletedMsg: 'Assignment has been deleted',
  assignmentDeletedMsgWithCase: 'Case {caseNumber} has been deleted',
  errorCreatingAssignment: 'Error creating assignment',
  errorUpdatingAssignment: 'Error updating assignment',
  errorDeletingAssignment: 'Error deleting assignment',
  
  // Change Log
  changeLog: {
    title: 'Planner Changes',
    subtitle: 'Recent planner activity',
    noChanges: 'No changes yet',
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    published: 'published',
    assignments: 'assignments',
  },
  
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
  nothingPlannedToday: 'Nothing planned today',
  
  // Publishing messages
  assignmentPublished: 'Assignment Published',
  assignmentPublishedMsg: 'The assignment has been published successfully',
  assignmentsPublished: 'Assignments Published',
  assignmentsPublishedMsg: 'The assignments have been published successfully',
  publishingInProgress: 'Publishing in Progress',
  noAssignmentsToPublish: 'No Assignments to Publish',
  noUnpublishedAssignments: 'No unpublished assignments found',
  errorPublishingAssignments: 'Failed to publish assignments',
  dayPublished: 'Day Published',
  dayPublishedMsg: 'All assignments for {date} have been published',
  errorPublishingAssignment: 'Failed to publish assignment',
  errorPublishingDay: 'Failed to publish assignments for the day',
  
  // Required fields
  employees: 'Employees',
  date: 'Date',
  time: 'Time',
  
  // Form labels
  titleLabel: 'Title',
  enterTitle: 'Enter title',
  descriptionLabel: 'Description',
  assignmentDescription: 'Assignment description',
  dateAndTime: 'Date and Time',
  assignmentDetails: 'Details',
  notesPlaceholder: 'Enter notes',
  dateLabel: 'Date',
  assignmentDate: 'Assignment date',
  selectMultipleDates: 'Select multiple dates (for multi-day assignment)',
  datesSelected: '{count} days selected',
  removeDate: 'Remove date',
  clearDates: 'Clear all dates',
  timeLabel: 'Time',
  startTime: 'Start time',
  endTime: 'End time',
  locationLabel: 'Location',
  enterLocation: 'Enter location',
  carLabel: 'Car',
  employeesLabel: 'Employees',
  responsibleUserLabel: 'Responsible User',
  
  // Placeholders
  timePlaceholder: 'Select time',
  datePlaceholder: 'Select date',
  
  // Status messages
  deleteConfirmation: 'Are you sure you want to delete this assignment?',
  
  // Table headers
  tableTitle: 'Title',
  tableDate: 'Date',
  tableTime: 'Time',
  tableLocation: 'Location',
  tableActions: 'Actions',
  
  // Filters and sorting
  filterPublished: 'Published',
  filterUnpublished: 'Unpublished',
  sortByDate: 'Sort by date',
  sortByTime: 'Sort by time',
  
  // Date and time formats
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'HH:mm',
  
  // Assignment types
  typeCleaning: 'Cleaning',
  typeMaintenance: 'Maintenance',
  typeInspection: 'Inspection',
  typeOther: 'Other',
  
  // Common terms
  assignment: 'assignment',
  createFirst: 'Create your first assignment',
  
  // Unassigned resources
  unassignedResources: 'Unassigned Resources',
  unassignedEmployees: 'Unassigned Employees',
  unassignedCars: 'Unassigned Cars',
  employeesOnVacation: 'Employees on Vacation',
  availableEmployees: 'Available Employees',
  availableCars: 'Available Cars',
  
  // Car-related translations
  availableCarsTitle: 'Available Cars',
  unavailableCarsTitle: 'Unavailable Cars',
  noCarsAvailable: 'No cars available',
  noCarsUnavailable: 'All cars are available',
  carWithTrailer: 'Car with trailer',
  carWithoutTrailer: 'Car without trailer',
  cars: 'Cars',
  selectCars: 'Select Cars',
  carsSelected: '{count} cars selected',
  unavailable: 'Unavailable',
  available: 'Available',
  bookedUntil: 'Booked until {time}',
  carNotAvailable: 'Not available',
  
  // Employee-related translations
  onVacation: 'On Vacation',
  employeeOnVacation: 'On vacation',
  employeeAvailable: 'Available',
  employeeUnavailable: 'Unavailable',
  noEmployeesSelected: 'No employees selected',
  
  // Responsible user translations
  responsibleUserDisplay: 'Responsible: {name}',
  noResponsibleUserAssigned: 'No responsible assigned',
  
  // Additional translations for unassigned resources
  showMore: "more",
  showLess: "Show less",
  allCarsAssigned: "All cars are assigned",
  availableResources: "available resources",
  
  // Assignment status
  assignmentStatus: 'Status',
  assignmentPublishedStatus: 'Published',
  assignmentUnpublishedStatus: 'Unpublished',
  
  // Additional translations
  unknownEmployee: 'Unknown employee',
  today: 'Today',
  
  // New translations for unassigned resources
  noEmployeesAvailable: 'All employees are assigned or on vacation',
  
  // Collapsible and date navigation
  collapseResources: 'Hide resources',
  expandResources: 'Show resources', 
  selectDate: 'Select date',
  previousDay: 'Previous day',
  nextDay: 'Next day',
  previousDays: 'Previous days',
  
  // Validation messages
  validation: {
    titleRequired: 'Title is required',
    locationRequired: 'Location is required',
    dateRequired: 'Date is required',
    fromTimeRequired: 'Start time is required',
    toTimeRequired: 'End time is required',
    timeOrderRequired: 'Start time must be before end time'
  },
  
  // Operation status messages
  operations: {
    creating: 'Creating',
    updating: 'Updating',
    deleting: 'Deleting',
    publishing: 'Publishing',
    saving: 'Saving',
    processing: 'Processing',
    success: 'Success',
    failed: 'Failed'
  },

  // Car booking conflict dialog
  carBookingConflict: 'Car already in use',
  carAlreadyInUse: 'is already in use on this day.',
  conflictingTasks: 'Used for the following tasks',
  confirmDoubleBooking: 'Do you still want to select this car?',
  useAnywayButton: 'Use anyway',
  until: 'until',
  sharedWithOtherTasks: 'Shared with other tasks',
  
  // View modes
  viewModeStandard: 'Standard',
  viewModeCompact: 'Compact',
  
  // Employee role categories
  skadeledere: 'Case Managers',
  servicemedarbejdere: 'Service Workers',
  
  // Search
  searchPlaceholder: 'Search by case no., address or employee...',
  noSearchResults: 'No assignments match your search',
  
  // Tabs
  tabs: {
    details: 'Details',
    messages: 'Messages',
    files: 'Files'
  },
  
  // Messages
  messages: {
    title: 'Messages',
    sendMessage: 'Send message',
    messagePlaceholder: 'Write a message...',
    noMessages: 'No messages yet',
    exportMessages: 'Export',
    exporting: 'Exporting...',
    messagesExported: 'Messages exported',
    newMessage: 'New message',
    reply: 'Reply',
    replyingTo: 'Replying to',
    cancelReply: 'Cancel reply',
    inReplyTo: 'In reply to',
    writeReply: 'Write a reply...',
    deleteMessage: 'Delete message',
    confirmDelete: 'Are you sure you want to delete this message? This action cannot be undone.',
    messageDeleted: 'Message deleted',
    errorDeletingMessage: 'Could not delete message'
  },
  
  // Files
  files: {
    title: 'Files',
    uploadFile: 'Upload file',
    createFolder: 'Create folder',
    folderName: 'Folder name',
    folderPlaceholder: 'E.g.: Demolition 05.02.2026',
    noFiles: 'No files yet',
    downloadFile: 'Download file',
    deleteFile: 'Delete file',
    downloadAll: 'Download all',
    fileUploaded: 'File uploaded',
    fileDeleted: 'File deleted',
    noFolder: 'No folder',
    imagePreview: 'Preview',
    closePreview: 'Close',
    downloadFolder: 'Download folder',
    allFiles: 'All files',
    preparingDownload: 'Preparing download...',
    imageCount: 'images',
    documentCount: 'documents',
    looseFiles: 'Loose files',
    noFilesInFolder: 'No files in this folder',
    addComment: 'Add comment',
    editComment: 'Edit comment',
    commentPlaceholder: 'Add a comment to this image...',
    noComment: 'No comment',
    downloadAsPdf: 'Download as PDF',
    generatingPdf: 'Generating PDF...',
    pdfGenerated: 'PDF generated',
    uploadImages: 'Upload images'
  },
  
  // Department filtering
  noDepartmentSelected: 'No department selected',
  selectDepartmentToViewData: 'Select a department to view data',
  departmentFilterActive: 'Showing data for {department}',
};

export default planner;
