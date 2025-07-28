
const employees = {
  title: 'Medarbejdere',
  description: 'Administrer medarbejdere og deres roller',
  
  // Form fields
  name: 'Navn',
  email: 'Email',
  phone: 'Telefon',
  jobTitle: 'Stilling',
  role: 'Rolle',
  status: 'Status',
  notes: 'Noter',
  contact: 'Kontakt',
  avatar: 'Profilbillede',
  
  // Status translations
  'status.available': 'Tilgængelig',
  'status.onVacation': 'På ferie',
  'status.unavailable': 'Ikke tilgængelig',
  'status.onLeave': 'På orlov',
  'status.unknown': 'Ukendt',
  
  // Actions
  addEmployee: 'Tilføj Medarbejder',
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
  onLeave: 'På orlov',
  available: 'Tilgængelig',
  fullyBooked: 'Fuldt booket',
  availableAfter: 'Tilgængelig efter {time}',
  
  // Leave management
  markOnLeave: 'Marker som på orlov',
  markAvailable: 'Marker som tilgængelig',
  leaveMarked: 'Orlovsstatus Opdateret',
  leaveMarkedMsg: 'Medarbejderens orlovsstatus er blevet opdateret',
  
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
};

export default employees;
