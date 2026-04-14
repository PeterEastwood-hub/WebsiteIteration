/**
 * Static mirror helpers for the Insights / Engineering listing redesign (postprocess-mirror.mjs).
 * Manifest: site-mirror/data/insights-article-manifest.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

/** Tags removed from Insights filter surface (categories still inferred from raw tags before strip). */
export const INSIGHTS_TAGS_HIDDEN = new Set([
  'sanity',
  'urql',
  'd3',
  'redux',
  'victory',
  'content',
  'capability',
]);

/** Raw tag slug → consolidated topic keys (Insights AND filter). */
export const TAG_TO_TOPIC_KEYS = {
  ai: ['ai-machine-learning'],
  data: ['data'],
  engineering: ['engineering-architecture'],
  backend: ['engineering-architecture'],
  platform: ['engineering-architecture'],
  cloud: ['engineering-architecture'],
  devops: ['engineering-architecture'],
  'node-js': ['engineering-architecture'],
  react: ['engineering-architecture'],
  'react-native': ['engineering-architecture'],
  'next-js': ['engineering-architecture'],
  graphql: ['engineering-architecture'],
  strategy: ['strategy-transformation'],
  modernisation: ['strategy-transformation'],
  capability: ['strategy-transformation'],
  design: ['design-product'],
  product: ['design-product'],
  mobile: ['design-product'],
  'open-source': ['open-source-tools'],
  'developer-tools': ['open-source-tools'],
  banking: [],
  healthcare: [],
  retail: [],
  telco: [],
};

export const TAG_TO_INDUSTRY = {
  banking: 'banking-financial-services',
  healthcare: 'healthcare',
  retail: 'retail-ecommerce',
  telco: 'telecommunications',
};

export function inferInsightFormat(slug, titleText) {
  const s = `${slug} ${titleText}`.toLowerCase();
  if (/\b(sxsw|conference|summit|recap|event)\b/.test(s)) return 'event-recap';
  if (/\b(announce|launches|collaborat|partnership|nearform and|wins|award)\b/.test(s)) return 'news';
  if (/\b(report|study|mapping|survey|data-driven)\b/.test(s)) return 'report';
  if (/\b(deep dive|long-form|beyond the hype|engineering for the)\b/.test(s)) return 'deep-dive';
  if (/\b(how to|how-to|tips|tricks|pitfalls|implementing|tutorial|guide|walkthrough)\b/.test(s))
    return 'tutorial';
  if (/\b(conversation|interview|ceo|q\s*&\s*a|asks)\b/.test(s)) return 'interview';
  if (/\b(case study|case-study|customer story)\b/.test(s)) return 'case-study';
  if (/\b(open source release|release v\d|changelog)\b/.test(s)) return 'open-source-release';
  return 'opinion';
}

