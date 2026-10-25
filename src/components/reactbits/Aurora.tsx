import React from 'react';
import { cn } from '../../lib/utils';

interface AuroraProps {
  className?: string;
  children?: React.ReactNode;
  colorStops?: string[];
  amplitude?: number;
  blendMode?: string;
}

export const Aurora: React.FC<AuroraProps> = ({
  className,
  children,
  colorStops = ['#1d4ed8', '#0284c7', '#38bdf8', '#4f46e5'],
}) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background Aurora Mesh Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div
          className="absolute -top-[30%] -left-[20%] w-[140%] h-[160%] animate-aurora blur-[110px]"
          style={{
            backgroundImage: `radial-gradient(ellipse at 20% 30%, ${colorStops[0]} 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, ${colorStops[1]} 0%, transparent 45%),
              radial-gradient(ellipse at 50% 80%, ${colorStops[2]} 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, ${colorStops[3]} 0%, transparent 40%)`,
          }}
        />
        {/* Subtle noise / grain overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Children content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Aurora;
