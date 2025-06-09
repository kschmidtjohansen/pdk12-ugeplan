
const employees = {
  title: 'Employees',
  description: 'Manage employees and their access',
  addEmployee: 'Add Employee',
  editEmployee: 'Edit Employee',
  deleteEmployee: 'Delete Employee',
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
  
  // Confirmation dialogs
  deleteConfirmTitle: 'Delete Employee',
  deleteConfirmMessage: 'Are you sure you want to delete this employee? This action cannot be undone.',
  markLeaveTitle: 'Mark as on leave',
  markLeaveMessage: 'Mark this employee as being on leave?',
  markAvailableTitle: 'Mark as available',
  markAvailableMessage: 'Mark this employee as available again?'
};

export default employees;