function stripHtmlForWordCount(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

export function wordCountFromArticleHtml(html) {
  const t = stripHtmlForWordCount(html).trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function metaDescriptionFromArticle($article) {
  const m = $article('meta[name="description"]').attr('content');
  return (m || '').trim().slice(0, 160);
}

function titleFromArticle($article) {
  const t = $article('title').first().text();
  return (t || '').replace(/\s*\|\s*Nearform.*$/i, '').trim();
}

export function loadArticleManifest(siteMirrorRoot) {
  if (!siteMirrorRoot) return { featuredOrder: [], overrides: {} };
  try {
    const p = path.join(siteMirrorRoot, 'data', 'insights-article-manifest.json');
    if (!fs.existsSync(p)) return { featuredOrder: [], overrides: {} };
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return {
      featuredOrder: Array.isArray(j.featuredOrder) ? j.featuredOrder : [],
      overrides: j.overrides && typeof j.overrides === 'object' ? j.overrides : {},
    };
  } catch {
    return { featuredOrder: [], overrides: {} };
  }
}

/**
 * First slug in featuredOrder present on page, else first on-page slug with overrides[slug].featured.
 */
export function pickFeaturedSlug(manifest, slugsInDomOrder) {
  const set = new Set(slugsInDomOrder);
  for (const s of manifest.featuredOrder) {
    if (set.has(s)) return s;
  }
  for (const s of slugsInDomOrder) {
    const o = manifest.overrides[s];
    if (o && o.featured) return s;
  }
  return '';
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {{ fileAbs: string; relPosix: string; siteMirrorRoot: string }} ctx
 */
export function enrichInsightsListingCheerio($, ctx) {
  const base = path.posix.basename(ctx.relPosix);
  if (!/^insights(?:_\d+)?\.html$/.test(base)) return;
  if (!$('body').hasClass('nf-insights-index')) return;

  const dir = path.dirname(ctx.fileAbs);
  const manifest = loadArticleManifest(ctx.siteMirrorRoot);

  const rows = [];
  $('.nf-insights-feed--primary .nf-insights-feed-list--stack .nf-insights-article-card').each(
    (_, el) => {
      const $card = $(el);
      const $link = $card.find('a[href$=".html"]').filter((__, a) => $(a).find('h3').length).first();
      const href = ($link.attr('href') || '').trim();
      if (!href || href.includes('://')) return;
      const slug = path.basename(href, '.html');
      rows.push({ $card, slug });
    },
  );

  const slugsOrdered = rows.map((r) => r.slug);
  const featuredSlug = pickFeaturedSlug(manifest, slugsOrdered);

  rows.forEach(function (row, idx) {
    const $card = row.$card;
    const slug = row.slug;
    const absArticle = path.join(dir, `${slug}.html`);
    let wc = 0;
    let excerpt = '';
    let titleText = slug.replace(/-/g, ' ');
    if (fs.existsSync(absArticle)) {
      const raw = fs.readFileSync(absArticle, 'utf8');
      wc = wordCountFromArticleHtml(raw);
      const $a = load(raw, { decodeEntities: false });
      excerpt = metaDescriptionFromArticle($a);
      titleText = titleFromArticle($a) || titleText;
    }
    const ovr = manifest.overrides[slug] || {};
    if (ovr.excerpt) excerpt = String(ovr.excerpt).slice(0, 160);
    const minutes = Math.max(1, Math.ceil(wc / 200));
    const fmt = ovr.format || inferInsightFormat(slug, titleText);

    const rawTags = ($card.attr('data-nf-insight-tags') || '').trim().split(/\s+/).filter(Boolean);
    const visibleTags = rawTags.filter((t) => !INSIGHTS_TAGS_HIDDEN.has(t));
    const topicSet = new Set();
    let industry = '';
    for (const tag of rawTags) {
      const ind = TAG_TO_INDUSTRY[tag];
      if (ind) industry = ind;
      const topics = TAG_TO_TOPIC_KEYS[tag];
      if (topics) topics.forEach((k) => topicSet.add(k));
    }

    $card.attr('data-nf-insight-tags', visibleTags.join(' '));
    $card.attr('data-nf-insight-format', fmt);
    $card.attr('data-nf-insight-categories', Array.from(topicSet).join(' '));
    if (industry) $card.attr('data-nf-insight-industry', industry);
    $card.attr('data-nf-insight-reading-minutes', String(minutes));
    if (excerpt) $card.attr('data-nf-insight-excerpt', excerpt);

    const isFeatured = featuredSlug ? slug === featuredSlug : idx === 0;
    if (isFeatured) $card.attr('data-nf-insight-featured', '1');
    else $card.removeAttr('data-nf-insight-featured');
  });

  $('body').addClass('nf-insights-redesign');
}

/**
 * Engineering community listing: granular tags as filter dimensions, same format/excerpt/manifest.
 * @param {import('cheerio').CheerioAPI} $
 * @param {{ fileAbs: string; relPosix: string; siteMirrorRoot: string }} ctx
 */
export function enrichEngineeringListingCheerio($, ctx) {
  const base = path.posix.basename(ctx.relPosix);
  if (base !== 'insights-engineering-community.html') return;
  if (!$('body').hasClass('nf-insights-index')) return;

  const dir = path.dirname(ctx.fileAbs);
  const manifest = loadArticleManifest(ctx.siteMirrorRoot);

  const rows = [];
  $('.nf-insights-feed--primary .nf-insights-feed-list--stack .nf-insights-article-card').each(
    (_, el) => {
      const $card = $(el);
      const $link = $card.find('a[href$=".html"]').filter((__, a) => $(a).find('h3').length).first();
      const href = ($link.attr('href') || '').trim();
      if (!href || href.includes('://')) return;
      const slug = path.basename(href, '.html');
      rows.push({ $card, slug });
    },
  );

  const slugsOrdered = rows.map((r) => r.slug);
  const featuredSlug = pickFeaturedSlug(manifest, slugsOrdered);

  rows.forEach(function (row, idx) {
    const $card = row.$card;
    const slug = row.slug;
    const absArticle = path.join(dir, `${slug}.html`);
    let wc = 0;
    let excerpt = '';
    let titleText = slug.replace(/-/g, ' ');
    if (fs.existsSync(absArticle)) {
      const raw = fs.readFileSync(absArticle, 'utf8');
      wc = wordCountFromArticleHtml(raw);
      const $a = load(raw, { decodeEntities: false });
      excerpt = metaDescriptionFromArticle($a);
      titleText = titleFromArticle($a) || titleText;
    }
    const ovr = manifest.overrides[slug] || {};
    if (ovr.excerpt) excerpt = String(ovr.excerpt).slice(0, 160);
    const minutes = Math.max(1, Math.ceil(wc / 200));
    const fmt = ovr.format || inferInsightFormat(slug, titleText);

    const rawTags = ($card.attr('data-nf-insight-tags') || '').trim().split(/\s+/).filter(Boolean);
    const visibleTags = rawTags.filter((t) => !INSIGHTS_TAGS_HIDDEN.has(t));
    const topicSet = new Set();
    let industry = '';
    for (const tag of rawTags) {
      const ind = TAG_TO_INDUSTRY[tag];
      if (ind) industry = ind;
      const topics = TAG_TO_TOPIC_KEYS[tag];
      if (topics) topics.forEach((k) => topicSet.add(k));
    }

    $card.attr('data-nf-insight-tags', visibleTags.join(' '));
    $card.attr('data-nf-insight-categories', Array.from(topicSet).join(' '));
    $card.attr('data-nf-insight-format', fmt);
    if (industry) $card.attr('data-nf-insight-industry', industry);
    $card.attr('data-nf-insight-reading-minutes', String(minutes));
    if (excerpt) $card.attr('data-nf-insight-excerpt', excerpt);

    const isFeatured = featuredSlug ? slug === featuredSlug : idx === 0;
    if (isFeatured) $card.attr('data-nf-insight-featured', '1');
    else $card.removeAttr('data-nf-insight-featured');
  });

  $('body').addClass('nf-insights-redesign nf-insights-redesign--engineering');
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} relPosix
 * @param {string} [siteMirrorRoot]
 */
export function enhanceInsightArticleFormatPill($, relPosix, siteMirrorRoot) {
  if (($('body').attr('data-nf-layout') || '') !== 'insight-article') return;
  const $k = $('[data-nf-insight-kicker]').first();
  if (!$k.length || $k.find('[data-nf-insight-format-pill]').length) return;
  const slug = path.basename(relPosix, '.html');
  const titleText = titleFromArticle($) || slug;
  const manifest = loadArticleManifest(siteMirrorRoot || '');
  const ovr = manifest.overrides[slug] || {};
  const fmt = ovr.format || inferInsightFormat(slug, titleText);
  const label = FORMAT_LABELS[fmt] || fmt;
  const $pill = $(
    `<span class="nf-insight-format-pill" data-nf-insight-format-pill="" data-nf-insight-format="${fmt}">${label}</span>`,
  );
  $k.append($pill);
}

export const FORMAT_LABELS = {
  opinion: 'Opinion',
  interview: 'Interview',
  tutorial: 'Tutorial',
  'deep-dive': 'Deep Dive',
  report: 'Report',
  news: 'News',
  'event-recap': 'Event Recap',
  'case-study': 'Case study',
  'open-source-release': 'Open Source Release',
};
