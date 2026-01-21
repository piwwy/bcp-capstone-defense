import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Play, Users, Briefcase, Calendar } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hero images for carousel
  const heroImages = [
    '/images/2.jpg',
    '/images/3.jpg',
    '/images/4.jpg',
    '/images/5.jpg',
    '/images/6.jpg',
    '/images/7.jpg',
  ];

  // Particle animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2,
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

        // Draw particle
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

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${0.1 * (1 - distance / 150)})`;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToAbout = () => {
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden hero-bg"
    >
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 hero-overlay z-1" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-900/50 z-1" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-200">
                Join 30,000+ Connected Alumni
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Not Sure What Comes After 
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Graduation?
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-blue-100/80 mb-8 max-w-xl mx-auto lg:mx-0">
              Learn from Bestlink alumni and build your own career path.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronDown className="w-5 h-5 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 border-2 border-blue-400/50 text-blue-300 font-semibold rounded-full hover:bg-blue-400/10 hover:border-blue-400 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Video
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">30K+</span>
                </div>
                <p className="text-sm text-blue-200/70">Alumni Connected</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">500+</span>
                </div>
                <p className="text-sm text-blue-200/70">Job Opportunities</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-pink-400" />
                  <span className="text-2xl font-bold text-white">50+</span>
                </div>
                <p className="text-sm text-blue-200/70">Events Yearly</p>
              </div>
            </div>
          </div>

          {/* Right Content - Image Carousel */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[500px]">
              {/* Floating Cards */}
              <div className="absolute inset-0 flex items-center justify-center">
                {heroImages.map((img, index) => {
                  const isActive = index === currentSlide;
                  const offset = (index - currentSlide + heroImages.length) % heroImages.length;
                  
                  return (
                    <div
                      key={index}
                      className={`absolute w-80 h-96 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-out ${
                        isActive
                          ? 'z-30 scale-100 opacity-100'
                          : offset === 1
                          ? 'z-20 scale-90 opacity-70 translate-x-20 -rotate-6'
                          : offset === heroImages.length - 1
                          ? 'z-20 scale-90 opacity-70 -translate-x-20 rotate-6'
                          : 'z-10 scale-75 opacity-0'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent z-10" />
                      <img
                        src={img}
                        alt={`BCP Campus ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback gradient if image fails
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <h3 className="text-white font-semibold text-lg">
                          BCP Campus Life
                        </h3>
                        <p className="text-white/70 text-sm">
                          Building futures together
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-blue-400'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToAbout}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer z-20"
      >
        <span className="text-sm font-medium">Scroll Down</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </button>
    </section>
  );
};

export default HeroSection;
