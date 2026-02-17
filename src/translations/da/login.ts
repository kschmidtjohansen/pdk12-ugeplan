
const login = {
  title: 'Log ind',
  description: 'Indtast dine oplysninger for at få adgang til ugeplanen',
  emailPlaceholder: 'din.email@polygongroup.com',
  passwordPlaceholder: '••••••••',
  button: 'Log ind',
  buttonLoading: 'Logger ind...',
  failed: 'Ugyldig email eller adgangskode. Prøv igen.',
  success: 'Du er nu logget ind.',
  logoutSuccess: 'Du er nu logget ud',
  welcomeMessage: 'Ugeplan',
  internalSystem: '',
  invalidCredentials: 'Ugyldig email eller adgangskode. Prøv igen.',
  tooManyRequests: 'For mange login-forsøg. Vent venligst før du prøver igen.',
  passwordReset: {
    forgotPassword: 'Glemt adgangskode?',
    title: 'Nulstil adgangskode',
    description: 'Indtast din email-adresse, og vi sender dig et link til at nulstille din adgangskode.',
    button: 'Send link til nulstilling',
    buttonLoading: 'Sender...',
    emailPlaceholder: 'Indtast email for nulstilling af adgangskode',
    sendResetEmail: 'Send ny adgangskode',
    emailSentTitle: 'Email sendt',
    emailSentDescription: 'Tjek din indbakke for linket til nulstilling af adgangskode.',
    emailError: 'Kunne ikke sende nulstillings-email. Prøv igen senere.',
    successMessage: 'Link til nulstilling af adgangskode er sendt!',
    checkEmail: 'Tjek din email for et link til at nulstille din adgangskode. Hvis det ikke dukker op indenfor få minutter, tjek din spam-mappe.',
    backToLogin: 'Tilbage til login',
    enterNewPassword: 'Indtast en ny adgangskode til din konto.',
    resetButton: 'Nulstil adgangskode',
    passwordUpdated: 'Din adgangskode er blevet opdateret!',
    resetError: 'Der opstod en fejl ved nulstilling af din adgangskode. Prøv venligst igen.'
  },
  resetYourPassword: 'Nulstil din adgangskode',
  invalidOrExpiredToken: 'Ugyldigt eller udløbet token',
  resetPasswordDescriptionPage: 'Indtast din nye adgangskode nedenfor.',
  newPassword: 'Ny adgangskode',
  confirmPassword: 'Bekræft adgangskode',
  updatePassword: 'Opdater adgangskode',
  passwordsDontMatch: 'Adgangskoderne stemmer ikke overens',
  passwordTooShort: 'Adgangskoden skal være mindst 6 tegn',
  passwordUpdated: 'Din adgangskode er blevet opdateret!',
  passwordError: 'Der opstod en fejl ved opdatering af din adgangskode',
  unexpectedError: 'Der opstod en uventet fejl',
  backToLogin: 'Tilbage til login',
  
  // Form error messages
  requiredFields: 'Udfyld venligst alle påkrævede felter.',
  timeout: 'Login tager længere tid end forventet. Prøv venligst igen.',
  lockedMessage: 'Konto midlertidigt låst på grund af for mange mislykkede forsøg. Prøv venligst igen senere.',
  refreshPage: 'Opdater side',
  tooManyAttemptsLock: 'Konto midlertidigt låst på grund af for mange mislykkede login-forsøg. Vent venligst 15 minutter før du prøver igen.',
  timeoutMessage: 'Login tager længere tid end forventet. Dette kan være et forbindelsesproblem.',
  
  // Department selector
  selectDepartment: 'Vælg hovedafdeling',
  selectDepartmentPlaceholder: 'Vælg afdeling...',
  departmentRequired: 'Vælg venligst en hovedafdeling før du logger ind.',
  departmentAccessDenied: 'Adgang nægtet. Du er ikke tilknyttet denne afdeling. Vælg venligst den korrekte afdeling og prøv igen.',
  loadingDepartments: 'Indlæser afdelinger...'
};

export default login;
