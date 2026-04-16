#!/usr/bin/env python3
"""
Build distinct Insights exploration pages from insights.html:
  - insights-explore-mosaic.html        — mosaic / dense discovery grid
  - insights-explore-leftnav.html       — sticky left rail replaces horizontal tabs
  - insights-explore-list.html          — simple list scan
  - insights-explore-community-nav.html — Insights brand hover → Engineering Community link
  - insights-explore-iter6.html              — sixth iteration (default listing + hooks for further CSS/JS)
  - insights-explore-iter7.html              — seventh iteration (redesign + stream labels + iter7-only JS)

Regenerate after editing insights.html (and after node scripts/split-insights-engineering-community.mjs
when splitting community articles).
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
MIRROR = ROOT / "site-mirror"
# Canonical listing source; the baked-in nf-explore-topbar here must list the same
# layout links as replacement_header() (including iterations 8 and 9).
SOURCE = MIRROR / "insights.html"

TAB_PREFIX = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-0">'
    '<div class="w-full max-w-[1600px] mx-auto"><div>'
)
TAB_SUFFIX = "</div></div></section>"

FEED_START = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 md:hidden '
    'nf-insights-feed nf-insights-feed--primary"'
)
CTA_MARKER = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 dark bg-nf-deep-navy text-center"'
)

CSS_LINK = '<link rel="stylesheet" href="css/insights-explore.css">'

# Iteration 8/9 listings: run iter8-9-listing before tabs/redesign so the featured hero and duplicate
# primary-row removal run before the first bento layout (stable slots match “All topics”).
_FLAIR_TABS_CTA_SCRIPTS = (
    '<script src="js/mirror-flair.js" defer=""></script>'
    '<script src="js/mirror-insights-tabs.js" defer=""></script>'
    '<script src="js/mirror-insights-card-cta.js" defer=""></script>'
)
_FLAIR_LISTING_CTA_TABS_SCRIPTS = (
    '<script src="js/mirror-flair.js" defer=""></script>'
    '<script src="js/mirror-insights-iter8-9-listing.js" defer="" id="mirror-insights-iter8-9-listing-js"></script>'
    '<script src="js/mirror-insights-card-cta.js" defer=""></script>'
    '<script src="js/mirror-insights-tabs.js" defer=""></script>'
)
_REDESIGN_PLUS_ITER89_LISTING = (
    '<script src="js/mirror-insights-redesign.js" defer="" id="mirror-insights-redesign-js"></script>'
    '<script src="js/mirror-insights-iter8-9-listing.js" defer="" id="mirror-insights-iter8-9-listing-js"></script>'
)
_REDESIGN_SCRIPT_ONLY = '<script src="js/mirror-insights-redesign.js" defer="" id="mirror-insights-redesign-js"></script>'


def patch_iter789_listing_script_order(html: str) -> str:
    """Promote iter8-9-listing.js ahead of card-cta/tabs; drop duplicate tag after redesign if present."""
    h = html.replace(_REDESIGN_PLUS_ITER89_LISTING, _REDESIGN_SCRIPT_ONLY, 1)
    if _FLAIR_TABS_CTA_SCRIPTS in h:
        h = h.replace(_FLAIR_TABS_CTA_SCRIPTS, _FLAIR_LISTING_CTA_TABS_SCRIPTS, 1)
    return h


def replace_body_explore_class(html: str, explore_page_class: str, *, keep_redesign: bool) -> str:
    """Append a single nf-explore-page-* class; strip any previous explore page class.

    Only iteration 7 keeps ``nf-insights-redesign`` + redesign script so the six older
    variants stay on topic tabs + legacy behaviour.
    """

    def repl(m: re.Match[str]) -> str:
        raw = (m.group(1) or "").strip()
        parts = [p for p in raw.split() if p]
        parts = [p for p in parts if not p.startswith("nf-explore-page-")]
        if not keep_redesign:
            parts = [p for p in parts if p != "nf-insights-redesign"]
        if explore_page_class not in parts:
            parts.append(explore_page_class)
        return '<body data-nf-layout="default" class="' + " ".join(parts) + '">'

    new_html, n = re.subn(
        r"<body\s+data-nf-layout=\"default\"\s+class=\"([^\"]*)\"\s*>",
        repl,
        html,
        count=1,
    )
    if n != 1:
        raise RuntimeError("Could not replace <body> class for explore build")
    return new_html


def strip_mirror_insights_redesign_script(html: str) -> str:
    """Remove redesign script tag (defer variants)."""
    for needle in (
        '<script src="js/mirror-insights-redesign.js" defer="" id="mirror-insights-redesign-js"></script>',
        '<script src="js/mirror-insights-redesign.js" defer id="mirror-insights-redesign-js"></script>',
    ):
        if needle in html:
            return html.replace(needle, "", 1)
    return html


def replacement_header(active: str | None, *, brand_dropdown: bool = False) -> str:
    """active: default | mosaic | leftnav | list | community_nav | iter6 | iter7 | None (no pill highlighted)."""
    links = [
        ("insights.html", "default", "Default"),
        ("insights-explore-mosaic.html", "mosaic", "Mosaic"),
        ("insights-explore-leftnav.html", "leftnav", "Left rail"),
        ("insights-explore-list.html", "list", "Timeline"),
        ("insights-explore-community-nav.html", "community_nav", "Community nav"),
        ("insights-explore-iter6.html", "iter6", "Iteration 6"),
        ("insights-explore-iter7.html", "iter7", "Iteration 7"),
        ("insights-explore-iter8.html", "iter8", "Iteration 8"),
        ("insights-explore-iter9.html", "iter9", "Iteration 9"),
    ]
    nav = "".join(
        (
            f'<a class="is-active" href="{href}">{label}</a>'
            if active is not None and key == active
            else f'<a href="{href}">{label}</a>'
        )
        for href, key, label in links
    )
    if brand_dropdown:
        brand = (
            '<div class="nf-explore-brand-dropdown">'
            '<a class="nf-explore-brand" href="insights-explore.html">Insights</a>'
            '<div class="nf-explore-brand-menu" role="menu" aria-label="Insights submenu">'
            '<a role="menuitem" class="nf-explore-brand-menu__link" '
            'href="insights-engineering-community.html">Engineering Community</a>'
            "</div></div>"
        )
    else:
        brand = '<a class="nf-explore-brand" href="insights-explore.html">Insights</a>'
    return (
        '<header class="nf-explore-topbar">'
        '<div class="nf-explore-topbar__inner">'
        f"{brand}"
        f'<nav class="nf-explore-switch" aria-label="Layout explorations">{nav}</nav>'
        "</div></header>"
    )


def extract_tab_section(html: str) -> tuple[str, int, int]:
    start = html.find(TAB_PREFIX)
    if start == -1:
        raise RuntimeError("Tab section block not found")
    end = html.find("</section>", start)
    if end == -1:
        raise RuntimeError("Tab section end not found")
    end += len("</section>")
    return html[start:end], start, end


def extract_tabs_inner(tab_section: str) -> str:
    if not tab_section.startswith(TAB_PREFIX) or not tab_section.endswith(TAB_SUFFIX):
        raise RuntimeError("Unexpected tab section shape")
    return tab_section[len(TAB_PREFIX) : -len(TAB_SUFFIX)]


def build_leftnav_block(tabs_inner: str) -> str:
    # Vertical tab semantics + rail styling hooks
    tabs_inner = tabs_inner.replace(
        '<div role="tablist" aria-label="Browse insights by topic" class="nf-insights-topic-tabs__list">',
        '<div role="tablist" aria-label="Browse insights by topic" aria-orientation="vertical" '
        'class="nf-insights-topic-tabs__list">',
        1,
    )
    tabs_inner = tabs_inner.replace(
        '<div class="nf-insights-topic-tabs pt-2" data-nf-insights-tabs="">',
        '<div class="nf-insights-topic-tabs pt-0" data-nf-insights-tabs="">',
        1,
    )
    # Layout uses .nf-explore-leftnav-row + plain CSS (Tailwind lg:* in injected HTML is often
    # missing from the prebuilt CSS bundle, which broke the sidebar into a full-width strip).
    return (
        '<section class="w-full px-5 md:px-7 lg:px-8 pt-16 pb-0 nf-explore-leftnav-section">'
        '<div class="nf-explore-leftnav-row">'
        '<aside class="nf-explore-sidebar" aria-label="Topic filters">'
        f"{tabs_inner}"
        "</aside>"
        '<div class="nf-explore-main-stream">'
    )


def strip_pre_mirror_explore_bar(html: str) -> str:
    """Remove layout switcher from insights.html; variant builds prepend a fresh bar above global nav."""
    return re.sub(
        r'<header class="nf-explore-topbar">.*?</header>',
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )


_ITER7_RM_INDUSTRIES_NAV = re.compile(
    r'<li><div class="group relative"><a[^>]*href="industries\.html"[^>]*>Industries</a>.*?</div></div></li>',
    re.DOTALL,
)
_ITER7_RM_INDUSTRIES_MOBILE = re.compile(
    r'<li><div><div class="flex items-center justify-between">'
    r'<a[^>]*href="industries\.html">Industries</a>[\s\S]*?</li>',
)
_ITER7_RM_INTRO = re.compile(
    r'<p class="mb-6 2xl:mr-16 whitespace-pre-line dark:text-white text-xl lg:text-2xl 2xl:text-3xl">'
    r"Perspectives drawn from real delivery work across engineering, data, AI, and modern platforms\. "
    r"Experience-led thinking grounded in production reality\.</p>"
)
_ITER7_JUMP_OLD = re.compile(
    r'<a target="_self" href="#digital-community" class="nf-insights-jump-to-community"[^>]*>'
    r'[\s\S]*?</a>',
    re.DOTALL,
)
_ITER7_JUMP_NEW = (
    '<a target="_self" href="insights-engineering-community.html" class="nf-insights-jump-to-community" '
    'aria-label="Engineering Community — open technical articles">'
    '<span class="nf-insights-jump-to-community__label">Engineering Community →</span></a>'
)


def apply_iter7_only_patches(html: str) -> str:
    """HTML edits exclusive to insights-explore-iter7.html (global nav, hero CTA, intro)."""
    html, n = _ITER7_RM_INDUSTRIES_NAV.subn("", html, count=1)
    if n != 1:
        raise RuntimeError("Iteration 7 build: Industries nav block not found or not unique")
    html, nm = _ITER7_RM_INDUSTRIES_MOBILE.subn("", html, count=1)
    if nm != 1:
        raise RuntimeError("Iteration 7 build: mobile Industries nav block not found or not unique")
    html, n2 = _ITER7_RM_INTRO.subn("", html, count=1)
    if n2 != 1:
        raise RuntimeError("Iteration 7 build: hero intro paragraph not found or not unique")
    html, n3 = _ITER7_JUMP_OLD.subn(_ITER7_JUMP_NEW, html, count=1)
    if n3 != 1:
        raise RuntimeError("Iteration 7 build: Engineering community jump link not found or not unique")
    return html


_HEADER_CENTER_UL = re.compile(
    r'(<ul[^>]*data-testid="header-center"[^>]*>)([\s\S]*?)(</ul>)',
)

_INSIGHTS_TOP_NAV_LINK = re.compile(r'<a\s([^>]*href="insights\.html"[^>]*)>Insights</a>')


def _insights_center_nav_repl(match) -> str:
    """Same mega-menu shell as About / other header-center dropdowns (Stripe nav + mirror-stripe-influence)."""
    inner = match.group(1)
    return (
        '<div class="group relative">'
        f"<a {inner}>Insights</a>"
        '<div class="absolute top-full w-max p-10 -m-10 -translate-x-6 transition-all transition-discrete invisible group-hov:visible opacity-0 group-hov:opacity-100 translate-y-6 group-hov:translate-y-4">'
        '<div class="py-2 border shadow-sm rounded-lg bg-white text-nf-deep-navy border-nf-light-grey dark:bg-nf-deep-navy dark:text-white dark:border-white">'
        '<a class="relative dark:text-background outline-none px-5 py-4 block hov:bg-nf-light-grey dark:hov:bg-nf-muted-grey transition-colors duration-200 ease-in-out" '
        'href="insights-engineering-community.html">Engineering Community</a>'
        "</div></div></div>"
    )


def inject_global_insights_dropdown(html: str) -> str:
    """Community nav: desktop header-center Insights uses native dropdown styling + JS parity."""
    m = re.search(r'(<header class="font-sans.*?</header>)', html, re.DOTALL)
    if not m:
        return html
    block = m.group(1)
    cm = _HEADER_CENTER_UL.search(block)
    if not cm:
        return html
    inner = cm.group(2)
    new_inner, n = _INSIGHTS_TOP_NAV_LINK.subn(_insights_center_nav_repl, inner, count=1)
    if n == 0:
        return html
    new_block = block[: cm.start(2)] + new_inner + block[cm.end(2) :]
    return html[: m.start()] + new_block + html[m.end() :]


_COMMUNITY_NAV_HERO_CTA = re.compile(
    r'<div class="group relative overflow-hidden inline-flex[^>]*_type="ctaButtonBlock">[\s\S]*?</a></span></div>'
)


def strip_community_nav_hero_cta(html: str) -> str:
    """Remove Insights hero ‘Engineering community’ pill (only used on Community nav layout)."""
    return _COMMUNITY_NAV_HERO_CTA.sub("", html, count=1)


def apply_page(
    html: str,
    *,
    body_class: str,
    title: str,
    header_active: str,
    mode: str,
    brand_dropdown: bool = False,
) -> str:
    """mode: mosaic | leftnav | list | community | iter6 | iter7 (extra transforms only for iter7)."""
    # Stack layout switcher above the mirror global nav (do not remove site header).
    explore_bar = replacement_header(header_active, brand_dropdown=brand_dropdown)
    html = re.sub(
        r'(<header class="font-sans.*?</header>)',
        explore_bar + r"\1",
        html,
        count=1,
        flags=re.DOTALL,
    )

    # CSS (canonical listing may already load this with an id attribute)
    if "insights-explore.css" not in html:
        html = html.replace("</head>", f"{CSS_LINK}</head>", 1)

    keep_redesign = mode == "iter7"
    html = replace_body_explore_class(html, body_class, keep_redesign=keep_redesign)
    if not keep_redesign:
        html = strip_mirror_insights_redesign_script(html)
    elif mode == "iter7":
        redesign_needles = (
            '<script src="js/mirror-insights-redesign.js" defer="" id="mirror-insights-redesign-js"></script>',
            '<script src="js/mirror-insights-redesign.js" defer id="mirror-insights-redesign-js"></script>',
        )
        iter7_tag = '<script src="js/mirror-insights-iter7.js" defer="" id="mirror-insights-iter7-js"></script>'
        if "mirror-insights-iter7.js" not in html:
            for needle in redesign_needles:
                if needle in html:
                    html = html.replace(needle, needle + iter7_tag, 1)
                    break

    # Title
    html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1)

    if mode == "list":
        needle = '<script src="js/mirror-insights-card-cta.js" defer=""></script>'
        extra = '<script src="js/mirror-insights-timeline-sort.js" defer=""></script>'
        if needle in html and "mirror-insights-timeline-sort.js" not in html:
            html = html.replace(needle, needle + extra, 1)

    if mode == "leftnav":
        tab_section, t0, t1 = extract_tab_section(html)
        tabs_inner = extract_tabs_inner(tab_section)
        feed_start = html.find(FEED_START)
        cta = html.find(CTA_MARKER)
        if feed_start == -1 or cta == -1:
            raise RuntimeError("Feed block or CTA marker not found")
        feeds = html[feed_start:cta]
        left_open = build_leftnav_block(tabs_inner)
        close_rail = "</div></div></section>"
        new_block = left_open + feeds + close_rail
        html = html[:t0] + new_block + html[cta:]

    if header_active == "community_nav":
        html = inject_global_insights_dropdown(html)
        html = strip_community_nav_hero_cta(html)

    return html


_NAV_DESKTOP_INSIGHTS_DROPDOWN_LI = re.compile(
    r'<li><div class="group relative"><a[^>]*href="insights\.html"[^>]*>Insights</a>[\s\S]*?</div></div></li>',
    re.DOTALL,
)
_NAV_MOBILE_INSIGHTS_SIMPLE_LI = re.compile(
    r'<li><a class="transition-colors duration-200 ease-in-out hov:text-nf-dark-green" href="insights\.html">Insights</a></li>',
)

_ITER8_DESKTOP_NAV = (
    '<li class="nf-nav-iter8-desktop nf-nav-iter8-desktop-insights">'
    '<a class="relative dark:text-background after:content-[\'\'] after:absolute after:block after:pointer-events-none '
    'after:h-0.5 after:left-0 after:bottom-[-3px] hov:after:w-full after:bg-nf-green after:transition-all '
    'after:duration-[0.3s] after:ease-[ease-in-out] outline-none after:w-full z-1 nf-nav-iter8-insights" '
    'href="insights-explore-iter8.html">Insights</a></li>'
    '<li class="nf-nav-iter8-desktop nf-nav-iter8-desktop-engineering">'
    '<a class="relative dark:text-background after:content-[\'\'] after:absolute after:block after:pointer-events-none '
    'after:h-0.5 after:left-0 after:bottom-[-3px] hov:after:w-full after:bg-nf-green after:transition-all '
    'after:duration-[0.3s] after:ease-[ease-in-out] outline-none after:w-full z-1 nf-nav-iter8-engineering" '
    'href="insights-explore-iter8-engineering.html">Engineering</a></li>'
)

_ITER8_MOBILE_NAV = (
    '<li><a class="transition-colors duration-200 ease-in-out hov:text-nf-dark-green nf-nav-iter8-insights" '
    'href="insights-explore-iter8.html">Insights</a></li>'
    '<li><a class="transition-colors duration-200 ease-in-out hov:text-nf-dark-green nf-nav-iter8-engineering" '
    'href="insights-explore-iter8-engineering.html">Engineering</a></li>'
)

_ITER9_DESKTOP_NAV = (
    '<li class="nf-nav-iter9-desktop"><div class="group relative">'
    '<a class="relative dark:text-background after:content-[\'\'] after:absolute after:block after:pointer-events-none '
    'after:h-0.5 after:left-0 after:bottom-[-3px] hov:after:w-full after:bg-nf-green after:transition-all '
    'after:duration-[0.3s] after:ease-[ease-in-out] outline-none after:w-full z-1 nf-nav-iter9-main" '
    'href="insights-explore-iter9.html">Insights</a>'
    '<div class="absolute top-full w-max p-10 -m-10 -translate-x-6 transition-all transition-discrete invisible '
    'group-hov:visible opacity-0 group-hov:opacity-100 translate-y-6 group-hov:translate-y-4">'
    '<div class="py-2 border shadow-sm rounded-lg bg-white text-nf-deep-navy border-nf-light-grey dark:bg-nf-deep-navy '
    'dark:text-white dark:border-white">'
    '<a class="relative dark:text-background outline-none px-5 py-4 block hov:bg-nf-light-grey dark:hov:bg-nf-muted-grey '
    'transition-colors duration-200 ease-in-out" href="insights-explore-iter9-engineering.html">Engineering</a>'
    "</div></div></div></li>"
)

_ITER9_MOBILE_NAV = (
    '<li><a class="transition-colors duration-200 ease-in-out hov:text-nf-dark-green nf-nav-iter9-main" '
    'href="insights-explore-iter9.html">Insights</a></li>'
    '<li><a class="transition-colors duration-200 ease-in-out hov:text-nf-dark-green" '
    'href="insights-explore-iter9-engineering.html">Engineering</a></li>'
)


def _replace_explore_topbar(html: str, header_active: str) -> str:
    return re.sub(
        r'<header class="nf-explore-topbar">.*?</header>',
        replacement_header(header_active),
        html,
        count=1,
        flags=re.DOTALL,
    )


def apply_iter8_peer_nav(html: str) -> str:
    html, n = _NAV_DESKTOP_INSIGHTS_DROPDOWN_LI.subn(_ITER8_DESKTOP_NAV, html, count=1)
    if n != 1:
        raise RuntimeError("Iteration 8 build: desktop Insights nav block not found or not unique")
    html, nm = _NAV_MOBILE_INSIGHTS_SIMPLE_LI.subn(_ITER8_MOBILE_NAV, html, count=1)
    if nm != 1:
        raise RuntimeError("Iteration 8 build: mobile Insights nav item not found or not unique")
    return html


def apply_iter9_insights_nav(html: str) -> str:
    html, n = _NAV_DESKTOP_INSIGHTS_DROPDOWN_LI.subn(_ITER9_DESKTOP_NAV, html, count=1)
    if n != 1:
        raise RuntimeError("Iteration 9 build: desktop Insights nav block not found or not unique")
    html, nm = _NAV_MOBILE_INSIGHTS_SIMPLE_LI.subn(_ITER9_MOBILE_NAV, html, count=1)
    if nm != 1:
        raise RuntimeError("Iteration 9 build: mobile Insights nav item not found or not unique")
    return html


def _inject_before_main_close(html: str, block: str) -> str:
    anchor = "</main><!--$-->"
    idx = html.rfind(anchor)
    if idx == -1:
        idx = html.rfind("</main>")
    if idx == -1:
        raise RuntimeError("Listing CTA: could not find </main> close")
    return html[:idx] + block + html[idx:]


def inject_listing_bottom_cta_insights(html: str, *, iteration: str) -> str:
    eng = f"insights-explore-iter{iteration}-engineering.html"
    block = (
        '<section class="nf-cross-stream-cta nf-cross-stream-cta--to-engineering" aria-label="Technical content">'
        '<div class="nf-cross-stream-cta__inner">'
        "<h2 class=\"nf-cross-stream-cta__h\">Looking for technical content?</h2>"
        "<p class=\"nf-cross-stream-cta__p\">Deep-dives, tutorials and open source releases from our engineering team.</p>"
        f'<a class="nf-cross-stream-cta__link" href="{eng}">Explore Engineering →</a>'
        "</div></section>"
    )
    return _inject_before_main_close(html, block)


def patch_iter789_insights_hero_engineering_jump(html: str, *, iteration: str) -> str:
    """Hero pill: label 'Engineering', link to this iteration's Engineering listing (not legacy community URL)."""
    old = (
        '<a target="_self" href="insights-engineering-community.html" class="nf-insights-jump-to-community" '
        'aria-label="Engineering Community — open technical articles">'
        '<span class="nf-insights-jump-to-community__label">Engineering Community →</span></a>'
    )
    eng = f"insights-explore-iter{iteration}-engineering.html"
    new = (
        f'<a target="_self" href="{eng}" class="nf-insights-jump-to-community" '
        'aria-label="Engineering — open technical articles">'
        '<span class="nf-insights-jump-to-community__label">Engineering →</span></a>'
    )
    if old not in html:
        raise RuntimeError("Iteration 8/9 Insights build: hero Engineering jump link not found")
    return html.replace(old, new, 1)


