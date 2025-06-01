

const admin = {
  title: 'Admin Dashboard',
  description: 'System administration og indstillinger',
  tabs: {
    overview: 'System Oversigt',
    users: 'Brugeradministration'
  },
  systemOverview: {
    title: 'System Oversigt',
    description: 'Omfattende systemadministration og overvågning'
  },
  quickStats: {
    totalUsers: 'Brugere i alt',
    vehicles: 'Køretøjer',
    pendingVacations: 'Afventende Ferier',
    todaysTasks: 'Dagens Opgaver',
    active: 'aktive',
    available: 'tilgængelige',
    approved: 'godkendte',
    total: 'i alt'
  },
  systemHealth: {
    title: 'System Status',
    assignmentPublishing: 'Opgave Publicering',
    vehicleUtilization: 'Køretøjer',
    staffAvailability: 'Medarbejdere',
    allAssignmentsPublished: 'Alle opgaver publiceret',
    unpublishedTasks: '{count} upublicerede',
    vehiclesInUse: '{inUse}/{total} køretøjer i brug',
    staffAvailable: '{available}/{total} medarbejdere tilgængelige'
  },
  quickActions: {
    title: 'Hurtige Handlinger',
    viewPlanner: 'Ugeplan',
    manageStaff: 'Administrer Medarbejdere',
    fleetManagement: 'Administrer Biler',
    vacationRequests: 'Ferieansøgninger'
  },
  systemMetrics: {
    totalUsers: 'Antal Brugere',
    totalUsersDesc: '{count} aktive i dag',
    vehicles: 'Køretøjer',
    vehiclesDesc: '{count} i brug nu',
    vacationRequests: 'Ferieansøgninger',
    vacationRequestsDesc: 'afventer godkendelse',
    scheduledTasks: 'Planlagte Opgaver',
    scheduledTasksDesc: 'Opgaver for denne uge'
  },
  userManagement: {
    title: 'Brugeradministration',
    description: 'Administrer systembrugere og deres tilladelser',
    addUser: 'Tilføj Bruger',
    name: 'Navn',
    email: 'Email',
    role: 'Rolle',
    phone: 'Telefonnummer',
    position: 'Position',
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
    deleteWarning: 'Du er ved at slette {name}\'s konto. Denne handling kan ikke fortrydes.',
    createSuccess: 'Bruger oprettet succesfuldt',
    updateSuccess: 'Bruger opdateret succesfuldt',
    createError: 'Fejl ved oprettelse af bruger',
    updateError: 'Fejl ved opdatering af bruger'
  },
  passwords: {
    changePassword: 'Skift adgangskode',
    resetPasswordFor: 'Rediger adgangskode for denne medarbejder',
    enterNewPassword: 'Indtast ny adgangskode for denne medarbejder',
    newPassword: 'Ny adgangskode',
    confirmPassword: 'Bekræft adgangskode',
    resetPassword: 'Nulstil adgangskode',
    resetting: 'Nulstiller...',
    resetSuccess: 'Adgangskode nustillet',
    resetDescription: '{name}\'s adgangskode er nu nulstillet',
    resetError: 'Fejl. Kunne ikke nulstille adgangskoden. Prøv igen.',
    passwordMismatch: 'Adgangskoderne stemmer ikke overens',
    passwordMinLength: 'Adgangskoden skal være mindst 8 tegn lang',
    passwordChanged: 'Adgangskode ændret',
    passwordChangedMsg: 'Adgangskoden er blevet ændret.',
    passwordTooShort: 'Adgangskode for kort. Skal indeholde 6 tegn.'
  },
  roles: {
    administrator: 'Administrator',
    skadeleder: 'Skadeleder',
    servicemedarbejder: 'Servicemedarbejder'
  }
};

export default admin;

