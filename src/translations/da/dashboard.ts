
const dashboard = {
  welcome: 'Velkommen, {name}',
  today: 'I dag er {date}, Uge {week}',
  availableEmployees: 'Tilgængelige medarbejdere',
  onLeaveEmployees: 'Medarbejdere på orlov',
  availableCars: 'Tilgængelige biler',
  todayAssignments: "Dagens opgaver",
  scheduledToday: 'Planlagt for i dag',
  totalEmployees: '{count} medarbejdere i alt',
  totalCars: '{count} biler i alt',
  todaysDate: '{date}',
  viewAll: 'Se alle',
  myAssignments: 'Mine opgaver for uge {week}',
  noAssignments: 'Ingen opgaver planlagt for denne uge',
  
  // Upcoming Vacations widget
  upcomingVacations: 'Kommende ferier',
  noUpcomingVacations: 'Ingen kommende ferier',
  
  // Employee availability dialogs
  availableEmployeesDesc: 'Medarbejdere tilgængelige og ikke tildelt opgaver',
  unavailableEmployeesDesc: 'Medarbejdere på orlov eller ferie',
  
  // Metrics
  metrics: {
    availableEmployees: 'Tilgængelige medarbejdere',
    unavailableEmployees: 'Ikke-tilgængelige medarbejdere',
    unavailableSubtitle: 'På orlov eller ferie',
    availableCars: 'Tilgængelige biler',
    carsInUse: 'Biler i brug',
    carsInUseSubtitle: 'Tildelt for i dag'
  },
  
  // Quick access items
  quickAccess: {
    planner: {
      title: 'Planlægger',
      description: 'Se og administrer ugentlige planer'
    },
    vacation: {
      title: 'Ferie',
      description: 'Anmod om og administrer frihed'
    },
    employees: {
      title: 'Medarbejdere',
      description: 'Administrer medarbejderinformation'
    },
    cars: {
      title: 'Biler',
      description: 'Se og administrer bilpark'
    }
  }
};

export default dashboard;
