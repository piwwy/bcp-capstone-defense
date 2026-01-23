import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Courses', href: '#courses' },
    { name: 'Alumni', href: '#alumni' },
    { name: 'Events', href: '#events' },
    { name: 'News', href: '#news' },
    { name: 'Jobs', href: '#jobs' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          isScrolled
            ? 'bg-dark-900/90 backdrop-blur-xl border-white/10 shadow-lg'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-3 group z-50 relative">
              <div className="relative">
                <img
                  src="/images/Linker College Of The Philippines.png"
                  alt="LCP Logo"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="block">
                <h1 className="text-sm sm:text-xl font-bold text-white leading-tight">
                  ALUMNI PORTAL
                </h1>
                <p className="text-[10px] sm:text-xs text-blue-300/80">
                  Linker College Of The Philippines
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="nav-link px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 text-sm font-semibold text-white hover:text-blue-300 transition-colors duration-300"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button (Hamburger) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-300"
              aria-label="Open menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - SLIDE DOWN ANIMATION with WHITE BG */}
      <div
        className={`fixed inset-0 z-[60] bg-white transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col ${
          isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Mobile Menu Header (Logo + Close Button) */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img
               src="/images/Linker College Of The Philippines.png"
               alt="LCP Logo"
               className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-gray-900 tracking-tight">LCP Alumni</span>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto py-4 px-6 flex flex-col justify-center">
          <nav className="flex flex-col gap-2 text-center">
            {navLinks.map((link, index) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-3 rounded-xl transition-all duration-300"
                style={{ transitionDelay: `${index * 50}ms` }} // Staggered fade in effect
              >
                {link.name}
              </button>
            ))}
          </nav>

          <div className="w-12 h-1 bg-gray-100 mx-auto my-6 rounded-full" />

          {/* Mobile Auth Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <Link
              to="/login"
              className="w-full py-3.5 text-center font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="w-full py-3.5 text-center font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;