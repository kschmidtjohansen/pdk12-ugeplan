/**
 * Fælles UI-tekster der tidligere var hardkodede i komponenterne.
 * Holdes 1:1 synkron med src/translations/en/ui.ts.
 */
export const ui = {
  // Generelt
  reloadPage: "Genindlæs side",
  unexpectedError: "Der opstod en uventet fejl. Prøv at genindlæse siden eller kontakt support, hvis problemet fortsætter.",
  plannerWidgetError: "Resten af ugeplanen virker stadig. Prøv at genindlæse denne del.",
  primaryNavigation: "Primær navigation",
  latestChanges: "Seneste ændringer",
  read: "Læst",
  unread: "Ulæst",
  darkTheme: "Mørkt tema",
  searchEllipsis: "Søg…",
  nextPage: "Næste side",
  pullDown: "Træk ned",
  offlineMessage: "Vi kan ikke nå serveren lige nu. Tjek din internetforbindelse og prøv igen. Dine ændringer gemmes ikke før forbindelsen er tilbage.",
  keyFigures: "Nøgletal",
  absent: "Fraværende",
  availablePlural: "Tilgængelige",
  previousMonth: "Forrige måned",
  nextMonth: "Næste måned",
  nextWeek: "Næste uge",
  satShort: "lør",
  sunShort: "søn",

  // Ugeplan
  selectAssignment: "Vælg opgave",
  absence: "Fravær",
  absenceThisDay: "Fravær denne dag",
  absencePartDay: "Fravær (del af dag)",
  absenceFullDay: "Fravær (hel dag)",
  absenceOrVacation: "Fravær / ferie",
  searchVehicle: "Søg køretøj…",
  searchEmployee: "Søg medarbejder…",
  clearSearch: "Ryd søgning",
  searchPlannerPlaceholder: "Søg sag, kunde, adresse eller medarbejder",
  searchPlannerAria: "Søg i ugens opgaver",
  selectSubDepartment: "Vælg underafdeling",
  removeBlockedAndContinue: "Fjern blokerede og fortsæt",
  departmentNotReady: "Afdeling er ikke klar endnu. Vent et øjeblik og prøv igen.",
  carAssignFailed: "Kunne ikke tildele køretøj",
  carAssignedOne: "Køretøj tildelt {count} opgave",
  carAssignedMany: "Køretøj tildelt {count} opgaver",

  // Biler og værksted
  workshop: "Værksted",
  workshopPartial: "Værksted (delvis)",
  workshopOnDate: "Værksted {date}",
  workshopVisit: "Værkstedsbesøg",
  workshopVisitRegistered: "Værkstedsbesøg registreret",
  scheduledWorkshop: "Planlagt værksted",
  carInWorkshop: "Bilen er på værksted",
  carScheduledWorkshop: "{car} er planlagt til værksted {from} → {to}",
  carUnavailablePeriod: "{car} er ikke tilgængelig i den valgte periode.",
  carMarkedUnavailableUpdated: "{car} er markeret som ikke tilgængelig. {count} opgave(r) er opdateret.",
  carMarkedUnavailable: "{car} er markeret som ikke tilgængelig i perioden.",
  carAvailableAgain: "{car} er nu tilgængelig igen.",
  reason: "Årsag",
  reasonPlaceholder: "Fx værksted, kontaktperson...",
  endDateAfterStart: "Slutdato skal være efter startdato",
  environment: "miljø",
  searchCarsPlaceholder: "Søg bilnr, navn, nummerplade…",

  // Medarbejdere
  searchEmployeesPlaceholder: "Søg navn, email, titel…",
  employeeNoLongerSick: "{name} er ikke længere markeret som syg",
  employeeEnrolledCourse: "{name} er meldt på kursus.",
  endDateAfterStartDot: "Slutdato skal være efter startdato.",
  makeVisibleInMainDepartment: "gør medarbejderen synlig i hovedafdelingens",

  // Vagter
  drivingDuty: "Kørevagt",
  drivingDuties: "Kørevagter",
  confirmRemoveDuties: "Er du sikker på, at du vil fjerne {count} vagter?",
  tempExpiringOne: "vikar udløber",
  tempExpiringMany: "vikarer udløber",
  tempExpiringTitle: "Vikarer der udløber",

  // Søgning
  globalSearchPlaceholder: "Søg sag, adresse, kollega eller bil",

  // Admin
  locationAdded: "Lokation tilføjet",
  newLocationPlaceholder: "Navn på ny lokation...",
  locationDeleteWarning: "Alle opbevaringer tilknyttet denne lokation vil få deres lokation sat til",
  selectAtLeastOneRole: "Vælg mindst én rolle",
  vehicles: "Køretøjer",
  vehiclesLower: "køretøjer",
  chooseRolesDesc: "Vælg hvilke medarbejderroller der skal vises i denne underafdeling.",
  chooseVehiclesDesc: "Vælg hvilke køretøjer der hører til denne underafdeling.",
  noVehiclesInDepartment: "Ingen køretøjer i afdelingen.",
  rolesHelp: "Vælg én eller flere roller. Højeste rolle bestemmer adgangen.",
  reloadUserList: "Genindlæs brugerliste",

  // Vejrvarsel
  weatherZipInvalid: "Skriv et dansk postnummer på 4 cifre.",
  weatherTryAgain: "Prøv igen.",
  weatherBarShown: "Bjælken vises ved mindst {rain24} mm regn på 24 timer, {rain30} mm på 30 min eller vindstød over {gust} m/s",
  weatherInDepartmentArea: "i afdelingens opgaveområde",
  weatherBarDisabled: "Beredskabsbjælken er slået fra for denne afdeling.",

  // Filer og beskeder
  looseFiles: "Løse filer",
  downloadDone: "Download færdig",
  fileTooLarge: "Filen er for stor. Maksimal størrelse er 20MB.",
  mustBeLoggedInUpload: "Du skal være logget ind for at uploade filer",
  fileNotSaved: "Filen blev ikke gemt korrekt — prøv igen",
  mustBeLoggedInSend: "Du skal være logget ind for at sende beskeder",
  newMessageOn: "Ny besked på {title}",
  replyTo: "↳ Svar på:",

  // Login og sikkerhed
  sessionExpired: "Session udløbet",
  roleChanged: "Rolle ændret",
  confirmWithBiometrics: "Bekræft med Face ID / fingeraftryk",
  followDeviceInstructions: "Følg vejledningen på din enhed for at logge ind.",
  confirmCancelled: "Bekræftelsen blev afbrudt. Prøv igen, eller log ind med din adgangskode.",
  confirmFailedDevice: "Bekræftelsen kunne ikke gennemføres på denne enhed. Prøv igen, eller log ind med din adgangskode.",
  deviceConfirmedLogin: "Din enhed bekræftede dit login.",
  biometricRetryDesc: "Bekræftelsen blev afbrudt eller er ikke tilgængelig på denne enhed. Prøv igen, eller log ind med din adgangskode.",
  passkeyNextTime: "Næste gang logger du ind med Face ID, fingeraftryk eller pinkode.",
  passkeyTryFromProfile: "Prøv igen fra profilmenuen.",
  biometricEnrollDesc: "Næste gang kan du logge ind med Face ID, fingeraftryk eller pinkode — helt uden adgangskode.",
  biometricCancelledDevice: "Bekræftelsen blev afbrudt på enheden.",
  enrollFailedUnknown: "Registreringen fejlede uden en nærmere forklaring. Prøv igen.",
  quickLoginDisabled: "Hurtig login er slået fra på denne enhed.",
  tryAgainDot: "Prøv igen.",
  pushWorksOnDevice: "Push-notifikationer virker på denne enhed.",
  passwordMinLength: "Adgangskoden skal være mindst 8 tegn.",

  // Demo
  demoAutoCleanupWarning: "Demo data ryddes automatisk om 1 minut. Alle ændringer mistes.",
  demoSessionExtended: "Demo session forlænget",
  demoSessionExtendedDesc: "Demo session forlænget med 15 minutter.",
};

export default ui;
