import React, { useEffect, useRef, useState } from 'react';
import { Users, Award, Building, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, suffix = '', label, delay }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, value, delay]);

  return (
    <div
      ref={ref}
      className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-500"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">
        {count.toLocaleString()}{suffix}
      </h3>
      <p className="text-blue-200/70">{label}</p>
    </div>
  );
};

const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="relative py-24 bg-transparent overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Main Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-600/20 to-sky-600/20 relative">
                <img
                  src="/images/g1.jpg"
                  alt="BCP Campus"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent" />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-6 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Since 2002</h4>
                    <p className="text-sm text-blue-200/70">23+ Years of Excellence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-blue-500/30 rounded-2xl" />
            <div className="absolute -bottom-6 -left-12 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
          </div>

          {/* Right Side - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
              <span className="text-sm text-blue-300 font-medium">About Us</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              About the BCP
              <span className="block bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
                Alumni Portal
              </span>
            </h2>

            <p className="text-lg text-blue-100/80 mb-6 leading-relaxed">
              The Bestlink College of the Philippines (BCP) Alumni Portal connects graduates,
              faculty, and industry partners in one powerful digital community. Founded in 2002
              by Dr. Maria M. Vicente, BCP's mission is to provide quality, affordable education
              — "Be trained to be the best. Be linked to success."
            </p>

            <p className="text-blue-200/70 mb-8 leading-relaxed">
              Our alumni portal fosters lifelong connections among BCP graduates,
              offering career tools, job opportunities, and professional networking to help
              every Bestlinker thrive — from Novaliches, Quezon City to wherever success takes them.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                'Career Resources',
                'Networking Events',
                'Job Opportunities',
                'Alumni Directory',
                'Mentorship Programs',
                'News & Updates',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                  <span className="text-blue-100/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Link to="/login" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-blue-500/20 inline-block">
              Learn More About BCP
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <StatItem
            icon={<Users className="w-7 h-7 text-white" />}
            value={45000}
            suffix="+"
            label="Students & Graduates"
            delay={0}
          />
          <StatItem
            icon={<Award className="w-7 h-7 text-white" />}
            value={23}
            suffix="+"
            label="Years of Excellence"
            delay={200}
          />
          <StatItem
            icon={<Building className="w-7 h-7 text-white" />}
            value={10}
            label="Academic Programs"
            delay={400}
          />
          <StatItem
            icon={<Briefcase className="w-7 h-7 text-white" />}
            value={500}
            suffix="+"
            label="Career Opportunities"
            delay={600}
          />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
