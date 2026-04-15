#!/usr/bin/env node
/**
 * Move "Engineering community" articles (cards whose tag links to digital-community.html)
 * from insights.html into insights-engineering-community.html. Replace the large
 * #digital-community hero with a compact CTA. Add the 5th explore switcher link.
 *
 * Engineering page: same hero typography + tab row + primary feeds as the Insights index.
 *
 * Run: node scripts/split-insights-engineering-community.mjs
 * Then: npm run build-insights-explore
 */

import fs from "fs";
import path from "path";
import { load } from "cheerio";
import { fileURLToPath } from "url";
import { readOgImageUrl } from "./mirror-og-image.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIRROR = path.join(ROOT, "site-mirror");
const INSIGHTS = path.join(MIRROR, "insights.html");
const OUT_ENG = path.join(MIRROR, "insights-engineering-community.html");

const COMMUNITY_TAG = 'href="digital-community.html"';
/** Landing page for the digital / engineering community (overview). */
const COMMUNITY_LANDING_HREF = "digital-community.html";

const HERO_START =
  '<section class="w-full flex px-5 md:px-7 lg:px-8 mt-12 pt-24 pb-6 items-start">';
const TAB_SECTION_START =
  '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-0">';

const CTA_SECTION = `<section class="w-full flex px-5 md:px-7 lg:px-8 mt-12 pt-20 pb-8 items-start nf-insights-community-cta"><div class="w-full max-w-[1600px] mx-auto"><p class="font-sans text-lg text-nf-deep-navy dark:text-white max-w-2xl"><a href="insights-engineering-community.html" class="underline font-semibold decoration-nf-green underline-offset-4 hover:text-nf-green">Engineering Community</a><span class="text-nf-deep-navy dark:text-white"> — articles for builders and practitioners are on a dedicated page.</span></p></div></section>`;

/** Same display treatment as Insights index + digital-community title (animated letters + green blink underscore). */
const ENGINEERING_H1 = `<h1 class="font-sans whitespace-pre-line text-6xl/17 lg:text-[84px] lg:leading-[94px] lg:tracking-tight xl:text-8xl/27 xl:tracking-tight 2xl:text-[140px]/37 2xl:tracking-[-4.2px]" id="engineering-community"><span class="relative block"><span class="sr-only select-none">Engineering
community</span><span class="absolute w-full z-10" aria-hidden="true"><span>E</span><span>n</span><span>g</span><span>i</span><span>n</span><span>e</span><span>e</span><span>r</span><span>i</span><span>n</span><span>g</span><span>
</span><span>c</span><span>o</span><span>m</span><span>m</span><span>u</span><span>n</span><span>i</span><span>t</span><span>y</span><span class="animate-blink animate-blink text-nf-green" aria-hidden="true">_</span></span><span class="opacity-0 select-none" aria-hidden="true"><span>E</span><span>n</span><span>g</span><span>i</span><span>n</span><span>e</span><span>e</span><span>r</span><span>i</span><span>n</span><span>g</span><span>
</span><span>c</span><span>o</span><span>m</span><span>m</span><span>u</span><span>n</span><span>i</span><span>t</span><span>y</span><span>_</span></span></span></h1>`;

function isCommunityCard(html) {
  return html.includes(COMMUNITY_TAG);
}

function ogImageUrl(mirrorDir, articleHref) {
  return readOgImageUrl(mirrorDir, articleHref);
}

/** Replace Next placeholder src (image_*) with the article’s og:image so static mirrors show thumbnails. */
function hydrateCardImages(cardHtml, mirrorDir) {
  const $ = load(`<div id="nf-cwrap">${cardHtml}</div>`);
  const wrap = $("#nf-cwrap");
  const mainA = wrap.find("a.group.overflow-hidden").first();
  const href = mainA.attr("href");
  if (!href || !href.endsWith(".html")) return cardHtml;
  const url = ogImageUrl(mirrorDir, href);
  if (!url) return cardHtml;
  const img = mainA.find("img").first();
  if (!img.length) return cardHtml;
  img.attr("src", url);
  img.attr("srcset", `${url} 1x, ${url} 2x`);
  return wrap.html() ?? cardHtml;
}

function extractInsightsHero(insightsHtml) {
  const start = insightsHtml.indexOf(HERO_START);
  if (start === -1) throw new Error("insights.html: hero section start not found");
  const from = insightsHtml.slice(start);
  const next = from.indexOf(TAB_SECTION_START);
  if (next === -1) throw new Error("insights.html: tab section (after hero) not found");
  return from.slice(0, next);
}

function extractTopicTabSection(insightsHtml) {
  const start = insightsHtml.indexOf(TAB_SECTION_START);
  if (start === -1) throw new Error("insights.html: topic tab section not found");
  const from = insightsHtml.slice(start);
  const end = from.indexOf("</section>");
  if (end === -1) throw new Error("insights.html: tab section end not found");
  // Closing tag is exactly `</section>` (10 chars); do not slice into the next `<section`.
  return from.slice(0, end + 10);
}