_ITER89_INSIGHTS_HERO_SUBTEXT = (
    '<p class="mb-5 md:mb-6 2xl:mr-16 whitespace-pre-line dark:text-white text-xl lg:text-2xl 2xl:text-3xl '
    'nf-explore-iter89-insights-hero-sub">'
    "Perspectives drawn from real delivery work across engineering, data, AI, and modern platforms. "
    "Experience-led thinking grounded in production reality.</p>"
)
_ITER89_INSIGHTS_HERO_SUBTEXT_ANCHOR = (
    '<div data-type="page-section-content"><div class="group relative overflow-hidden inline-flex'
)


def inject_iter789_insights_hero_subtext(html: str) -> str:
    """Right-hand hero column: subtext above Engineering CTA (iterations 8 & 9 Insights only)."""
    if _ITER89_INSIGHTS_HERO_SUBTEXT_ANCHOR not in html:
        raise RuntimeError("Iteration 8/9 Insights build: hero column anchor not found for subtext")
    if "nf-explore-iter89-insights-hero-sub" in html:
        return html
    return html.replace(
        _ITER89_INSIGHTS_HERO_SUBTEXT_ANCHOR,
        '<div data-type="page-section-content">' + _ITER89_INSIGHTS_HERO_SUBTEXT + '<div class="group relative overflow-hidden inline-flex',
        1,
    )


