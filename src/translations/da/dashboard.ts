
const dashboard = {
  welcome: 'Velkommen, {name}',
  today: 'I dag er det {date}, vi er i Uge {week}',
  quickAccess: {
    planner: {
      title: 'Ugeplan',
      description: 'Se og administrer ugentlige opgaver'
    },
    vacation: {
      title: 'Ferie',
      description: 'Ansøg om eller administrer fridage'
    },
    employees: {
      title: 'Medarbejdere',
      description: 'Administrer afdelingens medarbejdere'
    },
    cars: {
      title: 'Biler',
      description: 'Se og administrer afdelingens køretøjer'
    }
  },
  weekAssignments: 'Opgaver - Uge {week}',
  myAssignments: 'Mine Opgaver - Uge {week}',
  viewAll: 'Se alle',
  noAssignments: 'Ingen opgaver for denne uge',
  assignmentTime: '{fromTime} - {toTime}',
  manageAssignments: 'Administrer Opgaver',
  assignments: {
    waterDamage: 'Vandskade inspektion',
    fireDamage: 'Brandskade restaurering',
    mold: 'Skimmelsvamp vurdering'
  },
  location: 'Lokation',
  
  // New metrics translations
  metrics: {
    todayTasks: 'Dagens opgaver',
    tasksDescription: 'Planlagte opgaver i dag',
    activeEmployees: 'Aktive medarbejdere',
    employeesDescription: 'Medarbejdere på vagt i dag',
    activeCars: 'Aktive køretøjer',
    carsDescription: 'Køretøjer i brug i dag',
    onVacation: 'På ferie',
    vacationDescription: 'Medarbejdere på ferie'
  },
  
  // Dashboard widgets
  assignmentDistribution: 'Opgavefordeling',
  upcomingVacations: 'Kommende ferier',
  vehicleStatus: 'Køretøjsstatus',
  currentlyOnLeave: 'På ferie nu',
  startingSoon: 'Starter snart',
  inUse: 'I brug',
  available: 'Tilgængelig'
};

export default dashboard;