function heroForEngineeringPage(heroHtml) {
  let out = heroHtml.replace(
    /<h1 class="font-sans whitespace-pre-line[\s\S]*?<\/h1>/,
    ENGINEERING_H1
  );
  out = out.replace(
    /<a target="_self" href="#digital-community"[^>]*class="nf-insights-jump-to-community"[^>]*aria-label="[^"]*"[^>]*>[\s\S]*?<\/a>/,
    '<a target="_self" href="insights.html" class="nf-insights-jump-to-community" aria-label="View all Insights articles"><span class="nf-insights-jump-to-community__label">All Insights</span><span class="nf-insights-jump-to-community__chev" aria-hidden="true">→</span></a>'
  );
  return out;
}

function loadCommunityCardsFromEngineeringFile() {
  if (!fs.existsSync(OUT_ENG)) return [];
  const $p = load(fs.readFileSync(OUT_ENG, "utf8"));
  const collected = [];
  const seen = new Set();
  $p(".nf-insights-article-card").each((_, el) => {
    const block = $p(el);
    const outer = $p.html(block);
    const mainHref = block.find('a.group.overflow-hidden[href$=".html"]').first().attr("href");
    if (!mainHref || seen.has(mainHref)) return;
    seen.add(mainHref);
    collected.push(outer);
  });
  return collected;
}

function listingHasCommunityLanding(cards) {
  return cards.some(
    (html) =>
      html.includes(`href="${COMMUNITY_LANDING_HREF}"`) &&
      html.includes("group overflow-hidden") &&
      (html.includes("nf-insights-article-card--community-landing") ||
        html.includes(`href="${COMMUNITY_LANDING_HREF}"><img`))
  );
}

/** Card for digital-community.html — overview of the community programme. */
function buildDigitalCommunityLandingCard(mirrorDir) {
  const p = path.join(mirrorDir, COMMUNITY_LANDING_HREF);
  if (!fs.existsSync(p)) return null;

  const fileHtml = fs.readFileSync(p, "utf8");
  const titleMatch = fileHtml.match(/property="og:title"[^>]*content="([^"]+)"/);
  let headline = "Digital Community";
  if (titleMatch) {
    headline = titleMatch[1].replace(/\s*\|\s*Nearform\s*$/i, "").trim();
  }

  let imgUrl = ogImageUrl(mirrorDir, COMMUNITY_LANDING_HREF);
  if (!imgUrl || !/^https?:\/\//i.test(imgUrl)) {
    const tw = fileHtml.match(/name="twitter:image"[^>]*content="([^"]+)"/);
    imgUrl = tw
      ? tw[1]
      : "https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_1200,h_630/v1740090887/preview_thumbnail_4_mmgyhv.png";
  }

  const $ = load("<div></div>");
  const card = $(
    '<div class="mb-8 nf-insights-article-card nf-insights-article-card--community-landing" data-nf-insight-card="" data-nf-insight-topics="strategy" data-nf-insight-tags=""></div>'
  );

  const thumb = $(
    '<a class="group overflow-hidden block mb-4 w-full" target="_self"></a>'
  ).attr("href", COMMUNITY_LANDING_HREF);
  thumb.append(
    $("<img/>")
      .attr("alt", headline)
      .attr("loading", "lazy")
      .attr("width", 1920)
      .attr("height", 1080)
      .attr("decoding", "async")
      .attr("data-nimg", "1")
      .attr(
        "class",
        "transition-transform duration-300 transform group-hover:scale-105 object-cover aspect-16/9"
      )
      .attr("style", "color:transparent")
      .attr("src", imgUrl)
      .attr("srcset", `${imgUrl} 1x, ${imgUrl} 2x`)
  );

  const body = $('<div class="nf-insight-related-card-body"></div>');
  const head = $('<div class="nf-insight-related-card-head"></div>');
  head.append(
    $(
      '<div class="flex flex-wrap gap-1 pt-2 lg:gap-3 nf-insight-related-card-meta"></div>'
    ).append(
      $(
        '<div class="group relative overflow-hidden inline-flex justify-center items-center font-sans rounded-full py-2.5 cursor-pointer link-button-transition dark:text-white disabled:pointer-events-none disabled:opacity-40 disabled:text-nf-deep-grey disabled:bg-nf-grey text-nf-deep-navy border border-nf-green hover:bg-nf-green hover:text-nf-deep-navy dark:border-nf-green dark:hover:bg-nf-green dark:hover:text-nf-deep-navy text-xs/4 px-[8.4px] pt-1.5 pb-[5px] uppercase tracking-[0.1em] inline-flex items-center"></div>'
      ).append(
        $('<span class="relative inline-block transition-transform duration-300 ease-in-out"></span>').append(
          $("<span></span>").text("Overview")
        )
      )
    )
  );
  const titleA = $(
    '<a class="group block max-w-[95%]" target="_self"></a>'
  ).attr("href", COMMUNITY_LANDING_HREF);
  titleA.append(
    $(
      '<h3 class="font-sans dark:text-white text-[28px] 2xl:text-4xl leading-[1.2em] tracking-nf-tight group-hover:underline group-hover:underline-offset-4 group-hover:decoration-[1.5px] my-4"></h3>'
    ).text(headline)
  );
  head.append(titleA);
  body.append(head);

  const foot = $('<div class="flex gap-3 nf-insight-related-card-meta"></div>');
  foot.append(
    $(
      '<span class="uppercase leading-[1.3em] text-[15px] font-sans tracking-[0.08em] text-[#514b45] dark:text-white"></span>'
    ).text("Nearform")
  );
  foot.append(
    $(
      '<span class="uppercase leading-[1.3em] text-[15px] font-sans tracking-[0.08em] text-[#514b45] dark:text-white"></span>'
    ).text("Digital community")
  );
  body.append(foot);

  card.append(thumb);
  card.append(body);

  return $.html(card);
}

