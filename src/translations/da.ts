
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
    language: 'Sprog',
    actions: 'Handlinger'
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
    manageAssignments: 'Administrer Opgaver',
    assignments: {
      waterDamage: 'Vandskade inspektion',
      fireDamage: 'Brandskade restaurering',
      mold: 'Skimmelsvamp vurdering'
    },
    location: 'Lokation'
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'System administration og indstillinger',
    tabs: {
      metrics: 'System Metrikker',
      users: 'Brugeradministration'
    },
    systemMetrics: {
      totalUsers: 'Antal Brugere',
      totalUsersDesc: '5 aktive i dag',
      vehicles: 'Køretøjer',
      vehiclesDesc: '3 i brug nu',
      vacationRequests: 'Ferieansøgninger',
      vacationRequestsDesc: '2 afventer godkendelse'
    },
    userManagement: {
      title: 'Brugeradministration',
      description: 'Administrer systembrugere og deres tilladelser',
      addUser: 'Tilføj Bruger',
      name: 'Navn',
      email: 'Email',
      role: 'Rolle',
      actions: 'Handlinger',
      editUser: 'Rediger Bruger',
      addNewUser: 'Tilføj Ny Bruger',
      updateInfo: 'Opdater brugeroplysninger og tilladelser.',
      createAccount: 'Opret en ny brugerkonto.',
      fullName: 'Fulde Navn',
      selectRole: 'Vælg en rolle',
      userUpdated: 'Bruger opdateret',
      userAdded: 'Bruger tilføjet',
      userDeleted: 'Bruger slettet',
      userUpdateMsg: '{name}\'s oplysninger er blevet opdateret.',
      userAddedMsg: '{name} er blevet tilføjet som {role}.',
      userDeletedMsg: '{name}\'s konto er blevet fjernet.',
      deleteConfirm: 'Er du sikker?',
      deleteWarning: 'Du er ved at slette {name}\'s konto. Denne handling kan ikke fortrydes.'
    },
    roles: {
      administrator: 'Administrator',
      skadeleder: 'Skadeleder',
      servicemedarbejder: 'Servicemedarbejder'
    }
  },
  accessDenied: {
    title: 'Adgang Nægtet',
    message: 'Du skal være logget ind for at få adgang til denne side.'
  },
  cars: {
    title: 'Biler',
    description: 'Afdelingens køretøjer og deres detaljer',
    addVehicle: 'Tilføj Køretøj',
    vehicleName: 'Køretøjsnavn',
    carNumber: 'Bilnummer',
    numberPlate: 'Nummerplade',
    fuelCardCode: 'Brændstofkortkode',
    editVehicle: 'Rediger Køretøj',
    addNewVehicle: 'Tilføj Nyt Køretøj',
    updateVehicleInfo: 'Opdater køretøjsoplysninger.',
    addNewVehicleDesc: 'Tilføj et nyt køretøj til afdelingens flåde.',
    vehicleUpdated: 'Køretøj opdateret',
    vehicleAdded: 'Køretøj tilføjet',
    vehicleDeleted: 'Køretøj slettet',
    vehicleUpdatedMsg: '{name}\'s oplysninger er blevet opdateret.',
    vehicleAddedMsg: '{name} er blevet tilføjet til flåden.',
    vehicleDeletedMsg: '{name} er blevet fjernet fra flåden.'
  },
  deleteConfirm: {
    title: 'Er du helt sikker?',
    carWarning: 'Du er ved at slette {name} fra din køretøjsflåde. Denne handling kan ikke fortrydes.',
    cancel: 'Annuller',
    delete: 'Slet'
  }
};

export default translations;
