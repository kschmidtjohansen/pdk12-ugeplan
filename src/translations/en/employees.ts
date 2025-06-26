
const employees = {
  title: 'Employees',
  description: 'Manage employees and their availability',
  
  // Basic employee information
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  role: 'Role',
  status: 'Status',
  actions: 'Actions',
  jobTitle: 'Job Title',
  
  // Employee roles
  administrator: 'Administrator',
  user: 'User',
  
  // Employee status
  available: 'Available',
  unavailable: 'Unavailable',
  onLeave: 'On Leave',
  onVacation: 'On Vacation',
  availableAfter: 'Available after {time}',
  
  // Actions
  add: 'Add Employee',
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
  
  // Contact information
  contact: 'Contact Information',
  
  // Messages
  employeeAdded: 'Employee added',
  employeeUpdated: 'Employee updated',
  employeeDeleted: 'Employee deleted',
  statusUpdated: 'Status updated',
  
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
  addFirst: 'Add your first employee',
  
  // Validation
  nameRequired: 'Name is required',
  emailRequired: 'Email is required',
  emailInvalid: 'Invalid email address',
  phoneRequired: 'Phone number is required',
  roleRequired: 'Role is required'
};

export default employees;
