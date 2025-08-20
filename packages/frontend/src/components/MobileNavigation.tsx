import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from './common/Button';

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number;
  restricted?: 'patient' | 'doctor';
}

interface MobileNavigationProps {
  userType?: 'patient' | 'doctor' | null;
  userName?: string;
  onLogout?: () => void;
  notificationCount?: number;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  userType,
  userName,
  onLogout,
  notificationCount = 0,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Navigation items based on user type
  const getNavigationItems = (): NavigationItem[] => {
    const commonItems: NavigationItem[] = [
      {
        id: 'home',
        label: 'Home',
        path: '/',
        icon: '🏠'
      },
      {
        id: 'about',
        label: 'About',
        path: '/about',
        icon: 'ℹ️'
      }
    ];

    const patientItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/patient',
        icon: '📊',
        restricted: 'patient'
      },
      {
        id: 'new-query',
        label: 'New Query',
        path: '/patient/new-query',
        icon: '➕',
        restricted: 'patient'
      },
      {
        id: 'queries',
        label: 'My Queries',
        path: '/patient/queries',
        icon: '📋',
        restricted: 'patient'
      },
      {
        id: 'profile',
        label: 'Profile',
        path: '/patient/profile',
        icon: '👤',
        restricted: 'patient'
      }
    ];

    const doctorItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/doctor',
        icon: '🩺',
        restricted: 'doctor'
      },
      {
        id: 'patients',
        label: 'My Patients',
        path: '/doctor/patients',
        icon: '👥',
        restricted: 'doctor'
      },
      {
        id: 'incoming',
        label: 'Incoming Queries',
        path: '/doctor/incoming',
        icon: '📥',
        badge: notificationCount,
        restricted: 'doctor'
      },
      {
        id: 'assignments',
        label: 'Patient Assignments',
        path: '/doctor/assignments',
        icon: '📋',
        restricted: 'doctor'
      }
    ];

    if (userType === 'patient') {
      return [...commonItems, ...patientItems];
    } else if (userType === 'doctor') {
      return [...commonItems, ...doctorItems];
    } else {
      return [
        ...commonItems,
        {
          id: 'login-patient',
          label: 'Patient Login',
          path: '/patient/login',
          icon: '👤'
        },
        {
          id: 'login-doctor',
          label: 'Doctor Login',
          path: '/doctor/login',
          icon: '🩺'
        }
      ];
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          menuRef.current && 
          !menuRef.current.contains(event.target as Node) &&
          overlayRef.current &&
          !overlayRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowSubMenu(null);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsOpen(false);
  };

  const isActivePath = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className={`lg:hidden bg-white shadow-sm border-b border-gray-200 ${className}`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏥</span>
            <span className="text-lg font-semibold text-gray-900">
              TrustCare
            </span>
          </div>

          {/* Right side - notifications and hamburger */}
          <div className="flex items-center space-x-3">
            {/* Notification badge */}
            {userType && notificationCount > 0 && (
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  🔔
                </button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              </div>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded"
              aria-label="Open menu"
            >
              <div className="w-6 h-6 relative">
                <span className={`absolute block w-full h-0.5 bg-current transform transition duration-300 ease-in-out ${
                  isOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-0'
                }`} />
                <span className={`absolute block w-full h-0.5 bg-current transform transition duration-300 ease-in-out translate-y-2.5 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`} />
                <span className={`absolute block w-full h-0.5 bg-current transform transition duration-300 ease-in-out ${
                  isOpen ? '-rotate-45 translate-y-2.5' : 'translate-y-5'
                }`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🏥</span>
              <span className="text-lg font-semibold text-gray-900">
                TrustCare Connect
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          {userType && userName && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  {userType === 'doctor' ? '🩺' : '👤'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500 capitalize">{userType}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto">
            <div className="py-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {userType ? (
              <>
                <Button
                  onClick={() => handleNavigation('/settings')}
                  variant="secondary"
                  className="w-full justify-start"
                >
                  <span className="mr-2">⚙️</span>
                  Settings
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <span className="mr-2">🚪</span>
                  Logout
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => handleNavigation('/patient/login')}
                  variant="primary"
                  className="w-full"
                >
                  Patient Login
                </Button>
                <Button
                  onClick={() => handleNavigation('/doctor/login')}
                  variant="secondary"
                  className="w-full"
                >
                  Doctor Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for authenticated users */}
      {userType && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="grid grid-cols-4 gap-1">
            {navigationItems
              .filter(item => item.restricted === userType)
              .slice(0, 4)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex flex-col items-center py-2 px-1 text-xs relative ${
                    isActivePath(item.path)
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-lg mb-1">{item.icon}</span>
                  <span className="font-medium truncate w-full text-center">
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;

// Hook for managing mobile navigation state
export const useMobileNavigation = () => {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const openNavigation = () => setIsNavigationOpen(true);
  const closeNavigation = () => setIsNavigationOpen(false);
  const toggleNavigation = () => setIsNavigationOpen(prev => !prev);

  const updateNotificationCount = (count: number) => {
    setNotificationCount(count);
  };

  const incrementNotificationCount = () => {
    setNotificationCount(prev => prev + 1);
  };

  const decrementNotificationCount = () => {
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  return {
    isNavigationOpen,
    notificationCount,
    openNavigation,
    closeNavigation,
    toggleNavigation,
    updateNotificationCount,
    incrementNotificationCount,
    decrementNotificationCount,
    clearNotifications
  };
};