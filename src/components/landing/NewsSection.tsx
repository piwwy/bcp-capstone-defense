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
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Tech Summit 2025: Highlights and Key Takeaways',
    excerpt: 'Industry leaders from Accenture and Google shared insights at our annual summit.',
    date: 'Jan 15, 2026',
    author: 'Sarah Jenkins',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1544531696-9348411888a9?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'New Campus Wing Named After Distinguished Alumnus',
    excerpt: 'Celebrating the legacy of Dr. Cruz with the opening of the Innovation Center.',
    date: 'Jan 10, 2026',
    author: 'Campus News',
    category: 'Campus Life',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop'
  }
];

const NewsSection: React.FC = () => {
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
              {' '}News & Stories
            </span>
          </h2>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <div key={item.id} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300">
              {/* Image */}
              <div className="h-48 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-white font-medium border border-white/10">
                  {item.category}
                </div>
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-blue-200/60 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.author}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-blue-200/70 text-sm mb-6 line-clamp-2">
                  {item.excerpt}
                </p>

                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-2 text-orange-400 font-semibold text-sm hover:gap-3 transition-all"
                >
                  Read Full Story <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;