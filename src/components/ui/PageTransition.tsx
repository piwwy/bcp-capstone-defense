import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// Page Transition Wrapper
// Wrap any page content for smooth fade+slide animation
// Makes SPA navigation feel native/polished
// ============================================================

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
