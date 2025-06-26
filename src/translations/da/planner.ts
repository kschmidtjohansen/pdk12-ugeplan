
const planner = {
  title: 'Planlægger',
  description: 'Planlæg og administrer arbejdsopgaver',
  
  // Basic actions
  cancel: 'Annuller',
  save: 'Gem',
  delete: 'Slet',
  edit: 'Rediger',
  create: 'Opret',
  
  // Assignment management
  assignments: 'Opgaver',
  newAssignment: 'Ny opgave',
  editAssignment: 'Rediger opgave',
  deleteAssignment: 'Slet opgave',
  assignmentDetails: 'Opgavedetaljer',
  noAssignments: 'Ingen opgaver fundet',
  
  // Form fields
  assignmentTitle: 'Sagsnummer',
  assignmentDescription: 'Beskrivelse',
  date: 'Dato',
  time: 'Tid',
  fromTime: 'Fra tid',
  toTime: 'Til tid',
  location: 'Lokation',
  employees: 'Medarbejdere',
  cars: 'Biler',
  selectEmployee: 'Vælg medarbejder',
  selectCar: 'Vælg bil',
  onVacation: 'På ferie',
  
  // Status and actions
  published: 'Publiceret',
  notPublished: 'Ikke publiceret',
  draft: 'Kladde',
  publish: 'Publicer',
  unpublish: 'Afpublicer',
  duplicate: 'Duplikér',
  
  // New keys for unassigned resources
  unassignedResources: 'Ubrugte ressourcer',
  showOnScreen: 'Vis på skærm',
  unassignedCars: 'Ikke brugte biler',
  showMore: 'Vis mere',
  
  // Error messages
  fetchError: 'Fejl ved indlæsning af opgaver',
  createError: 'Fejl ved oprettelse af opgave',
  updateError: 'Fejl ved opdatering af opgave',
  deleteError: 'Fejl ved sletning af opgave',
  publishError: 'Fejl ved publicering af opgave',
  errorCreatingAssignment: 'Fejl ved oprettelse af opgave',
  errorUpdatingAssignment: 'Fejl ved opdatering af opgave',
  errorDeletingAssignment: 'Fejl ved sletning af opgave',
  errorPublishingAssignment: 'Fejl ved publicering af opgave',
  errorPublishingDay: 'Fejl ved publicering af dagens opgaver',
  
  // Success messages
  assignmentCreated: 'Opgave oprettet',
  assignmentUpdated: 'Opgave opdateret',
  assignmentDeleted: 'Opgave slettet',
  assignmentPublished: 'Opgave publiceret',
  publishSuccess: 'Opgave publiceret succesfuldt',
  deleteSuccess: 'Opgave slettet succesfuldt',
  updateSuccess: 'Opgave opdateret succesfuldt',
  createSuccess: 'Opgave oprettet succesfuldt',
  assignmentCreatedMsg: 'Opgave "{title}" oprettet succesfuldt',
  assignmentUpdatedMsg: 'Opgave "{title}" opdateret succesfuldt',
  assignmentDeletedMsg: 'Opgave slettet succesfuldt',
  assignmentPublishedMsg: 'Opgave publiceret succesfuldt',
  dayPublished: 'Dagens opgaver publiceret',
  dayPublishedMsg: 'Alle dagens opgaver blev publiceret succesfuldt',
  
  // Confirmation dialogs
  deleteConfirm: 'Slet opgave',
  deleteWarning: 'Er du sikker på, at du vil slette denne opgave? Denne handling kan ikke fortrydes.',
  publishConfirm: 'Publicer opgave',
  publishWarning: 'Er du sikker på, at du vil publicere denne opgave?',
  
  // Time navigation
  today: 'I dag',
  previousWeek: 'Forrige uge',
  nextWeek: 'Næste uge',
  week: 'Uge',
  
  // Empty states
  noAssignmentsToday: 'Ingen opgaver i dag',
  noAssignmentsWeek: 'Ingen opgaver denne uge',
  createFirst: 'Opret din første opgave',
  
  // Additional planner-specific translations
  previousDays: 'Tidligere dage',
  nothingPlannedToday: 'Intet planlagt i dag',
  publishDayTasks: 'Publicer dagens opgaver',
  copyAssignment: 'Kopier opgave',
  createNew: 'Opret ny',
  weekView: 'Uge {week}, {year} ({start} - {end})',
  selectDateForCopy: 'Vælg en ny dato for den kopierede opgave',
  
  // Car selector translations
  selectCars: 'Vælg biler',
  carsSelected: '{count} biler valgt',
  available: 'Tilgængelig',
  unavailable: 'Ikke tilgængelig',
  bookedUntil: 'Booket indtil {time}',
  carNotAvailable: 'Bil ikke tilgængelig'
};

export default planner;