_ITER89_ENGINEERING_HERO_SUBTEXT = (
    '<p class="mb-5 md:mb-6 2xl:mr-16 whitespace-pre-line dark:text-white text-xl lg:text-2xl 2xl:text-3xl '
    'nf-explore-iter89-engineering-hero-sub">'
    "Tutorials, performance notes, protocol walkthroughs and open source releases from Nearform engineers "
    "shipping in production. Practical detail you can lift into your own systems and repos.</p>"
)


def inject_iter789_engineering_hero_subtext(html: str) -> str:
    """Right-hand hero column: subtext above Insights CTA (iterations 8 & 9 Engineering listings only)."""
    if _ITER89_INSIGHTS_HERO_SUBTEXT_ANCHOR not in html:
        raise RuntimeError("Iteration 8/9 Engineering build: hero column anchor not found for subtext")
    if "nf-explore-iter89-engineering-hero-sub" in html:
        return html
    return html.replace(
        _ITER89_INSIGHTS_HERO_SUBTEXT_ANCHOR,
        '<div data-type="page-section-content">' + _ITER89_ENGINEERING_HERO_SUBTEXT + '<div class="group relative overflow-hidden inline-flex',
        1,
    )


_H1_ENGINEERING_COMMUNITY_BLOCK = re.compile(
    r'<h1 class="font-sans whitespace-pre-line[^"]*" id="engineering-community">[\s\S]*?</h1>',
    re.DOTALL,
)
_H1_ENGINEERING_ITER789 = (
    '<h1 class="font-sans whitespace-pre-line text-6xl/17 lg:text-[84px] lg:leading-[94px] lg:tracking-tight '
    'xl:text-8xl/27 xl:tracking-tight 2xl:text-[140px]/37 2xl:tracking-[-4.2px]" id="engineering-community">'
    '<span class="relative block">'
    '<span class="sr-only select-none">Engineering</span>'
    '<span class="absolute w-full z-10" aria-hidden="true">'
    "<span>E</span><span>n</span><span>g</span><span>i</span><span>n</span><span>e</span><span>e</span>"
    "<span>r</span><span>i</span><span>n</span><span>g</span>"
    "</span>"
    '<span class="opacity-0 select-none" aria-hidden="true">'
    "<span>E</span><span>n</span><span>g</span><span>i</span><span>n</span><span>e</span><span>e</span>"
    "<span>r</span><span>i</span><span>n</span><span>g</span>"
    "</span>"
    "</span>"
    "</h1>"
)


