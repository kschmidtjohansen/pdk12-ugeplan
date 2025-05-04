
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Users, 
  Car, 
  LogIn, 
  Search, 
  User,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account."
    });
    navigate('/');
  };

  // Don't show layout for login page
  if (location.pathname === "/") {
    return <>{children}</>;
  }

  const navigationItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <Search className="h-5 w-5" /> },
    { path: '/planner', name: 'Weekly Planner', icon: <Clock className="h-5 w-5" /> },
    { path: '/employees', name: 'Employees', icon: <Users className="h-5 w-5" /> },
    { path: '/cars', name: 'Cars', icon: <Car className="h-5 w-5" /> },
    { path: '/vacation', name: 'Vacation', icon: <Calendar className="h-5 w-5" /> },
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-polygon-lightgray">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You need to log in to access this page.</p>
          <Button onClick={() => navigate('/')}>
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-polygon-lightgray">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white polygon-shadow">
        <div className="p-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center justify-center">
            <img 
              src="https://www.polygongroup.com/contentassets/b818881348e84bee9795695eb87c9516/polygon_pos_rgb.png" 
              alt="Polygon Logo" 
              className="polygon-logo"
            />
          </Link>
        </div>
        
        <nav className="flex-1 pt-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-6 py-3 text-gray-700 hover:bg-polygon-lightgray",
                    location.pathname === item.path && "bg-polygon-lightgray border-l-4 border-polygon-red"
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="rounded-full bg-polygon-red p-2 mr-3">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-gray-700"
            onClick={handleLogout}
          >
            <LogIn className="mr-2 h-4 w-4 rotate-180" /> 
            Logout
          </Button>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white polygon-shadow">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center">
            <img 
              src="https://www.polygongroup.com/contentassets/b818881348e84bee9795695eb87c9516/polygon_pos_rgb.png" 
              alt="Polygon Logo" 
              className="h-8 w-auto"
            />
          </Link>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="bg-white border-t border-gray-200">
            <ul>
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-6 py-4 text-gray-700",
                      location.pathname === item.path && "bg-polygon-lightgray border-l-4 border-polygon-red"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  className="w-full py-4 text-left px-6 flex items-center"
                  onClick={handleLogout}
                >
                  <LogIn className="mr-3 h-5 w-5 rotate-180" /> 
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        )}
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
