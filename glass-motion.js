/* Pointer parallax eases toward the cursor without changing layout dimensions. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  const surfaces = document.querySelectorAll('.glass-panel, .shop-card, .contact-aside, .feature-card');
  for (const element of surfaces) {
    element.classList.add('glass-motion');
    const current = { x: 0, y: 0, lightX: 50, lightY: 0 };
    const target = { ...current };
    let frame = 0;
    let last = 0;
    function animate(now) {
      frame = 0;
      const dt = Math.min(48, last ? now - last : 16);
      last = now;
      const ease = 1 - Math.exp(-dt / 95);
      let distance = 0;
      for (const key of Object.keys(current)) {
        const change = target[key] - current[key];
        current[key] += change * ease;
        distance += Math.abs(change);
      }
      element.style.setProperty('--glass-rx', `${current.y.toFixed(2)}deg`);
      element.style.setProperty('--glass-ry', `${current.x.toFixed(2)}deg`);
      element.style.setProperty('--glass-x', `${current.lightX.toFixed(1)}%`);
      element.style.setProperty('--glass-y', `${current.lightY.toFixed(1)}%`);
      if (distance > .12) frame = requestAnimationFrame(animate);
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(animate); };
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      target.x = (x - .5) * 5;
      target.y = (.5 - y) * 5;
      target.lightX = x * 100;
      target.lightY = y * 100;
      schedule();
    });
    element.addEventListener('pointerleave', () => {
      target.x = 0;
      target.y = 0;
      target.lightX = 50;
      target.lightY = 0;
      schedule();
    });
  }
})();
