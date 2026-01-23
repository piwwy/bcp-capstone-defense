import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Scroll to section handler
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-dark-800/95 backdrop-blur-xl shadow-2xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* --- LOGO SECTION (WITH SECRET ADMIN TRIGGER) --- */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <img
                src="/images/Linker College Of The Philippines.png"
                alt="LCP Logo"
                // SECRET TRIGGER: Double click to go to Admin Login
                onDoubleClick={() => navigate('/admin/login')}
                title="Double click for Admin Access"
                className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110 select-none"
              />
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            
            <Link to="/" className="block">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                ALUMNI PORTAL
              </h1>
              <p className="text-[10px] sm:text-xs text-blue-300/80">
                Linker College Of The Philippines
              </p>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="nav-link px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-300"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-300"
              >
                {link.name}
              </button>
            ))}
            <div className="border-t border-white/10 mt-2 pt-4 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full px-4 py-3 text-center text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-300"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="w-full px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;