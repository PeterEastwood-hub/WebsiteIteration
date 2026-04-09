# Orbital convergence diagram — Figma handoff

Vector assets and references extracted from the **Services** hub diagram (`#orbital-convergence` on `site-mirror/services.html`).

## What to send your colleague

Zip this entire folder. They get:

| File | Purpose |
|------|---------|
| `01-orbit-rings-all-layers.svg` | All three orbit circles in one file (same center, r=250, viewBox 0 0 600 600). |
| `01-orbit-ring-teal.svg` | Single ring only — teal `#00D4AA`. |
| `01-orbit-ring-purple.svg` | Single ring only — purple `#8B5CF6`. |
| `01-orbit-ring-blue.svg` | Single ring only — blue `#0EA5E9`. |
| `02-hub-lightning-icon.svg` | Lightning bolt used in the centre hub (24×24 viewBox). |
| `03-node-icon-teal-sparkles.svg` | Icon for the **teal** (3 o’clock) node. |
| `04-node-icon-purple-cpu.svg` | Icon for the **purple** (5 o’clock) node. |
| `05-node-icon-blue-code.svg` | Icon for the **blue** (10 o’clock) node. |
| `reference-orbital-convergence.css` | Full layout, motion, colours, and sizes from the live site. |
| `06-reference-screenshot-2x.png` | **Static reference image** of the full `<figure>` (diagram + caption), 2× device pixel ratio (~2400px wide). Pulses hidden; reduced-motion end state. |
| `README.md` | This file. |

## Copy for text layers (not embedded in the SVGs)

**Centre hub**

- Large label: `AI`
- Subtitle (two lines): `Native` / `Engineering`

**Node titles (inside the circular cards)**

1. Teal node: `Build and evolve enterprise digital products`
2. Purple node: `Modernise legacy systems for AI-Readiness`
3. Blue node: `Design and build agents and agentic workflows for scale`

**Caption under the diagram**

`We combine digital engineering, design and strategy to build code and capability for sustained business impact.`

## Brand colours (from CSS)

- Teal: `#00d4aa` (also `#00D4AA` in markup)
- Purple: `#8b5cf6` / `#8B5CF6`
- Blue: `#0ea5e9` / `#0EA5E9`
- Ink (text / icon stroke on light): `#0f172a`
- Hub inner circle background (light mode): `#fff`
- Hub gradient wash (behind inner circle): `135deg`, `rgba(0,212,170,0.22)`, `rgba(139,92,246,0.22)`, `rgba(14,165,233,0.22)`

Icon tints on the live site (for circular icon wells):

- Teal: `rgba(0,212,170,0.15)`
- Purple: `rgba(139,92,246,0.15)`
- Blue: `rgba(14,165,233,0.15)`

## Layout geometry (for rebuilding in Figma)

- Orbit SVG: **viewBox `0 0 600 600`**, circles centred at **(300, 300)**, radius **250**.
- On the site, the orbit graphic is rotated **-90deg** in CSS so the “open” part of the dashes reads correctly; these SVGs are **unrotated** — rotate in Figma if you want a pixel match.
- Nodes are positioned from the **stage centre** using CSS variables (see `reference-orbital-convergence.css`, `.orbital-node`):
  - Teal: `translate(var(--oc-r), 0)` — to the right
  - Purple: `translate(calc(-0.5 * var(--oc-r)), calc(0.866 * var(--oc-r)))` — lower left (~120°)
  - Blue: `translate(calc(-0.5 * var(--oc-r)), calc(-0.866 * var(--oc-r)))` — upper left (~-120°)
- `--oc-r` is responsive: `min(280px, 36vw)` in the figure. For a fixed comp, **280px** is a reasonable desktop value.
- Circular cards: **10.5rem** (168px) diameter, **3px** border in the node colour.
- Centre hub outer glow: **9rem** (144px) diameter.

## What these SVGs do *not* include

The live diagram also uses **HTML/CSS only**:

- Expanding **pulse rings** (border animations from the hub)
- **Dashed** stroke animation on the orbits (`stroke-dasharray` / `stroke-dashoffset` in CSS). The handoff rings are **solid** strokes so they import cleanly; add dashes in Figma if needed (`stroke-dasharray` ≈ `1570` in CSS for the full perimeter).
- **Card chrome** (shadows, hover scale, white disc fills)
- **Motion** (entrance, breathing icons, etc.) — see keyframes in `reference-orbital-convergence.css`

## Figma tips

1. **Place** (`File → Place` or drag) each `.svg` onto the canvas.
2. For **01-orbit-rings-all-layers.svg**, ungroup to edit rings separately, or use the three `01-orbit-ring-*.svg` files stacked with align centre.
3. Icon strokes are set to `#0f172a` for visibility. In Figma, recolour strokes to match each node (`#00D4AA`, `#8B5CF6`, `#0EA5E9`) if you want parity with the site.
4. Scale the 600×600 orbit and the 24×24 icons **proportionally** to match the dimensions above.

## Regenerating the reference PNG

From the repo root (requires `playwright` and Chromium — `npx playwright install chromium` once):

```bash
npm run capture-orbital-handoff
```

Script: `scripts/capture-orbital-handoff.mjs`. It loads `site-mirror/services.html`, enables **prefers-reduced-motion**, adds **`orbital-in-view`**, hides the **pulse rings** (cleaner static comp), sets a light page background, and screenshots **`#orbital-convergence`** at **2×** DPR.

## Source in this repo

- Markup: `site-mirror/services.html` — search for `id="orbital-convergence"`.
- Styles: `site-mirror/css/orbital-convergence.css` (duplicate here as `reference-orbital-convergence.css`).
- Scroll trigger script: `site-mirror/js/orbital-convergence.js` (adds `orbital-in-view` for animations).
