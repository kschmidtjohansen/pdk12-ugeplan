
const admin = {
  title: 'Admin Dashboard',
  description: 'Systemadministration og indstillinger',
  tabs: {
    metrics: 'Statistik',
    users: 'Brugeradministration'
  },
  systemMetrics: {
    totalUsers: 'Antal brugere',
    totalUsersDesc: '5 aktive i dag',
    vehicles: 'Køretøjer',
    vehiclesDesc: '3 i brug nu',
    vacationRequests: 'Ferieansøgninger',
    vacationRequestsDesc: '2 afventer godkendelse',
    scheduledTasks: 'Planlagte opgaver',
    scheduledTasksDesc: 'Opgaver for denne uge'
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
  passwords: {
    resetPasswordFor: 'Nulstil adgangskode for {name}',
    enterNewPassword: 'Indtast en ny adgangskode for denne bruger.',
    newPassword: 'Ny adgangskode',
    confirmPassword: 'Bekræft adgangskode',
    resetPassword: 'Nulstil adgangskode',
    resetting: 'Nulstiller...',
    resetSuccess: 'Adgangskode nulstillet',
    resetDescription: '{name}\'s adgangskode er blevet nulstillet.',
    resetError: 'Kunne ikke nulstille adgangskoden. Prøv igen.',
    passwordsMustMatch: 'Adgangskoderne skal være ens.',
    passwordTooShort: 'Adgangskoden skal være mindst 6 tegn.'
  },
  roles: {
    administrator: 'Administrator',
    skadeleder: 'Skadeleder',
    servicemedarbejder: 'Servicemedarbejder'
  }
};

export default admin;
