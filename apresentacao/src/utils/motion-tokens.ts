/**
 * Tokens de motion — espelham as CSS variables em styles/index.css.
 * Usar aqui para Framer Motion; usar as CSS vars para transition em CSS/Tailwind.
 */

export const motionEase = {
  standard:   [0.4, 0, 0.2, 1] as [number, number, number, number],
  emphasized: [0.2, 0, 0, 1]   as [number, number, number, number],
  decelerate: [0, 0, 0.2, 1]   as [number, number, number, number],
} as const

export const motionDur = {
  fast: 0.12,   // hover, focus, press
  base: 0.22,   // state changes, toggles
  slow: 0.38,   // page transitions, modal
} as const

/** Variante de página padrão — enter decelera, exit sai sem drama */
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDur.slow, ease: motionEase.decelerate },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: motionDur.base, ease: motionEase.standard },
  },
}
