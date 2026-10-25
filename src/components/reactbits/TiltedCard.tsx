import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxAngle?: number;
  scale?: number;
  glareOpacity?: number;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className,
  maxAngle = 12,
  scale = 1.03,
  glareOpacity = 0.25,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) * 2 - 1;
    const normalizedY = (y / rect.height) * 2 - 1;

    setRotateX(-normalizedY * maxAngle);
    setRotateY(normalizedX * maxAngle);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="inline-block w-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
          transformStyle: 'preserve-3d',
        }}
        className={cn('relative rounded-3xl overflow-hidden', className)}
      >
        {children}

        {/* Dynamic Glare Overlay */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? glareOpacity : 0,
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.45) 0%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  );
};

export default TiltedCard;
