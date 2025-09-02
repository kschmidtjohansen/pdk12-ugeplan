
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
  
  // Validation messages
  validation: {
    titleRequired: 'Sagsnummer er påkrævet',
    locationRequired: 'Adresse er påkrævet',
    dateRequired: 'Dato er påkrævet',
    fromTimeRequired: 'Start tid er påkrævet',
    toTimeRequired: 'Slut tid er påkrævet',
    timeOrderRequired: 'Start tid skal være før slut tid'
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

  // File management translations
  files: {
    dragDrop: 'Træk og slip filer her, eller klik for at vælge',
    dropHere: 'Slip filer her',
    browse: 'Vælg Filer',
    camera: 'Tag Billede',
    supportedTypes: 'Understøttet: Billeder (JPG, PNG, WebP), PDF, Word dokumenter',
    maxSize: 'Maksimal filstørrelse: 10MB',
    attachedFiles: 'Vedhæftede Filer',
    uploadError: 'Kunne ikke uploade {filename}',
    deleteError: 'Kunne ikke slette {filename}',
    tooManyFiles: 'Maksimalt {max} filer tilladt',
    attachments: 'Vedhæftninger',
    addFiles: 'Tilføj Filer',
    noFiles: 'Ingen filer vedhæftet'
  }
};

export default planner;
