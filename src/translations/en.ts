
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
    language: 'Language'
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
    manageAssignments: 'Manage Assignments'
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'System management and settings',
    tabs: {
      metrics: 'System Metrics',
      users: 'User Management'
    }
  },
  accessDenied: {
    title: 'Access Denied',
    message: 'You need to log in to access this page.'
  }
};

export default translations;
