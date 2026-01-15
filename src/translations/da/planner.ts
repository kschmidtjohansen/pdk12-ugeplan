
const planner = {
  title: 'Planner',
  description: 'Beskrivelse',
  
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
  assignmentsCreated: 'Opgaver Oprettet',
  assignmentCreatedMultipleDays: 'Opgave "{title}" oprettet på {count} dage',
  assignmentsCreatedAcrossDays: 'Oprettet {count} opgaver på {days} dage',
  assignmentsCreatedPartialFail: 'Oprettet {success} af {total} opgaver. {failed} fejlede.',
  assignmentsUpdatedAcrossDays: 'Opdateret og oprettet opgaver på {days} dage',
  assignmentsUpdatedPartialFail: 'Opdateret 1 og oprettet {success} af {total} ekstra opgaver. {failed} fejlede.',
  assignmentUpdated: 'Opgave Opdateret',
  assignmentUpdatedMsg: 'Opgaven {title} er blevet opdateret',
  assignmentDeleted: 'Opgave Slettet',
  assignmentDeletedMsg: 'Opgaven er blevet slettet',
  assignmentDeletedMsgWithCase: 'Sag {caseNumber} er blevet slettet',
  errorCreatingAssignment: 'Fejl ved oprettelse af opgave',
  errorUpdatingAssignment: 'Fejl ved opdatering af opgave',
  errorDeletingAssignment: 'Fejl ved sletning af opgave',
  
  // Change Log
  changeLog: {
    title: 'Planner Ændringer',
    subtitle: 'Seneste aktivitet i planneren',
    noChanges: 'Ingen ændringer endnu',
    created: 'oprettede',
    updated: 'opdaterede',
    deleted: 'slettede',
    published: 'publicerede',
    assignments: 'opgaver',
  },
  
  // Week view
  weekView: 'Uge {week}, {year} ({start} - {end})',
  week: 'Uge',
  
  // Status
  published: 'Aftalt',
  notPublished: 'Ikke Aftalt',
  
  // Confirmation dialogs
  deleteConfirm: 'Slet Opgave',
  deleteWarning: 'Er du sikker på, at du vil slette denne opgave?',
  
  // Empty states
  addFirst: 'Tilføj din første opgave',
  nothingPlannedToday: 'Intet planlagt i dag',
  
  // Publishing messages
  assignmentPublished: 'Opgave Publiceret',
  assignmentPublishedMsg: 'Opgaven er blevet publiceret med succes',
  assignmentsPublished: 'Opgaver Publiceret',
  assignmentsPublishedMsg: 'Opgaverne er blevet publiceret med succes',
  publishingInProgress: 'Publicerer',
  noAssignmentsToPublish: 'Ingen Opgaver at Publicere',
  noUnpublishedAssignments: 'Ingen upublicerede opgaver fundet',
  errorPublishingAssignments: 'Kunne ikke publicere opgaver',
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
  dateAndTime: 'Dato og Tidspunkt',
  assignmentDetails: 'Detaljer',
  notesPlaceholder: 'Indtast noter',
  dateLabel: 'Dato',
  assignmentDate: 'Opgave dato',
  selectMultipleDates: 'Vælg flere datoer (til opgave over flere dage)',
  datesSelected: '{count} dage valgt',
  removeDate: 'Fjern dato',
  clearDates: 'Ryd alle datoer',
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
  filterPublished: 'Aftalt',
  filterUnpublished: 'Ikke aftalt',
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
  cars: 'Biler',
  selectCars: 'Vælg Biler',
  carsSelected: '{count} biler valgt',
  unavailable: 'Ikke tilgængelig',
  available: 'Tilgængelig',
  bookedUntil: 'Optaget til {time}',
  carNotAvailable: 'Ikke tilgængelig',
  
  // Employee-related translations
  onVacation: 'Fri/Ferie',
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
  assignmentPublishedStatus: 'Aftalt',
  assignmentUnpublishedStatus: 'Ikke aftalt',
  
  // Additional translations
  unknownEmployee: 'Ukendt medarbejder',
  today: 'I dag',
  
  // New translations for unassigned resources
  noEmployeesAvailable: 'Alle medarbejdere er tildelt eller på ferie',
  
  // Collapsible and date navigation
  collapseResources: 'Skjul ressourcer',
  expandResources: 'Vis ressourcer',
  selectDate: 'Vælg dato',
  previousDay: 'Forrige dag',
  nextDay: 'Næste dag',
  previousDays: 'Forrige dage',
  
  // Additional translations for enhanced unassigned resources
  fullyAvailableEmployees: 'Fuldt Tilgængelige Medarbejdere',
  partiallyAvailableEmployees: 'Delvist Tilgængelige Medarbejdere',
  onVacationEmployees: 'Medarbejdere på Ferie',
  availableCount: 'Tilgængelige',
  onVacationCount: 'På Ferie',
  partiallyBookedCount: 'Delvist Optaget',
  noAvailableResources: 'Ingen Ledige Ressourcer',
  allResourcesAssigned: 'Alle medarbejdere og biler er tildelt opgaver på denne dag.',
  employeeStatusAvailable: 'Ledig',
  employeeStatusPartial: 'Delvist',
  employeeStatusVacation: 'Ferie',
  carStatusAvailable: 'Ledig',
  carWithTrailerLabel: 'Trailer',
  
  // Validation messages
  validation: {
    titleRequired: 'Titel er påkrævet',
    locationRequired: 'Adresse er påkrævet',
    dateRequired: 'Dato er påkrævet',
    fromTimeRequired: 'Starttid er påkrævet',
    toTimeRequired: 'Sluttid er påkrævet',
    timeOrderRequired: 'Starttid skal være før sluttid',
    carRequired: 'Du skal vælge mindst én bil'
  },

  // Operation status messages
  operations: {
    creating: 'Opretter',
    updating: 'Opdaterer',
    deleting: 'Sletter',
    publishing: 'Publicerer',
    saving: 'Gemmer',
    processing: 'Behandler',
    success: 'Succes',
    failed: 'Fejlede'
  },

  // Car booking conflict dialog
  carBookingConflict: 'Bil allerede i brug',
  carAlreadyInUse: 'er allerede i brug på denne dag.',
  conflictingTasks: 'Bruges til følgende opgaver',
  confirmDoubleBooking: 'Vil du alligevel vælge denne bil?',
  useAnywayButton: 'Brug alligevel',
  until: 'indtil',
  sharedWithOtherTasks: 'Delt med andre opgaver',

  // Address autocomplete
  routeDistance: '{distance} km · ca. {duration} kørsel',
  calculatingRoute: 'Beregner kørerute...',
  noAddressesFound: 'Ingen adresser fundet',
  locationNotAvailable: 'Kunne ikke hente din placering',

  // Kanban view
  kanban: {
    viewTitle: 'Uge oversigt',
    noCase: 'Ingen sagsnr.',
    draft: 'Kladde',
    publishColumn: 'Udgiv alle',
    addNew: 'Opret ny',
    tasksCount: '{count} opgaver',
    publishedCount: '{count} aftalt'
  }
};

export default planner;
