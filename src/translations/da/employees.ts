
const employees = {
  title: 'Medarbejdere',
  description: 'Vis og administrer medarbejdere.',
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
  availability: 'Tilgængelighed',
  notes: 'Noter',
  actions: 'Handlinger',
  noEmployees: 'Ingen medarbejdere fundet',
  fetchError: 'Fejl ved indlæsning af medarbejdere',
  updateError: 'Fejl ved opdatering af medarbejder',
  deleteError: 'Fejl ved sletning af medarbejder',
  createError: 'Fejl ved oprettelse af medarbejder',
  
  // RLS and database access errors
  rlsError: 'Der opstod en adgangsfejl ved indlæsning af medarbejdere. Dette er blevet rapporteret og vil blive rettet snarest.',
  rlsErrorTitle: 'Adgangsfejl',
  rlsErrorDescription: 'Der opstod en adgangsfejl ved indlæsning af medarbejdere. Dette er blevet rapporteret og vil blive rettet snarest.',
  permissionErrorTitle: 'Ingen tilladelse',
  permissionErrorDescription: 'Du har ikke tilladelse til at se medarbejdere. Kontakt din administrator.',
  generalErrorTitle: 'Indlæsningsfejl',
  generalErrorDescription: 'Der opstod en fejl ved indlæsning af medarbejderdata. Prøv venligst igen.',
  
  // Success messages
  employeeCreated: 'Medarbejder oprettet',
  employeeUpdated: 'Medarbejder opdateret',
  employeeDeleted: 'Medarbejder slettet',
  
  // Confirmation dialogs
  deleteConfirm: 'Slet medarbejder',
  deleteConfirmTitle: 'Slet medarbejder',
  deleteConfirmMessage: 'Er du sikker på, at du vil slette denne medarbejder? Denne handling kan ikke fortrydes.',
  deleteWarning: 'Er du sikker på, at du vil slette {name}? Denne handling kan ikke fortrydes.',
  markLeaveTitle: 'Marker som på orlov',
  markLeaveMessage: 'Marker denne medarbejder som værende på orlov?',
  markAvailableTitle: 'Marker som tilgængelig',
  markAvailableMessage: 'Marker denne medarbejder som tilgængelig igen?',
  markOnLeaveTitle: 'Marker på orlov',
  markOnLeaveDescription: 'Marker {name} som på orlov?',
  markAvailableDescription: 'Marker {name} som tilgængelig igen?',
  
  // Notes and actions
  notesPlaceholder: 'Tilføj noter om denne medarbejder...',
  viewNotes: 'Se noter',
  viewNotesOnly: 'Du kan se noter, men ikke redigere dem.',
  markOnLeave: 'Marker på orlov',
  markAvailable: 'Marker tilgængelig',
  removeNote: 'Fjern note og marker tilgængelig',
  keepNote: 'Behold note og marker tilgængelig',
  
  // Employee selector and availability
  selectEmployees: 'Vælg medarbejdere',
  selected: 'valgt',
  fullyBooked: 'Ikke ledig',
  availableAfter: 'Medarbejder ledig efter kl. {time}',
  autoRemovedUnavailable: 'Følgende medarbejdere blev automatisk fjernet da de ikke er tilgængelige'
};

export default employees;
