// Runs before the stylesheet so an evening visit never flashes the light theme.
(() => {
  const root = document.documentElement;
  const storageKey = 'nextstep.website.theme';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let preference = 'auto';
  let transition;
  try {
    const saved = localStorage.getItem(storageKey);
    if (['light', 'dark'].includes(saved)) preference = saved;
  } catch { /* Automatic mode also works when storage is unavailable. */ }

  function theme() {
    const hour = new Date().getHours();
    return preference === 'auto' ? (hour >= 20 || hour < 7 ? 'dark' : 'light') : preference;
  }

  function apply() {
    const next = theme();
    const changed = root.dataset.theme !== next;
    root.dataset.theme = next;
    root.dataset.themePreference = preference;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#111318' : '#ffffff');
    for (const toggle of document.querySelectorAll('[data-theme-toggle]')) {
      const label = `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`;
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }
    for (const status of document.querySelectorAll('[data-theme-status]')) {
      status.textContent = preference === 'auto' ? `${next === 'dark' ? 'Night' : 'Day'} mode · your local time` : `${next === 'dark' ? 'Night' : 'Day'} mode · your choice`;
    }
    for (const automatic of document.querySelectorAll('[data-theme-auto]')) {
      automatic.setAttribute('aria-pressed', String(preference === 'auto'));
    }
    if (changed) document.dispatchEvent(new CustomEvent('nextstep:theme', { detail: { theme: next } }));
  }

  function choose(next, event) {
    preference = next;
    try {
      if (next === 'auto') localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, next);
    } catch { /* The selection still works for this visit. */ }
    if (theme() === root.dataset.theme || motion.matches || !document.startViewTransition) { apply(); return; }
    transition?.skipTransition();
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.detail ? event.clientX : bounds.x + bounds.width / 2;
    const y = event.detail ? event.clientY : bounds.y + bounds.height / 2;
    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.style.setProperty('--theme-radius', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    transition = document.startViewTransition(apply);
    transition.ready.catch(() => { /* A newer click can skip this animation. */ });
  }

  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', event => choose(root.dataset.theme === 'dark' ? 'light' : 'dark', event));
    });
    document.querySelectorAll('[data-theme-auto]').forEach(button => {
      button.addEventListener('click', event => choose('auto', event));
    });
  });
  // Align with the local clock so an open page changes at 20:00 and 07:00.
  function checkClock() {
    apply();
    setTimeout(checkClock, 60000 - Date.now() % 60000);
  }
  setTimeout(checkClock, 60000 - Date.now() % 60000);
  addEventListener('pageshow', apply);
  addEventListener('focus', apply);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
  addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : 'auto';
    apply();
  });
})();
