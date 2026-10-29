/* Subtle pointer parallax on existing glass surfaces; no layout changes. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  const surfaces = document.querySelectorAll('.glass-panel, .shop-card, .contact-aside, .feature-card');
  for (const element of surfaces) {
    element.classList.add('glass-motion');
    let frame = 0;
    let point;
    element.addEventListener('pointermove', event => {
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
        element.style.setProperty('--glass-rx', `${((.5 - y) * 5).toFixed(2)}deg`);
        element.style.setProperty('--glass-ry', `${((x - .5) * 5).toFixed(2)}deg`);
        element.style.setProperty('--glass-x', `${(x * 100).toFixed(1)}%`);
        element.style.setProperty('--glass-y', `${(y * 100).toFixed(1)}%`);
      });
    });
    element.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      element.style.setProperty('--glass-rx', '0deg');
      element.style.setProperty('--glass-ry', '0deg');
      element.style.setProperty('--glass-x', '50%');
      element.style.setProperty('--glass-y', '0%');
    });
  }
})();
