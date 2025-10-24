
const employees = {
  title: 'Employees',
  description: 'Manage employees and their roles',
  
  // Form fields
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  jobTitle: 'Job Title',
  role: 'Role',
  statusLabel: 'Status',
  notes: 'Notes',
  contact: 'Contact',
  avatar: 'Avatar',
  onLeave: 'On Leave',
  
  // Status translations
  status: {
    available: 'Available',
    onVacation: 'On vacation',
    onLeave: 'On Leave',
    unknown: 'Unknown',
    fullyBooked: 'Fully Booked',
    unavailable: 'Unavailable',
    partiallyBooked: 'Partially booked',
    partialVacation: 'Partial vacation',
  },
  
  // Actions
  addEmployee: 'Add Employee',
  addVikar: 'Add Substitute',
  editEmployee: 'Edit Employee',
  deleteEmployee: 'Delete Employee',
  save: 'Save Employee',
  cancel: 'Cancel',
  
  // Messages
  employeeCreated: 'Employee Created',
  employeeCreatedMsg: 'Employee {name} has been created',
  employeeUpdated: 'Employee Updated',
  employeeUpdatedMsg: 'Employee {name} has been updated',
  employeeDeleted: 'Employee Deleted',
  employeeDeletedMsg: 'Employee has been deleted',
  errorCreatingEmployee: 'Error creating employee',
  errorUpdatingEmployee: 'Error updating employee',
  errorDeletingEmployee: 'Error deleting employee',
  
  // Status
  active: 'Active',
  inactive: 'Inactive',
  availableAfter: 'Available after {time}',
  
  // Leave management
  markOnLeave: 'Mark as On Leave',
  markAvailable: 'Mark as Available',
  leaveMarked: 'Leave Status Updated',
  leaveMarkedMsg: 'Employee leave status has been updated',
  employeeOnLeave: 'Employee On Leave',
  employeeAvailable: 'Employee Available',
  employeeOnLeaveMsg: '{name} is now marked as on leave',
  employeeAvailableMsg: '{name} is now marked as available',
  
  // Validation
  nameRequired: 'Name is required',
  emailRequired: 'Email is required',
  emailInvalid: 'Please enter a valid email address',
  phoneRequired: 'Phone number is required',
  
  // Empty states
  noEmployees: 'No employees found',
  noEmployeesDescription: 'No employee records were found in the system.',
  
  // Table headers and actions
  viewNotes: 'View notes',
  
  // Additional status translations
  terminated: 'Terminated',
  
  // Form dialog
  addNewEmployee: 'Add New Employee',
  updateInfo: 'Update Information',
  createAccount: 'Create Account',
  fullName: 'Full Name',
  passwordRequirements: 'Password must be at least 6 characters',
  unexpectedError: 'An unexpected error occurred',
  creatingUserDescription: 'Creating user account...',
  userCreatedSuccessfully: 'User created successfully',
  userCreatedFallback: 'User created but email was not sent',
  userCreationFailed: 'User creation failed',
  notesPlaceholder: 'Add notes about the employee...',
  viewNotesOnly: 'View notes (read-only)',
  
  // Delete dialog
  deleteConfirm: 'Confirm Delete',
  deleteWarning: 'Are you sure you want to delete {name}? This action cannot be undone.',
  
  // Leave management
  markAvailableTitle: 'Mark as Available',
  markAvailableDescription: 'Do you want to mark {name} as available? What should happen to the existing note?',
  removeNote: 'Remove Note',
  keepNote: 'Keep Note',
  markOnLeaveTitle: 'Mark as On Leave',
  markOnLeaveDescription: 'Mark {name} as on leave. Please add a note with the reason.',
  
  // Roles
  administrator: 'Administrator',
  skadeleder: 'Damage Leader',
  servicemedarbejder: 'Service Employee',
  vikar: 'Substitute',
  
  // Responsible users
  noResponsibleUsersFound: 'No responsible users found',
  
  // Temporary users
  temporaryUser: 'Temporary User',
  isTemporary: 'Is Substitute',
  expiresAt: 'Expires',
  expirationDate: 'Expiration Date',
  temporaryUserNote: 'Substitutes expire automatically and are deleted after the expiration date',
  emailOptional: 'Email (optional for substitutes)',
  phoneOptional: 'Phone (optional for substitutes)',
  vikarExpiresOn: 'Substitute expires on {date}',
  vikarExpired: 'Substitute expired',
  
  // Creation method and error messages
  methodUsed: 'Method used',
  allMethodsFailed: 'All creation methods failed',
  directCreationFailed: 'Direct creation failed',
  edgeFunctionFailed: 'Edge function failed',
  createError: 'Creation error',
  userAlreadyExists: 'User already exists',
  invalidEmail: 'Invalid email format',
  networkError: 'Network error',
  rateLimitError: 'Too many attempts',
  vikarAutoRole: 'Substitutes are automatically assigned the "Substitute" role',
  expirationMustBeFuture: 'Expiration date must be in the future',
  expirationFarFuture: 'Warning: Expiration date is more than 6 months away. Consider a shorter period for temporary users.',
  validEmailRequired: 'Valid email address is required',
  autoRemovedUnavailable: 'The following employees were automatically removed because they became unavailable',
};

export default employees;
