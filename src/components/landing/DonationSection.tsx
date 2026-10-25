import React from 'react';
import { Heart, Coins, TrendingUp, ArrowRight, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpotlightCard, CountUp } from '../reactbits';

interface Campaign {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  donorsCount: number;
  image: string;
  category: string;
  isUrgent?: boolean;
}

const activeCampaigns: Campaign[] = [
  {
    id: 1,
    title: 'BCP Scholarship & Tuition Endowment 2026',
    description: 'Providing full-tuition grants and learning allowances for 50 high-achieving but financially challenged Bestlink students.',
    targetAmount: 500000,
    currentAmount: 385000,
    donorsCount: 142,
    category: 'Education',
    isUrgent: true,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    title: 'Novaliches Innovation & AI Lab Expansion',
    description: 'Upgrading the BCP computing laboratories with high-performance workstations, server infrastructure, and AI dev tools.',
    targetAmount: 1000000,
    currentAmount: 480000,
    donorsCount: 96,
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
  },
];

const DonationSection: React.FC = () => {
  return (
    <section id="donation" className="relative py-28 bg-dark-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-[550px] h-[550px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Heart className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Alumni Philanthropy
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Support the Future of{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Bestlink Students
            </span>
          </h2>

          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mx-auto">
            100% transparent giving. Every peso goes directly toward student tuition, lab equipment, and calamity relief.
          </p>
        </div>

        {/* Campaign Cards with SpotlightCard */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {activeCampaigns.map((campaign) => {
            const progress = (campaign.currentAmount / campaign.targetAmount) * 100;

            return (
              <SpotlightCard
                key={campaign.id}
                spotlightColor="rgba(56, 189, 248, 0.25)"
                className="group p-0 overflow-hidden border-white/10 hover:border-blue-500/40 bg-dark-800/80 rounded-3xl flex flex-col md:flex-row"
              >
                {/* Image */}
                <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto overflow-hidden bg-dark-900 shrink-0">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent md:hidden" />
                  {campaign.isUrgent && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
                      <Sparkles className="w-3 h-3" />
                      <span>Urgent Priority</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        {campaign.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-blue-200/70 text-xs">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        <span>{campaign.donorsCount} Donors</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-sky-300 transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-blue-200/70 mb-5 leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Progress & Donate Action */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-white font-bold">
                        ₱{campaign.currentAmount.toLocaleString()}{' '}
                        <span className="text-blue-200/50 font-normal">
                          of ₱{campaign.targetAmount.toLocaleString()}
                        </span>
                      </span>
                      <span className="text-sky-400 font-extrabold">{progress.toFixed(0)}%</span>
                    </div>

                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="pt-2">
                      <Link
                        to="/donate"
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20"
                      >
                        <Heart className="w-4 h-4 fill-white/20" />
                        <span>Make a Contribution</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Transparency Metric Grid with ReactBits CountUp */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-dark-800/60 backdrop-blur-xl rounded-3xl border border-white/10">
          <div className="text-center p-3">
            <Coins className="w-7 h-7 text-sky-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              ₱<CountUp to={1200000} suffix="+" duration={2} />
            </div>
            <p className="text-xs text-blue-200/60 font-medium mt-1">Total Funds Raised</p>
          </div>

          <div className="text-center p-3">
            <Heart className="w-7 h-7 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              <CountUp to={520} suffix="+" duration={2} delay={0.2} />
            </div>
            <p className="text-xs text-blue-200/60 font-medium mt-1">Active Alumni Donors</p>
          </div>

          <div className="text-center p-3">
            <GraduationCap className="w-7 h-7 text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              <CountUp to={250} suffix=" Scholars" duration={2} delay={0.3} />
            </div>
            <p className="text-xs text-blue-200/60 font-medium mt-1">Scholars Sponsored</p>
          </div>

          <div className="text-center p-3">
            <ShieldCheck className="w-7 h-7 text-teal-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
            <p className="text-xs text-blue-200/60 font-medium mt-1">Direct Program Allocation</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationSection;