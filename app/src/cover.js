// Neon Bay's cover engine: paints the multi-panel poster onto any canvas.
// Every picture on the cover is drawn here — the sunset sky, the skyline, the
// palms, the photo panels, the grade and the bold caption lettering. Nothing
// here reaches the network: the sky and skyline are procedural, the photos
// come from the page, and the fonts are files under app/fonts/.

/** The export sizes the app offers, in pixels. */
export const SIZES = {
  square: { width: 1080, height: 1080, label: 'Square 1080 x 1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait 1080 x 1350' },
  wide: { width: 1920, height: 1080, label: 'Wide 1920 x 1080' },
};

/** The colour grades: sky stops, sun, panel wash, accent and title band. */
export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#1c0b3d', '#7a1e63', '#e84c60', '#ff9a4d'],
    sun: '#ffe9b0',
    panelTop: 'rgba(255,110,60,0.30)',
    panelBottom: 'rgba(150,30,110,0.36)',
    accent: '#ffd23e',
    band: '#150a24',
  },
  neon: {
    name: 'Neon',
    sky: ['#07031c', '#3b0f66', '#c2187a', '#ff5da2'],
    sun: '#c8f6ff',
    panelTop: 'rgba(0,220,255,0.28)',
    panelBottom: 'rgba(255,40,160,0.38)',
    accent: '#37f4ff',
    band: '#0a0618',
  },
  midnight: {
    name: 'Midnight',
    sky: ['#03081e', '#0e1e4a', '#274b8f', '#5f7fd0'],
    sun: '#e8eeff',
    panelTop: 'rgba(90,140,255,0.26)',
    panelBottom: 'rgba(20,30,90,0.40)',
    accent: '#9db8ff',
    band: '#050a1a',
  },
  gold: {
    name: 'Gold hour',
    sky: ['#2b0f2e', '#8a2f4d', '#e07b39', '#ffc46b'],
    sun: '#fff3c4',
    panelTop: 'rgba(255,180,60,0.28)',
    panelBottom: 'rgba(140,50,20,0.36)',
    accent: '#ffe08a',
    band: '#1c0d18',
  },
};

/** A small deterministic random source, so the same cover paints the same way twice. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where the panels and the title band sit for a cover of w by h.
 * Square and portrait stack a wide hero panel over two panels side by side;
 * wide puts the hero on the left and stacks the two small panels on the right.
 */
export function layoutFor(w, h) {
  const m = Math.round(w * 0.028);
  const gap = Math.round(w * 0.02);
  const titleH = Math.round(h * (w >= h ? 0.17 : 0.155));
  const title = { x: m, y: h - titleH - m, w: w - 2 * m, h: titleH };
  const bodyH = h - titleH - 3 * m;
  const bodyW = w - 2 * m;
  let panels;
  if (w > h) {
    // Wide: the hero takes the left, the two small panels stack on the right.
    const heroW = Math.round(bodyW * 0.6);
    const sideW = bodyW - heroW - gap;
    const sideH = Math.round((bodyH - gap) / 2);
    panels = [
      { x: m, y: m, w: heroW, h: bodyH, role: 'hero' },
      { x: m + heroW + gap, y: m, w: sideW, h: sideH, role: 'second' },
      { x: m + heroW + gap, y: m + sideH + gap, w: sideW, h: sideH, role: 'third' },
    ];
  } else {
    const heroH = Math.round(bodyH * 0.56);
    const lowH = bodyH - heroH - gap;
    const lowW = Math.round((bodyW - gap) / 2);
    panels = [
      { x: m, y: m, w: bodyW, h: heroH, role: 'hero' },
      { x: m, y: m + heroH + gap, w: lowW, h: lowH, role: 'second' },
      { x: m + lowW + gap, y: m + heroH + gap, w: lowW, h: lowH, role: 'third' },
    ];
  }
  return { panels, title, margin: m, gap };
}

/** A palm silhouette: a leaning trunk and seven drooping fronds. */
function drawPalm(ctx, x, y, s, color, rng) {
  const lean = (rng() - 0.5) * 0.5;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(4, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, y);
  const topX = x + lean * s;
  const topY = y - s;
  ctx.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(3, s * 0.028);
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI * (0.06 + (0.88 * k) / 6);
    const len = s * (0.42 + rng() * 0.14);
    const midX = topX + Math.cos(ang) * len * 0.55;
    const midY = topY - Math.sin(ang) * len * 0.4 + s * 0.08;
    const endX = topX + Math.cos(ang) * len;
    const endY = topY + s * 0.22 - Math.sin(ang) * len * 0.3;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }
}

