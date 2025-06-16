
export const admin = {
  title: 'Administration',
  description: 'Systemadministration og indstillinger',
  tabs: {
    metrics: 'Metrikker',
    users: 'Brugerstyring',
    overview: 'Oversigt',
    diagnostics: 'Diagnostik',
    performance: 'Ydeevne',
    security: 'Sikkerhed',
    system: 'System'
  },
  dashboard: {
    title: 'Administrationspanel',
    description: 'Systemoversigt og hurtig adgang til administrative funktioner'
  },
  security: {
    title: 'Sikkerhedsovervågning',
    description: 'Overvåg sikkerhedshændelser og adgangslogfiler'
  },
  systemHealth: {
    title: 'Systemsundhed',
    description: 'Overvåg database- og applikationssundhed'
  },
  systemOverview: {
    description: 'Administrer systemet og overvåg nøglemetrikker'
  },
  systemMetrics: {
    totalUsers: 'Samlede brugere',
    totalUsersDesc: '{count} aktive i dag',
    vehicles: 'Køretøjer',
    vehiclesDesc: '{count} i brug nu',
    vacationRequests: 'Ansøgninger om fridage',
    vacationRequestsDesc: 'afventer godkendelse',
    scheduledTasks: 'Planlagte opgaver',
    scheduledTasksDesc: 'Opgaver denne uge'
  },
  quickStats: {
    vehicles: 'Køretøjer',
    available: 'tilgængelige',
    pendingVacations: 'Afventende ferier',
    approved: 'godkendt',
    todaysTasks: 'Dagens opgaver',
    total: 'total'
  },
  systemHealth: {
    title: 'Systemsundhed',
    assignmentPublishing: 'Opgavepublicering',
    allAssignmentsPublished: 'Alle opgaver er publiceret',
    unpublishedTasks: '{count} upublicerede opgaver',
    vehicleUtilization: 'Køretøjer',
    vehiclesInUse: '{inUse} af {total} køretøjer i brug',
    staffAvailability: 'Personale tilgængelighed',
    staffAvailable: '{available} af {total} medarbejdere tilgængelige'
  },
  quickActions: {
    title: 'Hurtige handlinger',
    viewPlanner: 'Se ugeplan',
    manageStaff: 'Administrer personale',
    fleetManagement: 'Biler',
    vacationRequests: 'Ansøgninger om fridage'
  },
  userManagement: {
    title: 'Brugerstyring',
    description: 'Administrer systembrugere og deres tilladelser',
    addUser: 'Tilføj bruger',
    name: 'Navn',
    email: 'Email',
    role: 'Rolle',
    phone: 'Telefonnummer',
    position: 'Stilling',
    actions: 'Handlinger',
    editUser: 'Rediger bruger',
    addNewUser: 'Tilføj ny bruger',
    updateInfo: 'Opdater brugerinformation og tilladelser.',
    createAccount: 'Opret en ny brugerkonto.',
    fullName: 'Fulde navn',
    selectRole: 'Vælg en rolle',
    userUpdated: 'Bruger opdateret',
    userAdded: 'Bruger tilføjet',
    userDeleted: 'Bruger slettet',
    userUpdateMsg: '{name}s information er blevet opdateret.',
    userAddedMsg: '{name} er blevet tilføjet som {role}.',
    userDeletedMsg: '{name}s konto er blevet fjernet.',
    deleteConfirm: 'Er du sikker?',
    deleteWarning: 'Du er ved at slette {name}s konto. Denne handling kan ikke fortrydes.',
    createSuccess: 'Bruger oprettet med succes',
    updateSuccess: 'Bruger opdateret med succes',
    createError: 'Fejl ved oprettelse af bruger',
    updateError: 'Fejl ved opdatering af bruger',
    deleteError: 'Fejl ved sletning af bruger',
    fetchError: 'Fejl ved indlæsning af brugere',
    confirmActivate: 'Aktiver {name}?',
    confirmDeactivate: 'Deaktiver {name}?',
    userActivatedMsg: '{name} er blevet aktiveret',
    userDeactivatedMsg: '{name} er blevet deaktiveret',
    userActivated: 'Bruger aktiveret',
    userDeactivated: 'Bruger deaktiveret',
    deactivateWarning: 'Dette vil forhindre brugeren i at få adgang til systemet.',
    activateUser: 'Aktiver bruger',
    deactivateUser: 'Deaktiver bruger',
    activateError: 'Fejl ved aktivering af bruger',
    deactivateError: 'Fejl ved deaktivering af bruger',
    inactive: 'inaktiv'
  },
  passwords: {
    changePassword: 'Skift adgangskode',
    resetPasswordFor: 'Nulstil adgangskode for denne medarbejder',
    enterNewPassword: 'Indtast ny adgangskode for denne medarbejder',
    newPassword: 'Ny adgangskode',
    confirmPassword: 'Bekræft adgangskode',
    resetPassword: 'Nulstil adgangskode',
    resetting: 'Nulstiller...',
    resetSuccess: 'Adgangskode nulstillet',
    resetDescription: '{name}s adgangskode er blevet nulstillet',
    resetError: 'Fejl. Kunne ikke nulstille adgangskode. Prøv igen.',
    passwordMismatch: 'Adgangskoder matcher ikke',
    passwordMinLength: 'Adgangskoden skal være mindst 8 tegn lang',
    passwordChanged: 'Adgangskode ændret',
    passwordChangedMsg: 'Adgangskoden er blevet ændret.',
    passwordTooShort: 'Adgangskode for kort. Skal indeholde 6 tegn.',
    passwordsMustMatch: 'Adgangskoder skal være ens'
  },
  roles: {
    administrator: 'Administrator',
    skadeleder: 'Skadeleder',
    servicemedarbejder: 'Servicemedarbejder'
  }
};
