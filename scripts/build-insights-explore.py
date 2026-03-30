#!/usr/bin/env python3
"""
Build three sharply distinct Insights exploration pages from insights.html:
  - insights-explore-mosaic.html   — mosaic / dense discovery grid
  - insights-explore-leftnav.html — sticky left rail replaces horizontal tabs
  - insights-explore-list.html    — simple list scan

Regenerate after editing insights.html.
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


def replacement_header(active: str) -> str:
    """active: default | mosaic | leftnav | list"""
    links = [
        ("insights.html", "default", "Default"),
        ("insights-explore-mosaic.html", "mosaic", "Mosaic"),
        ("insights-explore-leftnav.html", "leftnav", "Left rail"),
        ("insights-explore-list.html", "list", "Timeline"),
    ]
    nav = "".join(
        (f'<a class="is-active" href="{href}">{label}</a>' if key == active else f'<a href="{href}">{label}</a>')
        for href, key, label in links
    )
    return (
        '<header class="nf-explore-topbar">'
        '<div class="nf-explore-topbar__inner">'
        '<a class="nf-explore-brand" href="insights-explore.html">Insights</a>'
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
    """Remove layout switcher from insights.html so variant builds get a single top bar."""
    return re.sub(
        r'<header class="nf-explore-topbar">.*?</header>',
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )


def apply_page(
    html: str,
    *,
    body_class: str,
    title: str,
    header_active: str,
    mode: str,
) -> str:
    """mode: mosaic | leftnav | list"""
    # Header
    html = re.sub(r"<header class=\"font-sans.*?</header>", replacement_header(header_active), html, count=1, flags=re.DOTALL)

    # CSS (canonical listing may already load this with an id attribute)
    if "insights-explore.css" not in html:
        html = html.replace("</head>", f"{CSS_LINK}</head>", 1)

    # Body class (canonical listing may include nf-insights-with-layout-switcher)
    body_out = f'<body data-nf-layout="default" class="nf-insights-index {body_class}">'
    body_switcher = (
        '<body data-nf-layout="default" class="nf-insights-index '
        'nf-insights-with-layout-switcher">'
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

    return html


def main() -> None:
    raw = strip_pre_mirror_explore_bar(SOURCE.read_text(encoding="utf-8"))

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
    ]

    for filename, body_class, title, header_active, mode in pages:
        out = apply_page(
            raw,
            body_class=body_class,
            title=title,
            header_active=header_active,
            mode=mode,
        )
        (MIRROR / filename).write_text(out, encoding="utf-8")
        print("wrote", filename)

    hub = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Insights — Layout explorations</title>
  <link rel="stylesheet" href="css/insights-explore.css">
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f1f5f9; color: #0f172a; }
    .wrap { max-width: 960px; margin: 0 auto; padding: 48px 40px 80px; }
    h1 { font-size: clamp(1.6rem, 3vw, 2.4rem); margin: 0 0 12px; }
    p.lead { margin: 0 0 8px; color: #475569; line-height: 1.5; max-width: 640px; }
    p.note { margin: 0 0 28px; font-size: 12px; color: #64748b; }
    .grid { display: grid; gap: 16px; }
    @media (min-width: 720px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    .card {
      background: #fff;border: 1px solid #cbd5e1;border-radius: 14px;padding: 20px;
      display: flex; flex-direction: column; gap: 10px; min-height: 120px;
    }
    .card h2 { margin: 0; font-size: 1.05rem; }
    .card p { margin: 0; font-size: 0.9rem; color: #475569; line-height: 1.45; flex: 1; }
    .card a {
      display: inline-block; margin-top: 4px; font-weight: 600; font-size: 0.85rem;
      color: #0f172a; text-decoration: none; padding: 8px 12px; border-radius: 8px;
      background: #92f279; align-self: flex-start;
    }
    .card a:hover { filter: brightness(0.95); }
  </style>
</head>
<body>
  <header class="nf-explore-topbar"><div class="nf-explore-topbar__inner">
    <a class="nf-explore-brand" href="insights-explore.html">Insights</a>
    <nav class="nf-explore-switch" aria-label="Layout explorations">
      <a href="insights.html">Default</a>
      <a href="insights-explore-mosaic.html">Mosaic</a>
      <a href="insights-explore-leftnav.html">Left rail</a>
      <a href="insights-explore-list.html">Timeline</a>
    </nav>
  </div></header>
  <main class="wrap">
    <h1>Insights layout explorations</h1>
    <p class="lead">Three clearly different card systems: mosaic tiles, rail + horizontal rows, and a timeline list without thumbnails.</p>
    <p class="note">Left rail uses plain CSS for the two-column shell (not Tailwind utilities), so the sidebar stays narrow and the feed fills the remaining width.</p>
    <div class="grid">
      <article class="card">
        <h2>Mosaic</h2>
        <p>Bento-style primary grid from the main Insights CSS, plus a denser 3-column secondary river for discovery.</p>
        <a href="insights-explore-mosaic.html">Open mosaic</a>
      </article>
      <article class="card">
        <h2>Left rail + rows</h2>
        <p>Sticky topic rail replaces the top tab row. Articles are horizontal rows (image + copy), not mosaic tiles.</p>
        <a href="insights-explore-leftnav.html">Open left rail</a>
      </article>
      <article class="card">
        <h2>Timeline list</h2>
        <p>Vertical timeline rail with dot markers, hero images on each card, and relaxed stack spacing (tag chips still hidden for clarity).</p>
        <a href="insights-explore-list.html">Open timeline</a>
      </article>
    </div>
  </main>
</body>
</html>
"""
    (MIRROR / "insights-explore.html").write_text(hub, encoding="utf-8")
    print("wrote insights-explore.html")


if __name__ == "__main__":
    main()
