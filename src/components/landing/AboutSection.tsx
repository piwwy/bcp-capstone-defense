import React from 'react';
import { Users, Award, Building, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpotlightCard, CountUp, TiltedCard } from '../reactbits';

const AboutSection: React.FC = () => {
  const stats = [
    {
      icon: <Users className="w-6 h-6 text-sky-400" />,
      value: 45000,
      suffix: '+',
      label: 'Students & Graduates',
      desc: 'Shaping careers nationwide',
      spotlightColor: 'rgba(56, 189, 248, 0.25)',
    },
    {
      icon: <Award className="w-6 h-6 text-blue-400" />,
      value: 23,
      suffix: '+',
      label: 'Years of Excellence',
      desc: 'Founded in 2002',
      spotlightColor: 'rgba(59, 130, 246, 0.25)',
    },
    {
      icon: <Building className="w-6 h-6 text-indigo-400" />,
      value: 10,
      suffix: '',
      label: 'Academic Programs',
      desc: 'Industry-aligned degrees',
      spotlightColor: 'rgba(99, 102, 241, 0.25)',
    },
    {
      icon: <Briefcase className="w-6 h-6 text-teal-400" />,
      value: 500,
      suffix: '+',
      label: 'Career Opportunities',
      desc: 'Partner companies hiring',
      spotlightColor: 'rgba(45, 212, 191, 0.25)',
    },
  ];

  const features = [
    'Verified Alumni Directory',
    'Exclusive Job Opportunities',
    'Networking & Reunions',
    'Mentorship Programs',
    'Career Guidance Tools',
    'Donations & Scholarships',
  ];

  return (
    <section
      id="about"
      className="relative py-28 bg-dark-900 overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Image with TiltedCard */}
          <div className="lg:col-span-5 relative">
            <TiltedCard maxAngle={8} scale={1.01} glareOpacity={0.25}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-dark-800">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-900/40 to-sky-900/40 relative">
                  <img
                    src="/images/g1.jpg"
                    alt="BCP Campus"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/bcpbackground.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />
                </div>
              </div>
            </TiltedCard>

            {/* Floating Glassmorphic Badge */}
            <div className="absolute -bottom-6 -right-4 sm:-right-6 p-5 bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">Since 2002</h4>
                  <p className="text-xs text-blue-200/70">23+ Years of Quality Education</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mission and Pillars */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                About the Network
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
              Bestlink College of the Philippines
              <span className="block mt-1 bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Alumni Community
              </span>
            </h2>

            <p className="text-base sm:text-lg text-blue-100/80 mb-6 leading-relaxed">
              Founded in 2002 by Dr. Maria M. Vicente, Bestlink College of the Philippines has 
              empowered thousands of students under the motto: 
              <span className="text-white font-semibold italic"> "Be trained to be the best. Be linked to success."</span>
            </p>

            <p className="text-sm sm:text-base text-blue-200/70 mb-8 leading-relaxed">
              The BCP Alumni Portal is a unified platform connecting graduates across all batches. 
              Whether you are searching for career growth, hiring fellow Bestlinkers, or giving back through 
              scholarships, you are always part of the BCP family.
            </p>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-sky-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-blue-100/90">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <span>Register as an Alumnus</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-blue-200 hover:text-white font-medium rounded-xl border border-white/10 transition-all"
              >
                Log In to Directory
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Grid Powered by ReactBits SpotlightCard & CountUp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {stats.map((stat, index) => (
            <SpotlightCard
              key={index}
              spotlightColor={stat.spotlightColor}
              className="group border-white/10 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/60 bg-white/[0.03] px-2 py-1 rounded-md border border-white/5">
                  Verified
                </span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-1 tracking-tight">
                <CountUp to={stat.value} suffix={stat.suffix} duration={2} delay={index * 0.15} />
              </h3>
              <p className="text-sm font-semibold text-white/90 mb-1">{stat.label}</p>
              <p className="text-xs text-blue-200/60">{stat.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
