import { useEffect, useRef } from 'react';

/**
 * Custom hook for scroll-triggered entrance animations using IntersectionObserver.
 * Returns a ref to attach to the element that should animate on scroll.
 *
 * When the element enters the viewport, `.visible` class is added (triggering CSS animations).
 * Respects prefers-reduced-motion — skips animations entirely for accessibility.
 *
 * @param {Object} options
 * @param {number} options.threshold - Intersection ratio to trigger (default: 0.12)
 * @param {string} options.rootMargin - Observer root margin (default: '0px 0px -60px 0px')
 * @param {boolean} options.once - Only animate on first intersection (default: true)
 */
export function useScrollReveal({
  threshold = 0.12,
  rootMargin = '0px 0px -60px 0px',
  once = true
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect prefers-reduced-motion: skip animations entirely
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      element.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (once) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, once]);

  return ref;
}
