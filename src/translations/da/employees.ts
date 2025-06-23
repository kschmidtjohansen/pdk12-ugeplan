
const employees = {
  title: 'Medarbejdere',
  description: 'Administrer medarbejdere og deres adgang',
  addEmployee: 'Tilføj medarbejder',
  editEmployee: 'Rediger medarbejder',
  deleteEmployee: 'Slet medarbejder',
  addNewEmployee: 'Tilføj ny medarbejder',
  updateInfo: 'Opdater medarbejderinformation og adgang.',
  createAccount: 'Opret en ny medarbejderkonto.',
  fullName: 'Fulde navn',
  name: 'Navn',
  email: 'Email',
  phone: 'Telefon',
  jobTitle: 'Jobtitel',
  role: 'Rolle',
  status: 'Status',
  onLeave: 'På orlov',
  available: 'Tilgængelig',
  notes: 'Noter',
  actions: 'Handlinger',
  noEmployees: 'Ingen medarbejdere fundet',
  fetchError: 'Fejl ved indlæsning af medarbejdere',
  updateError: 'Fejl ved opdatering af medarbejder',
  deleteError: 'Fejl ved sletning af medarbejder',
  createError: 'Fejl ved oprettelse af medarbejder',
  
  // RLS and database access errors
  rlsError: 'Der opstod en adgangsfejl ved indlæsning af medarbejdere. Dette er blevet rapporteret og vil blive rettet hurtigst muligt.',
  rlsErrorTitle: 'Adgangsfejl',
  rlsErrorDescription: 'Der opstod en adgangsfejl ved indlæsning af medarbejdere. Dette er blevet rapporteret og vil blive rettet hurtigst muligt.',
  permissionErrorTitle: 'Ingen tilladelse',
  permissionErrorDescription: 'Du har ikke tilladelse til at se medarbejdere. Kontakt din administrator.',
  generalErrorTitle: 'Indlæsningsfejl',
  generalErrorDescription: 'Der opstod en fejl ved indlæsning af medarbejderdata. Prøv venligst igen.',
  
  // Success messages
  employeeCreated: 'Medarbejder oprettet',
  employeeUpdated: 'Medarbejder opdateret',
  employeeDeleted: 'Medarbejder slettet',
  employeeAdded: 'Medarbejder tilføjet',
  employeeAddedMsg: '{name} er blevet tilføjet som {role}',
  
  // Confirmation dialogs
  deleteConfirm: 'Slet medarbejder',
  deleteConfirmTitle: 'Slet medarbejder',
  deleteConfirmMessage: 'Er du sikker på, at du vil slette denne medarbejder? Denne handling kan ikke fortrydes.',
  deleteWarning: 'Er du sikker på, at du vil slette {name}? Denne handling kan ikke fortrydes.',
  markLeaveTitle: 'Marker som fraværende',
  markLeaveMessage: 'Marker denne medarbejder som fraværende?',
  markAvailableTitle: 'Marker som tilgængelig',
  markAvailableMessage: 'Marker denne medarbejder som tilgængelig igen?',
  markOnLeaveTitle: 'Marker fraværende',
  markOnLeaveDescription: 'Marker {name} som fraværende?',
  markAvailableDescription: 'Marker {name} som tilgængelig igen?',
  
  // Notes and actions
  notesPlaceholder: 'Tilføj noter om denne medarbejder...',
  viewNotes: 'Se noter',
  viewNotesOnly: 'Du kan se noter, men ikke redigere dem.',
  markOnLeave: 'Marker fraværende',
  markAvailable: 'Marker tilgængelig',
  removeNote: 'Fjern note og marker tilgængelig',
  keepNote: 'Behold note og marker tilgængelig',
  
  // User creation process
  creatingUser: 'Opretter brugerkonto',
  creatingUserDescription: 'Prøver flere metoder for at sikre succes',
  userCreatedSuccessfully: 'Bruger oprettet med succes ved hjælp af serverfunktion',
  userCreatedFallback: 'Serverfunktion ikke tilgængelig. Bruger oprettet ved direkte databaseadgang',
  userCreationFailed: 'Brugeroprettelse mislykkedes. Tjek venligst fejlmeddelelsen nedenfor',
  
  // Connection and network status
  connectionStatus: 'Forbindelsesstatus',
  tryingMultipleMethods: 'Prøver flere metoder for at sikre succes',
  serverFunctionUnavailable: 'Serverfunktion ikke tilgængelig',
  usingDirectDatabase: 'Bruger direkte databaseadgang',
  
  // Validation errors
  emailRequired: 'Email er påkrævet',
  passwordRequired: 'Adgangskode er påkrævet',
  nameRequired: 'Navn er påkrævet',
  validEmailRequired: 'Angiv venligst en gyldig email-adresse',
  userAlreadyExists: 'En bruger med denne email eksisterer allerede',
  invalidEmail: 'Indtast venligst en gyldig email-adresse',
  passwordRequirements: 'Adgangskoden opfylder ikke kravene (8+ tegn, store bogstaver, små bogstaver, tal)',
  networkError: 'Netværksfejl: Kan ikke forbinde til server',
  rateLimitError: 'For mange anmodninger. Vent venligst et øjeblik og prøv igen',
  
  // Method-specific messages
  edgeFunctionFailed: 'Edge-funktion mislykkedes',
  directCreationFailed: 'Direkte oprettelse mislykkedes også',
  allMethodsFailed: 'Alle oprettelsesmetoder mislykkedes',
  methodUsed: 'Brugt metode',
  
  // Generic error handling
  unexpectedError: 'Der opstod en uventet fejl',
  tryAgainLater: 'Prøv venligst igen senere',
  contactSupport: 'Kontakt support hvis problemet fortsætter'
};

export default employees;
