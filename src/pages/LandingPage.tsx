import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import CoursesSection from '../components/landing/CoursesSection';
import AlumniSection from '../components/landing/AlumniSection';
import EventsSection from '../components/landing/EventsSection';
import JobsSection from '../components/landing/JobsSection';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <CoursesSection />
        <AlumniSection />
        <EventsSection />
        <JobsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
