const SPORT_DATA = {
  field_hockey: {
    name: 'Field Hockey',
    periodName: 'Quarter',
    periodCount: 4,
    officials: ['Umpire 1', 'Umpire 2'],
    tags: ['Positioning', 'Overheads', 'Breakdown', 'Whistle Timing', 'Hitting Ball Away', 'Advantage', 'Player Management', 'Green Card', 'Yellow Card', 'Red Card', 'Presentation', 'Teamwork'],
  },
  football: {
    name: 'Football',
    periodName: 'Half',
    periodCount: 2,
    officials: ['Referee', 'AR 1', 'AR 2'],
    tags: ['Offside Decision', 'Foul — Awarded', 'Foul — Missed', 'Advantage Played', 'Yellow Card', 'Red Card', 'Penalty Decision', 'Corner / Goal Kick', 'AR Flag', 'Positioning', 'Communication'],
  },
  rugby_union: {
    name: 'Rugby',
    periodName: 'Half',
    periodCount: 2,
    officials: ['Referee', 'AR 1', 'AR 2'],
    tags: ['Offside at Ruck', 'Offside at Lineout', 'High Tackle', 'Ruck Infringement', 'Scrum Decision', 'Penalty Awarded', 'Yellow Card', 'Red Card', 'Try Awarded', 'Try Denied', 'Advantage Played', 'Positioning', 'Communication'],
  },
  basketball: {
    name: 'Basketball',
    periodName: 'Quarter',
    periodCount: 4,
    officials: ['Referee 1', 'Referee 2', 'Referee 3'],
    tags: ['Foul Called', 'Foul Missed', 'Travel', 'Double Dribble', 'Out of Bounds', 'Goaltending', 'Technical Foul', 'Free Throw Administration', 'Shot Clock Violation', 'Positioning', 'Communication'],
  },
};

const TAG_COLORS = [
  { name: 'Blue', value: '#4f7cff' },
  { name: 'Green', value: '#2dce89' },
  { name: 'Yellow', value: '#ffc400' },
  { name: 'Red', value: '#e94560' },
  { name: 'Purple', value: '#b07cff' },
];

document.addEventListener('DOMContentLoaded', async () => {
  const { settings } = await msg({ type: 'GET_SETTINGS' });
  populate(settings ?? {});
  bindEvents();
});

// ── Populate form from stored settings ────────────────────────────────────────

function populate(s) {
  set('obs-host',      s.obsHost      ?? 'localhost');
  set('obs-port',      s.obsPort      ?? 4455);
  set('obs-password',  s.obsPassword  ?? '');
  set('obs-exe-path',  s.obsExePath   ?? '');
  set('output-dir',    s.outputDirectory || s.clipOutputDirectory || '');
  set('obs-format',    s.obsOutputFormat ?? 'mp4');
  set('obs-resolution', s.obsResolution  ?? '1920x1080');
  set('obs-framerate', String(s.obsFramerate ?? 30));
  set('crop-margin',   String(s.cropOverlayMargin ?? 200));
  document.getElementById('crop-margin-value').textContent = s.cropOverlayMargin ?? 200;

  set('clip-pre',  String(s.clipPre  ?? 30));
  set('clip-post', String(s.clipPost ?? 15));
  updateClipTotal();

  const sport = s.sport ?? 'field_hockey';
  set('sport', sport);
  const sportDef = SPORT_DATA[sport] ?? SPORT_DATA.field_hockey;
  set('period-name', s.periodName ?? sportDef.periodName);
  set('period-count', s.periodCount ?? sportDef.periodCount);

  const savedTags = s.tagTypes ?? SPORT_DATA[sport]?.tags ?? [];
  renderTagList(savedTags, s.tagColors ?? {});
}

// ── Tag list ──────────────────────────────────────────────────────────────────

function renderTagList(tags, colors = {}) {
  document.getElementById('tag-list').innerHTML = '';
  tags.forEach(name => appendTag(name, colors[name] || defaultTagColor(name)));
}

function defaultTagColor(name) {
  if (name === 'Green Card') return '#2dce89';
  if (name === 'Yellow Card') return '#ffc400';
  if (name === 'Red Card') return '#e94560';
  return '#4f7cff';
}

