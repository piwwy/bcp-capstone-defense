import React, { useEffect, useRef, useState } from 'react';
import { Users, Award, Building, Briefcase } from 'lucide-react';

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
      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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
      className="relative py-24 bg-gradient-to-b from-dark-900 to-dark-800 overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Main Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative">
                <img
                  src="/images/bcpbackground.jpg"
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
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">22 Years</h4>
                    <p className="text-sm text-blue-200/70">Of Excellence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-blue-500/30 rounded-2xl" />
            <div className="absolute -bottom-6 -left-12 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
          </div>

          {/* Right Side - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
              <span className="text-sm text-blue-300 font-medium">About Us</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              About the BCP
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Alumni Portal
              </span>
            </h2>

            <p className="text-lg text-blue-100/80 mb-6 leading-relaxed">
              The Bestlink College of the Philippines Alumni Portal connects graduates,
              faculty, and partners in one digital community. It's designed to help
              alumni track their career growth, access job opportunities, and stay
              engaged with BCP's legacy of excellence.
            </p>

            <p className="text-blue-200/70 mb-8 leading-relaxed">
              Our mission is to foster lifelong connections among BCP alumni,
              providing resources for professional development, networking opportunities,
              and ways to give back to the community that shaped their futures.
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
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                  <span className="text-blue-100/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-blue-500/30">
              Learn More About BCP
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <StatItem
            icon={<Users className="w-7 h-7 text-white" />}
            value={30000}
            suffix="+"
            label="Graduates Connected"
            delay={0}
          />
          <StatItem
            icon={<Award className="w-7 h-7 text-white" />}
            value={20}
            suffix="+"
            label="Years of Excellence"
            delay={200}
          />
          <StatItem
            icon={<Building className="w-7 h-7 text-white" />}
            value={13}
            label="Departments & Programs"
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
