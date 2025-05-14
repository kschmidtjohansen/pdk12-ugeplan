
const vacation = {
  pageDescription: 'Ansøg om og administrer fridage',
  applyForVacation: 'Ansøg om fri',
  requestForEmployee: 'Ansøg for medarbejder',
  selectEmployee: 'Vælg medarbejder',
  selectEmployeeAndDates: 'Vælg en medarbejder, datoer og angiv en årsag til fraværet.',
  tabs: {
    all: 'Alle',
    pending: 'Afventende',
    approved: 'Godkendt',
    mine: 'Mine anmodninger'
  },
  noRequests: 'Ingen ferieforespørgsler fundet',
  status: {
    pending: 'Afventende',
    approved: 'Godkendt',
    rejected: 'Afvist'
  },
  dateRange: 'Datointerval',
  reason: 'Årsag',
  notes: 'Noter',
  requestedOn: 'Anmodet d.',
  reject: 'Afvis',
  approve: 'Godkend',
  selectDatesAndReason: 'Vælg dine feriedatoer og angiv en årsag.',
  selectVacationDates: 'Vælg fri datoer',
  reasonPlaceholder: 'Kort begrundelse for din anmodning om fri',
  submitRequest: 'Indsend anmodning',
  rejectRequest: 'Afvis ferieanmodning',
  approveRequest: 'Godkend ferieanmodning',
  rejectReasonDesc: 'Angiv venligst en årsag til afvisning af denne anmodning.',
  approveNoteDesc: 'Du kan tilføje en valgfri note til denne godkendelse.',
  rejectionReason: 'Årsag til afvisning',
  noteOptional: 'Note (valgfri)',
  rejectionReasonPlaceholder: 'Forklar hvorfor denne anmodning afvises',
  approveNotePlaceholder: 'Tilføj eventuelle yderligere noter til denne godkendelse',
  rejectRequestBtn: 'Afvis anmodning',
  approveRequestBtn: 'Godkend anmodning',
  missingDates: 'Manglende datoer',
  selectBothDates: 'Vælg venligst både start- og slutdatoer',
  requestSubmitted: 'Ferieanmodning indsendt',
  requestSent: 'Din anmodning er sendt til godkendelse.',
  adminRequestSubmitted: 'Ferieanmodning indsendt for medarbejder',
  adminRequestSent: 'Anmodningen for {name} er blevet sendt til godkendelse.',
  adminRequestedForYou: '{adminName} har anmodet om ferie for dig fra {from} til {to}',
  requestSubmittedForYou: 'Ferieanmodning indsendt for dig',
  requestRejected: 'Ferieanmodning afvist',
  requestApproved: 'Ferieanmodning godkendt',
  requestRejectedMsg: '{name}\'s anmodning er blevet afvist.',
  requestApprovedMsg: '{name}\'s anmodning er blevet godkendt.',
  yourRequestApproved: 'Din ferieanmodning er blevet godkendt.',
  yourRequestRejected: 'Din ferieanmodning er blevet afvist. Årsag: {reason}',
  error: 'Fejl',
  employeeNotFound: 'Medarbejderen kunne ikke findes',
  currentlyOnVacation: 'Medarbejdere på ferie',
  daysRemaining: 'Dage tilbage',
  days: 'dage',
  upcoming: 'Kommende',
  // New translations for vacation cleanup
  cleanup: {
    completed: 'Oprydning af ferieforespørgsler fuldført',
    completedMessage: 'Fjernede {count} afviste ferieforespørgsler ældre end 14 dage',
    failed: 'Oprydning af ferieforespørgsler mislykkedes',
    failedMessage: 'Der opstod en fejl under oprydning af gamle afviste ferieforespørgsler'
  }
};

export default vacation;
