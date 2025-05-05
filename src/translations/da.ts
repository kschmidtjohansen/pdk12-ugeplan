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
    description: 'Indtast dine oplysninger for at få adgang til ugeplanen',
    emailPlaceholder: 'din.email@polygongroup.com',
    passwordPlaceholder: '••••••••',
    button: 'Log ind',
    buttonLoading: 'Logger ind...',
    failed: 'Ugyldig email eller adgangskode. Prøv igen.',
    success: 'Login succesfuldt',
    welcomeMessage: 'Velkommen til Polygon Ugeplan',
    internalSystem: 'Afdeling 12 - Trekantsområdet',
    testCredentials: 'Til test, brug følgende oplysninger:'
  },
  navigation: {
    dashboard: 'Dashboard',
    planner: 'Ugeplan',
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
        title: 'Ugeplan',
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
    weekAssignments: 'Opgaver - Uge {week}',
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
    weekDescription: 'Uge {week} - Opgaver',
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
    pageDescription: 'Ansøg om og se informationer om Fridage.',
    applyForVacation: 'Ansøg om en fridag',
    tabs: {
      all: 'Alle',
      pending: 'Afventer',
      approved: 'Godkendt',
      mine: 'Mine Ansøgninger'
    },
    noRequests: 'Ingen ansøgninger om fridage fundet',
    status: {
      pending: 'Afventer',
      approved: 'Godkendt',
      rejected: 'Afvist'
    },
    dateRange: 'Datointerval',
    reason: 'Årsag',
    notes: 'Noter',
    requestedOn: 'Ansøgt',
    reject: 'Afvis',
    approve: 'Godkend',
    selectDatesAndReason: 'Vælg dine datoer og angiv en årsag.',
    selectVacationDates: 'Vælg datoer',
    reasonPlaceholder: 'Kort beskrivelse af din ansøgninger om fridag.',
    submitRequest: 'Indsend Ansøgning',
    rejectRequest: 'Afvis Ansøgning',
    approveRequest: 'Godkend Ansøgning',
    rejectReasonDesc: 'Angiv venligst en årsag til afvisning af denne ansøgning.',
    approveNoteDesc: 'Du kan tilføje en valgfri note til denne godkendelse.',
    rejectionReason: 'Årsag til afvisning',
    noteOptional: 'Note (valgfri)',
    rejectionReasonPlaceholder: 'Forklar, hvorfor denne ansøgning afvises',
    approveNotePlaceholder: 'Tilføj eventuelle yderligere noter til denne godkendelse',
    rejectRequestBtn: 'Afvis ansøgning',
    approveRequestBtn: 'Godkend ansøgning',
    missingDates: 'Manglende datoer',
    selectBothDates: 'Vælg venligst både start- og slutdato',
    requestSubmitted: 'Ansøgning om fridag indsendt',
    requestSent: 'Din ansøgning er sendt til godkendelse.',
    requestRejected: 'Ansøgning om fridag afvist',
    requestApproved: 'Ansøgning om fridag godkendt',
    requestRejectedMsg: '{name}\'s ansøgning er blevet afvist.',
    requestApprovedMsg: '{name}\'s ansøgning er blevet godkendt.'
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'System administration og indstillinger',
    tabs: {
      metrics: 'Metrikker',
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
    newVacationRequest: 'Ny ansøgning om fridag',
    newVacationRequestMsg: '{name} har ansøgt om fri fra {from} til {to}'
  },
  accessDenied: {
    title: 'Adgang Nægtet',
    message: 'Du skal være logget ind for at få adgang til denne side.'
  },
  cars: {
    title: 'Biler',
    description: 'Afdelingens køretøjer og detaljer',
    addVehicle: 'Tilføj Køretøj',
    vehicleName: 'Køretøjsnavn',
    carNumber: 'Bilnummer',
    numberPlate: 'Nummerplade',
    fuelCardCode: 'Tankkort kode',
    editVehicle: 'Rediger Køretøj',
    addNewVehicle: 'Tilføj Nyt Køretøj',
    updateVehicleInfo: 'Opdater køretøjsoplysninger.',
    addNewVehicleDesc: 'Tilføj et nyt køretøj til afdelingen.',
    vehicleUpdated: 'Køretøj opdateret',
    vehicleAdded: 'Køretøj tilføjet',
    vehicleDeleted: 'Køretøj slettet',
    vehicleUpdatedMsg: '{name}\'s oplysninger er blevet opdateret.',
    vehicleAddedMsg: '{name} er blevet tilføjet til afdelingen.',
    vehicleDeletedMsg: '{name} er blevet fjernet fra afdelingen.'
  },
  deleteConfirm: {
    title: 'Er du helt sikker?',
    carWarning: 'Du er ved at slette {name} fra din afdelingen. Denne handling kan ikke fortrydes.',
    cancel: 'Annuller',
    delete: 'Slet'
  },
  employees: {
    title: 'Medarbejdere',
    description: 'Afdelingens medarbejdere og deres roller',
    addEmployee: 'Tilføj Medarbejder',
    name: 'Navn',
    email: 'Email',
    phone: 'Telefon',
    jobTitle: 'Stilling',
    role: 'Rolle',
    actions: 'Handlinger',
    contactInfo: 'Kontaktoplysninger',
    editEmployee: 'Rediger Medarbejder',
    addNewEmployee: 'Tilføj Ny Medarbejder',
    updateInfo: 'Opdater medarbejderoplysninger.',
    createAccount: 'Tilføj en ny medarbejder til afdelingen.',
    fullName: 'Fulde Navn',
    employeeUpdated: 'Medarbejder opdateret',
    employeeAdded: 'Medarbejder tilføjet',
    employeeDeleted: 'Medarbejder slettet',
    employeeUpdatedMsg: '{name}\'s oplysninger er blevet opdateret.',
    employeeAddedMsg: '{name} er blevet tilføjet til afdelingen.',
    employeeDeletedMsg: '{name}\'s konto er blevet fjernet.',
    deleteConfirm: 'Er du sikker?',
    deleteWarning: 'Du er ved at slette {name}\'s konto. Denne handling kan ikke fortrydes.'
  }
};

export default translations;
