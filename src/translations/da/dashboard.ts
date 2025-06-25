
const dashboard = {
  welcome: 'Velkommen, {name}',
  title: 'Dashboard',
  today: 'I dag er {date}, Uge {week}',
  availableEmployees: 'Tilgængelige medarbejdere',
  onLeaveEmployees: 'Medarbejdere på orlov',
  availableCars: 'Tilgængelige biler',
  todayAssignments: 'Dagens opgaver',
  scheduledToday: 'Planlagt for i dag',
  totalEmployees: '{count} medarbejdere i alt',
  totalCars: '{count} biler i alt',
  todaysDate: '{date}',
  viewAll: 'Se alle',
  myAssignments: 'Mine opgaver for uge {week}',
  noAssignments: 'Ingen opgaver planlagt',
  noAssignmentsScheduled: 'Ingen opgaver planlagt for denne uge',
  connectionIssueDetected: 'Forbindelsesproblem opdaget',
  connectionIssueDescription: 'Der kan være forbindelsesproblemer. Data er muligvis ikke aktuel.',
  
  // Metrics
  metrics: {
    availableEmployees: 'Tilgængelige medarbejdere',
    unavailableEmployees: 'Ikke-tilgængelige medarbejdere',
    unavailableSubtitle: 'På orlov eller ferie',
    availableCars: 'Tilgængelige biler',
    carsInUse: 'Biler i brug',
    carsInUseSubtitle: 'Aktuelt tildelt'
  },
  
  // Upcoming Vacations widget
  upcomingVacations: 'Kommende ferier',
  noUpcomingVacations: 'Ingen kommende ferier',
  
  // Employee availability dialogs
  availableEmployeesDesc: 'Medarbejdere tilgængelige og ikke tildelt opgaver',
  unavailableEmployeesDesc: 'Medarbejdere i øjeblikket på orlov eller ferie',
  
  // Quick access items
  quickAccess: {
    planner: {
      title: 'Planlægger',
      description: 'Se og administrer ugentlige skemaer'
    },
    vacation: {
      title: 'Ferie',
      description: 'Anmod om og administrer fridage'
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
