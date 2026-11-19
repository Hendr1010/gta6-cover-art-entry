// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover-wide, cover-square and cover-portrait show one exported
// cover alone, drawn by the app itself at that size. window.__shotReady is set
// once the fonts arrived and the cover is painted.
const SCENES = {
  editor: {
    cover: false,
    size: 'square',
    grade: 'sunset',
    title: 'NEON BAY',
    subtitle: 'SUNSET HEIST IN THE CITY THAT NEVER SLEEPS',
  },
  'cover-wide': {
    cover: true,
    size: 'wide',
    grade: 'neon',
    title: 'NEON BAY',
    subtitle: 'THE CITY THAT NEVER SLEEPS',
  },
  'cover-square': {
    cover: true,
    size: 'square',
    grade: 'sunset',
    title: 'VICE NIGHTS',
    subtitle: 'EVERY SUNSET HAS A PRICE',
  },
  'cover-portrait': {
    cover: true,
    size: 'portrait',
    grade: 'gold',
    title: 'NEON BAY',
    subtitle: 'CHASE THE LAST LIGHT',
  },
};

export async function runShot(shot, query, api) {
  const scene = SCENES[shot] ?? SCENES.editor;
  if (scene.cover) document.body.classList.add('shot-cover');
  api.size(query.get('size') ?? scene.size);
  api.grade(query.get('grade') ?? scene.grade);
  api.title(query.get('title') ?? scene.title);
  api.subtitle(query.get('subtitle') ?? scene.subtitle);
  const photos = (query.get('photos') ?? '1,2,3').split(',');
  for (let i = 0; i < 3; i++) {
    await api.photo(i, `samples/city-${photos[i] ?? i + 1}.jpg`);
  }
  if (document.fonts) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    } catch {
      // A font that never arrives still leaves a painted cover behind.
    }
  }
  api.draw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
