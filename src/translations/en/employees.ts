
const employees = {
  title: 'Employees',
  description: 'Manage employees and their availability',
  
  // Basic employee information
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  role: 'Role',
  actions: 'Actions',
  jobTitle: 'Job Title',
  
  // Employee roles - STANDARDIZED: Use admin.roles instead
  administrator: 'Administrator',
  skadeleder: 'Damage Manager',
  servicemedarbejder: 'Service Employee',
  user: 'User',
  
  // Employee status - STANDARDIZED SECTION
  available: 'Available',
  unavailable: 'Unavailable',
  onLeave: 'On Leave',
  onVacation: 'On Vacation',
  availableAfter: 'Available after {time}',
  fullyBooked: 'Fully Booked',
  
  // Missing translation keys - ADD THESE
  addNewEmployee: 'Add New Employee',
  createAccount: 'Create Account',
  fullName: 'Full Name',
  notes: 'Notes',
  password: 'Password',

  // Additional status translations
  status: {
    available: 'Available',
    unavailable: 'Unavailable',
    partiallyAvailable: 'Partially available',
    onVacation: 'On vacation',
    onLeave: 'On leave',
    fullyBooked: 'Fully booked',
    unknown: 'Unknown status'
  },
  
  // Actions
  add: 'Add Employee',
  addEmployee: 'Add Employee',
  edit: 'Edit Employee',
  delete: 'Delete Employee',
  markAvailable: 'Mark Available',
  markOnLeave: 'Mark On Leave',
  
  // Form fields
  firstName: 'First Name',
  lastName: 'Last Name',
  emailAddress: 'Email Address',
  phoneNumber: 'Phone Number',
  selectRole: 'Select Role',
  selectEmployees: 'Select Employees',
  selected: 'selected employees',
  
  // Contact information
  contact: 'Contact Information',
  
  // Messages
  employeeAdded: 'Employee added',
  employeeUpdated: 'Employee updated',
  employeeDeleted: 'Employee deleted',
  statusUpdated: 'Status updated',
  autoRemovedUnavailable: 'Automatically removed unavailable employees',
  
  // Error messages
  addError: 'Error adding employee',
  updateError: 'Error updating employee',
  deleteError: 'Error deleting employee',
  fetchError: 'Error loading employees',
  
  // Confirmation dialogs
  deleteConfirm: 'Delete Employee',
  deleteWarning: 'Are you sure you want to delete this employee?',
  
  // Empty states
  noEmployees: 'No employees found',
  noResponsibleUsersFound: 'No responsible users found',
  addFirst: 'Add your first employee',
  
  // Validation
  nameRequired: 'Name is required',
  emailRequired: 'Email is required',
  emailInvalid: 'Invalid email address',
  phoneRequired: 'Phone number is required',
  roleRequired: 'Role is required',
  
  // Additional message translations
  employeeAddedMsg: 'Employee {name} added with role {role}',
  employeeUpdateMsg: 'Employee {name} was updated',
  employeeDeletedMsg: 'Employee {name} was deleted',
  employeeOnLeave: 'Employee set on leave',
  employeeAvailable: 'Employee marked as available',
  employeeOnLeaveMsg: '{name} is now on leave',
  employeeAvailableMsg: '{name} is now available'
};

export default employees;
