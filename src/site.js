const examples = {
  people: {
    title: 'People',
    description: 'Good work starts with good people.',
    columns: ['Name', 'Company', 'Relationship', 'Last contact'],
    rows: [
      ['Jamie Chen', 'Form & Field', 'Close', 'Oct 08'],
      ['Morgan Ellis', 'Common Ground', 'In touch', 'Oct 06'],
      ['Sam Okafor', 'Northstar Works', 'New', 'Oct 04'],
      ['Riley Park', 'Paperplane', 'In touch', 'Oct 02'],
    ],
    schema: {
      name: 'People',
      fields: [
        { key: 'company', type: 'text' },
        {
          key: 'relationship',
          type: 'select',
          options: ['New', 'In touch', 'Close'],
        },
        { key: 'last_contact', type: 'date' },
      ],
    },
  },
  projects: {
    title: 'Projects',
    description: 'A little progress, one next step at a time.',
    columns: ['Project', 'Status', 'Priority', 'Due date'],
    rows: [
      ['Studio website', 'In progress', 'High', 'Oct 24'],
      ['Field notes series', 'In review', 'Medium', 'Oct 18'],
      ['Community workshop', 'Backlog', 'Medium', 'Nov 05'],
    ],
    schema: {
      name: 'Projects',
      fields: [
        {
          key: 'status',
          type: 'select',
          options: ['Backlog', 'In progress', 'In review', 'Done'],
        },
        { key: 'priority', type: 'select', options: ['Low', 'Medium', 'High'] },
        { key: 'due_date', type: 'date' },
      ],
    },
  },
  research: {
    title: 'Research',
    description: 'Collect the useful bits. Connect the dots.',
    columns: ['Finding', 'Topic', 'Status', 'Source'],
    rows: [
      [
        'Designing for quiet focus',
        'Product thinking',
        'Reviewed',
        'example.com',
      ],
      ['Local-first software notes', 'Architecture', 'Reading', 'example.com'],
      [
        'The shape of a good question',
        'Research methods',
        'Inbox',
        'example.com',
      ],
    ],
    schema: {
      name: 'Research',
      fields: [
        { key: 'topic', type: 'text' },
        {
          key: 'status',
          type: 'select',
          options: ['Inbox', 'Reading', 'Reviewed'],
        },
        { key: 'source', type: 'url' },
      ],
    },
  },
};
let active = 'people',
  outcome = 'pending',
  showSchema = false;
const originalPeople = examples.people.rows.map((row) => [...row]);
const $ = (selector) => document.querySelector(selector);
function cell(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
function render() {
  const sample = examples[active],
    search = $('#demo-search').value.trim().toLowerCase();
  $('#demo-title').textContent = sample.title;
  $('#demo-description').textContent = sample.description;
  $('#demo-breadcrumb-name').textContent = sample.title;
  $('.demo-record-count').textContent = `${sample.rows.length} records`;
  $('[data-count="people"]').textContent = examples.people.rows.length;
  document
    .querySelectorAll('.demo-tab')
    .forEach((tab) =>
      tab.setAttribute(
        'aria-selected',
        String(tab.dataset.collection === active),
      ),
    );
  const table = document.createElement('table'),
    head = document.createElement('thead'),
    heading = document.createElement('tr');
  sample.columns.forEach((column) => {
    const th = cell('th', column);
    th.scope = 'col';
    heading.append(th);
  });
  head.append(heading);
  table.append(head);
  const body = document.createElement('tbody');
  const rows = sample.rows.filter((row) =>
    row.join(' ').toLowerCase().includes(search),
  );
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.style.setProperty('--row', rowIndex);
    row.forEach((value, index) => {
      const td = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) {
        td.scope = 'row';
        const mark = cell(
          'span',
          value
            .split(' ')
            .map((v) => v[0])
            .slice(0, 2)
            .join(''),
        );
        mark.className = 'record-initials';
        td.append(mark, document.createTextNode(value));
      } else if (index === 2) {
        const badge = cell('span', value);
        badge.className = 'badge';
        td.append(badge);
      } else td.textContent = value;
      tr.append(td);
    });
    body.append(tr);
  });
  table.append(body);
  $('#demo-table').replaceChildren(table);
  $('#demo-empty').hidden = rows.length > 0 || showSchema;
  $('#demo-table').hidden = showSchema;
  $('#demo-schema').hidden = !showSchema;
  $('#demo-schema').textContent = JSON.stringify(sample.schema, null, 2);
  $('#shape-toggle').setAttribute('aria-expanded', String(showSchema));
  $('#shape-toggle span').textContent = showSchema
    ? 'View records'
    : 'View schema';
  $('.review-count').textContent = outcome === 'pending' ? '1' : '0';
  $('#proposal-summary').textContent =
    outcome === 'approved'
      ? 'Approved. Alex Rivera is now part of the example People collection.'
      : outcome === 'rejected'
        ? 'Rejected. The example records were kept as they were.'
        : 'I found a new collaborator for the studio. One record is ready for your review.';
}
function selectCollection(name) {
  active = name;
  $('#demo-search').value = '';
  render();
}
document
  .querySelectorAll('.demo-tab')
  .forEach((tab) =>
    tab.addEventListener('click', () =>
      selectCollection(tab.dataset.collection),
    ),
  );
