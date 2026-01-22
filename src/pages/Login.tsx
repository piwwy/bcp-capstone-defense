import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";


const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Login failed.");
        return;
      }

      if (data.requires2FA) {
        navigate("/alumni/2fa", {
          state: { email, tempToken: data.tempToken },
          replace: true,
        });
        return;
      }

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // 🌌 Galaxy Animation (short butete-like trail)
  const galaxyRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = galaxyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = [
      "rgba(147, 51, 234, 1)", // violet
      "rgba(59, 130, 246, 1)", // blue
      "rgba(236, 72, 153, 1)", // pink
      "rgba(255,255,255,1)",   // white
    ];

    interface Particle {
      x: number;
      y: number;
      r: number;
      angle: number;
      radius: number;
      speed: number;
      color: string;
      trail: { x: number; y: number }[];
    }

    const particles: Particle[] = [];

    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (width * 0.5);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = width / 2 + Math.cos(angle) * radius;
      const y = height / 2 + Math.sin(angle) * radius;

      particles.push({
        x,
        y,
        r: Math.random() * 1.8 + 0.6,
        angle,
        radius,
        speed: 0.0004 + Math.random() * 0.0008,
        color,
        trail: [],
      });
    }

    const draw = () => {
      if (!ctx) return;

      // Slight fade to keep trails short
      ctx.fillStyle = "rgba(5, 5, 25, 0.3)";
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        // Update orbit
        p.angle += p.speed;
        p.x = width / 2 + Math.cos(p.angle) * p.radius;
        p.y = height / 2 + Math.sin(p.angle) * p.radius;

        // Save recent positions for trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift(); // only 5 short points (like butete tail)

        // Draw trail following the star
        ctx.beginPath();
        for (let i = 0; i < p.trail.length - 1; i++) {
          const opacity = i / p.trail.length; // fade effect
          const c = p.color.replace("1)", `${0.2 + opacity * 0.5})`);
          ctx.strokeStyle = c;
          ctx.lineWidth = 1;
          ctx.moveTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
        }
        ctx.stroke();

        // Draw glowing star
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        glow.addColorStop(0, p.color.replace("1)", "0.9)"));
        glow.addColorStop(1, p.color.replace("1)", "0)"));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden text-white">
      {/* Galaxy Background */}
      <canvas
        ref={galaxyRef}
        className="absolute inset-0 z-[0]"
        style={{
          background:
            "radial-gradient(ellipse at center, #0b001e 0%, #050011 100%)",
        }}
      />

      {/* Glass Card */}
      <div className="max-w-md w-full relative z-[10]">
        <div className="relative bg-white/10 backdrop-blur-[60px] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-white/20 p-10 pt-12 overflow-hidden">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/Linker College Of The Philippines.png"
              alt="LCP Logo"
              className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            />
          </div>

          {/* Heading */}
          <div className="relative text-center mb-2 overflow-hidden">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-gray-100 via-gray-400 to-gray-100 bg-clip-text text-transparent relative z-10">
              LCP Alumni Login
            </h2>
            <div className="absolute inset-0 animate-[shine_4s_linear_infinite]" />
          </div>

          <p className="text-center text-gray-300 text-sm tracking-wide mb-8">
            Stay Connected • Stay Informed • Stay Involved
          </p>

          {/* Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-inner">
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="flex items-center p-4 bg-red-100/20 border border-red-400/40 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-300 mr-3" />
                  <span className="text-red-200">{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-white/10 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-white/10 text-white placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 px-4 rounded-xl font-semibold hover:scale-[1.03] transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Don’t have an account yet?{" "}
              <Link
                to="/register"
                className="text-violet-300 font-semibold hover:underline"
              >
                Register
              </Link>
            </p>
            <Link
              to="/"
              className="text-blue-300 hover:underline text-xs font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Bestlink College of the Philippines
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% {
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
            transform: translateX(-100%);
          }
          100% {
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
