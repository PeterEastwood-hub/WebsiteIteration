import { load } from 'cheerio';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  enrichEngineeringListingCheerio,
  enrichInsightsListingCheerio,
  enhanceInsightArticleFormatPill,
} from './scripts/insights-redesign-enrich.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'site-mirror');
const HOME_COPY = 'mirrored-home.html';
const AUDIT_MARKER = '<!-- ux-audit-page-list -->';

const TRACKING_HOST_RE =
  /^(?:.*\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.net|connect\.facebook\.net|hotjar\.com|segment\.(com|io)|cdn\.segment\.com|api\.segment\.io|plausible\.io|clarity\.ms|fullstory\.com|mxpnl\.com|mixpanel\.com|heapanalytics\.com|cdn\.heapanalytics\.com|amplitude\.com|cdn\.amplitude\.com|hs-scripts\.com|js\.hs-scripts\.com|js\.hs-analytics\.net|usemessages\.com|hs-banner\.com|optimizely\.com|cdn\.optimizely\.com|browser-update\.org|static\.ads-twitter\.com|snap\.licdn\.com|px\.ads\.linkedin\.com|bat\.bing\.com|sc\.static\.net)$/i;

const TRACKING_SRC_RE =
  /googletagmanager|google-analytics|analytics\.google|g\.doubleclick|doubleclick|facebook\.net|connect\.facebook|hotjar|segment\.(?:com|io)|plausible\.io|clarity\.ms|fullstory|mxpnl|mixpanel|heap\.|heapanalytics|amplitude|hs-scripts|hs-analytics|hubspot.*\.js|optimizely|browser-update|ads-twitter|snap\.licdn|linkedin\.com\/px|bat\.bing|static\.hotjar/i;

