/* Pointer parallax eases toward the cursor without changing layout dimensions. */
(() => {
  const rich = document.documentElement.classList.contains('lg2');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Main site only: ambient light, rim-light layers and scroll depth. */
  if (rich) {
    // Rim light + sheen layer inside every large glass surface (absolutely positioned: no layout impact).
    document.querySelectorAll('.topbar, .glass-panel, .shop-card, .contact-aside, .summary').forEach((element, index) => {
      const fx = document.createElement('span');
      fx.className = 'glass-fx';
      fx.setAttribute('aria-hidden', 'true');
      element.appendChild(fx);
      element.style.setProperty('--fx-delay', `${(-((index * 2.7) % 11)).toFixed(1)}s`);
    });
    document.querySelectorAll('#home-details .glass-panel').forEach(element => {
      const modules = document.createElement('div');
      modules.className = 'glass-modules';
      modules.setAttribute('aria-hidden', 'true');
      modules.innerHTML = '<span></span><span></span><span></span>';
      element.appendChild(modules);
    });
    document.querySelectorAll('.showcase-browser').forEach((element, index) => {
      element.style.setProperty('--fx-delay', `${(-(3 + index * 4.5)).toFixed(1)}s`);
    });

    // The ← → symbols of the hero buttons get their own element, so they can glide independently of the button.
    document.querySelectorAll('.hero-controls .round').forEach(button => {
      if (button.querySelector('.glyph')) return;
      const glyph = document.createElement('span');
      glyph.className = 'glyph';
      glyph.textContent = button.textContent;
      button.textContent = '';
      button.appendChild(glyph);
    });

    // Orbit lines around the hero cube, placed from the cube's own centre and size.
    const heroStage = document.querySelector('.hero-stage');
    if (heroStage) {
      const orbits = document.createElement('div');
      orbits.className = 'hero-orbits';
      orbits.setAttribute('aria-hidden', 'true');
      orbits.innerHTML = '<i class="r1"></i><i class="r2"></i><i class="r3"></i>';
      heroStage.appendChild(orbits);
      const placeOrbits = () => {
        const w = heroStage.clientWidth;
        const h = heroStage.clientHeight;
        const mobile = w < 850;
        heroStage.style.setProperty('--cube', `${Math.min(h * .44, w * (mobile ? .57 : .30)).toFixed(1)}px`);
        heroStage.style.setProperty('--cx', `${(w * (mobile ? .5 : .64)).toFixed(1)}px`);
        heroStage.style.setProperty('--cy', `${(h * (mobile ? .34 : .41)).toFixed(1)}px`);
      };
      placeOrbits();
      addEventListener('resize', placeOrbits);
    }

    // Anything decorative that scrolls out of view stops animating (saves battery and keeps scrolling smooth).
    if ('IntersectionObserver' in window) {
      const pauser = new IntersectionObserver(entries => {
        for (const entry of entries) entry.target.classList.toggle('lg-off', !entry.isIntersecting);
      }, { rootMargin: '120px' });
      document.querySelectorAll('.glass-panel, .shop-card, .contact-aside, .summary, .showcase-browser, .hero-orbits').forEach(el => pauser.observe(el));
    }

    // Shop summary: a live "plan card" with an emblem, a level meter and the chosen budget.
    // It listens to the existing level buttons / slider (it only watches their text), so their own code is untouched.
    const summary = document.querySelector('.summary');
    const levelValue = document.getElementById('levelValue');
    const budgetInput = document.getElementById('budget');
    const budgetText = document.getElementById('budgetValue');
    const featureList = document.getElementById('features');
    if (summary && levelValue && featureList) {
      const tiers = { Essential: 1, Signature: 2, Universe: 3 };
      const emblem = document.createElement('div');
      emblem.className = 'plan-emblem';
      emblem.setAttribute('aria-hidden', 'true');
      emblem.innerHTML = '<i></i><i></i><i></i><b></b>';
      summary.insertBefore(emblem, summary.firstChild);

      const meter = document.createElement('div');
      meter.className = 'plan-meter';
      meter.setAttribute('aria-hidden', 'true');
      meter.innerHTML = '<i></i><i></i><i></i><em></em>';
      levelValue.insertAdjacentElement('afterend', meter);

      const budgetRow = document.createElement('div');
      budgetRow.className = 'plan-budget';
      budgetRow.innerHTML = '<span>Budget indicativo</span><b></b><div class="bar"><div></div></div>';
      featureList.insertAdjacentElement('afterend', budgetRow);

      let currentPlan = '';
      let switchTimer = 0;
      const syncPlan = first => {
        const name = levelValue.textContent.trim();
        if (!name || name === currentPlan) return;
        currentPlan = name;
        const tier = tiers[name] || 1;
        summary.dataset.plan = name;
        summary.dataset.tier = String(tier);
        meter.querySelector('em').textContent = `0${tier} / 03`;
        if (first || reduced) return;
        summary.classList.remove('is-switching');
        void summary.offsetWidth;
        summary.classList.add('is-switching');
        clearTimeout(switchTimer);
        switchTimer = setTimeout(() => summary.classList.remove('is-switching'), 1300);
      };
      new MutationObserver(() => syncPlan(false)).observe(levelValue, { childList: true, characterData: true, subtree: true });
      syncPlan(true);

      const syncBudget = () => {
        if (!budgetInput || !budgetText) return;
        budgetRow.querySelector('b').textContent = budgetText.textContent;
        const min = Number(budgetInput.min) || 0;
        const max = Number(budgetInput.max) || 100;
        const share = Math.max(0, Math.min(1, (Number(budgetInput.value) - min) / (max - min)));
        budgetRow.style.setProperty('--bp', `${(share * 100).toFixed(1)}%`);
      };
      if (budgetInput && budgetText) {
        budgetInput.addEventListener('input', syncBudget);
        new MutationObserver(syncBudget).observe(budgetText, { childList: true, characterData: true, subtree: true });
      }
      syncBudget();
    }

    // Showcase: each concept drifts and turns slightly as it travels through the screen (--par: -1 … 1).
    const showcaseItems = [...document.querySelectorAll('.showcase-item')];
    if (showcaseItems.length && !reduced) {
      let parFrame = 0;
      const updatePar = () => {
        parFrame = 0;
        const vh = innerHeight;
        for (const item of showcaseItems) {
          const r = item.getBoundingClientRect();
          if (!r.height || r.bottom < -240 || r.top > vh + 240) continue;
          const t = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / vh));
          item.style.setProperty('--par', t.toFixed(3));
        }
      };
      const queuePar = () => { if (!parFrame) parFrame = requestAnimationFrame(updatePar); };
      document.querySelectorAll('.page').forEach(page => page.addEventListener('scroll', queuePar, { passive: true }));
      addEventListener('resize', queuePar);
      document.addEventListener('click', event => { if (event.target.closest('[data-page]')) setTimeout(queuePar, 150); });
      updatePar();
    }

    // Glass budget slider: the filled part of the track follows the thumb.
    const budgetRange = document.getElementById('budget');
    if (budgetRange) {
      const paintRange = () => {
        const min = Number(budgetRange.min) || 0;
        const max = Number(budgetRange.max) || 100;
        budgetRange.style.setProperty('--p', ((Number(budgetRange.value) - min) / (max - min)).toFixed(4));
      };
      budgetRange.addEventListener('input', paintRange);
      paintRange();
    }

    // Touch screens: a short light bloom from the exact point that was tapped.
    if (matchMedia('(hover: none)').matches) {
      document.addEventListener('pointerdown', event => {
        const target = event.target instanceof Element ? event.target.closest('.button, .level') : null;
        if (!target) return;
        const box = target.getBoundingClientRect();
        target.style.setProperty('--tx', `${(event.clientX - box.left).toFixed(0)}px`);
        target.style.setProperty('--ty', `${(event.clientY - box.top).toFixed(0)}px`);
        target.classList.remove('tap');
        void target.offsetWidth;
        target.classList.add('tap');
      }, { passive: true });
      document.addEventListener('animationend', event => {
        if (event.animationName === 'lg-ripple' && event.target instanceof Element) event.target.classList.remove('tap');
      });
    }

    // Ambient orbs and glass bubbles behind the pages, so the glass has something to refract.
    const shell = document.querySelector('.shell');
    if (shell) {
      const ambient = document.createElement('div');
      ambient.className = 'ambient';
      ambient.setAttribute('aria-hidden', 'true');
      ambient.innerHTML = '<i class="o o1"></i><i class="o o2"></i><i class="o o3"></i><i class="b b1"></i><i class="b b2"></i><i class="c"></i>';
      shell.insertBefore(ambient, shell.firstChild);

      // Thin scroll-progress line along the top edge.
      const line = document.createElement('div');
      line.className = 'scroll-line';
      line.setAttribute('aria-hidden', 'true');
      line.innerHTML = '<i></i>';
      shell.appendChild(line);

      // Floating "back to top" button, shown after the first screen.
      const toTop = document.createElement('button');
      toTop.type = 'button';
      toTop.className = 'to-top';
      toTop.setAttribute('aria-label', 'Torna in alto');
      toTop.innerHTML = '<i>↑</i>';
      shell.appendChild(toTop);
      toTop.addEventListener('click', () => {
        const active = document.querySelector('.page.active');
        if (active) active.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });

      // Touch screens have no cursor: the light on each glass card slides as the card travels up the screen.
      let touchLight = null;
      if (!finePointer && !reduced) {
        const cards = document.querySelectorAll('.glass-panel, .shop-card, .contact-aside, .summary');
        const inView = new Set();
        if ('IntersectionObserver' in window) {
          const watcher = new IntersectionObserver(entries => {
            for (const entry of entries) entry.isIntersecting ? inView.add(entry.target) : inView.delete(entry.target);
            if (touchLight) touchLight();
          }, { rootMargin: '60px' });
          cards.forEach(card => watcher.observe(card));
        }
        touchLight = () => {
          const half = innerHeight / 2;
          for (const card of inView) {
            const box = card.getBoundingClientRect();
            const t = Math.max(-1, Math.min(1, (box.top + box.height / 2 - half) / half));
            card.style.setProperty('--glass-x', `${(50 - t * 34).toFixed(1)}%`);
            card.style.setProperty('--glass-y', `${(30 + t * 28).toFixed(1)}%`);
            card.style.setProperty('--glass-px', (-t * .45).toFixed(3));
            card.style.setProperty('--glass-py', (t * .9).toFixed(3));
          }
        };
        addEventListener('resize', () => touchLight());
      }

      // Scroll depth: the light drifts at its own speed while the page scrolls over it.
      let scrollFrame = 0;
      const syncScroll = () => {
        scrollFrame = 0;
        const page = document.querySelector('.page.active');
        if (!reduced) ambient.style.setProperty('--amb-y', page ? Math.round(page.scrollTop) : 0);
        const max = page ? page.scrollHeight - page.clientHeight : 0;
        shell.style.setProperty('--scroll-p', max > 0 ? Math.min(1, page.scrollTop / max).toFixed(4) : 0);
        toTop.classList.toggle('show', !!page && page.scrollTop > innerHeight * .8);
        if (touchLight) touchLight();
      };
      const scheduleScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScroll); };
      document.addEventListener('scroll', event => {
        if (event.target instanceof Element && event.target.classList.contains('page')) scheduleScroll();
      }, { capture: true, passive: true });
      addEventListener('hashchange', () => setTimeout(scheduleScroll, 60));

      if (!reduced) {
        // Light that trails the cursor behind the glass (fine pointers only).
        const light = ambient.querySelector('.c');
        if (finePointer && light) {
          const lp = { x: innerWidth / 2, y: innerHeight / 2 };
          const lt = { ...lp };
          let lightFrame = 0;
          const lightStep = () => {
            lightFrame = 0;
            lp.x += (lt.x - lp.x) * .14;
            lp.y += (lt.y - lp.y) * .14;
            light.style.transform = `translate3d(${lp.x.toFixed(1)}px, ${lp.y.toFixed(1)}px, 0)`;
            if (Math.abs(lt.x - lp.x) + Math.abs(lt.y - lp.y) > .5) lightFrame = requestAnimationFrame(lightStep);
          };
          addEventListener('pointermove', event => {
            lt.x = event.clientX;
            lt.y = event.clientY;
            light.classList.add('on');
            if (!lightFrame) lightFrame = requestAnimationFrame(lightStep);
          }, { passive: true });
          document.documentElement.addEventListener('pointerleave', () => light.classList.remove('on'));
        }

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

  const surfaces = document.querySelectorAll('.glass-panel, .shop-card, .contact-aside, .summary, .feature-card');
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
