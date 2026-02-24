import { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { useNewsArticles } from '../../hooks/useSupabaseQuery';
import { HeroSkeleton, CardGridSkeleton } from '../../components/ui/Skeleton';
import PageTransition from '../../components/ui/PageTransition';
import {
    Newspaper, Calendar, User,
    ChevronRight, Clock, ArrowLeft, Timer, Share2
} from 'lucide-react';

interface NewsArticle {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    thumbnail_url: string | null;
    category: string;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    author_id: string;
    profiles?: {
        first_name: string;
        last_name: string;
    };
}

const CATEGORIES = [
    { value: 'campus', label: 'Campus News', color: 'bg-blue-100 text-blue-700' },
    { value: 'alumni', label: 'Alumni Spotlight', color: 'bg-purple-100 text-purple-700' },
    { value: 'success', label: 'Success Stories', color: 'bg-rose-100 text-rose-700' },
    { value: 'events', label: 'Events & Activities', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'achievements', label: 'Achievements', color: 'bg-amber-100 text-amber-700' },
    { value: 'updates', label: 'System Updates', color: 'bg-slate-100 text-slate-700' },
];

const AlumniNews = () => {
    const { showToast } = useToast();
    const { data: fetchedArticles = [], isLoading: loading } = useNewsArticles();
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    // Sample placeholder articles with real Unsplash images
    const SAMPLE_ARTICLES: NewsArticle[] = [
        {
            id: 'sample-1',
            title: 'Linker College Celebrates 25th Anniversary with Grand Alumni Homecoming',
            content: `Linker College of the Philippines marked a significant milestone as it celebrated its 25th founding anniversary with a grand alumni homecoming event held at the main campus last Saturday.

Over 500 alumni from various batches gathered to reconnect, reminisce, and celebrate the institution's legacy of excellence in education. The event featured a Holy Mass, recognition of outstanding alumni, cultural performances by current students, and a gala dinner.

"This celebration is not just about looking back at our achievements, but also about looking forward to the future we will build together," said the University President during the opening ceremony.

The highlight of the event was the unveiling of the new Alumni Center, a dedicated space for alumni activities and networking. The center was made possible through donations from the alumni community.

Several alumni were recognized for their outstanding contributions to their respective fields, including notable figures in business, technology, education, and public service.

The celebration concluded with a fireworks display and a commitment from the alumni association to continue supporting the institution's mission of providing quality education.`,
            excerpt: 'Over 500 alumni gathered to celebrate 25 years of excellence in education with a grand homecoming event featuring recognition ceremonies and the unveiling of the new Alumni Center.',
            thumbnail_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1200',
            category: 'campus',
            is_published: true,
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            author_id: 'admin',
            profiles: { first_name: 'Admin', last_name: 'Office' }
        },
        {
            id: 'sample-2',
            title: 'Alumni Spotlight: Maria Santos Named Top 10 Under 40 Business Leaders',
            content: `Linker College alumna Maria Santos (Batch 2015, BS Business Administration) has been recognized as one of the Top 10 Under 40 Business Leaders by Philippine Business Magazine.

Maria, who graduated with honors, founded her tech startup "InnovatePH" in 2019, which has since grown to employ over 200 people and operates in 5 countries across Southeast Asia.

"My time at Linker College shaped my entrepreneurial mindset," Maria shared in an exclusive interview. "The professors encouraged us to think beyond the classroom and apply our learning to real-world problems."

Her company specializes in providing digital transformation solutions for small and medium enterprises, helping them adapt to the digital economy. During the pandemic, InnovatePH provided free digital tools to over 1,000 local businesses.

Maria continues to give back to her alma mater by serving as a guest lecturer and providing internship opportunities for current students. She also established a scholarship fund for deserving students from underprivileged backgrounds.

"Success is not just about personal achievement. It's about lifting others as you climb," she said during her recent campus visit.`,
            excerpt: 'Batch 2015 alumna Maria Santos recognized among Top 10 Under 40 Business Leaders for her groundbreaking tech startup InnovatePH that employs 200+ people across Southeast Asia.',
            thumbnail_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200',
            category: 'alumni',
            is_published: true,
            published_at: new Date(Date.now() - 86400000).toISOString(),
            created_at: new Date(Date.now() - 86400000).toISOString(),
            author_id: 'admin',
            profiles: { first_name: 'Communications', last_name: 'Team' }
        },
        {
            id: 'sample-3',
            title: 'Career Fair 2026: 50+ Companies Ready to Hire Linker Graduates',
            content: `The annual Linker College Career Fair returns this March with over 50 participating companies from various industries looking to hire fresh graduates and experienced alumni.

This year's theme, "Bridging Talent with Opportunity," reflects the institution's commitment to helping students and alumni find meaningful employment. Major companies in IT, finance, healthcare, manufacturing, and BPO sectors have confirmed their participation.

Featured employers include top multinational corporations as well as promising startups. Many have pre-registered job openings specifically for Linker College graduates, thanks to the institution's strong industry partnerships.

The two-day event will also feature:
• Resume review and enhancement workshops
• Mock interview sessions with HR professionals
• Career counseling and guidance talks
• Skills assessment and matching services
• Networking sessions with industry leaders

Alumni are encouraged to attend and explore new career opportunities. Those interested in speaking to current students about their career journeys are also welcome to register as mentors.

Registration is now open through the alumni portal. Early registrants will receive priority scheduling for company interviews.`,
            excerpt: 'Annual career fair brings 50+ companies offering jobs in IT, finance, healthcare, and more. Features resume workshops, mock interviews, and networking opportunities.',
            thumbnail_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200',
            category: 'events',
            is_published: true,
            published_at: new Date(Date.now() - 172800000).toISOString(),
            created_at: new Date(Date.now() - 172800000).toISOString(),
            author_id: 'admin',
            profiles: { first_name: 'Career', last_name: 'Services' }
        }
    ];

    // Use fetched data, fall back to samples if empty
    const articles = fetchedArticles.length > 0 ? fetchedArticles : SAMPLE_ARTICLES;

    // Featured article (based on is_featured flag)
    const featuredArticle = useMemo(() => {
        const featured = articles.find(a => a.is_featured === true);
        return featured || articles[0]; // Fallback to latest if no featured item
    }, [articles]);

    // Categories from data
    const categories = useMemo(() => {
        const cats = articles.map(a => a.category).filter(Boolean);
        return ['All', ...Array.from(new Set(cats))];
    }, [articles]);

    // Filtered articles (excluding the one in hero section)
    const filteredArticles = useMemo(() => {
        return articles.filter(article =>
            article.id !== featuredArticle?.id && // Exclude hero article
            (activeCategory === 'All' || article.category === activeCategory)
        );
    }, [articles, featuredArticle, activeCategory]);

    const getCategoryLabel = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.label || category;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const handleShare = async (article: NewsArticle) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: window.location.href,
                });
            } catch { }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast({ title: 'Link Copied!', message: 'Article link copied to clipboard.', type: 'success' });
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-10 pb-20">
                <HeroSkeleton />
                <CardGridSkeleton count={3} />
            </div>
        );
    }

    // ARTICLE DETAIL VIEW
    if (selectedArticle) {
        return (
            <PageTransition>
                <div className="max-w-7xl mx-auto space-y-8 pb-20">
                    {/* Back Button */}
                    <button
                        onClick={() => setSelectedArticle(null)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to News
                    </button>

                    {/* Hero Image */}
                    <div className="relative h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
                        <img
                            src={selectedArticle.thumbnail_url || `https://picsum.photos/seed/${selectedArticle.id}/1200/600`}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt={selectedArticle.title}
                        />
                        <div className="relative z-20 h-full flex flex-col justify-end p-10 md:p-16 text-white max-w-4xl">
                            <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-4">
                                {getCategoryLabel(selectedArticle.category)}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                                {selectedArticle.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-200">
                                <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-xl">
                                    <User className="w-4 h-4 text-blue-400" />
                                    {selectedArticle.profiles?.first_name} {selectedArticle.profiles?.last_name}
                                </span>
                                <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-xl">
                                    <Calendar className="w-4 h-4 text-emerald-400" />
                                    {formatDate(selectedArticle.published_at || selectedArticle.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Article Content */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-12">
                        <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {selectedArticle.content}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                            <button
                                onClick={() => handleShare(selectedArticle)}
                                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Share2 className="w-4 h-4" /> Share Article
                            </button>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to News
                            </button>
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // MAIN NEWS LIST VIEW
    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto space-y-10 pb-20">

                {/* 1. FEATURED ARTICLE HERO (Same pattern as Events) */}
                {featuredArticle && (
                    <div
                        onClick={() => setSelectedArticle(featuredArticle)}
                        className="relative h-[450px] rounded-[2.5rem] overflow-hidden group shadow-2xl cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
                        <img
                            src={featuredArticle.thumbnail_url || `https://picsum.photos/seed/${featuredArticle.id}/1200/600`}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            alt="Featured"
                        />

                        <div className="relative z-20 h-full flex flex-col justify-end p-10 md:p-16 text-white max-w-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Timer className="w-3 h-3" /> {featuredArticle.is_featured ? 'Featured Story' : 'Latest Article'}
                                </span>
                                <span className="bg-white/10 backdrop-blur px-4 py-1 rounded-full text-[10px] font-bold uppercase border border-white/20">
                                    {getCategoryLabel(featuredArticle.category)}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-none">
                                {featuredArticle.title}
                            </h1>

                            <p className="text-slate-200 text-lg mb-6 line-clamp-2 max-w-2xl">
                                {featuredArticle.excerpt}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-200 mb-8">
                                <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    {formatDate(featuredArticle.published_at || featuredArticle.created_at)}
                                </span>
                                <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                                    <User className="w-4 h-4 text-emerald-400" />
                                    {featuredArticle.profiles?.first_name} {featuredArticle.profiles?.last_name}
                                </span>
                            </div>

                            <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-xl flex items-center gap-2 w-fit">
                                Read Full Article <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. CATEGORY FILTER (Same pattern as Events) */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {cat === 'All' ? 'All News' : getCategoryLabel(cat)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. NEWS GRID (Same card pattern as Events) */}
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-20">
                        <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-700">No Articles Yet</h3>
                        <p className="text-slate-400 mt-2">Check back later for updates!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredArticles.map((article) => (
                            <div
                                key={article.id}
                                onClick={() => setSelectedArticle(article)}
                                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group cursor-pointer"
                            >
                                {/* Image */}
                                <div className="h-48 relative overflow-hidden bg-slate-100">
                                    <img
                                        src={article.thumbnail_url || `https://picsum.photos/seed/${article.id}/600/400`}
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                        alt={article.title}
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                                        {getCategoryLabel(article.category)}
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(article.published_at || article.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {article.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
                                        {article.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                        <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <User className="w-3.5 h-3.5" />
                                            {article.profiles?.first_name} {article.profiles?.last_name}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                                            Read <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AlumniNews;