const INLINE_TRACKING_RE =
  /gtag\s*\(|dataLayer\.|googletagmanager|GTM-[A-Z0-9]+|fbq\s*\(|facebook\s*pixel|analytics\.js|ga\s*\(\s*['"]create|_gaq\.|hjBootstrap|hj\(|hotjar|plausible\(|mixpanel\.|amplitude\.|segment\.|heap\.|fullstory|optimizely|linkedin_insight|lms_analytics/i;

const BAR_HTML = `
<div id="ux-audit-spacer" style="height:56px" aria-hidden="true"></div>
<div id="ux-audit-bar" role="region" aria-label="UX audit notes" style="position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#12121a;color:#e8e8ef;padding:10px 16px;box-shadow:0 -4px 24px rgba(0,0,0,.35);font:14px/1.4 system-ui,-apple-system,sans-serif;display:flex;align-items:center;gap:12px;border-top:1px solid #2a2a38;">
  <label for="ux-audit-notes" style="white-space:nowrap;font-weight:600;flex-shrink:0;">UX notes</label>
  <input id="ux-audit-notes" type="text" placeholder="Notes for this page (saved locally in your browser)…" style="flex:1;min-width:0;padding:8px 12px;border-radius:8px;border:1px solid #3d3d52;background:#fff;color:#111;" autocomplete="off" />
</div>
<script>
(function(){
  var el = document.getElementById('ux-audit-notes');
  if (!el) return;
  var k = 'ux-audit-notes:' + location.pathname;
  try { el.value = localStorage.getItem(k) || ''; } catch (e) {}
  el.addEventListener('input', function () {
    try { localStorage.setItem(k, el.value); } catch (e) {}
  });
})();
</script>
`.trim();

/** Sticky white global header (Nearform main site mirror uses fixed + transparent + white type). */
const STICKY_HEADER_STYLE = `
<style id="ux-audit-sticky-header">
  body > header.font-sans.fixed:has([data-testid="header-left"]) {
    position: sticky !important;
    top: 0 !important;
    left: 0;
    right: 0;
    width: 100% !important;
    z-index: 10000 !important;
    background-color: #ffffff !important;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.08);
  }
  body > header.font-sans.fixed:has([data-testid="header-left"])::after {
    display: none !important;
  }
  body > header.font-sans.fixed:has([data-testid="header-left"]) nav,
  body > header.font-sans.fixed:has([data-testid="header-left"]) nav a,
  body > header.font-sans.fixed:has([data-testid="header-left"]) nav button {
    color: #0f172a !important;
  }
  body > header.font-sans.fixed:has([data-testid="header-left"]) svg path:not([fill="none"]),
  body > header.font-sans.fixed:has([data-testid="header-left"]) svg rect:not([fill="none"]),
  body > header.font-sans.fixed:has([data-testid="header-left"]) svg circle:not([fill="none"]) {
    fill: #0f172a !important;
  }
  body > header.font-sans.fixed:has([data-testid="header-left"]) svg path[stroke],
  body > header.font-sans.fixed:has([data-testid="header-left"]) svg line,
  body > header.font-sans.fixed:has([data-testid="header-left"]) svg polyline {
    stroke: #0f172a !important;
  }
  body > header.font-sans.fixed:has([data-testid="header-left"]) button[aria-label="Toggle Nav Menu"] span {
    background-color: #0f172a !important;
  }
</style>
`.trim();

function ensureFlairAssets($, relPath = '') {
  const $head = $('head');
  if (!$head.length) return;
  if ($('#mirror-a11y-flair-css').length === 0) {
    $head.append(
      '<link rel="stylesheet" href="css/mirror-a11y-flair.css" id="mirror-a11y-flair-css" />',
    );
  }
  if ($('#mirror-stripe-influence-css').length === 0) {
    $head.append(
      '<link rel="stylesheet" href="css/mirror-stripe-influence.css" id="mirror-stripe-influence-css" />',
    );
  }
  if ($('#mirror-content-rhythm-css').length === 0) {
    $head.append(
      '<link rel="stylesheet" href="css/mirror-content-rhythm.css" id="mirror-content-rhythm-css" />',
    );
  }
  if ($('#mirror-services-flair-css').length === 0) {
    $head.append(
      '<link rel="stylesheet" href="css/mirror-services-flair.css" id="mirror-services-flair-css" />',
    );
  }
  if (relPath && inferNfLayout(relPath) === 'service') {
    if ($('#mirror-service-orbit-css').length === 0) {
      $head.append(
        '<link rel="stylesheet" href="css/mirror-service-orbit.css" id="mirror-service-orbit-css" />',
      );
    }
    if ($('script[src="js/mirror-service-orbit.js"]').length === 0) {
      $head.append(
        '<script src="js/mirror-service-orbit.js" defer id="mirror-service-orbit-js"></script>',
      );
    }
  }
  if ($('script[src="js/mirror-flair.js"]').length === 0) {
    $head.append('<script src="js/mirror-flair.js" defer id="mirror-flair-js"></script>');
  }
  if ($('script[src="js/mirror-stripe-nav.js"]').length === 0) {
    $head.append('<script src="js/mirror-stripe-nav.js" defer id="mirror-stripe-nav-js"></script>');
  }
  if ($('script[src="js/mirror-insights-card-cta.js"]').length === 0) {
    $head.append(
      '<script src="js/mirror-insights-card-cta.js" defer id="mirror-insights-card-cta-js"></script>',
    );
  }
  if (
    $('body').hasClass('nf-insights-redesign') &&
    $('script[src="js/mirror-insights-redesign.js"]').length === 0
  ) {
    $head.append(
      '<script src="js/mirror-insights-redesign.js" defer id="mirror-insights-redesign-js"></script>',
    );
  }
  if (
    ($('body').attr('data-nf-layout') || '').trim() === 'insight-article' &&
    $('script[src="js/mirror-insight-title-orphan.js"]').length === 0
  ) {
    $head.append(
      '<script src="js/mirror-insight-title-orphan.js" defer id="mirror-insight-title-orphan-js"></script>',
    );
  }
  if ($('script[src="js/mirror-motion.js"]').length === 0) {
    $head.append('<script type="module" src="js/mirror-motion.js"></script>');
  }
}

function isTrackingScript($, el) {
  const $el = $(el);
  const src = ($el.attr('src') || '').trim();
  if (src) {
    const lower = src.toLowerCase();
    if (TRACKING_SRC_RE.test(lower)) return true;
    try {
      const u = new URL(src, 'https://nearform.com/');
      if (TRACKING_HOST_RE.test(u.hostname)) return true;
    } catch {
      /* ignore */
    }
  }
  const inline = $el.html() || '';
  if (INLINE_TRACKING_RE.test(inline)) return true;
  return false;
}

const SERVICE_PRACTICE_PAGES = new Set([
  'strategy',
  'product',
  'ai-solutions',
  'data',
  'modernisation',
  'platform',
  'lifecycle-services',
]);

/**
 * True for mirrored *posts* under /insights/slug or /digital-community/slug (not hub URLs).
 * Listing pagination (insights_N, digital-community_N) keeps canonical …/insights/ or …/digital-community/.
 */
function isInsightArticleCanonical($) {
  const href = ($('link[rel="canonical"]').attr('href') || '').trim();
  if (!href) return false;
  try {
    const u = new URL(href);
    const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts.length < 2) return false;
    const root = parts[0];
    return root === 'insights' || root === 'digital-community';
  } catch {
    return false;
  }
}

/**
 * Stripe-style insight hero: author avatar, name, date + share sit on the top of the hero image
 * (see https://stripe.com/blog/…). Moves the share/byline `div` that follows the first figure
 * section into that section and marks it for CSS overlay.
 */
function hoistInsightArticleHeroByline($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  const $main = $('main');
  if (!$main.length) return;

  const $hero = $main
    .children('section')
    .filter((_, el) => $(el).find('figure img').length > 0)
    .first();
  if (!$hero.length || $hero.hasClass('nf-insight-hero-wrap')) return;

  const $byline = $hero.next('div');
  if (!$byline.length) return;

  const blob = ($byline.text() || '').replace(/\s+/g, ' ');
  /* Word-boundary fails when date runs into "Share" (e.g. "2025Share") in minified text */
  const hasShare = /Share/i.test(blob);
  const hasAvatar =
    $byline.find('img[alt="avatar"]').length > 0 ||
    $byline.find('[class*="rounded-full"]').length > 0;
  if (!hasShare || !hasAvatar) return;

  $hero.addClass('nf-insight-hero-wrap');
  $byline.attr('data-nf-insight-hero-byline', '');
  $hero.prepend($byline);
}

/** e.g. "11 Mar 2026" → "11th of March, 2026" for the green-stroke line */
function formatInsightArticleDateUkLong(raw) {
  const t = (raw || '').replace(/\s+/g, ' ').trim();
  if (!/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}$/.test(t)) return null;
  const m = t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mon = m[2];
  const y = m[3];
  const ord = (n) => {
    if (n >= 11 && n <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };
  const monthKeys = {
    jan: 'January',
    feb: 'February',
    mar: 'March',
    apr: 'April',
    may: 'May',
    jun: 'June',
    jul: 'July',
    aug: 'August',
    sep: 'September',
    oct: 'October',
    nov: 'November',
    dec: 'December',
  };
  const key = mon.slice(0, 3).toLowerCase();
  const monthName = monthKeys[key] || mon;
  return `${ord(d)} of ${monthName}, ${y}`;
}

/**
 * Stripe blog–style article chrome: breadcrumb + social kicker, date under H1 with accent
 * (date is lifted from the hoisted byline so it sits above the hero like stripe.com/blog).
 */
function enhanceInsightArticleStripeHeader($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  const $main = $('main');
  const $titleSec = $main.children('section').first();
  if (!$titleSec.length) return;

  if ($titleSec.find('[data-nf-insight-kicker]').length === 0) {
    const $kicker = $(`<div class="nf-insight-article-kicker" data-nf-insight-kicker="">
  <nav class="nf-insight-article-kicker__crumbs" aria-label="Breadcrumb"><a class="nf-insight-article-kicker__link" href="insights.html">Insights</a><span class="nf-insight-article-kicker__sep" aria-hidden="true">/</span><span class="nf-insight-article-kicker__current">Article</span></nav>
  <a class="nf-insight-article-kicker__social" href="https://x.com/nearform" target="_blank" rel="noopener noreferrer">Nearform on X<span aria-hidden="true" class="nf-insight-article-kicker__chev"> ›</span></a>
</div>`);
    $titleSec.prepend($kicker);
  }

  if ($titleSec.find('[data-nf-insight-article-date]').length > 0) return;

  const $byline = $main.find('[data-nf-insight-hero-byline]').first();
  if (!$byline.length) return;

  const $dateSource = $byline
    .find('div[class*="514b45"]')
    .filter((_, el) => /\d/.test($(el).text() || ''))
    .first();
  if (!$dateSource.length) return;

  const dateText = ($dateSource.text() || '').replace(/\s+/g, ' ').trim();
  if (!dateText) return;

  const $h1 = $titleSec.find('h1').first();
  if (!$h1.length) return;

  const $dateRow = $(`<p class="nf-insight-article-date" data-nf-insight-article-date="">
  <span class="nf-insight-article-date__accent" aria-hidden="true"></span>
  <span class="nf-insight-article-date__text"></span>
</p>`);
  $dateRow.find('.nf-insight-article-date__text').text(formatInsightArticleDateUkLong(dateText) || dateText);
  $h1.after($dateRow);

  $dateSource.addClass('nf-insight-byline-date--hidden').attr('aria-hidden', 'true');
}

/**
 * One row under the title: author + date left, share/social icons right.
 * Removes the hoisted hero byline wrapper once pieces are moved.
 */
function relocateInsightArticleMetaRow($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;

  const $existingMeta = $('.nf-insight-article-meta-row[data-nf-insight-meta-row]').first();
  if ($existingMeta.length) {
    const $left = $existingMeta.find('.nf-insight-article-meta-row__left');
    const $shell = $left.children('div[class*="max-w"]').first();
    if ($shell.length) {
      const $auth = $shell.find('.flex-1 > div.flex.items-center').first();
      $shell.remove();
      if ($auth.length) $left.prepend($auth);
    }
    return;
  }

  const $main = $('main');
  const $titleSec = $main.children('section').first();
  const $date = $titleSec.find('[data-nf-insight-article-date]').first();
  const $byline = $main.find('[data-nf-insight-hero-byline]').first();
  if (!$titleSec.length || !$date.length || !$byline.length) return;

  const $h1 = $titleSec.find('h1').first();
  if (!$h1.length) return;

  /* Inner row only — not the outer max-w shell that also has flex + items-center */
  const $authorRow = $byline.find('.flex-1 > div.flex.items-center').first();
  if (!$authorRow.length || !$authorRow.find('img[alt="Author"], img[alt="avatar"]').length) return;
  const $shareUl = $byline.find('ul.list-none').first();
  if (!$authorRow.length || !$shareUl.length) return;

  const $metaRow = $(`<div class="nf-insight-article-meta-row" data-nf-insight-meta-row="">
  <div class="nf-insight-article-meta-row__left"></div>
  <div class="nf-insight-article-meta-row__right"></div>
</div>`);
  const $left = $metaRow.find('.nf-insight-article-meta-row__left');
  const $right = $metaRow.find('.nf-insight-article-meta-row__right');

  $left.append($authorRow);
  $left.append($date);
  $right.append($shareUl);

  $h1.after($metaRow);
  $byline.remove();
}

/**
 * Drop duplicate plain date under the author name; move the green-stroke date into .ml-4 under the name.
 */
function stackInsightArticleDateUnderAuthor($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  $('.nf-insight-article-meta-row[data-nf-insight-meta-row]').each((_, row) => {
    const $row = $(row);
    const $left = $row.find('.nf-insight-article-meta-row__left').first();
    if (!$left.length) return;
    $left.find('.nf-insight-byline-date--hidden').remove();
    const $date = $left.find('p[data-nf-insight-article-date]').first();
    const $nameCol = $left.find('.flex.items-center > .ml-4').first();
    if (!$date.length || !$nameCol.length) return;
    const dateParent = $date.parent()[0];
    const nameColEl = $nameCol[0];
    if (dateParent && nameColEl && dateParent === nameColEl) return;
    $nameCol.append($date);
  });
}

/** Upgrade short mirror dates (e.g. 11 Mar 2026) to long UK copy on re-postprocess */
function normalizeInsightArticleDateLabels($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  $('p[data-nf-insight-article-date] .nf-insight-article-date__text').each((_, el) => {
    const $el = $(el);
    const cur = ($el.text() || '').replace(/\s+/g, ' ').trim();
    const fmt = formatInsightArticleDateUkLong(cur);
    if (fmt) $el.text(fmt);
  });
}

/** Generic author portrait (Unsplash, license: https://unsplash.com/license) — replaces logo avatars in hoisted bylines. */
const INSIGHT_AUTHOR_PLACEHOLDER = 'images/nf-insight-author-placeholder.jpg';

/**
 * Shared insight card anatomy (listing + article “You may also like”):
 * [image link] + div.nf-insight-related-card-body (column flex)
 *   .nf-insight-related-card-head → hashtags row, then title link (stacked, full width)
 *   .nf-insight-related-card-meta → author + date (margin-top: auto → bottom of card)
 */
function wrapInsightCardStackRegions($, $card) {
  const $kids = $card.children();
  if ($kids.length < 2) return;
  const $body = $($kids[1]);
  if (!$body.is('div')) return;
  $body.addClass('nf-insight-related-card-body');
  $body.children().each((_, el) => {
    const $el = $(el);
    if ($el.hasClass('nf-insight-related-card-head')) return;
    const cls = ($el.attr('class') || '').toLowerCase();
    if ($el.is('div') && /\bflex\b/.test(cls) && /\bgap-3\b/.test(cls)) {
      $el.addClass('nf-insight-related-card-meta');
    }
  });

  if ($body.children('.nf-insight-related-card-head').length) return;

  const $c0 = $body.children().eq(0);
  const $c1 = $body.children().eq(1);
  if (!$c0.length) return;

  const cls0 = ($c0.attr('class') || '').toLowerCase();
  const tagsFirst =
    cls0.includes('flex-wrap') ||
    cls0.includes('nf-insight-card-hashtags') ||
    $c0.find('.nf-insight-card-hashtag').length > 0;
  const titleSecond = $c1.is('a') && $c1.find('h3').length > 0;
  const titleFirst = $c0.is('a') && $c0.find('h3').length > 0;

  const $head = $('<div class="nf-insight-related-card-head"></div>');
  if (tagsFirst && titleSecond) {
    $head.append($c0, $c1);
    $body.prepend($head);
  } else if (titleFirst) {
    $head.append($c0);
    $body.prepend($head);
  }
}

/** Article pages: “You may also like” cards. */
function wrapInsightRelatedCardHeads($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  $('section.nf-insight-related-section .nf-insight-related-card').each((_, card) => {
    wrapInsightCardStackRegions($, $(card));
  });
}

/** Insights index / topic pages: bento stack cards (same inner structure as related). */
function wrapInsightsIndexArticleCards($) {
  if (!$('body').hasClass('nf-insights-index')) return;
  $('.nf-insights-feed-list--stack .nf-insights-article-card').each((_, card) => {
    wrapInsightCardStackRegions($, $(card));
  });
}

/**
 * Site-wide: Insights is a single link to insights.html (desktop flyout + mobile accordion).
 * Removed submenu was only “Engineering community” (insights.html#digital-community).
 */
function flattenInsightsNav($) {
  const $center = $('body > header.font-sans.fixed ul[data-testid="header-center"]');
  if ($center.length) {
    $center.find('> li').each((_, li) => {
      const $li = $(li);
      const $group = $li.children('div.group.relative').first();
      if (!$group.length) return;
      const $a = $group.children('a[href]').first();
      if (!$a.length) return;
      const href = ($a.attr('href') || '').trim();
      if (!/^insights\.html([#?].*)?$/.test(href)) return;
      if (!$group.find('a[href*="digital-community"]').length) return;
      const classes = $a.attr('class') || '';
      const text = ($a.text() || '').replace(/\s+/g, ' ').trim() || 'Insights';
      $li.empty();
      $li.append($('<a></a>').attr('class', classes).attr('href', 'insights.html').text(text));
    });
  }

  $('header button[aria-label="Toggle Insights submenu"]').each((_, btn) => {
    const $btn = $(btn);
    const $li = $btn.closest('li');
    if (!$li.length) return;
    if (!$li.find('a[href*="digital-community"]').length) return;
    const $insightsA = $btn.prev('a[href^="insights.html"]');
    if (!$insightsA.length) return;
    const href = ($insightsA.attr('href') || '').trim();
    if (!/^insights\.html([#?].*)?$/.test(href)) return;
    const classes = $insightsA.attr('class') || '';
    const text = ($insightsA.text() || '').replace(/\s+/g, ' ').trim() || 'Insights';
    $li.empty();
    $li.append($('<a></a>').attr('class', classes).attr('href', 'insights.html').text(text));
  });
}

/**
 * After flatten: restore a compact Insights flyout (All insights + Engineering + Content hub).
 */
function upgradeInsightsNavWithEngineeringDropdown($) {
  const $a = $('ul[data-testid="header-center"] > li > a[href="insights.html"]').first();
  if (!$a.length) return;
  const $li = $a.parent();
  if ($li.children('div.group.relative').length) return;

  const classes = $a.attr('class') || '';
  const text = ($a.text() || '').replace(/\s+/g, ' ').trim() || 'Insights';
  const ddClass =
    'relative dark:text-background outline-none px-5 py-4 block hov:bg-nf-light-grey dark:hov:bg-nf-muted-grey transition-colors duration-200 ease-in-out';

  const $group = $('<div class="group relative"></div>');
  const $main = $('<a></a>').attr('class', classes).attr('href', 'insights.html').text(text);
  const $panel = $(`
<div class="absolute top-full w-max p-10 -m-10 -translate-x-6 transition-all transition-discrete invisible group-hov:visible opacity-0 group-hov:opacity-100 translate-y-6 group-hov:translate-y-4">
  <div class="py-2 border shadow-sm rounded-lg bg-white text-nf-deep-navy border-nf-light-grey dark:bg-nf-deep-navy dark:text-white dark:border-white">
  </div>
</div>`);
  const $inner = $panel.find('div').first();
  $inner.append(
    $('<a></a>')
      .attr('class', ddClass)
      .attr('href', 'insights.html')
      .text('All insights'),
  );
  $inner.append(
    $('<a></a>')
      .attr('class', ddClass)
      .attr('href', 'engineering.html')
      .text('Engineering'),
  );
  $inner.append(
    $('<a></a>')
      .attr('class', ddClass)
      .attr('href', 'content-hub.html')
      .text('Content hub'),
  );
  $group.append($main, $panel);
  $li.empty().append($group);
}

/**
 * Hero “Engineering community” jump (#digital-community): add a trailing chevron so it reads as in-page anchor.
 */
function enhanceInsightsCommunityJumpLink($) {
  if (!$('body').hasClass('nf-insights-index')) return;
  $('a[href="#digital-community"]').each((_, el) => {
    const $a = $(el);
    if ($a.find('.nf-insights-jump-to-community__chev').length) return;
    const t = ($a.text() || '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    $a.addClass('nf-insights-jump-to-community');
    $a.attr(
      'aria-label',
      `${t} — jump to this section on the page`,
    );
    $a.empty();
    $a.append($('<span class="nf-insights-jump-to-community__label"></span>').text(t));
    $a.append(
      $('<span class="nf-insights-jump-to-community__chev" aria-hidden="true"></span>').text('↓'),
    );
  });
}

/**
 * “You may also like”: mark section + cards for CSS (divider + index-matching bento cards).
 * Pre-footer navy CTA: full-bleed + centered column (mirror-content-rhythm.css).
 */
function enhanceInsightArticleRelatedAndPrefooter($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  const $main = $('main');
  if (!$main.length) return;

  const $h2 = $main.find('h2#you-may-also-like').first();
  if ($h2.length) {
    const $section = $h2.closest('section');
    if ($section.length) {
      $section.addClass('nf-insight-related-section');
      const $hr = $section.find('hr').first();
      if ($hr.length) $hr.addClass('nf-insight-related-divider');
    }
    const $grid = $h2.closest('.grid');
    if ($grid.length) {
      $grid.children('div.mb-8').addClass('nf-insight-related-card');
    }
    wrapInsightRelatedCardHeads($);
  }

  $main.find('section').each((_, el) => {
    const $sec = $(el);
    const blob = ($sec.text() || '').replace(/\s+/g, ' ');
    if (blob.includes('accelerate and sustain progress') && $sec.hasClass('bg-nf-deep-navy')) {
      $sec.addClass('nf-insight-prefooter-cta');
    }
  });

  /* Same full-width band as <footer> (sibling of <main>, not inside flex main). */
  const $pre = $main.children('section.nf-insight-prefooter-cta').first();
  if ($pre.length) {
    $main.after($pre);
  }
}

function replaceInsightArticleAuthorAvatar($) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  $('[data-nf-insight-hero-byline] img[alt="avatar"]').each((_, el) => {
    const $img = $(el);
    $img.attr('src', INSIGHT_AUTHOR_PLACEHOLDER);
    $img.attr('alt', 'Author');
    $img.removeAttr('srcset');
    $img.removeAttr('width');
    $img.removeAttr('height');
    const style = ($img.attr('style') || '').replace(/width:\s*[^;]+;?/gi, '').replace(/height:\s*[^;]+;?/gi, '');
    if (style.trim()) $img.attr('style', style);
    else $img.removeAttr('style');
  });
}

/** Layout hint for readability CSS (mirror-content-rhythm.css). Tune rules here. */
function inferNfLayout(relPath) {
  const norm = relPath.split(path.sep).join('/');
  const base = path.posix.basename(norm, '.html');
  if (norm === 'index.html') return 'audit-index';
  if (base === 'mirrored-home') return 'marketing';
  if (base === 'work' || /^work_\d+$/.test(base)) return 'case-study';
  if (base === 'services') return 'services-hub';
  if (SERVICE_PRACTICE_PAGES.has(base)) return 'service';
  /* Long hyphenated slugs → centered single-column flow */
  if (base.includes('-') && base.length >= 40 && base.split('-').length >= 5) return 'reading';
  return 'default';
}

function hintDigitalCommunityEngineeringRedirect($, relPath) {
  const norm = relPath.split(path.sep).join('/');
  if (path.posix.basename(norm) !== 'digital-community.html') return;
  const $head = $('head');
  if ($head.find('meta[data-nf-eng-redirect]').length) return;
  $head.prepend(
    '<meta data-nf-eng-redirect="1" http-equiv="refresh" content="0; url=engineering.html">',
  );
}

function stripAndAnnotate(html, relPath = '') {
  const $ = load(html, { decodeEntities: false });
  hintDigitalCommunityEngineeringRedirect($, relPath);
  $('script').each((_, el) => {
    if (isTrackingScript($, el)) $(el).remove();
  });
  $('link[rel="preconnect"][href*="googletagmanager.com"]').remove();
  $('link[rel="dns-prefetch"][href*="googletagmanager.com"]').remove();
  $('noscript').each((_, el) => {
    const inner = $(el).html() || '';
    if (/googletagmanager\.com|google-analytics\.com|doubleclick\.net/i.test(inner)) $(el).remove();
  });
  $('link[rel="preload"]').each((_, el) => {
    const $l = $(el);
    const href = ($l.attr('href') || '').trim();
    const imagesrcset = $l.attr('imagesrcset') || '';
    if (/googletagmanager|gtm\.js/i.test(href)) $l.remove();
    else if (href.startsWith('/_next/') || /\/_next\//.test(href)) $l.remove();
    else if (/\/_next\//.test(imagesrcset)) $l.remove();
  });
  $('header a[aria-label="Home"][href=""]').attr('href', 'mirrored-home.html');
  $('header a[href="work_4.html"]').each((_, el) => {
    const $a = $(el);
    const t = ($a.text() || '').replace(/\s+/g, ' ').trim();
    if (t === 'Work') $a.attr('href', 'work.html');
  });
  if ($('#ux-audit-sticky-header').length === 0) {
    const $head = $('head');
    if ($head.length) $head.append(STICKY_HEADER_STYLE);
  }
  const $body = $('body');
  if ($body.length && relPath) {
    const norm = relPath.split(path.sep).join('/');
    const base = path.posix.basename(norm, '.html');
    let layout = inferNfLayout(relPath);
    /*
     * Blog / insight posts: canonical /insights/slug or /digital-community/slug.
     * Long hyphenated filenames are inferred as "reading" before this step — still promote
     * them to insight-article so editorial CSS (no hover cards, single column) applies.
     */
    if ((layout === 'default' || layout === 'reading') && isInsightArticleCanonical($)) {
      layout = 'insight-article';
    }
    $body.attr('data-nf-layout', layout);
    if (SERVICE_PRACTICE_PAGES.has(base)) {
      $body.attr('data-nf-service-orbit', base);
    } else {
      $body.removeAttr('data-nf-service-orbit');
    }
  }
  if (($body.attr('data-nf-layout') || '') === 'insight-article') {
    hoistInsightArticleHeroByline($);
    enhanceInsightArticleStripeHeader($);
    replaceInsightArticleAuthorAvatar($);
    relocateInsightArticleMetaRow($);
    stackInsightArticleDateUnderAuthor($);
    normalizeInsightArticleDateLabels($);
    enhanceInsightArticleRelatedAndPrefooter($);
    enhanceInsightArticleFormatPill($, relPath.split(path.sep).join('/'), root);
  }
  if ($body.hasClass('nf-insights-index')) {
    wrapInsightsIndexArticleCards($);
    enhanceInsightsCommunityJumpLink($);
    const listingCtx = {
      fileAbs: path.join(root, relPath.split(path.sep).join('/')),
      relPosix: relPath.split(path.sep).join('/'),
      siteMirrorRoot: root,
    };
    enrichInsightsListingCheerio($, listingCtx);
    enrichEngineeringListingCheerio($, listingCtx);
  }
  flattenInsightsNav($);
  upgradeInsightsNavWithEngineeringDropdown($);
  ensureFlairAssets($, relPath);
  if ($('#ux-audit-bar').length === 0) {
    $('body').append(BAR_HTML);
  }
  return $.root().html();
}

function walkHtmlFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walkHtmlFiles(p));
    else if (name.isFile() && name.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// Preserve scraped homepage before we replace index.html with the audit listing
const homePath = path.join(root, HOME_COPY);
const indexPath = path.join(root, 'index.html');
if (fs.existsSync(indexPath) && !fs.existsSync(homePath)) {
  fs.renameSync(indexPath, homePath);
}

const htmlPaths = walkHtmlFiles(root);
for (const file of htmlPaths) {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).split(path.sep).join('/');
  fs.writeFileSync(file, stripAndAnnotate(raw, rel), 'utf8');
}

// Build audit index grouped by directory (relative to site-mirror)
const relFiles = htmlPaths
  .map((p) => path.relative(root, p).split(path.sep).join('/'))
  .filter((f) => f !== 'index.html')
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const byDir = new Map();
for (const f of relFiles) {
  const d = path.posix.dirname(f);
  const key = d === '.' ? '(site root)' : d;
  if (!byDir.has(key)) byDir.set(key, []);
  byDir.get(key).push(f);
}

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

let body = `${AUDIT_MARKER}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nearform mirror — page index (UX audit)</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px 24px 96px; background: #f4f4f7; color: #1a1a1f; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    p { margin: 0 0 24px; color: #444; max-width: 60ch; }
    section { margin-bottom: 32px; }
    h2 { font-size: 1.05rem; margin: 0 0 12px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
    ul { list-style: none; padding: 0; margin: 0; columns: 1; column-gap: 24px; }
    @media (min-width: 640px) { ul { columns: 2; } }
    @media (min-width: 1100px) { ul { columns: 3; } }
    li { break-inside: avoid; margin: 0 0 6px; }
    a { color: #1a56b0; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .count { color: #666; font-weight: normal; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Scraped pages <span class="count">(${relFiles.length} files)</span></h1>
  <p>Mirror of <a href="https://nearform.com">nearform.com</a> for offline UX review. Homepage copy: <a href="${esc(HOME_COPY)}">${esc(HOME_COPY)}</a>. Tracking scripts were removed; notes field persists per path in <code>localStorage</code>.</p>
`;

const dirKeys = [...byDir.keys()].sort((a, b) => a.localeCompare(b));
for (const dir of dirKeys) {
  const files = byDir.get(dir);
  body += `  <section>\n    <h2>${esc(dir)} <span class="count">(${files.length})</span></h2>\n    <ul>\n`;
  for (const f of files) {
    body += `      <li><a href="${esc(f)}">${esc(f)}</a></li>\n`;
  }
  body += `    </ul>\n  </section>\n`;
}

body += `</body>\n</html>\n`;

fs.writeFileSync(indexPath, stripAndAnnotate(body, 'index.html'), 'utf8');

const orbitalPatch = path.join(__dirname, 'scripts', 'patch-about-orbital.mjs');
if (fs.existsSync(orbitalPatch)) {
  spawnSync(process.execPath, [orbitalPatch], { stdio: 'inherit', cwd: __dirname });
}

const homeUxInject = path.join(__dirname, 'scripts', 'inject-home-ux.mjs');
if (fs.existsSync(homeUxInject)) {
  spawnSync(process.execPath, [homeUxInject], { stdio: 'inherit', cwd: __dirname });
}

const buildMotion = path.join(__dirname, 'scripts', 'build-mirror-motion.mjs');
if (fs.existsSync(buildMotion)) {
  const r = spawnSync(process.execPath, [buildMotion], { stdio: 'inherit', cwd: __dirname });
  if (r.status !== 0) console.warn('build-mirror-motion exited', r.status);
}

console.log('Post-process done:', root);
console.log('Open listing:', indexPath);
