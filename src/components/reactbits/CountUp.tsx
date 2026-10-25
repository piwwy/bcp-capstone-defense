import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  separator?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  delay = 0,
  duration = 2,
  className,
  prefix = '',
  suffix = '',
  separator = ',',
}) => {
  const [count, setCount] = useState(from);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Ease out quad
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentCount = Math.floor(from + (to - from) * easeOutQuad);

        setCount(currentCount);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(to);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, to, from, duration, delay]);

  const formattedValue = count
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span ref={elementRef} className={cn('inline-block tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};

export default CountUp;