def patch_iter789_engineering_listing_copy(html: str, *, iteration: str) -> str:
    """Hero title 'Engineering'; Insights pill label + link to this iteration's Insights listing."""
    html, nh = _H1_ENGINEERING_COMMUNITY_BLOCK.subn(_H1_ENGINEERING_ITER789, html, count=1)
    if nh != 1:
        raise RuntimeError("Iteration 8/9 engineering build: hero h1 not found")

    ins = f"insights-explore-iter{iteration}.html"
    old_jump = (
        '<a target="_self" href="insights.html" class="nf-insights-jump-to-community" '
        'aria-label="View all Insights articles">'
        '<span class="nf-insights-jump-to-community__label">All Insights</span>'
        '<span class="nf-insights-jump-to-community__chev" aria-hidden="true">→</span></a>'
    )
    new_jump = (
        f'<a target="_self" href="{ins}" class="nf-insights-jump-to-community" '
        'aria-label="Insights — open strategic articles">'
        '<span class="nf-insights-jump-to-community__label">Insights</span>'
        '<span class="nf-insights-jump-to-community__chev" aria-hidden="true">→</span></a>'
    )
    if old_jump not in html:
        raise RuntimeError("Iteration 8/9 engineering build: All Insights jump link not found")
    return html.replace(old_jump, new_jump, 1)


def patch_insights_listing_iter789(
    iter7_html: str,
    *,
    iteration: str,
    nav_mode: str,
    explore_active: str,
    title: str,
    body_class: str,
) -> str:
    """nav_mode: iter8_peer | iter9_dropdown"""
    h = iter7_html
    h = _replace_explore_topbar(h, explore_active)
    h = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", h, count=1)
    h = h.replace("nf-explore-page-iter7", body_class)
    old_js = '<script src="js/mirror-insights-iter7.js" defer="" id="mirror-insights-iter7-js"></script>'
    if old_js not in h:
        raise RuntimeError("Expected iter7 listing script tag in iter7 HTML source")
    h = h.replace(old_js, "", 1)
    h = patch_iter789_listing_script_order(h)
    h = patch_iter789_insights_hero_engineering_jump(h, iteration=iteration)
    h = inject_iter789_insights_hero_subtext(h)
    if nav_mode == "iter8_peer":
        h = apply_iter8_peer_nav(h)
    else:
        h = apply_iter9_insights_nav(h)
    h = inject_listing_bottom_cta_insights(h, iteration=iteration)
    h = patch_iter89_insights_hub_topic_tabs(h)
    h = patch_iter89_insights_hub_card_topics(h)
    h = patch_iter89_insights_remove_engineering_community_cta(h)
    return h


# Iteration 8/9 Insights: remove static “Engineering Community … dedicated page” strip above the feeds.
_INSIGHTS_COMMUNITY_CTA_SECTION = re.compile(
    r'<section class="w-full flex px-5 md:px-7 lg:px-8 mt-12 pt-20 pb-8 items-start nf-insights-community-cta">.*?</section>',
    re.DOTALL,
)


