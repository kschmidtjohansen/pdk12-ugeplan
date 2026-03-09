
const cars = {
  // Basic car information
  vehicleInfo: "Vehicle Information",
  vehicleName: "Vehicle Name",
  vehicleNumber: "Vehicle Number",
  carNumber: "Car Number",
  numberPlate: "Number Plate",
  fuelCardCode: "Fuel Card Code",
  showInPlanner: "Show in Planner",
  towingCapacityWithBrakes: 'With Brakes',
  towingCapacityWithoutBrakes: 'Without Brakes',
  totalWeight: 'Total Weight',
  
  // Dialog actions
  editVehicle: "Edit Vehicle",
  addNewVehicle: "Add New Vehicle",
  updateVehicleInfo: "Update the vehicle information below",
  addNewVehicleDesc: "Fill in the details for the new vehicle",
  
  // Car selection and status
  selectCar: 'Select car',
  noCar: 'No car',
  removeCar: 'Remove car',
  available: 'Available',
  unavailable: 'Unavailable',
  inUse: 'In use until {time}',
  inUseFullDay: 'In use all day',
  
  // Vehicle features
  hasTrailerHitch: 'Has Trailer Hitch',
  isAvailable: 'Is Available',
  
  // Actions
  markAvailable: 'Mark as Available',
  markUnavailable: 'Mark as Unavailable',
  
  // Status messages
  vehicleAvailable: 'Vehicle available',
  vehicleUnavailable: 'Vehicle unavailable',
  vehicleAvailableMsg: '{name} is now marked as available.',
  vehicleUnavailableMsg: '{name} is now marked as unavailable.',
  
  // Notes and reasons
  unavailabilityReason: 'Please provide a reason why this vehicle is unavailable',
  enterNote: 'Enter note...',
  keepNoteQuestion: 'Do you want to keep or delete the note for this vehicle?',
  keepNote: 'Keep Note',
  deleteNote: 'Delete Note',
  notes: 'Notes',
  notesFeatureUnavailable: 'Notes feature is not fully available yet. Availability status has been updated.',
  
  // Messages
  carAdded: 'Car added',
  carUpdated: 'Car updated',
  carDeleted: 'Car deleted',
  vehicleUpdated: 'Vehicle updated',
  vehicleAdded: 'Vehicle added',
  vehicleDeleted: 'Vehicle deleted',
  vehicleUpdatedMsg: '{name}\'s information has been updated.',
  vehicleAddedMsg: '{name} has been added to the department.',
  vehicleDeletedMsg: '{name} has been removed from the department.',
  vehicleDeletedWithCleanup: '{name} has been removed from the department and {count} assignments have been updated.',
  
  // Error messages
  errorAddingCar: 'Error adding car',
  errorUpdatingCar: 'Error updating car',
  errorDeletingCar: 'Error deleting car',
  cannotDeleteCarInUse: 'Cannot delete vehicle',
  cannotDeleteCarInUseDesc: 'This vehicle cannot be deleted because it is assigned to one or more tasks. Please unassign it from all tasks first or mark it as unavailable instead.',
  deleteError: 'Failed to delete vehicle. Please try again.',
  
  // Page content
  pageDescription: 'Edit cars and their availability',
  addNewCar: 'Add New Vehicle',
  
  // Error messages for fetching
  fetchError: 'Failed to fetch vehicles. Please try again.',
  noCarsInSubDepartment: 'No cars assigned to this sub-department',
  selectAtLeastOneSubDepartment: 'Select at least one sub-department',
  
  // Falck
  falckSubscription: 'Falck Vejhjælp',
  falckSubscriptionNumber: 'Subscription Number',
  falckSubscriptionEmpty: 'No subscription number registered',
  falckSubscriptionUpdated: 'Subscription number updated',
  falckPhoneLabel: 'Emergency Phone',
  falckPhoneNumber: '70 10 20 30',
};

export default cars;
