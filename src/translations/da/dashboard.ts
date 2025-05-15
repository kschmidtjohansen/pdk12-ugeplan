
const dashboard = {
  welcome: 'Velkommen, {name}',
  today: 'I dag er det {date}, vi er i uge {week}',
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
  upcomingVacations: 'Kommende/Igangværende Fridage',
  noUpcomingVacations: 'Ingen kommende/igangværende fridage planlagt',
  vehicleStatus: 'Køretøjsstatus',
  available: 'Tilgængelig',
  inUse: 'I brug',
  availableEmployees: 'Dagens tilgængelige servicemedarbejdere',
  availableEmployeesDesc: 'Medarbejdere som er klar til at blive tildelt opgaver',
  onLeaveEmployees: 'Dagens fraværende servicemedarbejdere',
  unavailableEmployeesDesc: 'Medarbejdere som ikke er tilgængelige for opgaver',
  noAvailableEmployees: 'Ingen tilgængelige medarbejdere fundet',
  noUnavailableEmployees: 'Ingen fraværende medarbejdere fundet',
  onVacation: 'På ferie',
  onAssignment: 'På opgave',
  tomorrow: 'I morgen',
  yesterday: 'I går',
  totalEmployees: 'Samlede medarbejdere: {count}',
  totalCars: 'Samlede biler: {count}',
  availableCars: 'Tilgængelige Biler',
  todayAssignments: 'Dagens Opgaver',
  scheduledToday: 'Opgaver planlagt til i dag',
  upcomingAssignments: 'Kommende Opgaver',
  noData: 'Ingen data tilgængelig'
};

export default dashboard;
