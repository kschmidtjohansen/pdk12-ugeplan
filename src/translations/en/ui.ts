/**
 * Shared UI strings that used to be hardcoded in components.
 * Kept 1:1 in sync with src/translations/da/ui.ts.
 */
export const ui = {
  // General
  reloadPage: "Reload page",
  unexpectedError: "An unexpected error occurred. Try reloading the page, or contact support if the problem persists.",
  plannerWidgetError: "The rest of the weekly plan still works. Try reloading this part.",
  primaryNavigation: "Primary navigation",
  latestChanges: "Latest changes",
  read: "Read",
  unread: "Unread",
  darkTheme: "Dark theme",
  searchEllipsis: "Search…",
  nextPage: "Next page",
  pullDown: "Pull down",
  offlineMessage: "We cannot reach the server right now. Check your internet connection and try again. Your changes will not be saved until the connection is back.",
  keyFigures: "Key figures",
  absent: "Absent",
  availablePlural: "Available",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  nextWeek: "Next week",
  satShort: "Sat",
  sunShort: "Sun",

  // Weekly planner
  selectAssignment: "Select assignment",
  absence: "Absence",
  absenceThisDay: "Absence this day",
  absencePartDay: "Absence (part of day)",
  absenceFullDay: "Absence (full day)",
  absenceOrVacation: "Absence / vacation",
  searchVehicle: "Search vehicle…",
  searchEmployee: "Search employee…",
  clearSearch: "Clear search",
  searchPlannerPlaceholder: "Search case, customer, address or employee",
  searchPlannerAria: "Search this week's assignments",
  selectSubDepartment: "Select sub-department",
  removeBlockedAndContinue: "Remove blocked and continue",
  departmentNotReady: "The department is not ready yet. Wait a moment and try again.",
  carAssignFailed: "Could not assign vehicle",
  carAssignedOne: "Vehicle assigned to {count} assignment",
  carAssignedMany: "Vehicle assigned to {count} assignments",

  // Cars and workshop
  workshop: "Workshop",
  workshopPartial: "Workshop (partial)",
  workshopOnDate: "Workshop {date}",
  workshopVisit: "Workshop visit",
  workshopVisitRegistered: "Workshop visit registered",
  scheduledWorkshop: "Scheduled workshop",
  carInWorkshop: "The car is in the workshop",
  carScheduledWorkshop: "{car} is scheduled for the workshop {from} → {to}",
  carUnavailablePeriod: "{car} is not available in the selected period.",
  carMarkedUnavailableUpdated: "{car} is marked as unavailable. {count} assignment(s) updated.",
  carMarkedUnavailable: "{car} is marked as unavailable for the period.",
  carAvailableAgain: "{car} is available again.",
  reason: "Reason",
  reasonPlaceholder: "E.g. workshop, contact person...",
  endDateAfterStart: "End date must be after start date",
  environment: "environment",
  searchCarsPlaceholder: "Search car no., name, license plate…",

  // Employees
  searchEmployeesPlaceholder: "Search name, email, title…",
  employeeNoLongerSick: "{name} is no longer marked as sick",
  employeeEnrolledCourse: "{name} is enrolled in a course.",
  endDateAfterStartDot: "End date must be after start date.",
  makeVisibleInMainDepartment: "makes the employee visible in the main department's",

  // Duties
  drivingDuty: "Driving duty",
  drivingDuties: "Driving duties",
  confirmRemoveDuties: "Are you sure you want to remove {count} duties?",
  tempExpiringOne: "substitute expiring",
  tempExpiringMany: "substitutes expiring",
  tempExpiringTitle: "Substitutes expiring",

  // Search
  globalSearchPlaceholder: "Search case, address, colleague or car",

  // Admin
  locationAdded: "Location added",
  newLocationPlaceholder: "Name of new location...",
  locationDeleteWarning: "All storage linked to this location will have its location set to",
  selectAtLeastOneRole: "Select at least one role",
  vehicles: "Vehicles",
  vehiclesLower: "vehicles",
  chooseRolesDesc: "Choose which employee roles should be shown in this sub-department.",
  chooseVehiclesDesc: "Choose which vehicles belong to this sub-department.",
  noVehiclesInDepartment: "No vehicles in the department.",
  rolesHelp: "Select one or more roles. The highest role determines access.",
  reloadUserList: "Reload user list",

  // Weather alerts
  weatherZipInvalid: "Enter a 4-digit Danish postal code.",
  weatherTryAgain: "Try again.",
  weatherBarShown: "The bar appears at a minimum of {rain24} mm rain in 24 hours, {rain30} mm in 30 min or gusts above {gust} m/s",
  weatherInDepartmentArea: "in the department's service area",
  weatherBarDisabled: "The alert bar is turned off for this department.",

  // Files and messages
  looseFiles: "Other files",
  downloadDone: "Download complete",
  fileTooLarge: "The file is too large. Maximum size is 20MB.",
  mustBeLoggedInUpload: "You must be logged in to upload files",
  fileNotSaved: "The file was not saved correctly — please try again",
  mustBeLoggedInSend: "You must be logged in to send messages",
  newMessageOn: "New message on {title}",
  replyTo: "↳ Reply to:",

  // Login and security
  sessionExpired: "Session expired",
  roleChanged: "Role changed",
  confirmWithBiometrics: "Confirm with Face ID / fingerprint",
  followDeviceInstructions: "Follow the instructions on your device to log in.",
  confirmCancelled: "The confirmation was cancelled. Try again, or log in with your password.",
  confirmFailedDevice: "The confirmation could not be completed on this device. Try again, or log in with your password.",
  deviceConfirmedLogin: "Your device confirmed your login.",
  biometricRetryDesc: "The confirmation was cancelled or is unavailable on this device. Try again, or log in with your password.",
  passkeyNextTime: "Next time you will log in with Face ID, fingerprint or PIN.",
  passkeyTryFromProfile: "Try again from the profile menu.",
  biometricEnrollDesc: "Next time you can log in with Face ID, fingerprint or PIN — with no password at all.",
  biometricCancelledDevice: "The confirmation was cancelled on the device.",
  enrollFailedUnknown: "Registration failed without further explanation. Please try again.",
  quickLoginDisabled: "Quick login is turned off on this device.",
  tryAgainDot: "Try again.",
  pushWorksOnDevice: "Push notifications work on this device.",
  passwordMinLength: "The password must be at least 8 characters.",

  // Demo
  demoAutoCleanupWarning: "Demo data is cleared automatically in 1 minute. All changes will be lost.",
  demoSessionExtended: "Demo session extended",
  demoSessionExtendedDesc: "Demo session extended by 15 minutes.",
};

export default ui;
