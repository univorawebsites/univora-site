/* Shared, reversible camera movement for the two home-page concept previews. */
window.createUnivoraPreview = function createUnivoraPreview({ onActivate, onDeactivate, onPause, onPlay } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const topPause = 1700;
  const travel = 7200;
  const bottomPause = 1700;
  const cycle = 20000;
  const bottomStart = topPause + travel;
  const upwardStart = bottomStart + bottomPause;
  const topEnd = upwardStart + travel;
  const ease = value => (1 - Math.cos(Math.PI * value)) / 2;
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight;

  let active = false;
  let paused = false;
  let elapsed = 0;
  let position = scrollY;
  let holdUntil = 0;
  let lastFrame = performance.now();
  let manual = null;
  let lastDirection = '';

  function direction() {
    if (manual) return manual.to > manual.from ? 'down' : 'up';
    return elapsed < bottomStart ? 'down' : elapsed < topEnd ? 'up' : 'down';
  }
  function reportDirection() {
    const current = direction();
    if (current === lastDirection) return;
    lastDirection = current;
    parent.postMessage({ type: 'univora-preview-direction', direction: current }, location.origin);
  }
  function progress(time) {
    if (time < topPause) return 0;
    if (time < bottomStart) return ease((time - topPause) / travel);
    if (time < upwardStart) return 1;
    if (time < topEnd) return 1 - ease((time - upwardStart) / travel);
    return 0;
  }
  function syncToUserScroll() {
    const max = maxScroll();
    position = scrollY;
    if (max < 2) return;
    const ratio = Math.max(0, Math.min(1, position / max));
    if (elapsed < upwardStart) {
      elapsed = topPause + Math.acos(1 - 2 * ratio) / Math.PI * travel;
    } else {
      elapsed = upwardStart + Math.acos(2 * ratio - 1) / Math.PI * travel;
    }
    reportDirection();
  }
  function next() {
    const max = maxScroll();
    if (max < 2) return;
    const to = scrollY < max / 2 ? max : 0;
    if (reduced) {
      scrollTo(0, to);
      position = to;
      elapsed = to ? bottomStart : 0;
      reportDirection();
      return;
    }
    manual = { from: scrollY, to, start: performance.now(), duration: 1250 };
    reportDirection();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(64, Math.max(0, now - lastFrame));
    lastFrame = now;
    if (document.hidden || !active) return;
    const max = maxScroll();
    if (max < 2) return;
    if (manual) {
      const amount = Math.min(1, (now - manual.start) / manual.duration);
      const eased = ease(amount);
      position = manual.from + (manual.to - manual.from) * eased;
      scrollTo(0, position);
      if (amount === 1) {
        elapsed = manual.to ? bottomStart : 0;
        manual = null;
        holdUntil = now + 700;
        reportDirection();
      }
      return;
    }
    if (paused || reduced || now < holdUntil) {
      position = scrollY;
      return;
    }
    elapsed = (elapsed + dt) % cycle;
    const target = max * progress(elapsed);
    position += (target - position) * (1 - Math.exp(-dt / 125));
    if (Math.abs(target - position) < .15) position = target;
    scrollTo(0, position);
    reportDirection();
  }

  addEventListener('pointermove', () => { holdUntil = performance.now() + 1800; }, { passive: true });
  addEventListener('wheel', () => {
    holdUntil = performance.now() + 1800;
    requestAnimationFrame(syncToUserScroll);
  }, { passive: true });
  addEventListener('touchstart', () => { holdUntil = performance.now() + 1800; }, { passive: true });
  addEventListener('touchmove', () => {
    holdUntil = performance.now() + 1800;
    requestAnimationFrame(syncToUserScroll);
  }, { passive: true });
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'univora-preview') return;
    switch (event.data.action) {
      case 'activate':
        active = true;
        position = scrollY;
        lastFrame = performance.now();
        onActivate?.();
        reportDirection();
        break;
      case 'deactivate':
        active = false;
        manual = null;
        onDeactivate?.();
        break;
      case 'pause':
        paused = true;
        onPause?.();
        break;
      case 'play':
        paused = false;
        onPlay?.();
        break;
      case 'next':
        next();
        break;
    }
  });
  requestAnimationFrame(frame);
  return { next };
};