const tabs = [...document.querySelectorAll('.demo-tab')];
tabs.forEach((tab, index) =>
  tab.addEventListener('keydown', (event) => {
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index +
              (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) +
              tabs.length) %
            tabs.length;
    tabs[next].focus();
    selectCollection(tabs[next].dataset.collection);
  }),
);
document.querySelectorAll('[data-jump]').forEach((button) =>
  button.addEventListener('click', () => {
    selectCollection(button.dataset.jump);
    $('#demo').scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }),
);
$('#demo-search').addEventListener('input', render);
$('#shape-toggle').addEventListener('click', () => {
  showSchema = !showSchema;
  render();
});
const dialog = $('#review-dialog');
document.querySelectorAll('.review-trigger').forEach((button) =>
  button.addEventListener('click', () => {
    $('#review-feedback').textContent =
      outcome === 'pending'
        ? ''
        : `This example was already ${outcome}. Reset the example to try again.`;
    $('#approve-demo').disabled = outcome !== 'pending';
    $('#reject-demo').disabled = outcome !== 'pending';
    dialog.showModal();
  }),
);
$('#close-review').addEventListener('click', () => dialog.close());
$('#approve-demo').addEventListener('click', () => {
  if (outcome !== 'pending') return;
  outcome = 'approved';
  examples.people.rows.push([
    'Alex Rivera',
    'Fieldwork Studio',
    'In touch',
    'Just now',
  ]);
  active = 'people';
  $('#demo-search').value = '';
  dialog.close();
  render();
  stopPlayback();
  showCycle(4);
  notify('Example approved. Alex Rivera added to People.');
});
$('#reject-demo').addEventListener('click', () => {
  if (outcome !== 'pending') return;
  outcome = 'rejected';
  dialog.close();
  render();
  stopPlayback();
  showCycle(3);
  notify('Example rejected. No records changed.');
});
function resetExample() {
  stopPlayback();
  examples.people.rows = originalPeople.map((row) => [...row]);
  outcome = 'pending';
  showSchema = false;
  selectCollection('people');
  showCycle(0);
}
$('#demo-reset').addEventListener('click', () => {
  resetExample();
  notify('Example reset.');
});
let toastTimer;
function notify(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}
$('#copy-install').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#install-code').textContent);
    notify('Commands copied.');
  } catch {
    const selection = window.getSelection();
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents($('#install-code'));
    selection.addRange(range);
    notify('Commands selected. Copy them with your keyboard.');
  }
});
render();

