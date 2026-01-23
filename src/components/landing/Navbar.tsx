import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); // Trigger sooner
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        isScrolled
          ? 'bg-dark-900/80 backdrop-blur-xl border-white/10 shadow-lg' // Lower opacity (80) para kita ang blur
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-300 z-50"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - FULL SCREEN MODAL */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-dark-900/98 backdrop-blur-xl transition-all duration-300 flex flex-col justify-center items-center ${
          isMobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <nav className="w-full max-w-sm px-6 flex flex-col gap-4 text-center">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollToSection(link.href)}
              className="text-2xl font-medium text-white/80 hover:text-white py-2 hover:scale-110 transition-all duration-300"
            >
              {link.name}
            </button>
          ))}
          
          <div className="h-px w-full bg-white/10 my-4" />
          
          <Link
            to="/login"
            className="w-full py-4 text-lg text-white/80 hover:text-white font-medium border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;