import React from 'react';
import { Heart, HandHeart, Coins, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    title: "LCP Scholarship Fund 2026",
    description: "Supporting 50 deserving IT students for the upcoming academic year. Your contribution shapes future tech leaders.",
    targetAmount: 500000,
    currentAmount: 375000,
    donorsCount: 124,
    category: "Education",
    isUrgent: true,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "Innovation Lab Expansion",
    description: "Upgrading our computer laboratories with high-end workstations and AI research tools for the LCP community.",
    targetAmount: 1000000,
    currentAmount: 450000,
    donorsCount: 89,
    category: "Infrastructure",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"
  }
];

const DonationSection: React.FC = () => {
  return (
    <section id="donation" className="relative py-24 bg-dark-900 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6">
            <Heart className="w-4 h-4 text-emerald-300" />
            <span className="text-sm text-emerald-300 font-medium">Giving Back</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Support the
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {' '}LCP Legacy
            </span>
          </h2>
          
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Your donations help us provide better opportunities for the next generation of Linker students.
          </p>
        </div>

        {/* Campaign Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {activeCampaigns.map((campaign) => {
            const progress = (campaign.currentAmount / campaign.targetAmount) * 100;
            
            return (
              <div key={campaign.id} className="group flex flex-col md:flex-row bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
                {/* Image */}
                <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto overflow-hidden">
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {campaign.isUrgent && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-red-500/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      Urgent Cause
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-emerald-400 uppercase">{campaign.category}</span>
                    <div className="flex items-center gap-1 text-blue-200/60 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      {campaign.donorsCount} Donors
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    {campaign.title}
                  </h3>
                  <p className="text-blue-200/70 text-sm mb-6 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-medium">₱{campaign.currentAmount.toLocaleString()} raised</span>
                      <span className="text-blue-300">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">Goal: ₱{campaign.targetAmount.toLocaleString()}</span>
                      <Link 
                        to="/donate" 
                        className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm hover:gap-3 transition-all"
                      >
                        Donate Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transparency Wall / Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
          <div className="text-center">
            <Coins className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">₱1.2M+</div>
            <p className="text-xs text-blue-200/60">Total Raised</p>
          </div>
          <div className="text-center">
            <HandHeart className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">500+</div>
            <p className="text-xs text-blue-200/60">Active Donors</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 text-purple-400 mx-auto mb-3 flex items-center justify-center font-bold text-xl italic">L</div>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-blue-200/60">Active Campaigns</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 text-pink-400 mx-auto mb-3 flex items-center justify-center font-bold text-xl italic">S</div>
            <div className="text-2xl font-bold text-white">250</div>
            <p className="text-xs text-blue-200/60">Scholars Funded</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationSection;