
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
    mold: 'Skimmelsvamp vurdering',
    other: 'Andre opgaver'
  },
  location: 'Lokation',
  systemMetrics: 'System Metrikker',
  metrics: {
    activeAssignments: 'Aktive Opgaver',
    activeAssignmentsDesc: 'Igangværende publicerede opgaver',
    upcomingVacations: 'Kommende Ferier',
    upcomingVacationsDesc: 'Godkendte ferieanmodninger',
    vehicleStatus: 'Køretøjsstatus',
    vehicleStatusDesc: 'Tilgængelige / Samlede køretøjer',
    employeeActivity: 'Medarbejderaktivitet',
    employeeActivityDesc: 'Gennemsnitlig aktivitetsrate denne måned'
  },
  charts: {
    assignmentDistribution: 'Opgavefordeling'
  },
  upcomingVacations: 'Kommende Ferier',
  noUpcomingVacations: 'Ingen kommende ferier planlagt',
  vehicleStatus: 'Køretøjsstatus',
  available: 'Tilgængelig',
  inUse: 'I brug'
};

export default dashboard;
