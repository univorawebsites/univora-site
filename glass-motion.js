/* Pointer parallax eases toward the cursor without changing layout dimensions. */
(() => {
  const rich = document.documentElement.classList.contains('lg2');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Main site only: ambient light, rim-light layers and scroll depth. */
  if (rich) {
    // Rim light + sheen layer inside every large glass surface (absolutely positioned: no layout impact).
    document.querySelectorAll('.topbar, .glass-panel, .shop-card, .contact-aside').forEach((element, index) => {
      const fx = document.createElement('span');
      fx.className = 'glass-fx';
      fx.setAttribute('aria-hidden', 'true');
      element.appendChild(fx);
      element.style.setProperty('--fx-delay', `${(-((index * 2.7) % 11)).toFixed(1)}s`);
    });
    document.querySelectorAll('.showcase-browser').forEach((element, index) => {
      element.style.setProperty('--fx-delay', `${(-(3 + index * 4.5)).toFixed(1)}s`);
    });

    // Ambient orbs and glass bubbles behind the pages, so the glass has something to refract.
    const shell = document.querySelector('.shell');
    if (shell) {
      const ambient = document.createElement('div');
      ambient.className = 'ambient';
      ambient.setAttribute('aria-hidden', 'true');
      ambient.innerHTML = '<i class="o o1"></i><i class="o o2"></i><i class="o o3"></i><i class="b b1"></i><i class="b b2"></i>';
      shell.insertBefore(ambient, shell.firstChild);

      if (!reduced) {
        // Scroll depth: the light drifts at its own speed while the page scrolls over it.
        let scrollFrame = 0;
        const syncScroll = () => {
          scrollFrame = 0;
          const page = document.querySelector('.page.active');
          ambient.style.setProperty('--amb-y', page ? Math.round(page.scrollTop) : 0);
        };
        const scheduleScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScroll); };
        document.addEventListener('scroll', event => {
          if (event.target instanceof Element && event.target.classList.contains('page')) scheduleScroll();
        }, { capture: true, passive: true });
        addEventListener('hashchange', () => setTimeout(scheduleScroll, 60));

        // Pointer depth: the light moves slightly against the cursor (fine pointers only).
        if (finePointer) {
          const cur = { x: 0, y: 0 };
          const tgt = { x: 0, y: 0 };
          let frame = 0;
          const step = () => {
            frame = 0;
            cur.x += (tgt.x - cur.x) * .08;
            cur.y += (tgt.y - cur.y) * .08;
            ambient.style.setProperty('--amb-px', cur.x.toFixed(3));
            ambient.style.setProperty('--amb-py', cur.y.toFixed(3));
            if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .002) frame = requestAnimationFrame(step);
          };
          addEventListener('pointermove', event => {
            tgt.x = event.clientX / innerWidth - .5;
            tgt.y = event.clientY / innerHeight - .5;
            if (!frame) frame = requestAnimationFrame(step);
          }, { passive: true });
        }
      }
    }
  }

  if (!(finePointer && !reduced)) return;

  const surfaces = document.querySelectorAll('.glass-panel, .shop-card, .contact-aside, .feature-card');
  const strength = rich ? 7 : 5;
  for (const element of surfaces) {
    element.classList.add('glass-motion');
    const current = { x: 0, y: 0, lightX: 50, lightY: 0, px: 0, py: 0 };
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
      if (rich) {
        element.style.setProperty('--glass-px', current.px.toFixed(3));
        element.style.setProperty('--glass-py', current.py.toFixed(3));
      }
      if (distance > .12) frame = requestAnimationFrame(animate);
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(animate); };
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      target.x = (x - .5) * strength;
      target.y = (.5 - y) * strength;
      target.lightX = x * 100;
      target.lightY = y * 100;
      target.px = (x - .5) * 2;
      target.py = (y - .5) * 2;
      schedule();
    });
    element.addEventListener('pointerleave', () => {
      target.x = 0;
      target.y = 0;
      target.lightX = 50;
      target.lightY = 0;
      target.px = 0;
      target.py = 0;
      schedule();
    });
  }

  /* The two spheres in the "Due teste" block drift at different depths. */
  if (rich) {
    document.querySelectorAll('.duo-art').forEach(element => {
      const cur = { x: 0, y: 0 };
      const tgt = { x: 0, y: 0 };
      let frame = 0;
      const step = () => {
        frame = 0;
        cur.x += (tgt.x - cur.x) * .12;
        cur.y += (tgt.y - cur.y) * .12;
        element.style.setProperty('--dpx', cur.x.toFixed(3));
        element.style.setProperty('--dpy', cur.y.toFixed(3));
        if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .002) frame = requestAnimationFrame(step);
      };
      const schedule = () => { if (!frame) frame = requestAnimationFrame(step); };
      element.addEventListener('pointermove', event => {
        const rect = element.getBoundingClientRect();
        tgt.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
        tgt.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
        schedule();
      });
      element.addEventListener('pointerleave', () => { tgt.x = 0; tgt.y = 0; schedule(); });
    });
  }
})();
