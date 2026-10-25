import React from 'react';
import { cn } from '../../lib/utils';

interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
}

export const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'button',
  className = '',
  color = '#60a5fa',
  speed = '6s',
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(
        'relative inline-block py-[1px] overflow-hidden rounded-xl transition-all duration-300',
        className
      )}
      {...props}
    >
      {/* Animated Glowing Light Path */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-10px] right-[-250%] rounded-full animate-star-movement pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 20%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 20%)`,
          animationDuration: speed,
        }}
      />
      {/* Inner Content Wrapper */}
      <div className="relative z-10 w-full h-full rounded-[11px] bg-dark-900/90 border border-white/10 backdrop-blur-md">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
