const planner = {
  title: 'Planner',
  description: 'Administrer opgaver og planlæg arbejdsdagen',
  
  // Assignment labels
  titleLabel: 'Titel',
  descriptionLabel: 'Beskrivelse',
  dateLabel: 'Dato',
  timeLabel: 'Tid',
  locationLabel: 'Lokation',
  carLabel: 'Bil',
  employeesLabel: 'Medarbejdere',
  responsibleUserLabel: 'Ansvarlig Bruger',
  
  // Assignment placeholders
  titlePlaceholder: 'Indtast titel',
  descriptionPlaceholder: 'Indtast beskrivelse',
  locationPlaceholder: 'Indtast lokation',
  timePlaceholder: 'Vælg tidspunkt',
  datePlaceholder: 'Vælg dato',
  
  // Assignment actions
  newAssignment: 'Ny opgave',
  editAssignment: 'Rediger opgave',
  copyAssignment: 'Kopier opgave',
  deleteAssignment: 'Slet opgave',
  publish: 'Offentliggør',
  assignments: 'opgaver',
  assignment: 'opgave',
  showOnScreen: 'Vis på skærm',
  
  // Status messages
  assignmentCreated: 'Opgave oprettet',
  assignmentCreatedMsg: 'Opgaven "{title}" er oprettet',
  assignmentUpdated: 'Opgave opdateret',
  assignmentUpdatedMsg: 'Opgaven "{title}" er opdateret',
  assignmentDeleted: 'Opgave slettet',
  assignmentDeletedMsg: 'Opgaven er slettet',
  
  // Error messages
  errorCreatingAssignment: 'Fejl ved oprettelse af opgave',
  errorUpdatingAssignment: 'Fejl ved opdatering af opgave',
  errorDeletingAssignment: 'Fejl ved sletning af opgave',
  
  // Confirmation messages
  deleteConfirmation: 'Er du sikker på, at du vil slette denne opgave?',
  
  // Table headers
  tableTitle: 'Titel',
  tableDate: 'Dato',
  tableTime: 'Tid',
  tableLocation: 'Lokation',
  tableActions: 'Handlinger',
  
  // Filters and sorting
  filterPublished: 'Offentliggjort',
  filterUnpublished: 'Ikke offentliggjort',
  sortByDate: 'Sortér efter dato',
  sortByTime: 'Sortér efter tid',
  
  // Empty states
  noAssignments: 'Ingen opgaver fundet',
  noAssignmentsWeek: 'Ingen opgaver i denne uge',
  createFirst: 'Opret din første opgave',
  
  // Date and time formats
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  
  // Week view
  weekView: 'Uge {week}, {start} - {end}, {year}',
  
  // Common terms
  title: 'Titel',
  location: 'Lokation',
  date: 'Dato',
  time: 'Tid',
  description: 'Beskrivelse',
  
  // Assignment types
  typeCleaning: 'Rengøring',
  typeMaintenance: 'Vedligeholdelse',
  typeInspection: 'Inspektion',
  typeOther: 'Andet',
  
  // Status
  published: 'Offentliggjort',
  notPublished: 'Ikke offentliggjort',

  // Publishing messages
  assignmentPublished: 'Opgave Publiceret',
  assignmentPublishedMsg: 'Opgaven er blevet publiceret med succes',
  dayPublished: 'Dag Publiceret',
  dayPublishedMsg: 'Alle opgaver for {date} er blevet publiceret',
  errorPublishingAssignment: 'Kunne ikke publicere opgave',
  errorPublishingDay: 'Kunne ikke publicere opgaver for dagen',
};

export default planner;
