import { load } from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const homePath = path.join(root, 'site-mirror', 'mirrored-home.html');

const HOME_BLOCKS = `
<div id="nf-ux-home-blocks" class="nf-ux-root" data-nf-ux-injected="true">
  <section class="nf-ux-value-strip nf-ux-reveal" aria-labelledby="nf-ux-value-heading">
    <div class="nf-ux-value-strip__inner nf-ux-value-layout">
      <div class="nf-ux-value-panel">
        <div class="nf-ux-value-panel__grid" aria-hidden="true"></div>
        <p class="nf-ux-value-panel__eyebrow">For teams new to NearForm</p>
        <h2 id="nf-ux-value-heading" class="nf-ux-value-panel__title">Digital product consultancy</h2>
        <p class="nf-ux-value-panel__tagline">From strategy to shipped software</p>
        <div class="nf-ux-value-panel__rule" aria-hidden="true"></div>
        <p class="nf-ux-value-panel__meta">Engineering-led delivery · AI, data &amp; cloud · Global teams</p>
      </div>
      <div class="nf-ux-value-main">
        <p class="nf-ux-lede">We design, build and modernise platforms and products together with you. Dedicated practices in <strong>AI</strong>, <strong>data</strong> and <strong>cloud engineering</strong> mean you can ship, measure and improve — without losing momentum after go-live.</p>
        <nav class="nf-ux-quick-nav" aria-label="Get oriented">
          <a class="nf-ux-quick-nav__link nf-ux-reveal nf-ux-stagger-1" href="about.html">
            <span class="nf-ux-quick-nav__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/></svg></span>
            <span class="nf-ux-quick-nav__text"><strong>What we do</strong><span>Company, culture &amp; approach</span></span>
          </a>
          <a class="nf-ux-quick-nav__link nf-ux-reveal nf-ux-stagger-2" href="services.html">
            <span class="nf-ux-quick-nav__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h3.75A2.25 2.25 0 0112 6v3.75A2.25 2.25 0 019.75 12H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h3.75A2.25 2.25 0 0112 15.75V19.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V15.75zM13.5 6a2.25 2.25 0 012.25-2.25H19.5A2.25 2.25 0 0121.75 6v3.75A2.25 2.25 0 0119.5 12h-3.75a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H19.5a2.25 2.25 0 012.25 2.25V19.5a2.25 2.25 0 01-2.25 2.25h-3.75a2.25 2.25 0 01-2.25-2.25V15.75z"/></svg></span>
            <span class="nf-ux-quick-nav__text"><strong>Services</strong><span>Full practice overview</span></span>
          </a>
          <a class="nf-ux-quick-nav__link nf-ux-reveal nf-ux-stagger-3" href="work.html">
            <span class="nf-ux-quick-nav__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008H17.25v-.008zm0 3.75h.008v.008H17.25v-.008zm0 3.75h.008v.008H17.25v-.008z"/></svg></span>
            <span class="nf-ux-quick-nav__text"><strong>Client work</strong><span>Case studies &amp; outcomes</span></span>
          </a>
        </nav>
        <div class="nf-ux-path-header">
          <span class="nf-ux-path-header__label">Where should we start?</span>
          <span class="nf-ux-path-header__hint">Pick the path closest to your goal</span>
        </div>
        <div class="nf-ux-path-grid">
          <a class="nf-ux-path-card nf-ux-path-card--product nf-ux-reveal nf-ux-stagger-4" href="product.html">
            <span class="nf-ux-path-card__accent" aria-hidden="true"></span>
            <span class="nf-ux-path-card__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.856 2.649m0 0a6 6 0 01-5.775-5.775m5.775 5.775V18"/></svg></span>
            <span class="nf-ux-path-card__body">
              <span class="nf-ux-path-card__title">Build &amp; launch</span>
              <span class="nf-ux-path-card__desc">Ship new products and features with embedded design &amp; engineering.</span>
            </span>
            <span class="nf-ux-path-card__arrow" aria-hidden="true">→</span>
          </a>
          <a class="nf-ux-path-card nf-ux-path-card--modern nf-ux-reveal nf-ux-stagger-5" href="modernisation.html">
            <span class="nf-ux-path-card__accent" aria-hidden="true"></span>
            <span class="nf-ux-path-card__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg></span>
            <span class="nf-ux-path-card__body">
              <span class="nf-ux-path-card__title">Modernise</span>
              <span class="nf-ux-path-card__desc">Evolve legacy stacks and ways of working without stopping the business.</span>
            </span>
            <span class="nf-ux-path-card__arrow" aria-hidden="true">→</span>
          </a>
          <a class="nf-ux-path-card nf-ux-path-card--ai nf-ux-reveal nf-ux-stagger-6" href="ai-solutions.html">
            <span class="nf-ux-path-card__accent" aria-hidden="true"></span>
            <span class="nf-ux-path-card__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg></span>
            <span class="nf-ux-path-card__body">
              <span class="nf-ux-path-card__title">AI &amp; data</span>
              <span class="nf-ux-path-card__desc">From discovery to production — responsible, measurable intelligent systems.</span>
            </span>
            <span class="nf-ux-path-card__arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="nf-ux-trust nf-ux-reveal nf-ux-stagger-1" aria-label="Sectors we work with">
    <div class="nf-ux-trust__inner">
      <p class="nf-ux-trust__label">Where we make impact</p>
      <div class="nf-ux-trust__marks">
        <span class="nf-ux-trust__mark">Financial services</span>
        <span class="nf-ux-trust__mark">Healthcare &amp; life sciences</span>
        <span class="nf-ux-trust__mark">Retail &amp; e-commerce</span>
        <span class="nf-ux-trust__mark">Telecommunications &amp; media</span>
        <span class="nf-ux-trust__mark">Public sector</span>
      </div>
    </div>
  </section>

  <div class="nf-ux-orbit-rail nf-ux-reveal nf-ux-stagger-2" aria-hidden="true">
    <div class="nf-ux-orbit-rail__inner">
      <span class="nf-ux-orbit-rail__dash"></span>
      <span class="nf-ux-orbit-rail__node" style="--oc-delay:0s;--oc-color:#00d4aa"></span>
      <span class="nf-ux-orbit-rail__node" style="--oc-delay:0.2s;--oc-color:#8b5cf6"></span>
      <span class="nf-ux-orbit-rail__node" style="--oc-delay:0.4s;--oc-color:#0ea5e9"></span>
      <span class="nf-ux-orbit-rail__dash"></span>
    </div>
  </div>

  <section class="nf-ux-bento" aria-labelledby="nf-ux-bento-title">
    <div class="nf-ux-bento__inner">
      <header class="nf-ux-bento__head nf-ux-reveal">
        <h2 id="nf-ux-bento-title" class="nf-ux-bento__title">Services at a glance</h2>
        <p class="nf-ux-bento__sub">Explore each practice — every tile links to a full overview on this mirror.</p>
      </header>
      <div class="nf-ux-bento__grid">
        <a class="nf-ux-bento__tile nf-ux-bento__tile--featured nf-ux-bento__tile--ai nf-ux-reveal nf-ux-stagger-1" href="ai-solutions.html">
          <span class="nf-ux-bento__tile-glow" aria-hidden="true"></span>
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Featured practice</span>
          <h3 class="nf-ux-bento__tile-name">AI solutions</h3>
          <p class="nf-ux-bento__tile-outcome">Discovery through production — GenAI features, data foundations, governance and delivery.</p>
          <span class="nf-ux-bento__tile-arrow">Explore AI <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--strategy nf-ux-reveal nf-ux-stagger-2" href="strategy.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Advisory</span>
          <h3 class="nf-ux-bento__tile-name">Strategy</h3>
          <p class="nf-ux-bento__tile-outcome">Direction, roadmaps and measurable outcomes before you commit build budget.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--product nf-ux-reveal nf-ux-stagger-3" href="product.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.395 3.87a1.125 1.125 0 01-1.12.684H6.715a1.125 1.125 0 01-1.12-.684L4.2 15m15.6 0l1.395-3.87a1.125 1.125 0 00-1.12-.684H5.325a1.125 1.125 0 00-1.12.684L4.2 15"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Delivery</span>
          <h3 class="nf-ux-bento__tile-name">Product</h3>
          <p class="nf-ux-bento__tile-outcome">Design and engineering squads shipping usable, valuable software continuously.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--data nf-ux-reveal nf-ux-stagger-4" href="data.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Platform</span>
          <h3 class="nf-ux-bento__tile-name">Data</h3>
          <p class="nf-ux-bento__tile-outcome">Pipelines and platforms so insight and AI stay accurate and governed.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--modern nf-ux-reveal nf-ux-stagger-5" href="modernisation.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.733m8.032-.653l1.15-.733"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Transform</span>
          <h3 class="nf-ux-bento__tile-name">Modernisation</h3>
          <p class="nf-ux-bento__tile-outcome">Evolve legacy estates incrementally without freezing the business.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--platform nf-ux-reveal nf-ux-stagger-6" href="platform.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V6a3 3 0 013-3h13.5a3 3 0 013 3v5.25a3 3 0 01-3 3m-16.5 0a3 3 0 003 3h13.5a3 3 0 003-3m-19.5 0v.75a3 3 0 003 3h13.5a3 3 0 003-3v-.75"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Foundations</span>
          <h3 class="nf-ux-bento__tile-name">Platform</h3>
          <p class="nf-ux-bento__tile-outcome">Internal platforms and developer experience that compound team speed.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--lifecycle nf-ux-reveal nf-ux-stagger-7" href="lifecycle-services.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Sustain</span>
          <h3 class="nf-ux-bento__tile-name">Lifecycle</h3>
          <p class="nf-ux-bento__tile-outcome">Run, observe and extend what you already operate in production.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
        <a class="nf-ux-bento__tile nf-ux-bento__tile--industries nf-ux-reveal nf-ux-stagger-8" href="industries.html">
          <span class="nf-ux-bento__tile-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg></span>
          <span class="nf-ux-bento__tile-kicker">Sectors</span>
          <h3 class="nf-ux-bento__tile-name">Industries</h3>
          <p class="nf-ux-bento__tile-outcome">Regulated and high-scale verticals with tailored playbooks.</p>
          <span class="nf-ux-bento__tile-arrow">Open <span aria-hidden="true">→</span></span>
        </a>
      </div>
    </div>
  </section>

  <section class="nf-ux-phases" aria-labelledby="nf-ux-phases-title">
    <div class="nf-ux-phases__inner">
      <h2 id="nf-ux-phases-title" class="nf-ux-phases__title nf-ux-reveal">How we engage</h2>
      <p class="nf-ux-phases__sub nf-ux-reveal">A clear path from first conversation to lasting delivery — tailored to your constraints and teams.</p>
      <div class="nf-ux-phase-track">
        <div class="nf-ux-phase-line" aria-hidden="true"><div class="nf-ux-phase-line__fill"></div></div>
        <div class="nf-ux-phase">
          <div class="nf-ux-phase__dot"></div>
          <h3 class="nf-ux-phase__name">Discover</h3>
          <p class="nf-ux-phase__desc">Align on outcomes, constraints and the smallest valuable next step.</p>
        </div>
        <div class="nf-ux-phase">
          <div class="nf-ux-phase__dot"></div>
          <h3 class="nf-ux-phase__name">Shape</h3>
          <p class="nf-ux-phase__desc">Architecture, ways of working and a delivery plan you can stand behind.</p>
        </div>
        <div class="nf-ux-phase">
          <div class="nf-ux-phase__dot"></div>
          <h3 class="nf-ux-phase__name">Build</h3>
          <p class="nf-ux-phase__desc">Iterative shipping with measurable risk reduction and quality.</p>
        </div>
        <div class="nf-ux-phase">
          <div class="nf-ux-phase__dot"></div>
          <h3 class="nf-ux-phase__name">Run</h3>
          <p class="nf-ux-phase__desc">Handover, improvement loops and optional embedded support.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="nf-ux-cta-band nf-ux-reveal" aria-labelledby="nf-ux-cta-heading">
    <div class="nf-ux-mesh" aria-hidden="true"></div>
    <div class="nf-ux-cta-band__inner">
      <div class="nf-ux-cta-band__copy">
        <h2 id="nf-ux-cta-heading">Ready to talk?</h2>
        <p>Tell us about your product, platform or AI initiative — we’ll help you find the right entry point.</p>
      </div>
      <div class="nf-ux-cta-actions">
        <a class="nf-ux-cta-primary nf-ux-pulse-cta" href="contact.html">Contact NearForm</a>
        <a class="nf-ux-cta-secondary" href="services.html">Browse all services</a>
      </div>
    </div>
  </section>
</div>
`.trim();

function inject() {
  if (!fs.existsSync(homePath)) {
    console.warn("inject-home-ux: skip (no mirrored-home.html)");
    return;
  }
  const raw = fs.readFileSync(homePath, 'utf8');
  const $ = load(raw, { decodeEntities: false });

  $('#nf-ux-home-blocks').remove();
  $('#nf-ux-enhancements-css').remove();
  $('script#nf-ux-home-runtime').remove();

  const $main = $('main').first();
  const $thirdSection = $main.children('section').eq(2);
  if (!$thirdSection.length) {
    console.warn('inject-home-ux: no third main section; prepend to main');
    $main.prepend(HOME_BLOCKS);
  } else {
    $thirdSection.before(HOME_BLOCKS);
  }

  if ($('#nf-ux-enhancements-css').length === 0) {
    $('head').append(
      '<link rel="stylesheet" href="css/ux-enhancements.css" id="nf-ux-enhancements-css" />'
    );
  }

  const out = $.root().html();
  fs.writeFileSync(homePath, out, 'utf8');
  console.log('inject-home-ux: updated', path.relative(root, homePath));
}

inject();
