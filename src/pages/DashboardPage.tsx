
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/Layout/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock } from 'lucide-react';

// Mock data
const currentAssignments = [
  {
    id: '1',
    title: 'Water damage inspection',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employee: 'John Doe',
  },
  {
    id: '2',
    title: 'Fire damage restoration',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'Copenhagen South',
    car: 'Truck 3',
    employee: 'Jane Smith',
  },
  {
    id: '3',
    title: 'Mold assessment',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense East',
    car: 'Van 2',
    employee: 'Mike Johnson',
  },
];

// Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return weekNum;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const currentWeek = getCurrentWeek();

  // Quick access items based on user role
  const getQuickAccessItems = () => {
    const baseItems = [
      { 
        title: 'Weekly Planner', 
        icon: <Clock className="h-10 w-10" />,
        description: 'View and manage weekly assignments',
        link: '/planner'
      },
      { 
        title: 'Vacation', 
        icon: <Calendar className="h-10 w-10" />,
        description: 'Apply for or manage vacation time',
        link: '/vacation'
      },
    ];
    
    // Add role-specific items
    if (user?.role === 'administrator' || user?.role === 'skadeleder') {
      baseItems.push(
        { 
          title: 'Employees', 
          icon: <Users className="h-10 w-10" />,
          description: 'Manage department employees',
          link: '/employees'
        },
        { 
          title: 'Cars', 
          icon: <Car className="h-10 w-10" />,
          description: 'View and manage department vehicles',
          link: '/cars'
        }
      );
    }
    
    return baseItems;
  };

  return (
    <>
      <PageHeader 
        title={`Welcome, ${user?.name}`}
        description={`Today is ${new Date().toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getQuickAccessItems().map((item, index) => (
          <Link key={index} to={item.link} className="block">
            <Card className="h-full hover:border-polygon-red transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="text-polygon-red">{item.icon}</div>
                <CardTitle className="mt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Week {currentWeek} Assignments</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/planner">View All</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAssignments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No assignments for this week
            </p>
          ) : (
            <div className="grid gap-4">
              {currentAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="border rounded-md p-4 bg-white hover:border-polygon-red transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h3 className="font-medium">{assignment.title}</h3>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                      {new Date(assignment.date).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{assignment.fromTime} - {assignment.toTime}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{assignment.employee}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{assignment.car}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button asChild className="bg-polygon-red hover:bg-polygon-darkred">
            <Link to="/planner">
              <Clock className="mr-2 h-4 w-4" />
              Manage Assignments
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default DashboardPage;