def patch_iter89_insights_remove_engineering_community_cta(html: str) -> str:
    html2, n = _INSIGHTS_COMMUNITY_CTA_SECTION.subn("", html, count=1)
    if n != 1:
        raise RuntimeError(
            "Iteration 8/9 insights: expected one nf-insights-community-cta section to remove"
        )
    return html2


# Iteration 8/9 — shared hub topic tabs (Insights + Engineering listings; no Industry Insights tab).
_ITER89_HUB_TOPIC_TAB_BUTTONS = (
    '<button type="button" role="tab" id="nf-insights-tab-all" aria-selected="true" '
    'aria-controls="nf-insights-pill-panel" data-nf-tab-topic="all" class="nf-insights-topic-tabs__tab">All topics</button>'
    '<button type="button" role="tab" id="nf-insights-tab-ai-native-engineering" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="ai-native-engineering" '
    'class="nf-insights-topic-tabs__tab">AI Native Engineering</button>'
    '<button type="button" role="tab" id="nf-insights-tab-enterprise-ai-transformation" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="enterprise-ai-transformation" '
    'class="nf-insights-topic-tabs__tab">Enterprise AI Transformation</button>'
    '<button type="button" role="tab" id="nf-insights-tab-platform-cloud-modernization" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="platform-cloud-modernization" '
    'class="nf-insights-topic-tabs__tab">Platform &amp; Cloud Modernization</button>'
    '<button type="button" role="tab" id="nf-insights-tab-engineering-excellence" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="engineering-excellence" '
    'class="nf-insights-topic-tabs__tab">Engineering Excellence</button>'
    '<button type="button" role="tab" id="nf-insights-tab-digital-product-innovation" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="digital-product-innovation" '
    'class="nf-insights-topic-tabs__tab">Digital Product Innovation</button>'
    '<button type="button" role="tab" id="nf-insights-tab-business-impact-growth" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="business-impact-growth" '
    'class="nf-insights-topic-tabs__tab">Business Impact &amp; Growth</button>'
)

_INSIGHTS_ITER89_HUB_TOPIC_TABLIST = (
    '<div role="tablist" aria-label="Browse insights by topic" class="nf-insights-topic-tabs__list">'
    + _ITER89_HUB_TOPIC_TAB_BUTTONS
    + "</div>"
)

_ENG_ITER89_TOPIC_TABLIST = (
    '<div role="tablist" aria-label="Browse engineering articles by topic" class="nf-insights-topic-tabs__list">'
    + _ITER89_HUB_TOPIC_TAB_BUTTONS
    + "</div>"
)

_ENG_TOPIC_TABLIST_OLD = re.compile(
    r'<div role="tablist" aria-label="Browse insights by topic" class="nf-insights-topic-tabs__list">.*?</div>\s*'
    r'<div id="nf-insights-pill-panel"',
    re.DOTALL,
)

# (article href basename, data-nf-insight-topics, data-nf-insight-tags) — tags drive listing pill links.
_ENG_ITER89_ARTICLE_TOPIC_ROWS: tuple[tuple[str, str, str], ...] = (
    (
        "why-plan-mode-is-not-enough-better-outcomes-with-spec-driven-development.html",
        "business-impact-growth",
        "business-impact-growth",
    ),
    (
        "designers-and-ai-native-engineering-building-real-products-with-bmad-and-ai-driven-ides.html",
        "ai-native-engineering",
        "ai-native-engineering",
    ),
    (
        "browser-based-vector-search-fast-private-and-no-backend-required.html",
        "platform-cloud-modernization",
        "platform-cloud-modernization",
    ),
    (
        "implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html",
        "engineering-excellence",
        "engineering-excellence",
    ),
    (
        "cursor-vs-copilot-what-tool-has-the-best-planning-mode.html",
        "digital-product-innovation",
        "digital-product-innovation",
    ),
    (
        "ai-beyond-the-cloud-the-current-and-future-state-of-on-device-generative-ai.html",
        "enterprise-ai-transformation",
        "enterprise-ai-transformation",
    ),
    (
        "temporal-workflow-debt-the-hidden-blocker-in-enterprise-ai-integration.html",
        "enterprise-ai-transformation",
        "enterprise-ai-transformation",
    ),
)


# One legacy token can map to several hub slugs so every tab can have listing coverage.
_LEGACY_TOPICS_TOKEN_TO_HUB_EXPAND: dict[str, tuple[str, ...]] = {
    # Iter7 source tokens omit "cloud"; pair platform with build + product so the tab still filters real cards.
    "build": ("engineering-excellence", "platform-cloud-modernization"),
    "ai-data": ("ai-native-engineering", "enterprise-ai-transformation"),
    "cloud": ("platform-cloud-modernization",),
    "product": ("digital-product-innovation", "platform-cloud-modernization"),
    "strategy": ("business-impact-growth",),
}

_ITER89_INSIGHTS_CARD_TOPICS_TAGS_RE = re.compile(
    r'(<div class="mb-8 nf-insights-article-card(?: nf-insights-article-card--community-landing)?" '
    r'data-nf-insight-card="" data-nf-insight-topics=")([^"]+)(" data-nf-insight-tags=")([^"]*)(")',
)


def _legacy_topics_tokens_to_hub_slugs(raw: str) -> str:
    """Map iteration-7 listing topic tokens onto iteration-8/9 hub slugs (space-separated, deduped)."""
    hubs: list[str] = []
    seen: set[str] = set()
    for tok in (raw or "").split():
        for hub in _LEGACY_TOPICS_TOKEN_TO_HUB_EXPAND.get(tok, ()):
            if hub not in seen:
                seen.add(hub)
                hubs.append(hub)
    return " ".join(hubs) if hubs else "engineering-excellence"


def patch_iter89_insights_hub_topic_tabs(html: str) -> str:
    repl = _INSIGHTS_ITER89_HUB_TOPIC_TABLIST + '<div id="nf-insights-pill-panel"'
    html2, n = _ENG_TOPIC_TABLIST_OLD.subn(repl, html, count=1)
    if n != 1:
        raise RuntimeError("Iteration 8/9 insights hub: expected one topic tablist to replace")
    return html2


def patch_iter89_insights_hub_card_topics(html: str) -> str:
    """Align card data-nf-insight-topics/tags with hub tab ids (mirrors mirror-insights-tabs.js)."""

    def _repl(m: re.Match[str]) -> str:
        new_slugs = _legacy_topics_tokens_to_hub_slugs(m.group(2))
        return m.group(1) + new_slugs + m.group(3) + new_slugs + m.group(5)

    html2, n = _ITER89_INSIGHTS_CARD_TOPICS_TAGS_RE.subn(_repl, html)
    if n < 8:
        raise RuntimeError(f"Iteration 8/9 insights hub: expected card topic rewrites, got {n}")
    return html2


def patch_iter89_engineering_topic_tabs(html: str) -> str:
    repl = _ENG_ITER89_TOPIC_TABLIST + '<div id="nf-insights-pill-panel"'
    html2, n = _ENG_TOPIC_TABLIST_OLD.subn(repl, html, count=1)
    if n != 1:
        raise RuntimeError("Iteration 8/9 engineering: expected one topic tablist to replace")
    return html2


