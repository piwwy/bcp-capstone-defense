import React from 'react';
import { cn } from '../../lib/utils';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number; // seconds
  className?: string;
  shimmerColor?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className,
  shimmerColor = 'rgba(255, 255, 255, 0.95)',
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={cn(
        'inline-block font-semibold bg-clip-text text-transparent transition-all',
        !disabled && 'animate-shimmer bg-[linear-gradient(110deg,#93c5fd,45%,var(--shimmer-color),55%,#93c5fd)] bg-[length:250%_100%]',
        className
      )}
      style={
        {
          '--shimmer-color': shimmerColor,
          animationDuration,
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  );
};

export default ShinyText;
