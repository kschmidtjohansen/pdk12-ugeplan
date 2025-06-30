
const planner = {
  title: 'Planner',
  description: 'Administrer opgaver og planlæg arbejdsdagen',
  
  // Assignment list
  assignments: 'Opgaver',
  noAssignments: 'Ingen opgaver fundet',
  noAssignmentsWeek: 'Ingen opgaver i denne uge',
  createNew: 'Opret Ny Opgave',
  
  // Assignment details
  titlePlaceholder: 'Indtast titel',
  locationPlaceholder: 'Indtast lokation',
  fromTime: 'Fra Tid',
  toTime: 'Til Tid',
  location: 'Lokation',
  description: 'Beskrivelse',
  descriptionPlaceholder: 'Indtast beskrivelse',
  selectEmployees: 'Vælg Medarbejdere',
  car: 'Bil',
  selectCar: 'Vælg Bil',
  responsibleUser: 'Ansvarlig Bruger',
  selectResponsibleUser: 'Vælg Ansvarlig Bruger',
  noResponsibleUser: 'Ingen ansvarlig bruger',
  
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
  titleLabel: 'Titel',
  descriptionLabel: 'Beskrivelse',
  dateLabel: 'Dato',
  timeLabel: 'Tid',
  locationLabel: 'Lokation',
  carLabel: 'Bil',
  employeesLabel: 'Medarbejdere',
  responsibleUserLabel: 'Ansvarlig Bruger',
  
  // Placeholders
  timePlaceholder: 'Vælg tidspunkt',
  datePlaceholder: 'Vælg dato',
  
  // Status messages
  deleteConfirmation: 'Er du sikker på, at du vil slette denne opgave?',
  
  // Table headers
  tableTitle: 'Titel',
  tableDate: 'Dato',
  tableTime: 'Tid',
  tableLocation: 'Lokation',
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
  availableCars: 'Tilgængelige Biler'
};

export default planner;
