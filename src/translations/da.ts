
const translations = {
  common: {
    login: 'Log ind',
    logout: 'Log ud',
    email: 'Email',
    password: 'Adgangskode',
    submit: 'Indsend',
    cancel: 'Annuller',
    save: 'Gem',
    delete: 'Slet',
    edit: 'Rediger',
    add: 'Tilføj',
    search: 'Søg',
    loading: 'Indlæser...',
    success: 'Succes',
    error: 'Fejl',
    yes: 'Ja',
    no: 'Nej',
    language: 'Sprog'
  },
  login: {
    title: 'Log ind',
    description: 'Indtast dine oplysninger for at få adgang til planlæggeren',
    emailPlaceholder: 'din.email@polygon.com',
    passwordPlaceholder: '••••••••',
    button: 'Log ind',
    buttonLoading: 'Logger ind...',
    failed: 'Ugyldig email eller adgangskode. Prøv igen.',
    success: 'Login succesfuldt',
    welcomeMessage: 'Velkommen til Polygon Ugeplanner',
    internalSystem: 'Internt Planlægningssystem',
    testCredentials: 'Til test, brug følgende oplysninger:'
  },
  navigation: {
    dashboard: 'Dashboard',
    planner: 'Ugeplanlægger',
    employees: 'Medarbejdere',
    cars: 'Biler',
    vacation: 'Ferie',
    admin: 'Admin'
  },
  dashboard: {
    welcome: 'Velkommen, {name}',
    today: 'I dag er {date}, Uge {week}',
    quickAccess: {
      planner: {
        title: 'Ugeplanlægger',
        description: 'Se og administrer ugentlige opgaver'
      },
      vacation: {
        title: 'Ferie',
        description: 'Ansøg om eller administrer ferietid'
      },
      employees: {
        title: 'Medarbejdere',
        description: 'Administrer afdelingens medarbejdere'
      },
      cars: {
        title: 'Biler',
        description: 'Se og administrer afdelingens køretøjer'
      }
    },
    weekAssignments: 'Uge {week} Opgaver',
    viewAll: 'Se alle',
    noAssignments: 'Ingen opgaver for denne uge',
    assignmentTime: '{fromTime} - {toTime}',
    manageAssignments: 'Administrer Opgaver'
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'System administration og indstillinger',
    tabs: {
      metrics: 'System Metrikker',
      users: 'Brugeradministration'
    }
  },
  accessDenied: {
    title: 'Adgang Nægtet',
    message: 'Du skal være logget ind for at få adgang til denne side.'
  }
};

export default translations;