/** The skyline silhouette with lit windows, drawn on the sky behind the panels. */
function drawSkyline(ctx, w, baseY, hMin, hMax, color, rng) {
  ctx.fillStyle = color;
  let x = -10;
  while (x < w + 10) {
    const bw = 50 + rng() * 110;
    const bh = hMin + rng() * (hMax - hMin);
    ctx.fillRect(x, baseY - bh, bw, bh + 60);
    if (rng() < 0.35) {
      const ax = x + bw / 2;
      const ah = 16 + rng() * 34;
      ctx.fillRect(ax - 2, baseY - bh - ah, 4, ah);
      ctx.beginPath();
      ctx.arc(ax, baseY - bh - ah - 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5d5d';
      ctx.fill();
      ctx.fillStyle = color;
    }
    for (let wy = baseY - bh + 14; wy < baseY - 10; wy += 24) {
      for (let wx = x + 10; wx < x + bw - 12; wx += 22) {
        if (rng() < 0.3) {
          ctx.fillStyle = ['#ffd25e', '#ff7d9c', '#7ce8ff'][Math.floor(rng() * 3)];
          ctx.fillRect(wx, wy, 8, 11);
        }
      }
    }
    ctx.fillStyle = color;
    x += bw + 4 + rng() * 12;
  }
}

/** The sunset sky: gradient, glowing sun, skyline and palms at the edges. */
function drawSky(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sunX = w * 0.5;
  const sunY = h * 0.42;
  const sunR = Math.min(w, h) * 0.09;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 3.4);
  glow.addColorStop(0, 'rgba(255,190,110,0.55)');
  glow.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  const rng = mulberry32(20261119);
  drawSkyline(ctx, w, h * 0.86, h * 0.1, h * 0.24, 'rgba(16,6,32,0.85)', rng);
  drawPalm(ctx, w * 0.03, h * 0.88, h * 0.2, 'rgba(12,4,26,0.9)', rng);
  drawPalm(ctx, w * 0.97, h * 0.88, h * 0.17, 'rgba(12,4,26,0.9)', rng);
}

/** How far a photo may slide while still covering its panel, in panel fractions. */
function coverOffset(zoom, photoW, photoH, panelW, panelH) {
  const base = Math.max(panelW / photoW, panelH / photoH) * zoom;
  const dw = photoW * base;
  const dh = photoH * base;
  return {
    dw,
    dh,
    maxOx: Math.max(0, (dw - panelW) / 2 / panelW),
    maxOy: Math.max(0, (dh - panelH) / 2 / panelH),
  };
}

/** One photo panel: the photo cover-fit with its pan and zoom, then the grade wash. */
function drawPanel(ctx, panel, photo, transform, grade) {
  const { x, y, w, h } = panel;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (photo) {
    const iw = photo.naturalWidth || photo.width;
    const ih = photo.naturalHeight || photo.height;
    const { dw, dh, maxOx, maxOy } = coverOffset(transform.zoom, iw, ih, w, h);
    const ox = Math.max(-maxOx, Math.min(maxOx, transform.ox || 0));
    const oy = Math.max(-maxOy, Math.min(maxOy, transform.oy || 0));
    ctx.drawImage(photo, x + (w - dw) / 2 + ox * w, y + (h - dh) / 2 + oy * h, dw, dh);
  } else {
    ctx.fillStyle = '#241335';
    ctx.fillRect(x, y, w, h);
  }
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, grade.panelTop);
  wash.addColorStop(1, grade.panelBottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(8,2,18,0)');
  vig.addColorStop(1, 'rgba(8,2,18,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.lineWidth = Math.max(4, w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeStyle = 'rgba(10,4,20,0.85)';
  ctx.strokeRect(x + Math.max(4, w * 0.008), y + Math.max(4, w * 0.008), w - 2 * Math.max(4, w * 0.008), h - 2 * Math.max(4, w * 0.008));
}

/** The caption in tall condensed caps: white fill, dark outline, neon glow. */
function drawTitle(ctx, band, title, subtitle, grade) {
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(band.x, band.y, band.w, Math.max(3, band.h * 0.03));
  const text = (title || 'NEON BAY').trim().toUpperCase();
  let size = band.h * 0.56;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fit = (s) => {
    ctx.font = `900 ${s}px "Vice Display", "Arial Narrow", sans-serif`;
    return ctx.measureText(text).width <= band.w * 0.94;
  };
  while (size > 16 && !fit(size)) size -= 2;
  ctx.font = `900 ${size}px "Vice Display", "Arial Narrow", sans-serif`;
  const cy = band.y + band.h * (subtitle ? 0.38 : 0.52);
  ctx.shadowColor = 'rgba(255,60,180,0.55)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.03;
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14081f';
  ctx.strokeText(text, band.x + band.w / 2, cy);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, band.x + band.w / 2, cy);
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    let subSize = band.h * 0.17;
    const subFit = (s) => {
      ctx.font = `700 ${s}px "Vice Condensed", sans-serif`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${s * 0.32}px`;
      return ctx.measureText(sub).width <= band.w * 0.92;
    };
    while (subSize > 10 && !subFit(subSize)) subSize -= 1;
    ctx.font = `700 ${subSize}px "Vice Condensed", sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${subSize * 0.32}px`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, band.x + band.w / 2, band.y + band.h * 0.8);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

/**
 * Paints the whole cover onto `canvas` at its own size.
 * `state` holds the three panel photos (Image or null), their {zoom, ox, oy}
 * transforms, the title and subtitle, the grade name and the size name.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  drawSky(ctx, w, h, grade);
  const { panels, title } = layoutFor(w, h);
  panels.forEach((panel, i) => {
    drawPanel(ctx, panel, state.photos[i] ?? null, state.transforms[i] ?? { zoom: 1, ox: 0, oy: 0 }, grade);
  });
  drawTitle(ctx, title, state.title, state.subtitle, grade);
  const frame = Math.max(6, w * 0.01);
  ctx.lineWidth = frame;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  ctx.lineWidth = Math.max(1, frame * 0.16);
  ctx.strokeStyle = 'rgba(10,4,20,0.9)';
  ctx.strokeRect(frame * 1.5, frame * 1.5, w - frame * 3, h - frame * 3);
}
