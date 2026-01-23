import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight, User } from 'lucide-react';

const newsItems = [
  {
    id: 1,
    title: 'LCP Alumni Association Launches New Scholarship Fund',
    excerpt: 'Giving back to the next generation of Linkers through our new endowment program.',
    date: 'Jan 20, 2026',
    author: 'Alumni Board',
    category: 'Community',
    // UPDATED: Reliable Image (Students/Graduation context)
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 2,
    title: 'Tech Summit 2025: Highlights and Key Takeaways',
    excerpt: 'Industry leaders from Accenture and Google shared insights at our annual summit.',
    date: 'Jan 15, 2026',
    author: 'Sarah Jenkins',
    category: 'Technology',
    // UPDATED: Reliable Image (Conference/Speaker context)
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 3,
    title: 'New Campus Wing Named After Distinguished Alumnus',
    excerpt: 'Celebrating the legacy of Dr. Cruz with the opening of the Innovation Center.',
    date: 'Jan 10, 2026',
    author: 'Campus News',
    category: 'Campus Life',
    // UPDATED: Reliable Image (Modern Building context)
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1200'
  }
];

const NewsSection: React.FC = () => {
  // Fallback function if image fails
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/600x400/1e293b/FFF?text=Image+Unavailable";
  };

  return (
    <section id="news" className="relative py-24 bg-dark-800 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full border border-orange-500/20 mb-6">
            <Newspaper className="w-4 h-4 text-orange-300" />
            <span className="text-sm text-orange-300 font-medium">Latest Updates</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Alumni
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {' '}News
            </span>
          </h2>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <div key={item.id} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 h-full">
              {/* Image Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-dark-900">
                <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-white font-medium border border-white/10">
                  {item.category}
                </div>
                
                <img 
                  src={item.image} 
                  alt={item.title}
                  onError={handleImageError} // Added Error Handler
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent opacity-60" />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-grow p-6">
                <div className="flex items-center gap-4 text-xs text-blue-200/60 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.author}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-blue-200/70 text-sm mb-6 line-clamp-3 flex-grow">
                  {item.excerpt}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5">
                  <Link 
                    to="/register" 
                    className="inline-flex items-center gap-2 text-orange-400 font-semibold text-sm hover:gap-3 transition-all group-hover:text-orange-300"
                  >
                    Read Full Story <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;