def patch_iter89_engineering_card_topics(html: str) -> str:
    for basename, topics, tags in _ENG_ITER89_ARTICLE_TOPIC_ROWS:
        # Anchor to the listing hero image link only (avoids matching a later in-card href).
        pat = (
            r'(<div class="mb-8 nf-insights-article-card(?: nf-insights-article-card--community-landing)?" '
            r'data-nf-insight-card="" data-nf-insight-topics=")([^"]+)(" data-nf-insight-tags=")([^"]*)(")([^>]*>'
            r'<a class="group overflow-hidden block mb-4 w-full"[^>]*href="'
            + re.escape(basename)
            + r'")'
        )

        def make_repl(
            new_topics: str,
            new_tags: str,
        ) -> object:
            def _repl(m: re.Match[str]) -> str:
                return m.group(1) + new_topics + m.group(3) + new_tags + m.group(5) + m.group(6)

            return _repl

        html, nm = re.subn(pat, make_repl(topics, tags), html)
        if nm < 1:
            raise RuntimeError(
                f"Iteration 8/9 engineering: no card match for article {basename} (got {nm})"
            )
    return html


def build_engineering_listing_iter789(
    eng_source: str,
    *,
    iteration: str,
    nav_mode: str,
    explore_active: str,
    title: str,
    body_class: str,
) -> str:
    h = strip_pre_mirror_explore_bar(eng_source)
    h = re.sub(
        r'(<header class="font-sans.*?</header>)',
        replacement_header(explore_active) + r"\1",
        h,
        count=1,
        flags=re.DOTALL,
    )
    h = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", h, count=1)
    h, n = _ITER7_RM_INDUSTRIES_NAV.subn("", h, count=1)
    if n != 1:
        raise RuntimeError(f"Iteration {iteration} engineering: desktop Industries nav not found")
    h, nm = _ITER7_RM_INDUSTRIES_MOBILE.subn("", h, count=1)
    if nm != 1:
        raise RuntimeError(f"Iteration {iteration} engineering: mobile Industries nav not found")
    h, ni = _ITER7_RM_INTRO.subn("", h, count=1)
    if ni != 1:
        raise RuntimeError(f"Iteration {iteration} engineering: hero intro paragraph not found")

    def body_repl(m: re.Match[str]) -> str:
        raw = (m.group(1) or "").strip()
        parts = [p for p in raw.split() if p]
        if body_class not in parts:
            parts.append(body_class)
        return '<body data-nf-layout="default" class="' + " ".join(parts) + '">'

    h, nb = re.subn(
        r"<body\s+data-nf-layout=\"default\"\s+class=\"([^\"]*)\"\s*>",
        body_repl,
        h,
        count=1,
    )
    if nb != 1:
        raise RuntimeError(f"Iteration {iteration} engineering: body class replace failed")
    h = patch_iter789_listing_script_order(h)
    if nav_mode == "iter8_peer":
        h = apply_iter8_peer_nav(h)
    else:
        h = apply_iter9_insights_nav(h)
    h = patch_iter789_engineering_listing_copy(h, iteration=iteration)
    h = inject_iter789_engineering_hero_subtext(h)
    h = patch_iter89_engineering_topic_tabs(h)
    h = patch_iter89_engineering_card_topics(h)
    return h


# Matches primary mirrored CTAs (e.g. article body): height from py-2.5 + text-base/5.5.
_ARTICLE_GATE_BTN_CLASSES = (
    "group relative overflow-hidden inline-flex justify-center items-center font-sans rounded-full px-4 py-2.5 "
    "cursor-pointer link-button-transition dark:text-white disabled:pointer-events-none disabled:opacity-40 "
    "disabled:text-nf-deep-grey disabled:bg-nf-grey text-nf-deep-navy border border-nf-green hover:scale-110 "
    "hover:bg-nf-deep-navy hover:text-white hover:border-nf-deep-navy dark:border-nf-green dark:hover:bg-white "
    "dark:hover:text-nf-deep-navy dark:hover:border-nf-deep-navy green:border-nf-deep-navy green:hover:bg-white "
    "green:hover:border-white green:hover:text-nf-deep-navy text-base/5.5 transition-all ease-in duration-200"
)


_ARTICLE_EXPLORE_GATE_INSIGHTS = (
    '<section class="nf-article-explore-gate" aria-label="Explore more from Nearform">'
    "<!-- Production: ship this end-of-article module on every article; listing URLs are templated per nav iteration (8 vs 9). -->"
    '<div class="nf-article-explore-gate__inner">'
    "<h2 class=\"nf-article-explore-gate__h\">There's a lot more to explore</h2>"
    '<p class="nf-article-explore-gate__lead">Nearform publishes regular thinking on AI, engineering, strategy and digital transformation — grounded in real delivery work.</p>'
    '<div class="nf-article-explore-gate__paths">'
    '<div class="nf-article-explore-gate__path">'
    '<h3 class="nf-article-explore-gate__path-h">More Insights</h3>'
    "<p class=\"nf-article-explore-gate__path-p\">Strategy, AI, and leadership perspectives</p>"
    '<a target="_self" class="'
    + _ARTICLE_GATE_BTN_CLASSES
    + ' nf-article-explore-gate__cta" href="insights-explore-iter8.html">Browse Insights →</a>'
    "</div>"
    '<div class="nf-article-explore-gate__path">'
    '<h3 class="nf-article-explore-gate__path-h">Engineering Community</h3>'
    "<p class=\"nf-article-explore-gate__path-p\">Technical deep-dives and tutorials for practitioners</p>"
    '<a target="_self" class="'
    + _ARTICLE_GATE_BTN_CLASSES
    + ' nf-article-explore-gate__cta" href="insights-explore-iter8-engineering.html">Browse Engineering →</a>'
    "</div></div></div></section>"
)

_ARTICLE_EXPLORE_GATE_ENGINEERING = (
    '<section class="nf-article-explore-gate" aria-label="Explore more from Nearform">'
    "<!-- Production: ship this end-of-article module on every article; listing URLs are templated per nav iteration (8 vs 9). -->"
    '<div class="nf-article-explore-gate__inner">'
    "<h2 class=\"nf-article-explore-gate__h\">There's a lot more to explore</h2>"
    '<p class="nf-article-explore-gate__lead">Nearform publishes regular thinking on AI, engineering, strategy and digital transformation — grounded in real delivery work.</p>'
    '<div class="nf-article-explore-gate__paths">'
    '<div class="nf-article-explore-gate__path">'
    '<h3 class="nf-article-explore-gate__path-h">More Engineering</h3>'
    "<p class=\"nf-article-explore-gate__path-p\">Tutorials, tool comparisons and open source releases</p>"
    '<a target="_self" class="'
    + _ARTICLE_GATE_BTN_CLASSES
    + ' nf-article-explore-gate__cta" href="insights-explore-iter8-engineering.html">Browse Engineering →</a>'
    "</div>"
    '<div class="nf-article-explore-gate__path">'
    '<h3 class="nf-article-explore-gate__path-h">Insights</h3>'
    "<p class=\"nf-article-explore-gate__path-p\">Business strategy and AI thinking from Nearform's leadership</p>"
    '<a target="_self" class="'
    + _ARTICLE_GATE_BTN_CLASSES
    + ' nf-article-explore-gate__cta" href="insights-explore-iter8.html">Browse Insights →</a>'
    "</div></div></div></section>"
)

# “You may also like” block on mirrored insight articles (insert explore gate immediately above it).
_ARTICLE_YOU_MAY_ALSO_SECTION = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 nf-insight-related-section">'
)

# Legacy related strip: same outer section, sometimes without nf-insight-related-section and/or without the <hr>.
_ARTICLE_RELATED_SECTION_WITH_HR_RE = re.compile(
    r'<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12[^"]*"[^>]*>'
    r'<div class="w-full max-w-\[1600px\] mx-auto">'
    r'<hr class="lg:col-span-2 border-t border-nf-deep-navy',
)
_ARTICLE_RELATED_SECTION_NO_HR_RE = re.compile(
    r'<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12[^"]*"[^>]*>'
    r'<div class="w-full max-w-\[1600px\] mx-auto">'
    r'<div><div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-6 xl:gap-7 2xl:gap-8"',
)

