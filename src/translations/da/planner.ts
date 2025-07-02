
const planner = {
  title: 'Planner',
  description: 'Administrer opgaver og planlæg arbejdsdagen',
  
  // Assignment list
  assignments: 'Opgaver',
  noAssignments: 'Ingen opgaver fundet',
  noAssignmentsWeek: 'Ingen opgaver i denne uge',
  createNew: 'Opret Ny Opgave',
  
  // Assignment details
  titlePlaceholder: 'Sagsnummer',
  locationPlaceholder: 'Indtast adresse',
  fromTime: 'Fra Tid',
  toTime: 'Til Tid',
  location: 'Adresse',
  selectEmployees: 'Vælg Medarbejdere',
  car: 'Bil',
  selectCar: 'Vælg Bil',
  responsibleUser: 'Sagsansvarlig',
  selectResponsibleUser: 'Vælg Sagsansvarlig',
  noResponsibleUser: 'Ingen sagsansvarlig',
  
  // Actions
  addAssignment: 'Tilføj Opgave',
  editAssignment: 'Rediger Opgave',
  copyAssignment: 'Kopier Opgave',
  deleteAssignment: 'Slet Opgave',
  publish: 'Publicer',
  publishDayTasks: 'Publicer Dagens Opgaver',
  showOnScreen: 'Vis på Skærm',
  newAssignment: 'Ny Opgave',
  
  // Messages
  assignmentCreated: 'Opgave Oprettet',
  assignmentCreatedMsg: 'Opgaven {title} er blevet oprettet',
  assignmentUpdated: 'Opgave Opdateret',
  assignmentUpdatedMsg: 'Opgaven {title} er blevet opdateret',
  assignmentDeleted: 'Opgave Slettet',
  assignmentDeletedMsg: 'Opgaven er blevet slettet',
  errorCreatingAssignment: 'Fejl ved oprettelse af opgave',
  errorUpdatingAssignment: 'Fejl ved opdatering af opgave',
  errorDeletingAssignment: 'Fejl ved sletning af opgave',
  
  // Week view
  weekView: 'Uge {week}, {year} ({start} - {end})',
  week: 'Uge',
  
  // Status
  published: 'Publiceret',
  notPublished: 'Ikke Publiceret',
  
  // Confirmation dialogs
  deleteConfirm: 'Slet Opgave',
  deleteWarning: 'Er du sikker på, at du vil slette denne opgave?',
  
  // Empty states
  addFirst: 'Tilføj din første opgave',
  nothingPlannedToday: 'Intet planlagt i dag',
  
  // Publishing messages
  assignmentPublished: 'Opgave Publiceret',
  assignmentPublishedMsg: 'Opgaven er blevet publiceret med succes',
  dayPublished: 'Dag Publiceret',
  dayPublishedMsg: 'Alle opgaver for {date} er blevet publiceret',
  errorPublishingAssignment: 'Kunne ikke publicere opgave',
  errorPublishingDay: 'Kunne ikke publicere opgaver for dagen',
  
  // Required fields
  employees: 'Medarbejdere',
  date: 'Dato',
  time: 'Tid',
  
  // Form labels
  titleLabel: 'Sagsnummer',
  enterTitle: 'Sagsnummer',
  descriptionLabel: 'Beskrivelse',
  assignmentDescription: 'Opgave beskrivelse',
  notesPlaceholder: 'Indtast noter',
  dateLabel: 'Dato',
  assignmentDate: 'Opgave dato',
  timeLabel: 'Tid',
  startTime: 'Start tid',
  endTime: 'Slut tid',
  locationLabel: 'Adresse',
  enterLocation: 'Indtast adresse',
  carLabel: 'Bil',
  employeesLabel: 'Medarbejdere',
  responsibleUserLabel: 'Sagsansvarlig',
  
  // Placeholders
  timePlaceholder: 'Vælg tidspunkt',
  datePlaceholder: 'Vælg dato',
  
  // Status messages
  deleteConfirmation: 'Er du sikker på, at du vil slette denne opgave?',
  
  // Table headers
  tableTitle: 'Titel',
  tableDate: 'Dato',
  tableTime: 'Tid',
  tableLocation: 'Adresse',
  tableActions: 'Handlinger',
  
  // Filters and sorting
  filterPublished: 'Publiceret',
  filterUnpublished: 'Ikke publiceret',
  sortByDate: 'Sortér efter dato',
  sortByTime: 'Sortér efter tid',
  
  // Date and time formats
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  
  // Assignment types
  typeCleaning: 'Rengøring',
  typeMaintenance: 'Vedligeholdelse',
  typeInspection: 'Inspektion',
  typeOther: 'Andet',
  
  // Common terms
  assignment: 'opgave',
  createFirst: 'Opret din første opgave',
  
  // Unassigned resources
  unassignedResources: 'Ikke-tildelte Ressourcer',
  unassignedEmployees: 'Ikke-tildelte Medarbejdere',
  unassignedCars: 'Ikke-tildelte Biler',
  employeesOnVacation: 'Medarbejdere på Ferie',
  availableEmployees: 'Tilgængelige Medarbejdere',
  availableCars: 'Tilgængelige Biler',
  
  // Car-related translations
  availableCarsTitle: 'Tilgængelige Biler',
  unavailableCarsTitle: 'Ikke Tilgængelige Biler',
  noCarsAvailable: 'Ingen biler tilgængelige',
  noCarsUnavailable: 'Alle biler er tilgængelige',
  carWithTrailer: 'Bil med trailer',
  carWithoutTrailer: 'Bil uden trailer',
  
  // Employee-related translations
  employeeOnVacation: 'På ferie',
  employeeAvailable: 'Tilgængelig',
  employeeUnavailable: 'Ikke tilgængelig',
  noEmployeesSelected: 'Ingen medarbejdere valgt',
  
  // Responsible user translations
  responsibleUserDisplay: 'Ansvarlig: {name}',
  noResponsibleUserAssigned: 'Ingen ansvarlig tildelt',
  
  // Additional translations for unassigned resources
  showMore: "flere",
  showLess: "Vis færre",
  allCarsAssigned: "Alle biler er tildelt",
  availableResources: "tilgængelige ressourcer",
  
  // Assignment status
  assignmentStatus: 'Status',
  assignmentPublishedStatus: 'Publiceret',
  assignmentUnpublishedStatus: 'Ikke publiceret',
  
  // Additional translations
  unknownEmployee: 'Ukendt medarbejder',
  today: 'I dag',
  
  // New translations for unassigned resources
  noEmployeesAvailable: 'Alle medarbejdere er tildelt eller på ferie'
};

export default planner;
