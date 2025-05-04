
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
  planner: {
    weekDescription: 'Uge {week} Plan og Opgaver',
    newAssignment: 'Ny Opgave',
    editAssignment: 'Rediger Opgave',
    createFirstAssignment: 'Opret Første Opgave',
    noAssignments: 'Ingen opgaver planlagt',
    updateDetails: 'Opdater detaljer for denne opgave',
    addAssignment: 'Tilføj en ny opgave til ugeplanen',
    assignmentTitle: 'Opgavetitel',
    description: 'Beskrivelse',
    date: 'Dato',
    from: 'Fra',
    to: 'Til',
    location: 'Lokation',
    car: 'Bil',
    employees: 'Medarbejdere',
    selectCar: 'Vælg en bil',
    selectEmployee: 'Vælg en medarbejder',
    selectAtLeastOneEmployee: 'Vælg mindst én medarbejder',
    saveChanges: 'Gem Ændringer',
    createAssignment: 'Opret Opgave',
    assignmentUpdated: 'Opgave opdateret',
    assignmentCreated: 'Opgave oprettet',
    assignmentUpdatedMsg: '{title} er blevet opdateret.',
    assignmentCreatedMsg: '{title} er blevet tilføjet til planen.'
  },
  vacation: {
    pageDescription: 'Ansøg om og administrer ferietid',
    applyForVacation: 'Ansøg om Ferie',
    tabs: {
      all: 'Alle',
      pending: 'Afventer',
      approved: 'Godkendt',
      mine: 'Mine Anmodninger'
    },
    noRequests: 'Ingen ferieanmodninger fundet',
    status: {
      pending: 'Afventer',
      approved: 'Godkendt',
      rejected: 'Afvist'
    },
    dateRange: 'Datointerval',
    reason: 'Årsag',
    notes: 'Noter',
    requestedOn: 'Anmodet den',
    reject: 'Afvis',
    approve: 'Godkend',
    selectDatesAndReason: 'Vælg dine feriedatoer og angiv en årsag.',
    selectVacationDates: 'Vælg feriedatoer',
    reasonPlaceholder: 'Kort beskrivelse af din ferieansøgning',
    submitRequest: 'Indsend Anmodning',
    rejectRequest: 'Afvis Ferieanmodning',
    approveRequest: 'Godkend Ferieanmodning',
    rejectReasonDesc: 'Angiv venligst en årsag til afvisning af denne anmodning.',
    approveNoteDesc: 'Du kan tilføje en valgfri note til denne godkendelse.',
    rejectionReason: 'Årsag til afvisning',
    noteOptional: 'Note (valgfri)',
    rejectionReasonPlaceholder: 'Forklar, hvorfor denne anmodning afvises',
    approveNotePlaceholder: 'Tilføj eventuelle yderligere noter til denne godkendelse',
    rejectRequestBtn: 'Afvis Anmodning',
    approveRequestBtn: 'Godkend Anmodning',
    missingDates: 'Manglende datoer',
    selectBothDates: 'Vælg venligst både start- og slutdato',
    requestSubmitted: 'Ferieanmodning indsendt',
    requestSent: 'Din anmodning er sendt til godkendelse.',
    requestRejected: 'Ferieanmodning afvist',
    requestApproved: 'Ferieanmodning godkendt',
    requestRejectedMsg: '{name}\'s anmodning er blevet afvist.',
    requestApprovedMsg: '{name}\'s anmodning er blevet godkendt.'
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
  notifications: {
    title: 'Notifikationer',
    markAllAsRead: 'Marker alle som læst',
    noNotifications: 'Ingen notifikationer',
    viewAll: 'Se alle',
    newVacationRequest: 'Ny ferieansøgning',
    newVacationRequestMsg: '{name} har ansøgt om ferie fra {from} til {to}'
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
