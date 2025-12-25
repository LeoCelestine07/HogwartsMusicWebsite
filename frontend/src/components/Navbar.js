import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DEFAULT_LOGO = "https://customer-assets.emergentagent.com/job_audio-haven-21/artifacts/kjwts159_HOGWARTS%20%20white%20bg%20only%20logo%20.jpg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [content, setContent] = useState(null);
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API}/settings/content`);
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const navItems = [
    { name: content?.nav_home || 'Home', path: '/' },
    { name: content?.nav_services || 'Services', path: '/services' },
    { name: content?.nav_projects || 'Projects', path: '/projects' },
    { name: content?.nav_about || 'About', path: '/about' },
    { name: content?.nav_careers || 'Careers', path: '/careers' },
  ];

  const logoUrl = content?.logo_url || DEFAULT_LOGO;
  const brandName = content?.navbar_brand || 'Hogwarts';

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-500 ${
        scrolled ? 'top-4' : 'top-6'
      }`}
    >
      <div
        className={`rounded-full backdrop-blur-xl border transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a1a1f]/80 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-[#0a1a1f]/60 border-white/10'
        }`}
      >
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
            data-testid="navbar-logo"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <img 
                src={logoUrl} 
                alt={content?.logo_alt || "Hogwarts Music Studio"} 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-base lg:text-lg hidden sm:block">{brandName}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA & Auth */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  data-testid="nav-dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <User className="w-4 h-4" />
                  {user.name?.split(' ')[0]}
                </Link>
                <button
                  onClick={logout}
                  data-testid="nav-logout"
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                data-testid="nav-login"
                className="px-3 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Login
              </Link>
            )}
            <Link
              to="/booking"
              data-testid="nav-book-now"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,212,212,0.3)]"
            >
              {content?.nav_booking || 'Book Now'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-white/10 transition-colors"
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="px-6 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === item.path
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {user ? (
                    <>
                      <Link
                        to={isAdmin ? '/admin' : '/dashboard'}
                        className="block px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="block px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5"
                    >
                      Login
                    </Link>
                  )}
                  <Link
                    to="/booking"
                    className="block px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold text-sm text-center"
                  >
                    {content?.nav_booking || 'Book Now'}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
