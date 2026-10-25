import React from 'react';
import { InfiniteMarquee } from '../reactbits';
import { Building2, Globe2, Briefcase, Award } from 'lucide-react';

const employers = [
  { name: 'Accenture Philippines', subtitle: 'Technology & Consulting', icon: <Briefcase className="w-5 h-5" /> },
  { name: 'Google Operations Center', subtitle: 'Global Tech Services', icon: <Globe2 className="w-5 h-5" /> },
  { name: 'JP Morgan Chase & Co.', subtitle: 'Financial Tech', icon: <Building2 className="w-5 h-5" /> },
  { name: 'Converge ICT', subtitle: 'Telecommunications', icon: <Globe2 className="w-5 h-5" /> },
  { name: 'SM Supermalls', subtitle: 'Corporate Operations', icon: <Building2 className="w-5 h-5" /> },
  { name: 'Globe Telecom', subtitle: 'Telecom & FinTech', icon: <Briefcase className="w-5 h-5" /> },
  { name: 'BDO Unibank', subtitle: 'Banking & Systems', icon: <Building2 className="w-5 h-5" /> },
  { name: 'Canva Philippines', subtitle: 'Design & Engineering', icon: <Award className="w-5 h-5" /> },
  { name: 'Teleperformance', subtitle: 'Global Operations', icon: <Briefcase className="w-5 h-5" /> },
  { name: 'Cognizant', subtitle: 'IT Services & AI', icon: <Globe2 className="w-5 h-5" /> },
  { name: 'IBM Philippines', subtitle: 'Enterprise Cloud & Data', icon: <Building2 className="w-5 h-5" /> },
];

export const AlumniEmployerMarquee: React.FC = () => {
  return (
    <section className="relative py-10 bg-dark-900/60 border-y border-white/[0.06] backdrop-blur-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 text-center">
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-blue-300/70">
          Where Bestlink Alumni Lead and Succeed
        </p>
      </div>
      <InfiniteMarquee items={employers} speed={32} pauseOnHover={true} />
    </section>
  );
};

export default AlumniEmployerMarquee;
