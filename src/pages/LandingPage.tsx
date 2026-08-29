import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import CoursesSection from '../components/landing/CoursesSection';
import AlumniSection from '../components/landing/AlumniSection';
import EventsSection from '../components/landing/EventsSection';
import JobsSection from '../components/landing/JobsSection';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';
import NewsSection from '../components/landing/NewsSection';
import DonationSection from '../components/landing/DonationSection';

const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // If authenticated, redirect to the appropriate dashboard
  if (user) {
    switch (user.role) {
      case 'superadmin': return <Navigate to="/superadmin/dashboard" replace />;
      case 'admin':
      case 'registrar': return <Navigate to="/admin/dashboard" replace />;
      case 'staff': return <Navigate to="/staff/dashboard" replace />;
      case 'alumni': {
        const pendingOtp = sessionStorage.getItem('otp_code');
        const lastOtpKey = `otp_verified_${user.id}`;
        const lastOtpTimestamp = localStorage.getItem(lastOtpKey);
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const isWithinMonth = lastOtpTimestamp && (Date.now() - parseInt(lastOtpTimestamp)) < THIRTY_DAYS_MS;

        if (pendingOtp || !isWithinMonth) {
          return <Navigate to="/alumni/2fa" replace />;
        }
        return <Navigate to="/alumni/dashboard" replace />;
      }
      default: break;
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <CoursesSection />
        <AlumniSection />
        <EventsSection />
        <NewsSection />
        <DonationSection />
        <JobsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
