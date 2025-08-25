
const employees = {
  title: 'Medarbejdere',
  description: 'Administrer medarbejdere og deres roller',
  
  // Form fields
  name: 'Navn',
  email: 'Email',
  phone: 'Telefon',
  selected: 'valgte',
  jobTitle: 'Stilling',
  role: 'Rolle',
  statusLabel: 'Status',
  notes: 'Noter',
  contact: 'Kontakt',
  avatar: 'Profilbillede',
  onLeave: 'Fraværende',
  
  // Status translations
  status: {
    available: 'Tilgængelig',
    onVacation: 'På ferie',
    unavailable: 'Ikke tilgængelig',
    onLeave: 'Fraværende',
    unknown: 'Ukendt',
    fullyBooked: 'Fuldt booket',
    partiallyBooked: 'Delvis booket',
    partialVacation: 'Delvis ferie',
  },
  
  // Actions
  addEmployee: 'Tilføj Medarbejder',
  addVikar: 'Tilføj Vikar',
  editEmployee: 'Rediger Medarbejder',
  deleteEmployee: 'Slet Medarbejder',
  save: 'Gem Medarbejder',
  cancel: 'Annuller',
  
  // Messages
  employeeCreated: 'Medarbejder Oprettet',
  employeeCreatedMsg: 'Medarbejderen {name} er blevet oprettet',
  employeeUpdated: 'Medarbejder Opdateret',
  employeeUpdatedMsg: 'Medarbejderen {name} er blevet opdateret',
  employeeDeleted: 'Medarbejder Slettet',
  employeeDeletedMsg: 'Medarbejderen er blevet slettet',
  errorCreatingEmployee: 'Fejl ved oprettelse af medarbejder',
  errorUpdatingEmployee: 'Fejl ved opdatering af medarbejder',
  errorDeletingEmployee: 'Fejl ved sletning af medarbejder',
  
  // Status
  active: 'Aktiv',
  inactive: 'Inaktiv',
  availableAfter: 'Tilgængelig efter {time}',
  
  // Leave management
  markOnLeave: 'Marker som fraværende',
  markAvailable: 'Marker som tilgængelig',
  leaveMarked: 'Status Opdateret',
  leaveMarkedMsg: 'Medarbejderens status er blevet opdateret',
  
  // Validation
  nameRequired: 'Navn er påkrævet',
  emailRequired: 'Email er påkrævet',
  emailInvalid: 'Indtast venligst en gyldig email-adresse',
  phoneRequired: 'Telefonnummer er påkrævet',
  
  // Empty states
  noEmployees: 'Ingen medarbejdere fundet',
  noEmployeesDescription: 'Ingen medarbejderposter blev fundet i systemet.',
  
  // Table headers and actions
  viewNotes: 'Se noter',
  
  // Additional status translations
  terminated: 'Opsagt',
  
  // Form dialog
  addNewEmployee: 'Tilføj Ny Medarbejder',
  updateInfo: 'Opdater Information',
  createAccount: 'Opret Konto',
  fullName: 'Fulde Navn',
  passwordRequirements: 'Adgangskode skal være mindst 6 tegn',
  unexpectedError: 'Uventet fejl opstod',
  creatingUserDescription: 'Opretter brugerkonto...',
  userCreatedSuccessfully: 'Bruger oprettet med succes',
  userCreatedFallback: 'Bruger oprettet, men email blev ikke sendt',
  userCreationFailed: 'Brugeroprettelse mislykkedes',
  notesPlaceholder: 'Tilføj noter om medarbejderen...',
  viewNotesOnly: 'Se noter (kun læsning)',
  
  // Delete dialog
  deleteConfirm: 'Bekræft Sletning',
  deleteWarning: 'Er du sikker på, at du vil slette {name}? Denne handling kan ikke fortrydes.',
  
  // Leave management
  markAvailableTitle: 'Marker Som Tilgængelig',
  markAvailableDescription: 'Ønsker du at markere {name} som tilgængelig? Hvad skal der ske med den eksisterende note?',
  removeNote: 'Fjern Note',
  keepNote: 'Behold Note',
  markOnLeaveTitle: 'Marker Som Fraværende',
  markOnLeaveDescription: 'Marker {name} som fraværende. Tilføj venligst en note med årsagen.',
  
  // Roles
  administrator: 'Administrator',
  skadeleder: 'Skadeleder',
  servicemedarbejder: 'Servicemedarbejder',
  vikar: 'Vikar',
  
  // Responsible users
  noResponsibleUsersFound: 'Ingen sagsansvarlige fundet',
  
  // Temporary users
  temporaryUser: 'Midlertidig Bruger',
  isTemporary: 'Er Vikar',
  expiresAt: 'Udløber',
  expirationDate: 'Udløbsdato',
  temporaryUserNote: 'Vikarer udløber automatisk og slettes efter udløbsdatoen',
  emailOptional: 'Email (valgfri for vikarer)',
  phoneOptional: 'Telefon (valgfri for vikarer)',
  vikarExpiresOn: 'Vikar udløber den {date}',
  vikarExpired: 'Vikar udløbet',
};

export default employees;
