const translations = {
  common: {
    login: 'Login',
    logout: 'Log out',
    email: 'Email',
    password: 'Password',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    yes: 'Yes',
    no: 'No',
    language: 'Language',
    actions: 'Actions'
  },
  login: {
    title: 'Login',
    description: 'Enter your credentials to access the planner',
    emailPlaceholder: 'your.email@polygon.com',
    passwordPlaceholder: '••••••••',
    button: 'Log in',
    buttonLoading: 'Logging in...',
    failed: 'Invalid email or password. Please try again.',
    success: 'Login successful',
    welcomeMessage: 'Welcome to Polygon Weekly Compass',
    internalSystem: 'Internal Planning System',
    testCredentials: 'For testing, use the following credentials:'
  },
  navigation: {
    dashboard: 'Dashboard',
    planner: 'Weekly Planner',
    employees: 'Employees',
    cars: 'Cars',
    vacation: 'Vacation',
    admin: 'Admin'
  },
  dashboard: {
    welcome: 'Welcome, {name}',
    today: 'Today is {date}, Week {week}',
    quickAccess: {
      planner: {
        title: 'Weekly Planner',
        description: 'View and manage weekly assignments'
      },
      vacation: {
        title: 'Vacation',
        description: 'Apply for or manage vacation time'
      },
      employees: {
        title: 'Employees',
        description: 'Manage department employees'
      },
      cars: {
        title: 'Cars',
        description: 'View and manage department vehicles'
      }
    },
    weekAssignments: 'Week {week} Assignments',
    viewAll: 'View All',
    noAssignments: 'No assignments for this week',
    assignmentTime: '{fromTime} - {toTime}',
    manageAssignments: 'Manage Assignments',
    assignments: {
      waterDamage: 'Water damage inspection',
      fireDamage: 'Fire damage restoration',
      mold: 'Mold assessment'
    },
    location: 'Location'
  },
  planner: {
    weekDescription: 'Week {week} Plan and Tasks',
    newAssignment: 'New Assignment',
    editAssignment: 'Edit Assignment',
    createFirstAssignment: 'Create First Assignment',
    noAssignments: 'No assignments planned',
    updateDetails: 'Update details for this assignment',
    addAssignment: 'Add a new assignment to the weekly plan',
    assignmentTitle: 'Assignment Title',
    description: 'Description',
    date: 'Date',
    from: 'From',
    to: 'To',
    location: 'Location',
    car: 'Car',
    employees: 'Employees',
    selectCar: 'Select a car',
    selectEmployee: 'Select an employee',
    selectAtLeastOneEmployee: 'Select at least one employee',
    saveChanges: 'Save Changes',
    createAssignment: 'Create Assignment',
    assignmentUpdated: 'Assignment updated',
    assignmentCreated: 'Assignment created',
    assignmentUpdatedMsg: '{title} has been updated.',
    assignmentCreatedMsg: '{title} has been added to the plan.',
    onVacation: 'On Vacation'
  },
  vacation: {
    pageDescription: 'Apply for and manage vacation time',
    applyForVacation: 'Apply for Vacation',
    tabs: {
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      mine: 'My Requests'
    },
    noRequests: 'No vacation requests found',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    },
    dateRange: 'Date Range',
    reason: 'Reason',
    notes: 'Notes',
    requestedOn: 'Requested on',
    reject: 'Reject',
    approve: 'Approve',
    selectDatesAndReason: 'Select your vacation dates and provide a reason.',
    selectVacationDates: 'Select vacation dates',
    reasonPlaceholder: 'Brief reason for your vacation request',
    submitRequest: 'Submit Request',
    rejectRequest: 'Reject Vacation Request',
    approveRequest: 'Approve Vacation Request',
    rejectReasonDesc: 'Please provide a reason for rejecting this request.',
    approveNoteDesc: 'You can add an optional note to this approval.',
    rejectionReason: 'Reason for rejection',
    noteOptional: 'Note (optional)',
    rejectionReasonPlaceholder: 'Explain why this request is being rejected',
    approveNotePlaceholder: 'Add any additional notes to this approval',
    rejectRequestBtn: 'Reject Request',
    approveRequestBtn: 'Approve Request',
    missingDates: 'Missing dates',
    selectBothDates: 'Please select both start and end dates',
    requestSubmitted: 'Vacation request submitted',
    requestSent: 'Your request has been sent for approval.',
    requestRejected: 'Vacation request rejected',
    requestApproved: 'Vacation request approved',
    requestRejectedMsg: '{name}\'s request has been rejected.',
    requestApprovedMsg: '{name}\'s request has been approved.'
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'System management and settings',
    tabs: {
      metrics: 'System Metrics',
      users: 'User Management'
    },
    systemMetrics: {
      totalUsers: 'Total Users',
      totalUsersDesc: '5 active today',
      vehicles: 'Vehicles',
      vehiclesDesc: '3 in use now',
      vacationRequests: 'Vacation Requests',
      vacationRequestsDesc: '2 pending approval'
    },
    userManagement: {
      title: 'User Management',
      description: 'Manage system users and their permissions',
      addUser: 'Add User',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      actions: 'Actions',
      editUser: 'Edit User',
      addNewUser: 'Add New User',
      updateInfo: 'Update user information and permissions.',
      createAccount: 'Create a new user account.',
      fullName: 'Full Name',
      selectRole: 'Select a role',
      userUpdated: 'User updated',
      userAdded: 'User added',
      userDeleted: 'User deleted',
      userUpdateMsg: '{name}\'s information has been updated.',
      userAddedMsg: '{name} has been added as {role}.',
      userDeletedMsg: '{name}\'s account has been removed.',
      deleteConfirm: 'Are you sure?',
      deleteWarning: 'You are about to delete {name}\'s account. This action cannot be undone.'
    },
    roles: {
      administrator: 'Administrator',
      skadeleder: 'Damage Manager',
      servicemedarbejder: 'Service Employee'
    }
  },
  notifications: {
    title: 'Notifications',
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications',
    viewAll: 'View all',
    newVacationRequest: 'New vacation request',
    newVacationRequestMsg: '{name} has requested vacation from {from} to {to}'
  },
  accessDenied: {
    title: 'Access Denied',
    message: 'You need to log in to access this page.'
  },
  cars: {
    title: 'Cars',
    description: 'Department vehicles and their details',
    addVehicle: 'Add Vehicle',
    vehicleName: 'Vehicle Name',
    carNumber: 'Car Number',
    numberPlate: 'Number Plate',
    fuelCardCode: 'Fuel Card Code',
    editVehicle: 'Edit Vehicle',
    addNewVehicle: 'Add New Vehicle',
    updateVehicleInfo: 'Update vehicle information.',
    addNewVehicleDesc: 'Add a new vehicle to the department fleet.',
    vehicleUpdated: 'Vehicle updated',
    vehicleAdded: 'Vehicle added',
    vehicleDeleted: 'Vehicle deleted',
    vehicleUpdatedMsg: '{name}\'s information has been updated.',
    vehicleAddedMsg: '{name} has been added to the fleet.',
    vehicleDeletedMsg: '{name} has been removed from the fleet.'
  },
  deleteConfirm: {
    title: 'Are you absolutely sure?',
    carWarning: 'You are about to delete {name} from your vehicle fleet. This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete'
  },
  employees: {
    title: 'Employees',
    description: 'Department employees and their roles',
    addEmployee: 'Add Employee',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    jobTitle: 'Job Title',
    role: 'Role',
    actions: 'Actions',
    contactInfo: 'Contact Information',
    editEmployee: 'Edit Employee',
    addNewEmployee: 'Add New Employee',
    updateInfo: 'Update employee information.',
    createAccount: 'Add a new employee to the department.',
    fullName: 'Full Name',
    employeeUpdated: 'Employee updated',
    employeeAdded: 'Employee added',
    employeeUpdatedMsg: '{name}\'s information has been updated.',
    employeeAddedMsg: '{name} has been added to the department.'
  }
};

export default translations;