function appendTag(name, color = defaultTagColor(name)) {
  const list = document.getElementById('tag-list');

  const item = document.createElement('div');
  item.className = 'tag-item';
  item.dataset.tag = name;
  item.dataset.color = TAG_COLORS.some(option => option.value === color)
    ? color
    : defaultTagColor(name);

  const nameEl = document.createElement('span');
  nameEl.className = 'tag-name';
  nameEl.textContent = name;

  const colorControls = document.createElement('div');
  colorControls.className = 'tag-colors';
  colorControls.setAttribute('role', 'group');
  colorControls.setAttribute('aria-label', `Color for ${name}`);
  TAG_COLORS.forEach(option => {
    const colorBtn = document.createElement('button');
    colorBtn.type = 'button';
    colorBtn.className = 'tag-color';
    colorBtn.style.setProperty('--swatch-color', option.value);
    colorBtn.title = option.name;
    colorBtn.setAttribute('aria-label', `${option.name} color`);
    colorBtn.setAttribute('aria-pressed', String(item.dataset.color === option.value));
    if (item.dataset.color === option.value) colorBtn.classList.add('selected');
    colorBtn.addEventListener('click', () => {
      item.dataset.color = option.value;
      colorControls.querySelectorAll('.tag-color').forEach(button => {
        const selected = button === colorBtn;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    });
    colorControls.appendChild(colorBtn);
  });

  const moveUpBtn = document.createElement('button');
  moveUpBtn.className = 'icon-btn';
  moveUpBtn.type = 'button';
  moveUpBtn.title = 'Move up';
  moveUpBtn.setAttribute('aria-label', 'Move tag up');
  moveUpBtn.textContent = '↑';

  const moveDownBtn = document.createElement('button');
  moveDownBtn.className = 'icon-btn';
  moveDownBtn.type = 'button';
  moveDownBtn.title = 'Move down';
  moveDownBtn.setAttribute('aria-label', 'Move tag down');
  moveDownBtn.textContent = '↓';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.type = 'button';
  editBtn.title = 'Edit';
  editBtn.textContent = '✏';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn danger';
  deleteBtn.type = 'button';
  deleteBtn.title = 'Delete';
  deleteBtn.textContent = '×';

  moveUpBtn.addEventListener('click', () => {
    const previous = item.previousElementSibling;
    if (previous) list.insertBefore(item, previous);
    updateTagMoveButtons(list);
  });

  moveDownBtn.addEventListener('click', () => {
    const next = item.nextElementSibling;
    if (next) list.insertBefore(next, item);
    updateTagMoveButtons(list);
  });

  // Inline edit toggle
  editBtn.addEventListener('click', () => {
    const editing = nameEl.isContentEditable;
    if (editing) {
      const newName = nameEl.textContent.trim();
      if (newName) {
        item.dataset.tag = newName;
        colorControls.setAttribute('aria-label', `Color for ${newName}`);
        nameEl.contentEditable = 'false';
        editBtn.textContent = '✏';
        editBtn.title = 'Edit';
      }
    } else {
      nameEl.contentEditable = 'true';
      nameEl.focus();
      selectAll(nameEl);
      editBtn.textContent = '✓';
      editBtn.title = 'Save';
    }
  });

  nameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); editBtn.click(); }
    if (e.key === 'Escape') {
      nameEl.textContent = item.dataset.tag;
      nameEl.contentEditable = 'false';
      editBtn.textContent = '✏';
    }
  });

  deleteBtn.addEventListener('click', () => item.remove());

  item.append(nameEl, colorControls, moveUpBtn, moveDownBtn, editBtn, deleteBtn);
  list.appendChild(item);
  updateTagMoveButtons(list);
}

function updateTagMoveButtons(list) {
  const items = Array.from(list.children);
  items.forEach((item, index) => {
    item.querySelector('[aria-label="Move tag up"]').disabled = index === 0;
    item.querySelector('[aria-label="Move tag down"]').disabled = index === items.length - 1;
  });
}

function tagsFromDOM() {
  return Array.from(
    document.querySelectorAll('.tag-item')
  ).map((el) => el.dataset.tag);
}