_ARTICLE_EXPLORE_GATE_RE = re.compile(
    r'<section class="nf-article-explore-gate"[^>]*>[\s\S]*?</section>',
    re.IGNORECASE,
)

# Floating signup (mirror-insights-iter8-9-signup.js) — must exist on every gated article, not only listing hubs.
_ARTICLE_FLOAT_SIGNUP_SCRIPT = (
    '<script src="js/mirror-insights-iter8-9-signup.js" defer=""></script>'
)

_ENGINEERING_LISTING_HUB_HREFS = frozenset(
    {
        "insights.html",
        "digital-community.html",
        "insights-engineering-community.html",
        "engineering.html",
        "content-hub.html",
    }
)

# Article HTML not present on the Engineering listing but treated as an engineering stream page.
_EXTRA_ENGINEERING_ARTICLE_GATE_FILES = frozenset(
    ("sideways-not-upwards-scaling-frontend-performance-with-k6.html",)
)

# Linked from Engineering listings but should keep the Insights-oriented gate copy/URLs.
_INSIGHTS_GATE_ARTICLE_OVERRIDES = frozenset(
    ("moving-beyond-the-hype-engineering-for-the-ai-era.html",)
)


def discover_engineering_article_filenames(mirror: Path) -> set[str]:
    """Slugs linked from Engineering community primary feeds (mirrored article pages only)."""
    listing_path = mirror / "insights-engineering-community.html"
    if not listing_path.is_file():
        return set()
    listing = listing_path.read_text(encoding="utf-8")
    found: set[str] = set()
    for m in re.finditer(
        r"nf-insights-feed--primary[^>]*>([\s\S]{0,600000}?)(?=</section>|<section class=\"w-full flex)",
        listing,
    ):
        chunk = m.group(1)
        for hm in re.finditer(r'href="([a-z0-9][a-z0-9-]*\.html)"', chunk, re.I):
            name = hm.group(1).lower()
            if name in _ENGINEERING_LISTING_HUB_HREFS:
                continue
            if re.match(r"^insights_\d+\.html$", name, re.I):
                continue
            if not (mirror / name).is_file():
                continue
            found.add(name)
    return found


def discover_insight_article_filenames(mirror: Path) -> list[str]:
    """Static mirrored pages that use the insight-article layout (individual articles)."""
    out: list[str] = []
    for path in sorted(mirror.glob("*.html")):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if 'data-nf-layout="insight-article"' not in text:
            continue
        out.append(path.name)
    return out


def patch_all_insight_article_explore_gates(mirror: Path) -> None:
    """End-of-article explore gate on every mirrored insight article (above related / You may also like)."""
    engineering = discover_engineering_article_filenames(mirror) | set(_EXTRA_ENGINEERING_ARTICLE_GATE_FILES)
    for name in discover_insight_article_filenames(mirror):
        art = mirror / name
        if not art.is_file():
            continue
        t = art.read_text(encoding="utf-8")
        if name in _INSIGHTS_GATE_ARTICLE_OVERRIDES:
            variant = "insights"
        elif name in engineering:
            variant = "engineering"
        else:
            variant = "insights"
        t2 = inject_article_explore_gate(t, variant=variant)
        if t2 != t:
            art.write_text(t2, encoding="utf-8")
            print("patched article explore gate", name, f"({variant})")


def _article_explore_gate_insertion_index(html: str) -> Optional[int]:
    """Index to insert the explore gate: directly before the related-articles section, if present."""
    main_close = html.rfind("</main>")
    window_end = main_close if main_close != -1 else len(html)
    window = html[:window_end]

    idx = window.find(_ARTICLE_YOU_MAY_ALSO_SECTION)
    if idx != -1:
        return idx

    last_rel: Optional[int] = None
    for m in re.finditer(r"<section[^>]*\bnf-insight-related-section\b[^>]*>", window, re.IGNORECASE):
        last_rel = m.start()
    if last_rel is not None:
        return last_rel

    y = window.find('id="you-may-also-like"')
    if y == -1:
        y = window.find("id='you-may-also-like'")
    if y != -1:
        sec = window.rfind("<section", 0, y)
        if sec != -1:
            return sec

    last_hr: Optional[int] = None
    for m in _ARTICLE_RELATED_SECTION_WITH_HR_RE.finditer(window):
        last_hr = m.start()
    last_grid: Optional[int] = None
    for m in _ARTICLE_RELATED_SECTION_NO_HR_RE.finditer(window):
        last_grid = m.start()
    candidates = [p for p in (last_hr, last_grid) if p is not None]
    if candidates:
        return max(candidates)
    return None


def inject_article_explore_gate(html: str, *, variant: str) -> str:
    link = '<link rel="stylesheet" href="css/insights-explore.css" id="nf-insights-explore-article-gate-css">'
    html, _ = _ARTICLE_EXPLORE_GATE_RE.subn("", html, count=1)

    gate = _ARTICLE_EXPLORE_GATE_INSIGHTS if variant == "insights" else _ARTICLE_EXPLORE_GATE_ENGINEERING
    ins = _article_explore_gate_insertion_index(html)
    if ins is not None:
        out = html[:ins] + gate + html[ins:]
    else:
        idx = html.rfind("</main>")
        if idx == -1:
            raise RuntimeError("Article explore gate: no </main> and no you-may-also-like section")
        out = html[:idx] + gate + html[idx:]

    if "insights-explore.css" not in out and link not in out:
        out = out.replace("</head>", link + "</head>", 1)
    if "mirror-insights-iter8-9-signup.js" not in out:
        out = out.replace("</head>", _ARTICLE_FLOAT_SIGNUP_SCRIPT + "</head>", 1)
    return out


