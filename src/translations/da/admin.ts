
const admin = {
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
};

export default admin;