const cycleSteps = [
  ['YOUR DIRECTION','“Find the right design partners.”','Describe the outcome and the context. Your agent turns that direction into a workflow.',['Goal: build a useful contact pipeline','Context: product studios and independent designers','Review proposed changes before they are applied']],
  ['AGENT REPORTED · SOURCING','Your agent finds the useful information.','It researches relevant contacts and companies with its own tools, checks existing records, and reports its progress in the CRM.',['Read existing contacts to avoid duplicates','Find people at relevant studios','Attach source links and note uncertainties']],
  ['AGENT REPORTED · SHAPING','The workspace takes the shape of the work.','Your agent designs the collections, fields, relationships, and stages you need. No fixed sales pipeline required.',['Create linked People and Companies collections','Define relationship and next-step fields','Preview an atomic change set']],
  ['WAITING FOR YOU · REVIEW','See exactly what will change.','Review the proposed records and field changes. Approve or reject them. Trusted agents can have explicit direct-write access.',['One new contact proposed: Alex Rivera','Record remains unchanged until approval','Nextstep validates current versions before applying']],
  ['NEXTSTEP VERIFIED · CHANGES APPLIED','Your agent keeps the work moving.','After review, the agent reads the latest state, enriches contacts, moves records through stages, and reports the next step. You can follow the whole flow.',['Contact added after approval','Agent prepares the next enrichment or stage change','Every applied update has a before-and-after history']],
];
const cycleTabs = [...document.querySelectorAll('[data-cycle]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let cycleIndex = 0;
let playbackTimer;
let playing = false;
function updatePlayButton() {
  $('#cycle-play').textContent = playing ? 'Ⅱ Pause the flow' : '▶ Play the flow';
  $('#cycle-play').setAttribute('aria-label', playing ? 'Pause agent walkthrough' : 'Play agent walkthrough');
  $('.agent-cycle').classList.toggle('is-playing', playing);
  $('#playback-status').textContent = playing ? 'Agent walkthrough running' : cycleIndex === 3 && outcome === 'pending' ? 'Paused for your review' : outcome === 'approved' ? 'Change approved and applied' : outcome === 'rejected' ? 'Proposal rejected · records unchanged' : 'Interactive example';
}
function stopPlayback() {
  clearTimeout(playbackTimer);
  playing = false;
  updatePlayButton();
}
function showCycle(index) {
  cycleIndex = index;
  const [status, title, description, events] = cycleSteps[index];
  cycleTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    tab.classList.toggle('is-complete', i < index);
  });
  $('#cycle-panel').setAttribute('aria-labelledby', `cycle-tab-${index}`);
  $('#cycle-status').textContent = index === 4 && outcome !== 'approved' ? 'AFTER YOUR APPROVAL' : index === 3 && outcome === 'rejected' ? 'YOU REJECTED · NOTHING CHANGED' : status;
  $('#cycle-title').textContent = title;
  $('#cycle-description').textContent = description;
  $('#cycle-events').replaceChildren(...events.map((event, i) => {
    const item = cell('li', event);
    item.style.setProperty('--event', i);
    return item;
  }));
  $('#cycle-progress').style.width = `${(index + 1) * 20}%`;
  $('#cycle-review').hidden = index !== 3 || outcome !== 'pending';
  if (!reducedMotion.matches) $('#cycle-panel').animate([{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'ease-out' });
  updatePlayButton();
}
function queueStep() {
  playbackTimer = setTimeout(() => {
    if (!playing) return;
    showCycle(cycleIndex + 1);
    // Human approval is an actual interaction, never part of the timer.
    if (cycleIndex === 3) stopPlayback();
    else queueStep();
  }, 2200);
}
$('#cycle-play').addEventListener('click', () => {
  if (playing) { stopPlayback(); return; }
  if (outcome !== 'pending') resetExample();
  else if (cycleIndex >= 3) showCycle(0);
  playing = true;
  updatePlayButton();
  queueStep();
});
cycleTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => { stopPlayback(); showCycle(index); });
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + 5) % 5;
    stopPlayback(); showCycle(next); cycleTabs[next].focus();
  });
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
showCycle(0);

// Reveal once as sections enter the viewport; content remains readable without JS.
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.12 });
document.querySelectorAll('.demo-section, .section-top, .agent-cycle, .workflow article, .possibilities-layout, .principles-grid article, .start-section, .faq, .closing').forEach(node => {
  node.classList.add('reveal');
  revealObserver.observe(node);
});
let progressFrame;
function updateReadingProgress() {
  cancelAnimationFrame(progressFrame);
  progressFrame = requestAnimationFrame(() => {
    const total = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress span').style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
  });
}
addEventListener('scroll', updateReadingProgress, { passive: true });
addEventListener('resize', updateReadingProgress);
updateReadingProgress();
