import React from 'react';
import { cn } from '../../lib/utils';

interface InfiniteMarqueeProps {
  items: Array<{
    name: string;
    subtitle?: string;
    icon?: React.ReactNode;
  }>;
  direction?: 'left' | 'right';
  speed?: number; // seconds
  pauseOnHover?: boolean;
  className?: string;
}

export const InfiniteMarquee: React.FC<InfiniteMarqueeProps> = ({
  items,
  direction = 'left',
  speed = 30,
  pauseOnHover = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'group relative flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
        className
      )}
    >
      <div
        className={cn(
          'flex min-w-full shrink-0 items-center justify-around gap-8',
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((item, idx) => (
          <div
            key={`orig-${idx}`}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-blue-500/40 hover:bg-white/[0.08] transition-all"
          >
            {item.icon && <div className="text-blue-400">{item.icon}</div>}
            <div className="text-left">
              <span className="block text-sm font-semibold text-white tracking-wide">
                {item.name}
              </span>
              {item.subtitle && (
                <span className="block text-[11px] text-blue-200/60 font-medium">
                  {item.subtitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Duplicate for infinite loop */}
      <div
        aria-hidden="true"
        className={cn(
          'flex min-w-full shrink-0 items-center justify-around gap-8',
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map((item, idx) => (
          <div
            key={`dup-${idx}`}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-blue-500/40 hover:bg-white/[0.08] transition-all"
          >
            {item.icon && <div className="text-blue-400">{item.icon}</div>}
            <div className="text-left">
              <span className="block text-sm font-semibold text-white tracking-wide">
                {item.name}
              </span>
              {item.subtitle && (
                <span className="block text-[11px] text-blue-200/60 font-medium">
                  {item.subtitle}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteMarquee;
