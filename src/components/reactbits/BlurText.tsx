import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'bottom',
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay / 1000,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      filter: 'blur(12px)',
      opacity: 0,
      y: direction === 'bottom' ? 24 : -24,
    },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={cn('inline-flex flex-wrap items-baseline', className)}
    >
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className="inline-block whitespace-pre"
        >
          {element}
          {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default BlurText;
