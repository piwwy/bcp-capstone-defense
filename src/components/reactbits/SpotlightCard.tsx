import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(59, 130, 246, 0.22)',
  spotlightSize = 350,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(37,99,235,0.18)]',
        className
      )}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SpotlightCard;
