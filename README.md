# Mohammad Parsa Karkooti — Portfolio

A motion-led personal site for **Mohammad Parsa Karkooti**, AI / computer-vision
engineer. Dark, instrument-panel aesthetic built around a single WebGL particle
form that morphs through the story of the work as you scroll.

**Live:** https://parsavictor.pages.dev

---

## The idea

One swarm of points is the spine of the whole page. It is born from a dense
core, then deforms through five geometries — sphere → lens → lattice → globe →
ring — one per chapter. Between chapters it scatters and regroups, so the page
reads as a set of rooms rather than one long scroll. Each chapter hands the
swarm one half of the viewport and keeps the content on the other.

Every section also gets its own scroll grammar, on purpose:

| Chapter | Form | How the projects move |
|---|---|---|
| Hero | sphere | — |
| About | (in transit) | serpentine timeline that draws itself |
| 01 Computer vision | lens | horizontal arc, scroll-scrubbed |
| 02 Neural & data | lattice | vertical list with a travelling focus, live telemetry panel |
| 03 Creative web | globe | browser windows dealing into a stack |
| Contact | ring | — |

## Tech

| Area | Stack |
|---|---|
| Framework | React 19 + Vite 7, TypeScript |
| Styling | Tailwind CSS v4 |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll (one shared ticker) |
| 3D | three.js — a single `Points` + `LineSegments` pair with custom GLSL |
| i18n | English (default) / Persian, RTL-aware, `localStorage`-persisted |
| Hosting | Cloudflare Workers static assets |

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # -> dist/
npx wrangler deploy
```

## Notes

- The particle instrument lives in `src/three/` — `forms.ts` generates every
  geometry from one evenly distributed Fibonacci sphere so morphs stay coherent,
  `shaders.ts` holds the GLSL, `ParticleSystem.ts` drives it.
- Smooth scroll and every scroll-linked effect share one `requestAnimationFrame`
  loop (`src/scroll/useSmoothScroll.ts`), so nothing jitters against the scroll.
- `prefers-reduced-motion` resolves every effect to its end state instead of
  animating, and particle counts scale down on mobile.