def build_layout_hub_page(source_text: str) -> str:
    """Hub index: same mirror head + global nav as Insights, with layout switcher and card links."""
    raw = strip_pre_mirror_explore_bar(source_text)
    raw = re.sub(
        r'(<header class="font-sans.*?</header>)',
        replacement_header(None, brand_dropdown=False) + r"\1",
        raw,
        count=1,
        flags=re.DOTALL,
    )
    raw = re.sub(r"<title>.*?</title>", "<title>Insights Hub — layout explorations</title>", raw, count=1)
    hub_inner = """
    <style>
      .nf-explore-hub-wrap { max-width: 960px; margin: 0 auto; padding: 48px 40px 80px; }
      .nf-explore-hub-wrap h1 { font-size: clamp(1.6rem, 3vw, 2.4rem); margin: 0 0 12px; font-family: Inter, system-ui, sans-serif; }
      .nf-explore-hub-wrap p.lead { margin: 0 0 8px; color: #475569; line-height: 1.5; max-width: 640px; font-family: Inter, system-ui, sans-serif; }
      .nf-explore-hub-wrap p.note { margin: 0 0 28px; font-size: 12px; color: #64748b; font-family: Inter, system-ui, sans-serif; }
      .nf-explore-hub-grid { display: grid; gap: 16px; font-family: Inter, system-ui, sans-serif; }
      @media (min-width: 720px) { .nf-explore-hub-grid { grid-template-columns: repeat(3, 1fr); } }
      .nf-explore-hub-card {
        background: #fff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px;
        display: flex; flex-direction: column; gap: 10px; min-height: 120px;
      }
      html.dark .nf-explore-hub-card { background: #1e293b; border-color: #475569; }
      .nf-explore-hub-card h2 { margin: 0; font-size: 1.05rem; color: #0f172a; }
      html.dark .nf-explore-hub-card h2 { color: #f8fafc; }
      .nf-explore-hub-card p { margin: 0; font-size: 0.9rem; color: #475569; line-height: 1.45; flex: 1; }
      html.dark .nf-explore-hub-card p { color: #94a3b8; }
      .nf-explore-hub-card a {
        display: inline-block; margin-top: 4px; font-weight: 600; font-size: 0.85rem;
        color: #0f172a; text-decoration: none; padding: 8px 12px; border-radius: 8px;
        background: #92f279; align-self: flex-start;
      }
      .nf-explore-hub-card a:hover { filter: brightness(0.95); }
    </style>
    <div class="nf-explore-hub-wrap">
    <h1>Insights Hub</h1>
    <p class="lead">Layout explorations use the same site header and navigation as the main Insights page, with a different article treatment per iteration. On Community nav, hover <strong>Insights</strong> in the site header for a link to the Engineering Community page.</p>
    <p class="note">Left rail uses plain CSS for the two-column shell (not Tailwind utilities), so the sidebar stays narrow and the feed fills the remaining width.</p>
    <div class="nf-explore-hub-grid">
      <article class="nf-explore-hub-card">
        <h2>Default</h2>
        <p>Production-style Insights index: mosaic primary grid, topic tabs, and the same layout switcher as every exploration page.</p>
        <a href="insights.html">Open default</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Mosaic</h2>
        <p>Bento-style primary grid from the main Insights CSS, plus a denser 3-column secondary river for discovery.</p>
        <a href="insights-explore-mosaic.html">Open mosaic</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Left rail + rows</h2>
        <p>Sticky topic rail replaces the top tab row. Articles are horizontal rows (image + copy), not mosaic tiles.</p>
        <a href="insights-explore-leftnav.html">Open left rail</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Timeline list</h2>
        <p>Vertical timeline rail with dot markers, hero images on each card, and relaxed stack spacing (tag chips still hidden for clarity).</p>
        <a href="insights-explore-list.html">Open timeline</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Community nav</h2>
        <p>Same listing as default; hover <strong>Insights</strong> in the site header for a dropdown to the Engineering Community page (technical articles live there).</p>
        <a href="insights-explore-community-nav.html">Open Community nav</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Iteration 6</h2>
        <p>Starts from the default listing and body class <code>nf-explore-page-iter6</code> — add scoped rules in <code>insights-explore.css</code> when you are ready.</p>
        <a href="insights-explore-iter6.html">Open iteration 6</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Iteration 7</h2>
        <p>Full redesign prototype: consolidated topics, format and industry filters, featured hero, append-only load more, and clear separation of Insights vs Engineering Community streams on one page.</p>
        <a href="insights-explore-iter7.html">Open iteration 7</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Iteration 8</h2>
        <p>Insights and Engineering as equal global nav destinations, with separate listing pages and cross-stream CTAs.</p>
        <a href="insights-explore-iter8.html">Open iteration 8</a>
      </article>
      <article class="nf-explore-hub-card">
        <h2>Iteration 9</h2>
        <p>Insights as primary nav with Engineering nested in a dropdown; paired listing pages mirror iteration 8.</p>
        <a href="insights-explore-iter9.html">Open iteration 9</a>
      </article>
    </div>
    </div>
    """
    hub_main = (
        '<main class="flex flex-col transition-colors duration-[600ms] ease-in-out '
        'dark:bg-nf-deep-navy green:bg-nf-green">'
        f"{hub_inner}"
        "</main>"
    )
    raw = re.sub(
        r"<main[^>]+>.*?</main>",
        hub_main,
        raw,
        count=1,
        flags=re.DOTALL,
    )
    return raw


def main() -> None:
    source_text = SOURCE.read_text(encoding="utf-8")
    raw = strip_pre_mirror_explore_bar(source_text)

    pages = [
        (
            "insights-explore-mosaic.html",
            "nf-explore-page-mosaic",
            "Insights — Mosaic layout",
            "mosaic",
            "mosaic",
        ),
        (
            "insights-explore-leftnav.html",
            "nf-explore-page-leftnav",
            "Insights — Left rail + rows",
            "leftnav",
            "leftnav",
        ),
        (
            "insights-explore-list.html",
            "nf-explore-page-list",
            "Insights — Timeline list",
            "list",
            "list",
        ),
        (
            "insights-explore-community-nav.html",
            "nf-explore-page-community-nav",
            "Insights — Community nav",
            "community_nav",
            "community",
        ),
        (
            "insights-explore-iter6.html",
            "nf-explore-page-iter6",
            "Insights — Iteration 6",
            "iter6",
            "iter6",
        ),
        (
            "insights-explore-iter7.html",
            "nf-explore-page-iter7",
            "Insights — Iteration 7",
            "iter7",
            "iter7",
        ),
    ]

    for filename, body_class, title, header_active, mode in pages:
        out = apply_page(
            raw,
            body_class=body_class,
            title=title,
            header_active=header_active,
            mode=mode,
            brand_dropdown=False,
        )
        if filename == "insights-explore-iter7.html":
            out = apply_iter7_only_patches(out)
        (MIRROR / filename).write_text(out, encoding="utf-8")
        print("wrote", filename)

    iter7_html = (MIRROR / "insights-explore-iter7.html").read_text(encoding="utf-8")

    iter8_ins = patch_insights_listing_iter789(
        iter7_html,
        iteration="8",
        nav_mode="iter8_peer",
        explore_active="iter8",
        title="Insights — Iteration 8",
        body_class="nf-explore-page-iter8-insights",
    )
    (MIRROR / "insights-explore-iter8.html").write_text(iter8_ins, encoding="utf-8")
    print("wrote insights-explore-iter8.html")

    iter9_ins = patch_insights_listing_iter789(
        iter7_html,
        iteration="9",
        nav_mode="iter9_dropdown",
        explore_active="iter9",
        title="Insights — Iteration 9",
        body_class="nf-explore-page-iter9-insights",
    )
    (MIRROR / "insights-explore-iter9.html").write_text(iter9_ins, encoding="utf-8")
    print("wrote insights-explore-iter9.html")

    eng_src = (MIRROR / "insights-engineering-community.html").read_text(encoding="utf-8")

    iter8_eng = build_engineering_listing_iter789(
        eng_src,
        iteration="8",
        nav_mode="iter8_peer",
        explore_active="iter8",
        title="Engineering — Iteration 8",
        body_class="nf-explore-page-iter8-engineering",
    )
    (MIRROR / "insights-explore-iter8-engineering.html").write_text(iter8_eng, encoding="utf-8")
    print("wrote insights-explore-iter8-engineering.html")

    iter9_eng = build_engineering_listing_iter789(
        eng_src,
        iteration="9",
        nav_mode="iter9_dropdown",
        explore_active="iter9",
        title="Engineering — Iteration 9",
        body_class="nf-explore-page-iter9-engineering",
    )
    (MIRROR / "insights-explore-iter9-engineering.html").write_text(iter9_eng, encoding="utf-8")
    print("wrote insights-explore-iter9-engineering.html")

    hub = build_layout_hub_page(source_text)
    (MIRROR / "insights-explore.html").write_text(hub, encoding="utf-8")
    print("wrote insights-explore.html")

    patch_all_insight_article_explore_gates(MIRROR)


if __name__ == "__main__":
    main()
