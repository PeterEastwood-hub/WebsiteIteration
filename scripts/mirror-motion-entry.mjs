/**
 * Motion (motion.dev) — Framer-style springs, stagger, inView for the static mirror.
 * @see https://motion.dev/docs/quick-start
 */
import { animate, inView, stagger, scroll } from 'motion';

function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function skipSection(sec) {
  if (sec.querySelector('#orbital-convergence')) return true;
  if (sec.querySelector('#engineered-differently')) return true;
  if (/\bh-screen\b/.test(sec.className)) return true;
  if (
    /\babsolute\b/.test(sec.className) &&
    /\btop-0\b/.test(sec.className) &&
    /\bw-full\b/.test(sec.className) &&
    /\bh-full\b/.test(sec.className)
  ) {
    return true;
  }
  return false;
}

function isEffectivelyHidden(el) {
  try {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return true;
    if (parseFloat(st.opacity) === 0 && st.pointerEvents === 'none') return true;
  } catch {
    /* ignore */
  }
  return false;
}

function isServicesMotionLayout() {
  const m = document.body?.getAttribute('data-nf-layout');
  return m === 'service' || m === 'services-hub';
}

function findGridCols12(section) {
  const holders = section.querySelectorAll('div[class*="mx-auto"]');
  for (let i = 0; i < holders.length; i++) {
    const g = holders[i].querySelector(':scope > div.grid.grid-cols-12');
    if (g) return g;
  }
  return null;
}

/** Services / hub: Framer-style stagger on grid cells instead of whole-section fade. */
function primeServiceSections() {
  const sections = document.querySelectorAll('main > section');
  sections.forEach((sec) => {
    if (skipSection(sec)) return;
    if (isEffectivelyHidden(sec)) return;
    const grid = findGridCols12(sec);
    if (!grid) return;
    const kids = Array.from(grid.children).filter((cell) => {
      const cls = cell.getAttribute('class') || '';
      return /col-span/.test(cls) || cell.hasAttribute('data-type');
    });
    if (kids.length === 0) return;
    sec.style.opacity = '1';
    sec.style.transform = 'none';
    kids.forEach((cell) => {
      cell.dataset.mirrorMotionServiceCell = '1';
      cell.style.opacity = '0';
      cell.style.transform = 'translateY(28px)';
    });
    inView(
      sec,
      () => {
        if (sec.dataset.mirrorServiceStaggerDone === '1') return;
        sec.dataset.mirrorServiceStaggerDone = '1';
        animate(
          kids,
          { opacity: 1, y: 0 },
          {
            delay: stagger(0.065, { startDelay: 0.05 }),
            type: 'spring',
            stiffness: 96,
            damping: 18,
            mass: 0.82,
          },
        );
      },
      { margin: '-40px 0px -12% 0px', amount: 'some' },
    );
  });
}

function primeSections() {
  if (isServicesMotionLayout()) {
    primeServiceSections();
    return;
  }
  const sections = document.querySelectorAll('main > section');
  sections.forEach((sec) => {
    if (skipSection(sec)) return;
    /* Work / case-study pages use md:hidden + hidden md:block pairs; priming display:none
       leaves opacity:0 forever because inView never intersects hidden nodes. */
    if (isEffectivelyHidden(sec)) return;
    sec.dataset.mirrorMotionSection = '1';
    sec.style.opacity = '0';
    sec.style.transform = 'translateY(48px)';
  });

  inView(
    'main > section[data-mirror-motion-section]',
    (el) => {
      animate(
        el,
        { opacity: 1, y: 0 },
        { type: 'spring', stiffness: 68, damping: 17, mass: 0.9 },
      );
    },
    /* Default "some" is easier to hit than 0.12 for tall grids; margin less aggressive */
    { margin: '-48px 0px -8% 0px', amount: 'some' },
  );
}

/** UX island: staggered spring reveals (replaces inline IntersectionObserver). */
function primeUxIsland() {
  const root = document.getElementById('nf-ux-home-blocks');
  if (!root) return;

  const reveals = root.querySelectorAll('.nf-ux-reveal');
  reveals.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
  });

  inView(
    root,
    () => {
      animate(
        reveals,
        { opacity: 1, y: 0 },
        {
          delay: stagger(0.055, { startDelay: 0.08 }),
          type: 'spring',
          stiffness: 105,
          damping: 18,
        },
      );
    },
    { margin: '-48px 0px -8% 0px', amount: 0.06 },
  );

  const phases = root.querySelector('.nf-ux-phases');
  if (phases) {
    const line = phases.querySelector('.nf-ux-phase-line__fill');
    const steps = phases.querySelectorAll('.nf-ux-phase');
    inView(
      phases,
      () => {
        if (line) {
          line.style.width = '0%';
          animate(line, { width: '100%' }, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
        }
        steps.forEach((step, i) => {
          window.setTimeout(() => step.classList.add('nf-ux-phase--active'), 130 * i);
        });
      },
      { amount: 0.22 },
    );
  }
}

/** Hero background: subtle scroll-linked parallax (Motion scroll + animate). */
function heroParallax() {
  const heroImg = document.querySelector('main > section.absolute img.object-cover');
  if (!heroImg) return;
  const section = heroImg.closest('section.absolute');
  if (!section) return;

  try {
    const a = animate(heroImg, { y: [0, 24] }, { ease: 'linear', duration: 1 });
    scroll(a, { target: section, offset: ['start start', 'end start'] });
  } catch {
    /* ScrollTimeline / scroll() unsupported */
  }
}

function reducedFallbackUx() {
  document.querySelectorAll('.nf-ux-reveal').forEach((el) => el.classList.add('nf-ux-visible'));
  const ph = document.querySelector('.nf-ux-phases');
  if (ph) {
    ph.classList.add('nf-ux-line-filled');
    ph.querySelectorAll('.nf-ux-phase').forEach((p) => p.classList.add('nf-ux-phase--active'));
  }
}

function init() {
  if (reducedMotion()) {
    reducedFallbackUx();
    return;
  }

  document.documentElement.classList.add('mirror-motion-active');

  /* Wait for responsive CSS (md:hidden / hidden md:block) before getComputedStyle */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      primeSections();
      primeUxIsland();
      heroParallax();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
