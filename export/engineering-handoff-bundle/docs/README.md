# Engineering handoff — Insights, Communities, article, global nav

This folder describes **what to build in production** and **where the prototype encodes it**. The prototype is a static **Next-export mirror** plus a **postprocess** layer (Cheerio) and small **progressive JS** files.

## What is in scope for the target build

| Surface | Mirror HTML (reference) | Layout hook | Main design logic |
|--------|-------------------------|---------------|-------------------|
| **Insights index** | `site-mirror/insights.html` | `body.nf-insights-index`, `data-nf-layout` on `body` | `postprocess-mirror.mjs`, `scripts/insights-redesign-enrich.mjs`, `site-mirror/js/mirror-insights-*.js`, `site-mirror/css/mirror-content-rhythm.css` |
| **Communities listing** | `site-mirror/insights-engineering-community.html` | Same classes as Insights-style listing | Same as above + `relabelEngineeringCommunityLandingPage` in `postprocess-mirror.mjs` |
| **Article view** | Any `site-mirror/*.html` with `data-nf-layout="insight-article"` (example below) | `data-nf-layout="insight-article"` | `postprocess-mirror.mjs` (hero, meta, related, format pill removal), `mirror-content-rhythm.css`, `mirror-insights-card-cta.js` (listing cards only) |
| **Global nav** | Header in the same HTML files | `body > header.font-sans.fixed`, `data-testid="header-center"` | `postprocess-mirror.mjs` (`flattenInsightsNav`, `upgradeInsightsNavWithEngineeringDropdown`, `renameEngineeringNavLabelToCommunities`, `COMMUNITIES_NAV_SYNC_SCRIPT`), `site-mirror/js/mirror-stripe-nav.js`, sticky header style in postprocess |

**Branding note:** Product copy uses **Communities** (not “Engineering”) for the technical stream labels, titles, and nav where applicable. URLs may still use `engineering.html` / `insights-engineering-community.html` as mirror stubs—production may rename routes separately.

## How to run the prototype (full fidelity)

From the **repository root** (not only this folder):

```bash
npm install
npm run postprocess-mirror
npx serve site-mirror -l 5173
```

Then open:

- `http://localhost:5173/insights.html` — Insights  
- `http://localhost:5173/insights-engineering-community.html` — Communities  
- `http://localhost:5173/implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html` — example article  

The mirror ships **hashed Next CSS/JS** under `site-mirror/css/` and `site-mirror/js/`; those are required for pixel parity. A slim zip without the full `site-mirror/` tree will **not** render standalone pages faithfully.

## Recommended implementation approach

1. **Treat mirror HTML as visual/interaction reference**, not production components.  
2. **Port behaviour in order:** global header + nav → Insights listing → Communities listing → article template.  
3. **Map `data-nf-*` attributes and classes** added by postprocess to your component props (they are the contract the prototype CSS/JS expects).  
4. **Re-implement** tracking removal, sticky header, and nav flyouts in your app shell (mirror uses inline + deferred scripts).

## Key source files (repo paths)

| Path | Role |
|------|------|
| `postprocess-mirror.mjs` | Single pipeline: tracking strip, `data-nf-layout`, Insights nav flatten/flyout, Communities relabelling, article hero/meta/related, string scrubs |
| `scripts/insights-redesign-enrich.mjs` | Listing card markup / topic enrichment used from postprocess |
| `site-mirror/css/mirror-content-rhythm.css` | Editorial spacing, article rhythm, related cards, listing tweaks |
| `site-mirror/css/mirror-stripe-influence.css` | Stripe-like nav hover/focus behaviour (paired with JS) |
| `site-mirror/css/mirror-a11y-flair.css` | Minor a11y/visual polish injected by postprocess |
| `site-mirror/css/insights-explore.css` | Layout iteration / explore hub (if you ship iter8/9 explorations) |
| `site-mirror/js/mirror-stripe-nav.js` | Nav dropdown timing, iteration topbar injection, Communities label sync |
| `site-mirror/js/mirror-insights-tabs.js` | Topic tabs / filters on hub listings |
| `site-mirror/js/mirror-insights-card-cta.js` | Card meta, topic pill links, format handling on cards |
| `site-mirror/js/mirror-insights-redesign.js` | Redesign drawer / behaviour gates |
| `site-mirror/js/mirror-insights-iter8-9-listing.js` | Featured hero + cross-stream modules on iter8/9 pages only |
| `scripts/build-insights-explore.py` | Regenerates `insights-explore-*.html` variants from `insights-explore-iter7.html` (optional for production) |

## Example article page

Use any mirrored article; a representative technical article:

`site-mirror/implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html`

## Visual references

PNG full-page captures (if present in repo):

`export/pdf-handoff-screenshots/01-insights-full-page.png`  
`export/pdf-handoff-screenshots/02-communities-full-page.png`  
`export/pdf-handoff-screenshots/03-article-example-full-page.png`  

Regenerate:

```bash
npm run capture-pdf-handoff-screenshots
```

(requires `site-mirror` preview on port **5173** by default.)

## Building a zip for your engineer

From repo root:

```bash
bash export/engineering-handoff/package-handoff.sh
```

- **Default:** documentation + manifest + screenshots + custom mirror CSS/JS + prototype scripts + three example HTML pages (engineer still clones repo or copies full `site-mirror` for local run).  
- **Full mirror (large ~260MB+):**  

```bash
bash export/engineering-handoff/package-handoff.sh --with-site-mirror
```

Output: `export/engineering-handoff-bundle.zip` (and an unpacked directory next to it).

## Questions to resolve in production

- Canonical **routes** for Communities vs legacy `engineering` paths.  
- **CMS** fields for listing cards (topics, reading time, industry).  
- Whether **iteration 8/9** explore pages are product scope or UX-only experiments (`insights-explore-iter*.html`).  
- **Analytics**, consent banners, and **SEO** meta parity with marketing requirements.
