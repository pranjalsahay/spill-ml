import Lenis from 'lenis';

let lenisInstance = null;

export function initLenis() {
  if (typeof window === 'undefined') return null;

  if (lenisInstance) {
    return lenisInstance;
  }

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like exponential deceleration
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenisInstance = lenis;
  window.__spillLenis = lenis;

  let rafId;
  function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  return {
    lenis,
    destroy: () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisInstance = null;
      delete window.__spillLenis;
    },
  };
}

export function getLenis() {
  return lenisInstance || (typeof window !== 'undefined' ? window.__spillLenis : null);
}

export function smoothScrollTo(target, offset = -70) {
  if (typeof window === 'undefined') return;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, {
      offset,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}
