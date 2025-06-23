
const employees = {
  title: 'Employees',
  description: 'Manage employees and their access',
  addEmployee: 'Add Employee',
  editEmployee: 'Edit Employee',
  deleteEmployee: 'Delete Employee',
  addNewEmployee: 'Add New Employee',
  updateInfo: 'Update employee information and access.',
  createAccount: 'Create a new employee account.',
  fullName: 'Full Name',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  jobTitle: 'Job Title',
  role: 'Role',
  status: 'Status',
  onLeave: 'On Leave',
  available: 'Available',
  notes: 'Notes',
  actions: 'Actions',
  noEmployees: 'No employees found',
  fetchError: 'Error loading employees',
  updateError: 'Error updating employee',
  deleteError: 'Error deleting employee',
  createError: 'Error creating employee',
  
  // RLS and database access errors
  rlsError: 'An access error occurred while loading employees. This has been reported and will be fixed as soon as possible.',
  rlsErrorTitle: 'Access Error',
  rlsErrorDescription: 'An access error occurred while loading employees. This has been reported and will be fixed as soon as possible.',
  permissionErrorTitle: 'No Permission',
  permissionErrorDescription: 'You do not have permission to view employees. Contact your administrator.',
  generalErrorTitle: 'Loading Error',
  generalErrorDescription: 'An error occurred while loading employee data. Please try again.',
  
  // Success messages
  employeeCreated: 'Employee created',
  employeeUpdated: 'Employee updated',
  employeeDeleted: 'Employee deleted',
  employeeAdded: 'Employee added',
  employeeAddedMsg: '{name} has been added as {role}',
  
  // Confirmation dialogs
  deleteConfirm: 'Delete Employee',
  deleteConfirmTitle: 'Delete Employee',
  deleteConfirmMessage: 'Are you sure you want to delete this employee? This action cannot be undone.',
  deleteWarning: 'Are you sure you want to delete {name}? This action cannot be undone.',
  markLeaveTitle: 'Mark as on leave',
  markLeaveMessage: 'Mark this employee as being on leave?',
  markAvailableTitle: 'Mark as available',
  markAvailableMessage: 'Mark this employee as available again?',
  markOnLeaveTitle: 'Mark On Leave',
  markOnLeaveDescription: 'Mark {name} as on leave?',
  markAvailableDescription: 'Mark {name} as available again?',
  
  // Notes and actions
  notesPlaceholder: 'Add notes about this employee...',
  viewNotes: 'View notes',
  viewNotesOnly: 'You can view notes but cannot edit them.',
  markOnLeave: 'Mark on leave',
  markAvailable: 'Mark available',
  removeNote: 'Remove note and mark available',
  keepNote: 'Keep note and mark available',
  
  // User creation process
  creatingUser: 'Creating user account',
  creatingUserDescription: 'Trying multiple methods to ensure success',
  userCreatedSuccessfully: 'User created successfully using server function',
  userCreatedFallback: 'Server function unavailable. User created using direct database access',
  userCreationFailed: 'User creation failed. Please check the error message below',
  
  // Connection and network status
  connectionStatus: 'Connection Status',
  tryingMultipleMethods: 'Trying multiple methods to ensure success',
  serverFunctionUnavailable: 'Server function unavailable',
  usingDirectDatabase: 'Using direct database access',
  
  // Validation errors
  emailRequired: 'Email is required',
  passwordRequired: 'Password is required',
  nameRequired: 'Name is required',
  validEmailRequired: 'Please provide a valid email address',
  userAlreadyExists: 'A user with this email already exists',
  invalidEmail: 'Please enter a valid email address',
  passwordRequirements: 'Password does not meet requirements (8+ chars, uppercase, lowercase, number)',
  networkError: 'Network error: Unable to connect to server',
  rateLimitError: 'Too many requests. Please wait a moment and try again',
  
  // Method-specific messages
  edgeFunctionFailed: 'Edge function failed',
  directCreationFailed: 'Direct creation also failed',
  allMethodsFailed: 'All creation methods failed',
  methodUsed: 'Method used',
  
  // Generic error handling
  unexpectedError: 'An unexpected error occurred',
  tryAgainLater: 'Please try again later',
  contactSupport: 'Contact support if the problem persists'
};

export default employees;
