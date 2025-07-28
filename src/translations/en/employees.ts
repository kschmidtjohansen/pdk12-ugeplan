
const employees = {
  title: 'Employees',
  description: 'Manage employees and their roles',
  
  // Form fields
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  jobTitle: 'Job Title',
  role: 'Role',
  status: 'Status',
  notes: 'Notes',
  contact: 'Contact',
  avatar: 'Avatar',
  
  // Status translations
  'status.available': 'Available',
  'status.onVacation': 'On vacation',
  'status.unavailable': 'Unavailable',
  'status.onLeave': 'On Leave',
  'status.unknown': 'Unknown',
  
  // Actions
  addEmployee: 'Add Employee',
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
  onLeave: 'On Leave',
  available: 'Available',
  fullyBooked: 'Fully Booked',
  availableAfter: 'Available after {time}',
  
  // Leave management
  markOnLeave: 'Mark as On Leave',
  markAvailable: 'Mark as Available',
  leaveMarked: 'Leave Status Updated',
  leaveMarkedMsg: 'Employee leave status has been updated',
  
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
};

export default employees;
