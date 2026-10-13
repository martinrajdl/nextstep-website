(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  // Ink draws once on arrival, then again when invited. No idle animation loop.
  const doodles = [...document.querySelectorAll('.doodle')];
  const inkAnimations = new Map();
  function settleDoodle(doodle) {
    inkAnimations.get(doodle)?.forEach(animation => animation.cancel());
    inkAnimations.delete(doodle);
  }
  function drawDoodle(doodle) {
    settleDoodle(doodle);
    if (motion.matches || document.hidden) return;
    const animations = [...doodle.querySelectorAll('path')].map((path, index) =>
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: index ? 280 : 1250, delay: index ? 1080 : 0,
        easing: 'cubic-bezier(.45,0,.25,1)', fill: 'backwards',
      }),
    );
    animations.push(doodle.querySelector('.doodle-ink').animate([
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: 'translateY(-4px) rotate(-4deg)', offset: 0.35 },
      { transform: 'translateY(2px) rotate(2deg)', offset: 0.72 },
      { transform: 'translateY(0) rotate(0deg)' },
    ], { duration: 900, delay: 1200, easing: 'ease-in-out' }));
    inkAnimations.set(doodle, animations);
  }
  const doodleObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        drawDoodle(entry.target);
        doodleObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.6 });
  for (const doodle of doodles) {
    doodleObserver.observe(doodle);
    doodle.addEventListener('pointerenter', () => {
      if (finePointer.matches) drawDoodle(doodle);
    });
    doodle.addEventListener('click', () => drawDoodle(doodle));
  }
  motion.addEventListener('change', () => {
    if (motion.matches) doodles.forEach(settleDoodle);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) doodles.forEach(settleDoodle);
  });

  // Follow the pointer on the small illustrations, without moving the page layout.
  document.querySelectorAll('.mini-brief, .mini-schema, .mini-review').forEach(card => {
    card.classList.add('pointer-card');
    card.addEventListener('pointermove', event => {
      if (motion.matches || !finePointer.matches) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      card.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
      card.style.setProperty('--tilt-y', `${(x - 0.5) * 7}deg`);
      card.style.setProperty('--shine-x', `${x * 100}%`);
      card.style.setProperty('--shine-y', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });

  const schema = document.querySelector('.mini-schema');
  const shapes = [
    ['Projects', [['◷', 'Status', 'select'], ['↗', 'Owner', 'relation'], ['#', 'Progress', 'number']]],
    ['Research', [['↗', 'Source', 'url'], ['Aa', 'Finding', 'text'], ['✓', 'Verified', 'checkbox']]],
    ['People', [['Aa', 'Name', 'text'], ['@', 'Email', 'email'], ['↗', 'Projects', 'relation']]],
  ];
  let shapeIndex = 0;
  document.querySelector('#schema-shuffle')?.addEventListener('click', () => {
    const [name, fields] = shapes[shapeIndex++ % shapes.length];
    schema.querySelector('div > span').textContent = name;
    schema.querySelectorAll('p').forEach((row, index) => {
      const [icon, label, type] = fields[index];
      const glyph = document.createElement('span'); glyph.textContent = icon;
      const kind = document.createElement('i'); kind.textContent = type;
      row.replaceChildren(glyph, document.createTextNode(label), kind);
      if (!motion.matches) row.animate([{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 280, delay: index * 45, fill: 'both' });
    });
  });

  document.querySelector('#hero-play')?.addEventListener('click', () => {
    document.querySelector('#playground').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
    const canvas = document.querySelector('#workspace-orbit');
    const target = canvas.hidden ? document.querySelector('.shape-options [aria-pressed="true"]') : canvas;
    target.focus({ preventScroll: true });
    document.dispatchEvent(new Event('nextstep:scatter'));
  });

  const asterisk = document.querySelector('.closing .asterisk');
  asterisk?.addEventListener('pointerenter', () => {
    if (!motion.matches) asterisk.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(180deg) scale(1.25)', offset: 0.6 }, { transform: 'rotate(360deg) scale(1)' }], { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
})();
