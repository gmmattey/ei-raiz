import React from 'react';
import GlobalHeader from '../navigation/GlobalHeader';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { pageVariants } from '../../utils/motion-tokens';

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
