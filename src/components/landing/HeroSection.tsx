import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Play, Users, Briefcase, Calendar, X, Sparkles, ArrowRight } from 'lucide-react';
import { Aurora, ShinyText, BlurText, CountUp, TiltedCard } from '../reactbits';

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hero images for carousel
  const heroImages = [
    {
      src: '/images/g1.jpg',
      title: 'BCP Main Quadrangle',
      tag: 'Campus Life & Unity',
    },
    {
      src: '/images/g2.jpg',
      title: 'Innovation & Research',
      tag: 'Future-Ready Tech',
    },
    {
      src: '/images/g3.jpg',
      title: 'Graduation Milestones',
      tag: 'Class of Excellence',
    },
    {
      src: '/images/g4.jpg',
      title: 'Global Career Horizons',
      tag: 'Leadership & Success',
    },
  ];

  // Particle animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${particle.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${0.08 * (1 - distance / 130)})`;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const scrollToAbout = () => {
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-[94vh] flex items-center justify-center overflow-hidden bg-dark-900"
    >
      {/* React Bits Aurora Animated Glow Background */}
      <Aurora
        className="absolute inset-0 z-0 pointer-events-none"
        colorStops={['#1e3a8a', '#0284c7', '#38bdf8', '#3b82f6']}
      />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1] pointer-events-none"
      />

      {/* Subtle Grid and Gradient Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-dark-900/60 to-dark-900 pointer-events-none z-[2]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent z-[3] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* React Bits ShinyText Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/[0.06] backdrop-blur-xl rounded-full border border-white/15 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-ping" />
              <ShinyText
                text="✨ Official Bestlink College Alumni Network"
                className="text-xs sm:text-sm font-semibold tracking-wide"
                speed={3.5}
              />
            </div>

            {/* Main Headline with React Bits BlurText */}
            <div className="mb-6">
              <BlurText
                text="Not Sure What Comes After"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight block"
                delay={60}
              />
              <span className="block mt-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                Graduation?
              </span>
            </div>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Connect with over <span className="text-white font-semibold">30,000+ Bestlink alumni</span> worldwide. 
              Unlock exclusive job opportunities, gain mentorship from industry leaders, and build a thriving career path.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <Link
                to="/register"
                className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(37,99,235,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] hover:scale-[1.02] flex items-center justify-center gap-2.5 w-full sm:w-auto"
              >
                <span>Join the Network</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>

              <button
                onClick={() => setShowVideo(true)}
                className="px-7 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-blue-400/50 text-blue-200 hover:text-white font-semibold rounded-xl backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2.5 w-full sm:w-auto hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                  <Play className="w-3.5 h-3.5 fill-blue-400 text-blue-400 ml-0.5" />
                </div>
                <span>Watch Campus Story</span>
              </button>
            </div>

            {/* Quick Stats with React Bits CountUp */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Users className="w-5 h-5 text-sky-400" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <CountUp to={30} suffix="K+" duration={2.2} />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200/70 font-medium">Alumni Connected</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <CountUp to={500} suffix="+" duration={2.2} delay={0.2} />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200/70 font-medium">Job Opportunities</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    <CountUp to={50} suffix="+" duration={2.2} delay={0.4} />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200/70 font-medium">Events Yearly</p>
              </div>
            </div>
          </div>

          {/* Right Column - React Bits TiltedCard Showcase */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <TiltedCard
              maxAngle={10}
              scale={1.02}
              glareOpacity={0.3}
              className="shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/15 bg-dark-800/80 backdrop-blur-xl"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
                {/* Current Slide Image */}
                <img
                  src={heroImages[currentSlide].src}
                  alt={heroImages[currentSlide].title}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/images/bcpbackground.jpg';
                  }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent" />
                <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />

                {/* Floating Badge (Top Left) */}
                <div className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs text-white">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{heroImages[currentSlide].tag}</span>
                </div>

                {/* Card Bottom Meta */}
                <div className="absolute bottom-0 left-0 right-0 p-7 z-20">
                  <div className="inline-block px-3 py-1 bg-blue-600/80 backdrop-blur-sm rounded-lg text-[11px] font-bold text-white uppercase tracking-wider mb-2">
                    Featured Spotlight
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1.5 leading-snug">
                    {heroImages[currentSlide].title}
                  </h3>
                  <p className="text-sm text-blue-200/80 mb-5">
                    "Be trained to be the best. Be linked to success."
                  </p>

                  {/* Carousel Progress Indicators */}
                  <div className="flex items-center gap-2">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                          index === currentSlide
                            ? 'w-10 bg-gradient-to-r from-blue-400 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                            : 'w-2.5 bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TiltedCard>

            {/* Floating Glassmorphic Mini-Card */}
            <div className="absolute -bottom-6 -left-6 z-30 p-4 rounded-2xl bg-dark-800/90 border border-white/15 backdrop-blur-xl shadow-2xl flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-200/70 font-medium">Active Community</p>
                <p className="text-sm font-bold text-white">500+ Mentors Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <button
        onClick={scrollToAbout}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-blue-200/60 hover:text-white transition-all cursor-pointer z-20 group"
      >
        <span className="text-xs font-semibold tracking-wider uppercase">Explore Portal</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-sky-400 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* Video Modal Overlay */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            {/* Close Button */}
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-20 p-2.5 bg-black/70 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all duration-200 backdrop-blur-md"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video Player */}
            <video
              src="/videos/intro.mp4"
              controls
              autoPlay
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Close on background click */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowVideo(false)}
          />
        </div>
      )}
    </section>
  );
};

export default HeroSection;