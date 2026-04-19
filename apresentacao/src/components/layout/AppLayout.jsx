import React from 'react';
import GlobalHeader from '../navigation/GlobalHeader';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.21,1.02,0.73,1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } }
};

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <GlobalHeader />
      <main className="min-h-[calc(100vh-4rem)] pt-20 pb-12 px-6 lg:px-8">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default AppLayout;
