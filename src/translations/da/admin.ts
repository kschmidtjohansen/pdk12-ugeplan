
const admin = {
  title: "Administration",
  description: "Administrer brugere og systemindstillinger",
  systemOverview: {
    title: "Systemoversigt",
    description: "Oversigt over systemets tilstand og ydeevne"
  },
  tabs: {
    overview: "Oversigt",
    users: "Brugere"
  },
  userManagement: {
    title: "Brugerstyring",
    description: "Administrer brugere, roller og tilladelser",
    addUser: "Tilføj Bruger",
    editUser: "Rediger Bruger",
    deleteUser: "Slet Bruger",
    name: "Navn",
    email: "Email",
    role: "Rolle",
    actions: "Handlinger",
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
    inactive: "Inaktiv"
  },
  roles: {
    administrator: "Administrator",
    skadeleder: "Skadeleder",
    servicemedarbejder: "Servicemedarbejder"
  },
  passwords: {
    resetPassword: "Nulstil Adgangskode",
    resetPasswordFor: "Nulstil adgangskode for {name}",
    passwordReset: "Adgangskode nulstillet",
    passwordResetMsg: "En ny adgangskode er sendt til {email}",
    resetError: "Fejl ved nulstilling af adgangskode"
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
