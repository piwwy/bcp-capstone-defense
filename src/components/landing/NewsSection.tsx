import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight, User } from 'lucide-react';
import { SpotlightCard } from '../reactbits';

const newsItems = [
  {
    id: 1,
    title: 'BCP Alumni Association Launches 2026 Academic Scholarship Fund',
    excerpt: 'Giving back to the next generation of Bestlinkers through our expanded endowment program for deserving IT, CS, and Business students.',
    date: 'Jan 20, 2026',
    author: 'Alumni Board',
    category: 'Scholarship',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
    spotlightColor: 'rgba(56, 189, 248, 0.25)',
  },
  {
    id: 2,
    title: 'Bestlink Tech Summit 2026: Key Takeaways & Industry Trends',
    excerpt: 'Senior leaders from Accenture, Google, and Converge ICT gathered with BCP alumni to discuss AI transformations and hiring forecasts in ASEAN.',
    date: 'Jan 15, 2026',
    author: 'Tech Committee',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200',
    spotlightColor: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 3,
    title: 'Novaliches Campus Innovation & Cloud Lab Inaugurated',
    excerpt: 'Bestlink unveils its state-of-the-art Innovation Center, expanding high-compute labs and startup incubation resources for all registered alumni.',
    date: 'Jan 10, 2026',
    author: 'Campus News',
    category: 'Campus Life',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1200',
    spotlightColor: 'rgba(99, 102, 241, 0.25)',
  },
];

const NewsSection: React.FC = () => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/images/bcpbackground.jpg';
  };

  return (
    <section id="news" className="relative py-28 bg-dark-900 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Newspaper className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              News & Dispatches
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Latest from the{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              BCP Network
            </span>
          </h2>
          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mx-auto">
            Stay informed on institutional milestones, community initiatives, and alumni accomplishments.
          </p>
        </div>

        {/* News Grid with SpotlightCard */}
        <div className="grid md:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <SpotlightCard
              key={item.id}
              spotlightColor={item.spotlightColor}
              className="group p-0 overflow-hidden border-white/10 hover:border-blue-500/40 rounded-3xl bg-dark-800/80 flex flex-col justify-between"
            >
              <div>
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-dark-900">
                  <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] text-sky-300 font-semibold border border-white/10 uppercase tracking-wider">
                    {item.category}
                  </div>

                  <img
                    src={item.image}
                    alt={item.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-7">
                  <div className="flex items-center gap-4 text-xs text-blue-200/60 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" /> {item.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" /> {item.author}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-blue-200/70 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              {/* Read Action */}
              <div className="px-7 pb-7 pt-2 border-t border-white/10">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm hover:text-white transition-all group-hover:gap-3"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;