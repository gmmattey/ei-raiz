import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 900;
const TOUCH_TABLET_BREAKPOINT = 1200;

export function detectMobile() {
  if (typeof window === 'undefined') return false;

  const width = window.innerWidth || 0;

  const isTouchDevice = (() => {
    try {
      return (
        'ontouchstart' in window ||
        (navigator && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0)
      );
    } catch {
      return false;
    }
  })();

  const hasCoarsePointer = (() => {
    try {
      return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    } catch {
      return false;
    }
  })();

  const isStandalonePwa = (() => {
    try {
      const w = window as any;
      return (
        (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
        // iOS Safari (antigo e novo) usa `navigator.standalone`
        Boolean(w.navigator && w.navigator.standalone)
      );
    } catch {
      return false;
    }
  })();

  // Regra:
  // - Mobile "clássico" por largura
  // - Touch devices (inclui iPad/tablets e iPadOS que se identifica como "desktop") até certo limite
  // - PWA em touch prefere UX mobile para evitar render desktop impraticável
  if (width <= MOBILE_BREAKPOINT) return true;
  if ((isTouchDevice || hasCoarsePointer) && width <= TOUCH_TABLET_BREAKPOINT) return true;
  if (isStandalonePwa && (isTouchDevice || hasCoarsePointer)) return true;

  return false;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(detectMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(detectMobile());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return isMobile;
}
