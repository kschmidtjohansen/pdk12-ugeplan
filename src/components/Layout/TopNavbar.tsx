
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Users, 
  Car, 
  LogIn, 
  Clock,
  Calendar,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Type definitions for navigation items
interface NavigationItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const TopNavbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account."
    });
    navigate('/');
  };

  // Don't show navbar for login page
  if (location.pathname === "/") {
    return null;
  }

  const navigationItems: NavigationItem[] = [
    { path: '/dashboard', name: 'Dashboard', icon: <Search className="h-5 w-5" /> },
    { path: '/planner', name: 'Weekly Planner', icon: <Clock className="h-5 w-5" /> },
    { path: '/employees', name: 'Employees', icon: <Users className="h-5 w-5" /> },
    { path: '/cars', name: 'Cars', icon: <Car className="h-5 w-5" /> },
    { path: '/vacation', name: 'Vacation', icon: <Calendar className="h-5 w-5" /> },
    { path: '/admin', name: 'Admin', icon: <Settings className="h-5 w-5" />, adminOnly: true },
  ];

  // Get user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Filter items based on user role
  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || user?.role === 'administrator'
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white shadow-md navbar-height">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <img 
                src="https://www.polygongroup.com/contentassets/b818881348e84bee9795695eb87c9516/polygon_pos_rgb.png" 
                alt="Polygon Logo" 
                className="polygon-logo"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                    location.pathname === item.path 
                      ? "bg-polygon-blue text-white" 
                      : "text-gray-700 hover:bg-polygon-lightgray"
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* User profile and mobile menu button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-polygon-lightgray focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* User dropdown */}
            <div className="hidden md:ml-4 md:flex md:items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9 profile-avatar">
                      <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogIn className="mr-2 h-4 w-4 rotate-180" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium flex items-center",
                  location.pathname === item.path 
                    ? "bg-polygon-blue text-white" 
                    : "text-gray-700 hover:bg-polygon-lightgray"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            
            {/* Mobile user info and logout */}
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10 profile-avatar">
                    <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                  <div className="text-sm font-medium text-gray-500 capitalize">{user?.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-700 justify-start"
                  onClick={handleLogout}
                >
                  <LogIn className="mr-3 h-5 w-5 rotate-180" /> 
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNavbar;
