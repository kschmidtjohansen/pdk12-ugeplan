
const cars = {
  title: 'Bil Administration',
  description: 'Administrer firmaets køretøjer og deres tilgængelighed',
  pageDescription: 'Administrer firmaets køretøjer og deres tilgængelighed',
  addNewCar: 'Tilføj Ny Bil',
  editCar: 'Rediger Bil',
  deleteCar: 'Slet Bil',
  markAvailable: 'Marker som Tilgængelig',
  markUnavailable: 'Marker som Utilgængelig',
  confirmDelete: 'Bekræft Sletning',
  deleteWarning: 'Er du sikker på, at du vil slette denne bil? Denne handling kan ikke fortrydes.',
  availabilityWarning: 'Er du sikker på, at du vil ændre tilgængeligheden af denne bil?',
  
  // Form fields
  carName: 'Bil Navn',
  vehicleName: 'Køretøj Navn',
  carNumber: 'Bil Nummer',
  numberPlate: 'Nummerplade',
  fuelCardCode: 'Tankkortkode',
  hasTrailerHitch: 'Har Anhængertræk',
  isAvailable: 'Er Tilgængelig',
  notes: 'Noter',
  
  // Status
  available: 'Tilgængelig',
  unavailable: 'Utilgængelig',
  inUse: 'I brug til kl. {time}',
  
  // Actions
  save: 'Gem',
  cancel: 'Annuller',
  delete: 'Slet',
  edit: 'Rediger',
  
  // Messages
  carAdded: 'Bil tilføjet',
  carUpdated: 'Bil opdateret',
  carDeleted: 'Bil slettet',
  carMarkedAvailable: 'Bil markeret som tilgængelig',
  carMarkedUnavailable: 'Bil markeret som utilgængelig',
  
  // Placeholders
  enterCarName: 'Indtast bil navn',
  enterCarNumber: 'Indtast bil nummer',
  enterNumberPlate: 'Indtast nummerplade',
  enterFuelCardCode: 'Indtast tankkortkode',
  enterNotes: 'Indtast noter (valgfrit)',
  
  // Selection
  selectCar: 'Vælg en bil',
  noCar: 'Ingen bil',
  
  // Missing translations that were causing issues
  unavailabilityReason: 'Årsag til utilgængelighed',
  enterNote: 'Indtast note',
  
  // Added missing translations for note management
  keepNoteQuestion: 'Vil du beholde den nuværende note?',
  keepNote: 'Behold note',
  deleteNote: 'Slet note',

  // New error message translations
  cannotDeleteCarInUse: 'Kan ikke slette køretøj',
  cannotDeleteCarInUseDesc: 'Dette køretøj kan ikke slettes, fordi det er tildelt en eller flere opgaver. Fjern det fra alle opgaver først eller marker det som utilgængeligt i stedet.',
  deleteError: 'Fejl ved sletning af køretøj. Prøv igen.',

  // Additional translations to match English version
  addVehicle: 'Tilføj Køretøj',
  editVehicle: 'Rediger Køretøj',
  addNewVehicle: 'Tilføj Nyt Køretøj',
  updateVehicleInfo: 'Opdater køretøjsinformation.',
  addNewVehicleDesc: 'Tilføj et nyt køretøj til afdelingen.',
  vehicleUpdated: 'Køretøj opdateret',
  vehicleAdded: 'Køretøj tilføjet',
  vehicleDeleted: 'Køretøj slettet',
  vehicleUpdatedMsg: '{name}s information er blevet opdateret.',
  vehicleAddedMsg: '{name} er blevet tilføjet til afdelingen.',
  vehicleDeletedMsg: '{name} er blevet fjernet fra afdelingen.',
  vehicleDeletedWithCleanup: '{name} er blevet fjernet fra afdelingen og {count} opgaver er blevet opdateret.',
  vehicleAvailable: 'Køretøj tilgængeligt',
  vehicleUnavailable: 'Køretøj utilgængeligt',
  vehicleAvailableMsg: '{name} er nu markeret som tilgængelig.',
  vehicleUnavailableMsg: '{name} er nu markeret som utilgængelig.',
  notesFeatureUnavailable: 'Notefunktionen er ikke fuldt tilgængelig endnu. Tilgængelighedsstatus er blevet opdateret.'
};

export default cars;
