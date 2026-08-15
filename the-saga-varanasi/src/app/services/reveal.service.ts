import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RevealService {
  /**
   * Observe elements with class .reveal / .reveal-left / .reveal-right
   * and add .revealed when they enter the viewport.
   */
  observe(root?: HTMLElement) {
    const targets = (root || document).querySelectorAll(
      '.reveal, .reveal-left, .reveal-right'
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => io.observe(el));
    return io;
  }
}