function main() {
  const raw = fs.readFileSync(INSIGHTS, "utf8");
  const heroBase = extractInsightsHero(raw);
  const tabSection = extractTopicTabSection(raw);
  const engineeringHero = heroForEngineeringPage(heroBase);

  const $ = load(raw);

  let collected = [];
  const seenHref = new Set();

  $(".nf-insights-article-card").each((_, el) => {
    const block = $(el);
    const outer = $.html(block);
    if (!isCommunityCard(outer)) return;
    const mainHref = block.find('a.group.overflow-hidden[href$=".html"]').first().attr("href");
    if (!mainHref || seenHref.has(mainHref)) return;
    seenHref.add(mainHref);
    collected.push(outer);
  });

  if (collected.length === 0) {
    collected = loadCommunityCardsFromEngineeringFile();
  }

  collected = collected.map((c) => hydrateCardImages(c, MIRROR));

  if (!listingHasCommunityLanding(collected)) {
    const landing = buildDigitalCommunityLandingCard(MIRROR);
    if (landing) collected.unshift(landing);
  }

  $(".nf-insights-article-card").each((_, el) => {
    const block = $(el);
    if (isCommunityCard($.html(block))) block.remove();
  });

  const dc = $("#digital-community");
  if (dc.length) {
    const section = dc.closest("section");
    if (section.length) section.replaceWith(CTA_SECTION);
  }

  const navClose = "</nav></div></header>";
  let htmlOut = $.html();
  if (!htmlOut.includes("insights-explore-community-nav.html")) {
    const timeline = '<a href="insights-explore-list.html">Timeline</a>';
    const community = '<a href="insights-explore-community-nav.html">Community nav</a>';
    const iter6 = '<a href="insights-explore-iter6.html">Iteration 6</a>';
    const iter7 = '<a href="insights-explore-iter7.html">Iteration 7</a>';
    const fullTail = timeline + community + iter6 + iter7 + navClose;
    const needleBare = timeline + navClose;
    const needleWithIter6 = timeline + iter6 + navClose;
    const needleWithIter6Only = timeline + community + iter6 + navClose;
    if (htmlOut.includes(needleBare)) {
      htmlOut = htmlOut.replace(needleBare, fullTail);
    } else if (htmlOut.includes(needleWithIter6Only)) {
      htmlOut = htmlOut.replace(needleWithIter6Only, fullTail);
    } else if (htmlOut.includes(needleWithIter6)) {
      htmlOut = htmlOut.replace(needleWithIter6, fullTail);
    } else if (!htmlOut.includes('insights-explore-iter7.html')) {
      throw new Error("Could not find explore nav to insert Community nav link");
    }
  }
  fs.writeFileSync(INSIGHTS, htmlOut, "utf8");

  const $base = load(fs.readFileSync(INSIGHTS, "utf8"));
  $base("title").text("Engineering Community | Nearform");
  $base("meta[name=description]").attr(
    "content",
    "Engineering community — technical articles, tooling, and practice from Nearform."
  );
  const main = $base("main");
  if (!main.length) throw new Error("insights.html: missing <main>");

  const listClass = "nf-insights-feed-list nf-insights-feed-list--stack";
  const feedInner = collected.join("");

  const feedMobile = `<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 md:hidden nf-insights-feed nf-insights-feed--primary"><div class="w-full max-w-[1600px] mx-auto"><div class="${listClass}">${feedInner}</div></div></section>`;
  const feedDesktop = `<section class="w-full items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 hidden md:block nf-insights-feed nf-insights-feed--primary"><div class="w-full max-w-[1600px] mx-auto"><div class="${listClass}">${feedInner}</div></div></section>`;

  if (!feedInner.trim()) {
    throw new Error(
      "No engineering community article cards found (and none in existing insights-engineering-community.html)."
    );
  }

  main.empty().append(`${engineeringHero}${tabSection}${feedMobile}${feedDesktop}`);

  let bodyClass = $base("body").attr("class") || "";
  if (!bodyClass.includes("nf-insights-engineering-community")) {
    $base("body").attr("class", `${bodyClass} nf-insights-engineering-community`.trim());
  }

  fs.writeFileSync(OUT_ENG, $base.html(), "utf8");

  console.log("Updated", path.relative(ROOT, INSIGHTS));
  console.log("Wrote", path.relative(ROOT, OUT_ENG), `(${collected.length} unique community articles)`);
}

main();
