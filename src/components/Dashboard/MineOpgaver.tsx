
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useCars } from '@/hooks/car';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Calendar, Users, Car, Navigation, Timer, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { getCurrentWeekInfo, getWeekDates } from '@/utils/dates';
import { da } from 'date-fns/locale';

const MineOpgaver: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments, loading, error } = useAssignmentDataOptimized();
  const { cars } = useCars();

  // Filter assignments for current week only
  const userAssignments = React.useMemo(() => {
    if (!user?.id || !assignments) return [];
    
    const { week: currentWeek, year: currentYear } = getCurrentWeekInfo();
    const currentWeekDates = getWeekDates(currentWeek, currentYear);
    
    console.log('[MineOpgaver] COMPREHENSIVE FIX - Filtering assignments:', {
      userName: user.name,
      userId: user.id,
      totalAssignments: assignments.length,
      currentWeek,
      currentYear
    });
    
    const userTasks = assignments.filter(assignment => {
      // Check if user is assigned via assignedEmployees (preferred) or legacy employees array
      const isAssignedViaNew = assignment.assignedEmployees?.some(emp => emp.id === user.id);
      const isAssignedViaLegacy = assignment.employees?.includes(user.name);
      const isResponsible = assignment.responsibleUser?.id === user.id;
      const assignmentDate = parseISO(assignment.date);
      
      // Check if assignment is in current week
      const isInCurrentWeek = assignmentDate >= currentWeekDates.start && assignmentDate <= currentWeekDates.end;
      
      const isUserInvolved = isAssignedViaNew || isAssignedViaLegacy || isResponsible;
      
      console.log(`[MineOpgaver] Assignment "${assignment.title}":`, {
        currentUserId: user.id,
        currentUserName: user.name,
        isAssignedViaNew,
        isAssignedViaLegacy,
        isResponsible,
        isInCurrentWeek,
        isUserInvolved,
        published: assignment.published,
        assignedEmployeeIds: assignment.assignedEmployees?.map(e => e.id),
        assignedEmployeeNames: assignment.assignedEmployees?.map(e => e.name),
        legacyEmployees: assignment.employees,
        responsibleUserId: assignment.responsibleUser?.id
      });
      
      return isUserInvolved && isInCurrentWeek; // FIXED: Removed published filter so servicemedarbejder can see all assignments they're involved in
    });

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const startOfToday = new Date(`${todayStr}T00:00:00`);
    const endOfToday = new Date(`${todayStr}T23:59:59`);

    const weight = (d: Date) => (d >= startOfToday && d <= endOfToday) ? 0 : (d > endOfToday ? 1 : 2);

    const sorted = userTasks.sort((a, b) => {
      const da = parseISO(a.date);
      const db = parseISO(b.date);
      const wa = weight(da);
      const wb = weight(db);
      if (wa !== wb) return wa - wb;
      if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
      return a.fromTime.localeCompare(b.fromTime);
    });

    return sorted.slice(0, 5); // Show max 5 tasks with today first, past at bottom
  }, [assignments, user]);

  // Helper function to get car names from assignment
  const getCarNames = (assignment: any): string[] => {
    const carNames: string[] = [];
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array with IDs
      assignment.cars.forEach((carId: string) => {
        if (carId) {
          const car = cars.find(c => c.id === carId);
          if (car) {
            carNames.push(car.name);
          } else {
            carNames.push(`Car ${carId.substring(0, 8)}`);
          }
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        } else {
          carNames.push(`Car ${assignment.car.substring(0, 8)}`);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    return carNames;
  };

  // Helper function to generate Google Maps navigation URL
  const generateNavigationUrl = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    return `https://www.google.com/maps/dir/Current+Location/${encodedLocation}`;
  };

  // Helper function to handle navigation
  const handleNavigate = (location: string) => {
    const url = generateNavigationUrl(location);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // PHASE 3 FIX: Enhanced date formatting
  const formatAssignmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = currentLanguage === 'da' ? da : undefined;
    
    if (isToday(date)) {
      return t('common.today') || 'I dag';
    } else if (isTomorrow(date)) {
      return t('common.tomorrow') || 'I morgen';
    } else {
      return format(date, 'EEE d. MMM', { locale });
    }
  };


  console.log(`[MineOpgaver] PHASE 3 FIX - User assignments:`, {
    userName: user?.name,
    totalAssignments: assignments.length,
    userAssignments: userAssignments.length,
    assignmentsWithResponsible: userAssignments.filter(a => a.responsibleUser).length,
    assignmentsWithFullEmployeeData: userAssignments.filter(a => a.assignedEmployees?.length).length
  });

  if (loading) {
    return (
      <Card className="w-full glass-effect shadow-xl border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/20">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gradient">
                {t('dashboard.myTasks.title')}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Spinner size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full glass-effect shadow-xl border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/20">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gradient">
                {t('dashboard.myTasks.title')}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-base text-muted-foreground">
            {t('common.error') || 'Fejl ved indlæsning'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userAssignments.length === 0) {
    return (
      <Card className="w-full glass-effect shadow-xl border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/20">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gradient">
                {t('dashboard.myTasks.title')}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1 text-base">
                {t('dashboard.myTasks.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-base text-muted-foreground text-center">
            {t('dashboard.noUpcomingTasks') || 'Ingen kommende opgaver'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-effect shadow-xl border-0 bg-card/60 backdrop-blur-sm hover-lift">
      <CardHeader className="space-y-3 pb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/20">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gradient">
              {t('dashboard.myTasks.title') || 'Mine Opgaver'}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-base">
              {t('dashboard.myTasks.description') || 'Dine opgaver for ugen'}
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20">
              <span className="text-sm font-semibold text-primary">
                Uge {getCurrentWeekInfo().week}
              </span>
            </div>
            <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold bg-accent/20 border border-accent/30">
              {userAssignments.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {userAssignments.map((assignment, index) => (
          <div
            key={assignment.id}
            className="p-5 rounded-2xl border border-border/30 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm hover:from-primary/5 hover:to-primary/10 hover:border-primary/30 transition-all duration-300 group hover-lift animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {assignment.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-primary/20">
                  <Clock className="h-4 w-4" />
                  {formatAssignmentDate(assignment.date)}
                </div>
              </div>
            </div>

            {/* Location */}
            {assignment.location && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 p-3 rounded-xl bg-background/60 border border-border/30 backdrop-blur-sm">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate flex-1 font-medium text-foreground">{assignment.location}</span>
                  <button
                    onClick={() => handleNavigate(assignment.location)}
                    className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all duration-300 group hover:scale-110 shadow-lg shadow-primary/10"
                    title={t('dashboard.navigateToLocation') || 'Navigate to location'}
                    aria-label={t('dashboard.navigateToLocation') || 'Navigate to location'}
                  >
                    <Navigation className="h-5 w-5 text-primary group-hover:text-primary transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* Time */}
            {assignment.fromTime && assignment.toTime && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/30 border border-accent/50">
                  <Timer className="h-4 w-4 text-accent-foreground" />
                  <span className="text-sm font-semibold text-accent-foreground">
                    {assignment.fromTime?.substring(0, 5)} - {assignment.toTime?.substring(0, 5)}
                  </span>
                </div>
              </div>
            )}

            {/* Cars */}
            {(() => {
              const carNames = getCarNames(assignment);
              return carNames.length > 0 ? (
                <div className="flex items-start gap-3 mb-4">
                  <Car className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {carNames.map((carName, carIndex) => (
                      <span
                        key={carIndex}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 text-sm font-semibold rounded-xl border border-blue-200/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        {carName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Team members */}
            {(() => {
              let teamMembers = [];
              
              if (assignment.assignedEmployees?.length) {
                teamMembers = assignment.assignedEmployees.map(emp => emp.name);
              } else if (assignment.employees?.length) {
                teamMembers = assignment.employees;
              }
              
              return teamMembers.length > 0 ? (
                <div className="flex items-start gap-3 mb-4">
                  <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map((memberName, empIndex) => (
                      <span
                        key={empIndex}
                        className="px-3 py-2 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 text-sm font-semibold rounded-xl border border-green-200/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        {memberName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Responsible user */}
            {assignment.responsibleUser?.name && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-200/50">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">
                    {t('planner.responsible') || 'Sagsansvarlig'}: {assignment.responsibleUser.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* View all link */}
        <div className="pt-6 border-t border-border/30">
          <Link 
            to="/planner" 
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary hover:text-primary/90 font-semibold text-base rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300 hover-lift backdrop-blur-sm shadow-lg shadow-primary/10 group"
          >
            {t('dashboard.viewAllTasks') || 'Se alle opgaver'}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default MineOpgaver;
