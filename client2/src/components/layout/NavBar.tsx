import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import furkidsLogo from '../../assets/furkids.webp';

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Nav items for different user types
  const getNavigationItems = () => {
    const publicItems = [
      { name: 'Service Rates', href: '/service-rates' },
      { name: 'Grooming Policy', href: '/grooming-policy' },
      { name: 'Contact Us', href: '#footer', isScroll: true },
    ];

    if (!user) {
      return publicItems;
    }

    if (user.role === 'owner') {
      return [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Pets', href: '/pets' },
        { name: 'Appointments', href: '/appointments' },
        ...publicItems,
      ];
    }

    // groomer view
    return [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Calendar', href: '/calendar' },
      { name: 'Clients', href: '/clients' },
      ...publicItems,
    ];
  };

  const navigationItems = getNavigationItems();

  // handle nav with scroll to top for regular links
  const handleNavClick = (item: { name: string; href: string; isScroll?: boolean }) => {
    if (item.isScroll && item.href.startsWith('#')) {
      const element = document.getElementById(item.href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // scroll to top for regular page nav
      window.scrollTo(0, 0);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gray-900 shadow-lg sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* logo loco */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={furkidsLogo} 
                alt="Furkids Logo" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold text-white">Furkids</span>
            </Link>
          </motion.div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.isScroll ? (
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-gray-700`}
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => handleNavClick(item)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-300">
                  {user.firstName} {user.lastName}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  <button onClick={handleLogout}>Logout</button>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-700"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.isScroll ? (
                    <button
                      onClick={() => {
                        handleNavClick(item);
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => {
                        handleNavClick(item);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile User Actions */}
              <div className="border-t border-gray-700 pt-4">
                {user ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleLogout}
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default NavBar;
