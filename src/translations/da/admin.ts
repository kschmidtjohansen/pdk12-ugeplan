
const admin = {
  title: "Administration",
  description: "Administrer brugere og systemindstillinger",
  systemOverview: {
    title: "Systemoversigt",
    description: "Oversigt over systemets tilstand og ydeevne"
  },
  tabs: {
    overview: "Oversigt",
    users: "Brugere",
    metrics: "Metrics"
  },
  systemMetrics: {
    totalUsers: "Totale brugere",
    totalUsersDesc: "{count} aktive i dag",
    vehicles: "Køretøjer",
    vehiclesDesc: "{count} i brug nu",
    vacationRequests: "Ferieansøgninger",
    vacationRequestsDesc: "afventer godkendelse",
    scheduledTasks: "Planlagte opgaver",
    scheduledTasksDesc: "Opgaver denne uge"
  },
  userManagement: {
    title: "Brugerstyring",
    description: "Administrer brugere, roller og tilladelser",
    addUser: "Tilføj Bruger",
    editUser: "Rediger Bruger",
    deleteUser: "Slet Bruger",
    addNewUser: "Tilføj ny bruger",
    updateInfo: "Opdater brugeroplysninger og tilladelser.",
    createAccount: "Opret en ny brugerkonto.",
    fullName: "Fulde navn",
    name: "Navn",
    email: "Email",
    role: "Rolle",
    phone: "Telefonnummer",
    position: "Stilling",
    actions: "Handlinger",
    selectRole: "Vælg en rolle",
    fetchError: "Fejl ved indlæsning af brugere",
    userAdded: "Bruger tilføjet",
    userUpdated: "Bruger opdateret",
    userDeleted: "Bruger slettet",
    userAddedMsg: "{name} blev tilføjet som {role}",
    userUpdateMsg: "{name}s oplysninger blev opdateret",
    createError: "Fejl ved oprettelse af bruger",
    updateError: "Fejl ved opdatering af bruger",
    deleteError: "Fejl ved sletning af bruger",
    deactivateUser: "Deaktiver Bruger",
    activateUser: "Aktiver Bruger",
    userDeactivated: "Bruger deaktiveret",
    userActivated: "Bruger aktiveret",
    userDeactivatedMsg: "{name} kan ikke længere logge ind",
    userActivatedMsg: "{name} kan nu logge ind igen",
    deactivateError: "Fejl ved deaktivering af bruger",
    activateError: "Fejl ved aktivering af bruger",
    confirmDeactivate: "Er du sikker på, at du vil deaktivere {name}?",
    confirmActivate: "Er du sikker på, at du vil aktivere {name}?",
    deactivateWarning: "Brugeren vil ikke kunne logge ind, indtil de aktiveres igen.",
    active: "Aktiv",
    inactive: "Inaktiv",
    deleteConfirm: "Er du sikker?",
    deleteWarning: "Du er ved at slette {name}s konto. Denne handling kan ikke fortrydes.",
    createSuccess: "Bruger oprettet med succes",
    updateSuccess: "Bruger opdateret med succes"
  },
  roles: {
    administrator: "Administrator",
    skadeleder: "Skadeleder",
    servicemedarbejder: "Servicemedarbejder"
  },
  passwords: {
    changePassword: "Skift adgangskode",
    resetPassword: "Nulstil Adgangskode",
    resetPasswordFor: "Nulstil adgangskode for denne medarbejder",
    enterNewPassword: "Indtast ny adgangskode for denne medarbejder",
    newPassword: "Ny adgangskode",
    confirmPassword: "Bekræft adgangskode",
    resetting: "Nulstiller...",
    resetSuccess: "Adgangskode nulstillet",
    resetDescription: "{name}s adgangskode er blevet nulstillet",
    resetError: "Fejl. Kunne ikke nulstille adgangskode. Prøv igen.",
    passwordMismatch: "Adgangskoder matcher ikke",
    passwordMinLength: "Adgangskoden skal være mindst 8 tegn lang",
    passwordChanged: "Adgangskode ændret",
    passwordChangedMsg: "Adgangskoden er blevet ændret.",
    passwordTooShort: "Adgangskoden er for kort. Skal indeholde 6 tegn.",
    passwordResetMsg: "En ny adgangskode er sendt til {email}"
  },
  quickStats: {
    totalUsers: "Medarbejdere",
    vehicles: "Køretøjer",
    pendingVacations: "Afventende ferier",
    todaysTasks: "Dagens opgaver",
    active: "aktive",
    available: "tilgængelige",
    approved: "godkendte",
    total: "i alt"
  },
  systemHealth: {
    title: "Systemstatus",
    assignmentPublishing: "Publicering",
    vehicleUtilization: "Køretøjer",
    staffAvailability: "Medarbejder Tilgængelighed",
    allAssignmentsPublished: "Alle opgaver er publiceret",
    unpublishedTasks: "{count} opgaver er ikke publiceret",
    vehiclesInUse: "{inUse} af {total} køretøjer er i brug",
    staffAvailable: "{available} af {total} medarbejdere er tilgængelige"
  },
  quickActions: {
    title: "Hurtige handlinger",
    viewPlanner: "Se ugeplan",
    manageStaff: "Administrer personale",
    fleetManagement: "Administrer biler",
    vacationRequests: "Ferieansøgninger"
  }
};

export default admin;
