
export const admin = {
  title: 'Administration',
  description: 'Administrer systemindstillinger og brugere',
  userManagement: 'Brugerstyring',
  users: 'Brugere',
  createUser: 'Opret bruger',
  editUser: 'Rediger bruger',
  deleteUser: 'Slet bruger',
  systemMetrics: 'Systemmetrikker',
  
  // User form
  userForm: {
    name: 'Navn',
    email: 'Email',
    role: 'Rolle',
    password: 'Adgangskode',
    confirmPassword: 'Bekræft adgangskode',
    passwordsMustMatch: 'Adgangskoder skal være ens',
    passwordMinLength: 'Adgangskoden skal være mindst 6 tegn',
    emailRequired: 'Email er påkrævet',
    nameRequired: 'Navn er påkrævet',
    roleRequired: 'Rolle er påkrævet'
  },
  
  // Roles
  roles: {
    administrator: 'Administrator',
    skadeleder: 'Skadeleder',
    servicemedarbejder: 'Servicemedarbejder'
  },
  
  // Actions
  createUserSuccess: 'Bruger oprettet med succes',
  updateUserSuccess: 'Bruger opdateret med succes',
  deleteUserSuccess: 'Bruger slettet med succes',
  createUserError: 'Fejl ved oprettelse af bruger',
  updateUserError: 'Fejl ved opdatering af bruger',
  deleteUserError: 'Fejl ved sletning af bruger',
  
  // Confirmations
  deleteUserConfirm: 'Er du sikker på, at du vil slette denne bruger?',
  deleteUserWarning: 'Denne handling kan ikke fortrydes.',
  
  // Status
  active: 'Aktiv',
  inactive: 'Inaktiv',
  changeStatus: 'Skift status',
  activateUser: 'Aktiver bruger',
  deactivateUser: 'Deaktiver bruger',
  
  // Password reset
  resetPassword: 'Nulstil adgangskode',
  resetPasswordSuccess: 'Adgangskode nulstillet med succes',
  resetPasswordError: 'Fejl ved nulstilling af adgangskode',
  resetPasswordConfirm: 'Er du sikker på, at du vil nulstille adgangskoden for denne bruger?'
};
