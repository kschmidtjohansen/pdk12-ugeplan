
const cars = {
  // Basic car information
  vehicleInfo: "Køretøjsinformation",
  vehicleName: "Køretøjsnavn",
  vehicleNumber: "Køretøjsnummer",
  carNumber: "Bilnummer",
  numberPlate: "Nummerplade",
  fuelCardCode: "Brændstofkortkode",
  showInPlanner: "Vis i Planlægger",
  towingCapacityWithBrakes: 'Med bremser',
  towingCapacityWithoutBrakes: 'Uden bremser',
  totalWeight: 'Totalvægt',
  
  // Dialog actions
  editVehicle: "Rediger Køretøj",
  addNewVehicle: "Tilføj Nyt Køretøj",
  updateVehicleInfo: "Opdater køretøjsoplysningerne nedenfor",
  addNewVehicleDesc: "Udfyld detaljerne for det nye køretøj",
  
  // Car selection and status
  selectCar: 'Vælg bil',
  noCar: 'Ingen bil',
  removeCar: 'Fjern bil',
  available: 'Tilgængelig',
  unavailable: 'Ikke tilgængelig',
  inUse: 'I brug til {time}',
  inUseFullDay: 'I brug hele dagen',
  
  // Vehicle features
  hasTrailerHitch: 'Har anhængertræk',
  isAvailable: 'Er tilgængelig',
  
  // Actions
  markAvailable: 'Marker som tilgængelig',
  markUnavailable: 'Marker som ikke tilgængelig',
  
  // Status messages
  vehicleAvailable: 'Køretøj tilgængeligt',
  vehicleUnavailable: 'Køretøj ikke tilgængeligt',
  vehicleAvailableMsg: '{name} er nu markeret som tilgængelig.',
  vehicleUnavailableMsg: '{name} er nu markeret som ikke tilgængelig.',
  
  // Notes and reasons
  unavailabilityReason: 'Angiv venligst en grund til, at dette køretøj ikke er tilgængeligt',
  enterNote: 'Indtast note...',
  keepNoteQuestion: 'Vil du beholde eller slette noten for dette køretøj?',
  keepNote: 'Behold note',
  deleteNote: 'Slet note',
  notes: 'Noter',
  notesFeatureUnavailable: 'Notefunktionen er endnu ikke fuldt tilgængelig. Tilgængelighedsstatus er blevet opdateret.',
  
  // Messages
  carAdded: 'Bil tilføjet',
  carUpdated: 'Bil opdateret',
  carDeleted: 'Bil slettet',
  vehicleUpdated: 'Køretøj opdateret',
  vehicleAdded: 'Køretøj tilføjet',
  vehicleDeleted: 'Køretøj slettet',
  vehicleUpdatedMsg: '{name}s information er blevet opdateret.',
  vehicleAddedMsg: '{name} er blevet tilføjet til afdelingen.',
  vehicleDeletedMsg: '{name} er blevet fjernet fra afdelingen.',
  vehicleDeletedWithCleanup: '{name} er blevet fjernet fra afdelingen og {count} opgaver er blevet opdateret.',
  
  // Error messages
  errorAddingCar: 'Fejl ved tilføjelse af bil',
  errorUpdatingCar: 'Fejl ved opdatering af bil',
  errorDeletingCar: 'Fejl ved sletning af bil',
  cannotDeleteCarInUse: 'Kan ikke slette køretøj',
  cannotDeleteCarInUseDesc: 'Dette køretøj kan ikke slettes, fordi det er tildelt en eller flere opgaver. Fjern det fra alle opgaver først eller marker det som ikke tilgængeligt i stedet.',
  deleteError: 'Kunne ikke slette køretøj. Prøv igen.',
  
  // Page content
  pageDescription: 'Ret biler og deres tilgængelighed',
  addNewCar: 'Tilføj Nyt Køretøj',
  
  // Error messages for fetching
  fetchError: 'Kunne ikke hente køretøjer. Prøv venligst igen.'
};

export default cars;
