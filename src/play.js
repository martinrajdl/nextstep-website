(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  // Follow the pointer on the small illustrations, without moving the page layout.
  document.querySelectorAll('.mini-brief, .mini-schema, .mini-review, .principles-grid article').forEach(card => {
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

  // A click has a small physical response. Links and native button behavior stay intact.
  document.querySelectorAll('.button, #cycle-play, .shape-options button').forEach(button => {
    button.classList.add('has-ripple');
    button.addEventListener('pointerdown', event => {
      if (motion.matches) return;
      const box = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${event.clientX - box.left}px`;
      ripple.style.top = `${event.clientY - box.top}px`;
      button.append(ripple);
      setTimeout(() => ripple.remove(), 650);
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
