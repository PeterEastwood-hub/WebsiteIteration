#!/usr/bin/env python3
"""
Build distinct Insights exploration pages from insights.html:
  - insights-explore-mosaic.html        — mosaic / dense discovery grid
  - insights-explore-leftnav.html       — sticky left rail replaces horizontal tabs
  - insights-explore-list.html          — simple list scan
  - insights-explore-community-nav.html — Insights brand hover → Engineering Community link

Regenerate after editing insights.html (and after node scripts/split-insights-engineering-community.mjs
when splitting community articles).
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIRROR = ROOT / "site-mirror"
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


def replacement_header(active: str | None, *, brand_dropdown: bool = False) -> str:
    """active: default | mosaic | leftnav | list | community_nav | None (no pill highlighted)."""
    links = [
        ("insights.html", "default", "Default"),
        ("insights-explore-mosaic.html", "mosaic", "Mosaic"),
        ("insights-explore-leftnav.html", "leftnav", "Left rail"),
        ("insights-explore-list.html", "list", "Timeline"),
        ("insights-explore-community-nav.html", "community_nav", "Community nav"),
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
    """mode: mosaic | leftnav | list | community (no extra transforms)"""
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

    # Keep nf-insights-with-layout-switcher so fixed global header offsets below the explore bar.
    body_switcher = (
        '<body data-nf-layout="default" class="nf-insights-index '
        'nf-insights-with-layout-switcher">'
    )
    body_out = (
        '<body data-nf-layout="default" class="nf-insights-index '
        f'nf-insights-with-layout-switcher {body_class}">'
    )
    if body_switcher in html:
        html = html.replace(body_switcher, body_out, 1)
    else:
        html = html.replace(
            '<body data-nf-layout="default" class="nf-insights-index">',
            body_out,
            1,
        )

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
    raw = re.sub(r"<title>.*?</title>", "<title>Insights — Layout explorations</title>", raw, count=1)
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
    <h1>Insights layout explorations</h1>
    <p class="lead">Each link uses the same site header and navigation as the main Insights page, with a different article layout. On Community nav, hover <strong>Insights</strong> in the site header for a link to the Engineering Community page.</p>
    <p class="note">Left rail uses plain CSS for the two-column shell (not Tailwind utilities), so the sidebar stays narrow and the feed fills the remaining width.</p>
    <div class="nf-explore-hub-grid">
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
        (MIRROR / filename).write_text(out, encoding="utf-8")
        print("wrote", filename)

    hub = build_layout_hub_page(source_text)
    (MIRROR / "insights-explore.html").write_text(hub, encoding="utf-8")
    print("wrote insights-explore.html")


if __name__ == "__main__":
    main()
