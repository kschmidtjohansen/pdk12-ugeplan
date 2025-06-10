

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
  assignmentTitle: 'Titel',
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
  
  // Additional form fields
  enterTitle: 'Indtast titel',
  enterLocation: 'Indtast lokation',
  assignmentDate: 'Opgavedato',
  startTime: 'Starttid',
  endTime: 'Sluttid',
  notesPlaceholder: 'Tilføj noter eller beskrivelse...',
  
  // Form actions
  updateDetails: 'Opdater opgavedetaljer og tildeling.',
  addAssignment: 'Tilføj en ny opgave til planlæggeren.',
  saveChanges: 'Gem ændringer',
  createAssignment: 'Opret opgave',
  
  // Assignment types
  type: 'Type',
  selectType: 'Vælg type',
  assignmentTypes: {
    ordinary_damage: 'Almindelig skade',
    flood_damage: 'Vandskade',
    roof_damage: 'Tagskade',
    storm_damage: 'Stormskade',
    fire_damage: 'Brandskade',
    other: 'Andet'
  },
  
  // Car selection
  selectCars: 'Vælg biler',
  carsSelected: '{count} biler valgt',
  available: 'Tilgængelig',
  unavailable: 'Ikke tilgængelig',
  bookedUntil: 'Optaget til {time}',
  carNotAvailable: 'Bil ikke tilgængelig',
  
  // Employee selection
  selectEmployees: 'Vælg medarbejdere',
  onVacation: 'På ferie',
  
  // Responsible user selection
  responsibleUser: 'Ansvarlig bruger',
  selectResponsibleUser: 'Vælg ansvarlig bruger',
  noResponsibleUser: 'Ingen ansvarlig',
  
  // Screen display
  showOnScreen: 'Vis på skærm',
  
  // Status and actions
  published: 'Publiceret',
  notPublished: 'Ikke publiceret',
  draft: 'Kladde',
  publish: 'Publicer',
  unpublish: 'Afpublicer',
  duplicate: 'Duplikér',
  
  // Error messages
  fetchError: 'Fejl ved indlæsning af opgaver',
  createError: 'Fejl ved oprettelse af opgave',
  updateError: 'Fejl ved opdatering af opgave',
  deleteError: 'Fejl ved sletning af opgave',
  
  // Success messages
  assignmentCreated: 'Opgave oprettet',
  assignmentUpdated: 'Opgave opdateret',
  assignmentDeleted: 'Opgave slettet',
  assignmentPublished: 'Opgave publiceret',
  
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
  noAssignmentsToday: 'Ingen opgaver for i dag',
  noAssignmentsWeek: 'Ingen opgaver denne uge',
  createFirst: 'Opret din første opgave',
  
  // Additional planner-specific translations
  previousDays: 'Tidligere dage',
  nothingPlannedToday: 'Intet planlagt for i dag',
  publishDayTasks: 'Publicer dagens opgaver',
  copyAssignment: 'Kopier opgave',
  createNew: 'Opret ny',
  weekView: 'Uge {week}, {year} ({start} - {end})',
  
  // Unassigned resources section
  unassignedResources: 'Ubrugte ressourcer',
  unassignedCars: 'Ikke brugte biler',
  allCarsAssigned: 'Alle biler er tildelt',
  showMore: 'Vis mere',
  showLess: 'Vis mindre'
};

export default planner;

