# NearForm mirror — UX plan & execution log

This document captures the **page-by-page checklist**, **motion principles**, and **what is implemented** in this repo’s static mirror (`site-mirror/`).

## Pipeline

| Step | Command / script | Role |
|------|------------------|------|
| Scrape | `npm run mirror` | Refresh pages from nearform.com |
| Post-process | `npm run postprocess-mirror` | Strip tracking scripts, sticky header CSS, audit bar, **remove broken `/_next/` + GTM preloads**, **fix empty home logo `href`**, ensure **`css/mirror-a11y-flair.css`**, **`js/mirror-flair.js`**, **`js/mirror-motion.js`** (bundled [Motion](https://motion.dev/docs/quick-start) — Framer’s JS engine), rebuild `index.html`, run about orbital patch, **inject home UX blocks**, **`npm run build-motion`** at end |
| Build Motion only | `npm run build-motion` | Rebundle `scripts/mirror-motion-entry.mjs` → `site-mirror/js/mirror-motion.js` (after editing motion logic) |
| Home UX only | `npm run inject-home-ux` | Re-apply `mirrored-home.html` enhancements (safe to run alone) |
| Preview | `npm run preview-mirror` | `serve` on port 4173 |

## Motion principles

- **One strong hero idea per page** — Home uses scroll reveals + phased “How we engage” line; avoid stacking competing full-viewport loops.
- **`prefers-reduced-motion`** — Reveals snap on; phase line and dots apply instantly; mesh/shimmer/pulse disabled in `ux-enhancements.css`.
- **Cheap properties** — Transitions use `opacity` and `transform`; phase line uses `width` on a small bar only.

## Implemented (executed)

### Global (all HTML via `postprocess-mirror.mjs`)

- Remove `<link rel="preload">` pointing at **Google Tag Manager** or **`/_next/`** (including `imagesrcset` with `/_next/`).
- Set **`header a[aria-label="Home"][href=""]` → `mirrored-home.html`** so the logo works on every mirrored page.

### Home (`mirrored-home.html`) — `css/ux-enhancements.css` + `scripts/inject-home-ux.mjs`

Injected **after the first hero pair** (before the “Real expertise” section):

1. **Value strip** — **Split layout:** navy panel with **light text** (contrast-safe) + green accent; light column with lede, **quick-nav** cards (icon + title + subtitle), then **path chooser** rows (accent bar + icon + copy + arrow).
2. **Trust / sectors** — Pill chips on a soft gradient rail.
3. **Services bento** — Per-practice **accent colour**, icon, radial tint; featured **AI** tile with navy gradient, grid texture, soft glow pulse.
4. **How we engage** — Discover → Shape → Build → Run with line + green dots.
5. **CTA band** — Brand-tinted mesh, primary + secondary actions.

**A11y:** `.nf-ux-root` is a **light island** (`color-scheme: light`, explicit foreground/background pairs) so text does not inherit low-contrast `dark:` styles from `main` or sit as dark-on-dark over imagery.

**Animations:** scroll reveals, path/bento hovers, CTA pulse, mesh drift, grid pan on value panel, featured glow (all reduced when `prefers-reduced-motion`).

**Orbital rail (home):** Between trust and bento, a **teal / purple / cyan** rail echoes the About orbital diagram (dashed line draw + pulsing nodes) and the bento header gets a **gradient accent** line on reveal.

### Motion layer (`mirror-motion.js` + `scripts/mirror-motion-entry.mjs`)

Uses **[Motion](https://motion.dev/)** (successor to **Framer Motion**) vanilla APIs: [`inView`](https://motion.dev/docs/inview), [`animate`](https://motion.dev/docs/animate), [`stagger`](https://motion.dev/docs/quick-start#stagger-animations), [`scroll`](https://motion.dev/docs/scroll).

- **Main sections:** spring entrance (`type: "spring"`, tuned stiffness/damping), skipping hero / full-screen overlay / orbital block.
- **`#nf-ux-home-blocks`:** one `inView` on the island + **staggered springs** on `.nf-ux-reveal`; **phase line** width animated with easing; step dots still use CSS classes.
- **Hero:** subtle **scroll-linked** `y` parallax on the absolute hero image (when supported).
- **`prefers-reduced-motion`:** skips springs; applies static `.nf-ux-visible` / phase fallbacks like before.

### Global mirror layer (`mirror-a11y-flair.css` + `mirror-flair.js`)

- **Text on imagery (mobile):** Full-bleed promo rows with `bg-transparent` over photos get a **navy scrim**, **light text**, and **SVG arrows** use light strokes; the image cell gets a light **brightness** reduction so contrast meets intent for large headings and UI copy.
- **Editorial headings:** `h2` / `p` with Tailwind `dark:text-white` get explicit **light-theme ink** (`#0c2340`) when `html` is not `.dark`.
- **Motion:** `main > section` (except hero, full-screen overlay, orbital block) **fade/slide in** on scroll; promo grid links get **lift** on hover.
- **Hairline:** First `main > section` gets a subtle **orbital-gradient** divider at the bottom edge.

## Checklist — not yet automated (future work)

| Page | Intent | Suggested blocks |
|------|--------|-------------------|
| **services.html** | Map offers to problems | Role chips, bento/table, sticky sub-nav |
| **Industry hub** (e.g. `bfsi.html`) | Sector credibility | Challenges → services, 2 cases, compliance line |
| **ai-solutions.html** | De-vague AI | Use-case matrix, dual CTA |
| **work.html** | Scannable proof | Filters, outcome-first cards, fix footer “capability” labels |
| **contact.html** | Low friction | Expectations copy, success state with checkmark draw |

## Files touched by execution

- `postprocess-mirror.mjs` — preloads + logo + runs `inject-home-ux.mjs`
- `scripts/inject-home-ux.mjs` — home HTML + runtime script
- `site-mirror/css/ux-enhancements.css` — layout + motion tokens
- `package.json` — `inject-home-ux` script

## Re-scrape caveat

Re-running **mirror + postprocess** overwrites `mirrored-home.html` from the network; **inject-home-ux** runs at the end of postprocess and **re-applies** the enhancement layer. Custom edits *inside* scraped regions should be scripted (like `patch-about-orbital.mjs`) if they must survive.
