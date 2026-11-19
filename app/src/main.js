// Neon Bay's editor wiring: photos in, caption typed, grade picked, PNG out.
// The preview is the cover itself, drawn live at half size; clicking a panel
// selects it and dragging pans its photo. ?shot= hands the page to shots.js
// for fixed screenshot scenes instead.
import { drawCover, layoutFor, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const exportButton = document.getElementById('export');

const state = {
  photos: [null, null, null],
  transforms: [
    { zoom: 1, ox: 0, oy: 0 },
    { zoom: 1, ox: 0, oy: 0 },
    { zoom: 1, ox: 0, oy: 0 },
  ],
  title: 'NEON BAY',
  subtitle: 'SUNSET HEIST IN THE CITY THAT NEVER SLEEPS',
  grade: 'sunset',
  size: 'square',
  selected: 0,
};

const PANEL_NAMES = ['Hero panel', 'Second panel', 'Third panel'];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** The preview canvas's pixel size: half scale in the editor, full export size for a cover-only shot. */
function previewSize() {
  const size = SIZES[state.size];
  const scale = document.body.classList.contains('shot-cover') ? 1 : 0.5;
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function redraw() {
  const { width, height } = previewSize();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawCover(canvas, state);
  if (!document.body.classList.contains('shot-cover')) drawSelection();
}

/** The dashed outline that marks the selected panel on the preview. */
function drawSelection() {
  const ctx = canvas.getContext('2d');
  const { panels } = layoutFor(canvas.width, canvas.height);
  const panel = panels[state.selected];
  if (!panel) return;
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#37f4ff';
  ctx.strokeRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
  ctx.setLineDash([]);
  ctx.fillStyle = '#37f4ff';
  ctx.font = `700 ${Math.max(13, canvas.width * 0.018)}px "Vice Condensed", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(PANEL_NAMES[state.selected].toUpperCase(), panel.x + 10, panel.y + 8);
  ctx.restore();
}

async function setPhoto(index, source) {
  try {
    state.photos[index] = await loadImage(source);
    state.transforms[index] = { zoom: 1, ox: 0, oy: 0 };
    const zoom = document.getElementById(`zoom-${index}`);
    if (zoom) zoom.value = '1';
    redraw();
    status.textContent = `${PANEL_NAMES[index]} photo loaded. Drag it on the preview to position it.`;
  } catch {
    status.textContent = 'That photo could not be loaded. Try another file.';
  }
}

function setGrade(name) {
  if (!GRADES[name]) return;
  state.grade = name;
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === name);
    b.setAttribute('aria-pressed', String(b.dataset.grade === name));
  });
  redraw();
}

function setSize(name) {
  if (!SIZES[name]) return;
  state.size = name;
  document.querySelectorAll('input[name="size"]').forEach((r) => {
    r.checked = r.value === name;
  });
  redraw();
}

// ---- photo slots: file pickers, sample buttons, zoom sliders, reset buttons
for (let i = 0; i < 3; i++) {
  document.getElementById(`photo-${i}`).addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(i, URL.createObjectURL(file));
  });
  document.getElementById(`sample-${i}`).addEventListener('click', () => {
    setPhoto(i, `samples/city-${i + 1}.jpg`);
  });
  document.getElementById(`zoom-${i}`).addEventListener('input', (e) => {
    state.transforms[i].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById(`reset-${i}`).addEventListener('click', () => {
    state.transforms[i] = { zoom: 1, ox: 0, oy: 0 };
    document.getElementById(`zoom-${i}`).value = '1';
    redraw();
  });
}

// ---- caption
titleInput.addEventListener('input', () => {
  state.title = titleInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});

// ---- grade swatches and export sizes
document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => setGrade(b.dataset.grade));
});
document.querySelectorAll('input[name="size"]').forEach((r) => {
  r.addEventListener('change', () => setSize(r.value));
});

// ---- drag to pan the selected panel's photo
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const { panels } = layoutFor(canvas.width, canvas.height);
  const hit = panels.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit < 0) return;
  state.selected = hit;
  drag = { x: p.x, y: p.y, panel: panels[hit] };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const t = state.transforms[state.selected];
  t.ox += (p.x - drag.x) / drag.panel.w;
  t.oy += (p.y - drag.y) / drag.panel.h;
  drag = { x: p.x, y: p.y, panel: drag.panel };
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// ---- export the cover at full size
exportButton.addEventListener('click', () => {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.width;
  off.height = size.height;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed. Try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-bay-cover-${size.width}x${size.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved neon-bay-cover-${size.width}x${size.height}.png`;
  }, 'image/png');
});

// ---- fixed screenshot scenes
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    photo: (i, src) => setPhoto(i, src),
    title: (t) => {
      state.title = t;
      titleInput.value = t;
    },
    subtitle: (s) => {
      state.subtitle = s;
      subtitleInput.value = s;
    },
    grade: setGrade,
    size: setSize,
    draw: redraw,
  });
} else {
  redraw();
}

// The caption lettering uses the shipped fonts: redraw once they arrive.
if (document.fonts) {
  document.fonts.load('900 100px "Vice Display"').catch(() => {});
  document.fonts.load('700 40px "Vice Condensed"').catch(() => {});
  document.fonts.ready.then(() => redraw()).catch(() => {});
}