function tagColorsFromDOM() {
  return Object.fromEntries(
    Array.from(document.querySelectorAll('.tag-item'))
      .map(item => [item.dataset.tag, item.dataset.color])
  );
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('toggle-obs-password').addEventListener('click', (e) => {
    const button = e.currentTarget;
    const password = document.getElementById('obs-password');
    const isVisible = password.type === 'text';
    password.type = isVisible ? 'password' : 'text';
    button.textContent = isVisible ? 'Show' : 'Hide';
    button.setAttribute('aria-pressed', String(!isVisible));
  });

  // Browse buttons for path fields
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.browse-btn');
    if (!btn) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';

    const result = await msg({
      type:   'PICK_PATH',
      kind:   btn.dataset.kind,
      prompt: btn.dataset.prompt || 'Select',
      filter: btn.dataset.filter || '',
    });

    btn.disabled = false;
    btn.textContent = originalText;

    if (result?.success && result.path) {
      document.getElementById(btn.dataset.target).value = result.path;
    }
  });

  // Sport change — reset tag list to that sport's defaults
  document.getElementById('sport').addEventListener('change', (e) => {
    const sport = SPORT_DATA[e.target.value];
    if (sport) {
      renderTagList(sport.tags);
      set('period-name', sport.periodName);
      set('period-count', sport.periodCount);
    }
  });

  // Add tag
  const addBtn = document.getElementById('add-tag-btn');
  const newTagInput = document.getElementById('new-tag');

  addBtn.addEventListener('click', () => {
    const name = newTagInput.value.trim();
    if (!name) return;
    if (tagsFromDOM().includes(name)) {
      newTagInput.value = '';
      return;
    }
    appendTag(name);
    newTagInput.value = '';
    newTagInput.focus();
  });

  newTagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  // Live-update the crop margin label as the slider moves
  document.getElementById('crop-margin').addEventListener('input', (e) => {
    document.getElementById('crop-margin-value').textContent = e.target.value;
  });

  // Live-update clip total and validate
  document.getElementById('clip-pre').addEventListener('input', updateClipTotal);
  document.getElementById('clip-post').addEventListener('input', updateClipTotal);

  // Test OBS connection
  document.getElementById('test-conn-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('test-conn-status');
    setStatus(statusEl, 'Connecting…', '');
    const result = await msg({
      type: 'TEST_OBS_CONNECTION',
      settings: {
        obsHost:     get('obs-host')    || 'localhost',
        obsPort:     parseInt(get('obs-port')) || 4455,
        obsPassword: get('obs-password'),
      },
    });
    if (result.error) {
      setStatus(statusEl, '✗ ' + result.error, 'error');
    } else {
      const version = result.obsWebSocketVersion ?? '5';
      setStatus(statusEl, `✓ Connected (OBS WebSocket v${version})`, 'success');
    }
  });

  // Apply OBS settings
  document.getElementById('apply-obs-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('obs-status');
    setStatus(statusEl, 'Applying…', '');
    const result = await msg({ type: 'APPLY_OBS_SETTINGS', settings: gather() });
    if (result.error) {
      setStatus(statusEl, 'Error: ' + result.error, 'error');
    } else {
      setStatus(statusEl, 'Applied.', 'success');
    }
  });

  // Save all settings
  document.getElementById('save-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('save-status');
    const pre  = parseInt(get('clip-pre'),  10) || 0;
    const post = parseInt(get('clip-post'), 10) || 0;
    if (pre + post > 45) {
      setStatus(statusEl, 'Total clip duration cannot exceed 45 seconds.', 'error');
      return;
    }
    const periodCount = Number(get('period-count'));
    if (!Number.isInteger(periodCount) || periodCount < 1 || periodCount > 12) {
      setStatus(statusEl, 'Number of periods must be between 1 and 12.', 'error');
      return;
    }
    setStatus(statusEl, 'Saving…', '');
    const result = await msg({ type: 'SAVE_SETTINGS', settings: gather() });
    if (result.error) {
      setStatus(statusEl, 'Error: ' + result.error, 'error');
    } else {
      setStatus(statusEl, 'Saved.', 'success');
      setTimeout(() => setStatus(statusEl, '', ''), 3000);
    }
  });
}

// ── Gather current form values ────────────────────────────────────────────────

function gather() {
  const outputDir = get('output-dir');
  return {
    obsHost:             get('obs-host')              || 'localhost',
    obsPort:             parseInt(get('obs-port'))    || 4455,
    obsPassword:         get('obs-password'),
    obsExePath:          get('obs-exe-path'),
    outputDirectory:     outputDir,
    obsOutputFormat:     get('obs-format'),
    obsResolution:       get('obs-resolution'),
    obsFramerate:        parseInt(get('obs-framerate')) || 30,
    cropOverlayMargin:   parseInt(get('crop-margin'))  || 200,
    clipOutputDirectory: outputDir,
    sport:               get('sport') || 'field_hockey',
    periodName:          get('period-name'),
    periodCount:         Number(get('period-count')),
    tagTypes:            tagsFromDOM(),
    tagColors:           tagColorsFromDOM(),
    clipPre:             Math.min(45, Math.max(0, parseInt(get('clip-pre'))  || 30)),
    clipPost:            Math.min(45, Math.max(0, parseInt(get('clip-post')) || 15)),
  };
}

// ── Clip duration helpers ─────────────────────────────────────────────────────

function updateClipTotal() {
  const pre   = parseInt(document.getElementById('clip-pre').value,  10) || 0;
  const post  = parseInt(document.getElementById('clip-post').value, 10) || 0;
  const total = pre + post;
  const errorEl = document.getElementById('clip-duration-error');
  document.getElementById('clip-total').value = total + 's';
  const over = total > 45;
  errorEl.style.display = over ? '' : 'none';
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function msg(payload) {
  return chrome.runtime.sendMessage(payload);
}

function set(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function get(id) {
  return (document.getElementById(id)?.value ?? '').trim();
}

function setStatus(el, text, type) {
  el.textContent = text;
  el.className = 'inline-status' + (type ? ' ' + type : '');
}

function selectAll(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
