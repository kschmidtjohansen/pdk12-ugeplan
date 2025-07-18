
const employees = {
  title: 'Medarbejdere',
  description: 'Administrer medarbejdere og deres tilgængelighed',
  
  // Basic employee information
  name: 'Navn',
  email: 'Email',
  phone: 'Telefon',
  role: 'Rolle',
  actions: 'Handlinger',
  jobTitle: 'Job titel',
  
  // Employee roles - STANDARDIZED: Use admin.roles instead
  administrator: 'Administrator',
  skadeleder: 'Skadeleder',
  servicemedarbejder: 'Servicemedarbejder',
  user: 'Bruger',
  
  // Employee status - STANDARDIZED SECTION
  available: 'Tilgængelig',
  unavailable: 'Ikke tilgængelig',
  onLeave: 'På orlov',
  onVacation: 'På ferie',
  availableAfter: 'Tilgængelig efter {time}',
  fullyBooked: 'Fuldt booket',
  status: 'Status', // This fixes the "employees.status = Status" issue
  
  // Status
  statusOptions: {
    available: 'Tilgængelig',
    unavailable: 'Ikke tilgængelig',
    partiallyAvailable: 'Delvis tilgængelig',
    onVacation: 'På ferie',
    onLeave: 'På orlov',
    fullyBooked: 'Fuldt booket',
    unknown: 'Ukendt status'
  },
  
  // Missing translation keys - ADD THESE
  addNewEmployee: 'Tilføj ny medarbejder',
  createAccount: 'Opret konto',
  fullName: 'Fulde navn',
  notes: 'Noter',
  password: 'Adgangskode',

  
  // Actions
  add: 'Tilføj medarbejder',
  addEmployee: 'Tilføj medarbejder',
  edit: 'Rediger medarbejder',
  delete: 'Slet medarbejder',
  markAvailable: 'Marker som tilgængelig',
  markOnLeave: 'Marker som på orlov',
  
  // Form fields
  firstName: 'Fornavn',
  lastName: 'Efternavn',
  emailAddress: 'Email adresse',
  phoneNumber: 'Telefonnummer',
  selectRole: 'Vælg rolle',
  selectEmployees: 'Vælg medarbejdere',
  selected: 'valgte medarbejdere',
  
  // Contact information
  contact: 'Kontaktinformationer',
  
  // Messages
  employeeAdded: 'Medarbejder tilføjet',
  employeeUpdated: 'Medarbejder opdateret',
  employeeDeleted: 'Medarbejder slettet',
  statusUpdated: 'Status opdateret',
  autoRemovedUnavailable: 'Automatisk fjernet utilgængelige medarbejdere',
  
  // Error messages
  addError: 'Fejl ved tilføjelse af medarbejder',
  updateError: 'Fejl ved opdatering af medarbejder',
  deleteError: 'Fejl ved sletning af medarbejder',
  fetchError: 'Fejl ved indlæsning af medarbejdere',
  
  // Confirmation dialogs
  deleteConfirm: 'Slet medarbejder',
  deleteWarning: 'Er du sikker på, at du vil slette denne medarbejder?',
  
  // Empty states
  noEmployees: 'Ingen medarbejdere fundet',
  noResponsibleUsersFound: 'Ingen sagsansvarlige fundet',
  addFirst: 'Tilføj din første medarbejder',
  
  // Validation
  nameRequired: 'Navn er påkrævet',
  emailRequired: 'Email er påkrævet',
  emailInvalid: 'Ugyldig email adresse',
  phoneRequired: 'Telefonnummer er påkrævet',
  roleRequired: 'Rolle er påkrævet',
  
  // Additional message translations
  employeeAddedMsg: 'Medarbejder {name} tilføjet med rolle {role}',
  employeeUpdateMsg: 'Medarbejder {name} blev opdateret',
  employeeDeletedMsg: 'Medarbejder {name} blev slettet',
  employeeOnLeave: 'Medarbejder sat på orlov',
  employeeAvailable: 'Medarbejder markeret som tilgængelig',
  employeeOnLeaveMsg: '{name} er nu på orlov',
  employeeAvailableMsg: '{name} er nu tilgængelig'
};

export default employees;
