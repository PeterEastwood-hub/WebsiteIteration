#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIRROR = ROOT / "site-mirror"
SOURCE = MIRROR / "insights.html"

VARIANTS = [
    ("insights-variant-1.html", "Variation 1 - Spacious editorial"),
    ("insights-variant-2.html", "Variation 2 - Compact two-column"),
    ("insights-variant-3.html", "Variation 3 - Focused reading lane"),
    ("insights-variant-4.html", "Variation 4 - Dense card wall"),
    ("insights-variant-5.html", "Variation 5 - Magazine feature split"),
    ("insights-variant-6.html", "Variation 6 - Sidebar highlights"),
    ("insights-variant-7.html", "Variation 7 - Minimal list scan"),
    ("insights-variant-8.html", "Variation 8 - Mosaic cards"),
    ("insights-variant-9.html", "Variation 9 - Left rail + horizontal cards"),
    ("insights-variant-10.html", "Variation 10 - Left rail + author spotlight"),
    ("insights-variant-11.html", "Variation 11 - Left rail + alternating stories"),
]


def nav_markup(active_idx: int) -> str:
    links = []
    for i, (filename, _) in enumerate(VARIANTS, start=1):
        cls = "nf-v-link is-active" if i == active_idx else "nf-v-link"
        links.append(f'<a class="{cls}" href="{filename}">V{i}</a>')
    return "".join(links)


def replacement_header(active_idx: int, label: str) -> str:
    return (
        '<header class="nf-variant-header">'
        '<div class="nf-variant-header__inner">'
        '<a class="nf-brand" href="insights-variant-1.html">Insights</a>'
        f'<div class="nf-variant-switch" aria-label="Insights variations">{nav_markup(active_idx)}</div>'
        '</div>'
        f'<div class="nf-variant-label">{label}</div>'
        "</header>"
    )


BASE_STYLE = """
<style id="insights-variation-styles">
.nf-variant-header{position:sticky;top:0;z-index:900;background:#f6f7f9;border-bottom:1px solid #d8dde6}
.nf-variant-header__inner{max-width:1600px;margin:0 auto;padding:16px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.nf-brand{font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#121826;text-decoration:none}
.nf-variant-switch{display:flex;gap:8px;flex-wrap:wrap}
.nf-v-link{font:600 12px/1 Inter,Arial,sans-serif;padding:8px 12px;border-radius:999px;border:1px solid #c7d0dd;color:#243040;text-decoration:none}
.nf-v-link.is-active{background:#92f279;color:#101510;border-color:#92f279}
.nf-variant-label{max-width:1600px;margin:0 auto;padding:0 28px 14px;font:500 13px/1.2 Inter,Arial,sans-serif;color:#3a4657}
body.nf-insights-variant{padding-top:0}
body.nf-insights-variant .w-full.opacity-0.h-1[data-type="scroll-trigger-dark"]{display:none}
body.nf-insights-variant .nf-insights-topic-tabs{margin-top:8px}
.nf-left-rail{display:none}
@media (max-width: 900px){.nf-variant-header__inner{padding:14px 18px}.nf-variant-label{padding:0 18px 12px}}

/* V1: spacious editorial */
body.nf-insights-variant-1 .nf-insights-feed-list{max-width:1120px}
body.nf-insights-variant-1 .nf-insights-article-card{margin-bottom:48px !important}
body.nf-insights-variant-1 .nf-insights-article-card h2{font-size:clamp(1.45rem,2vw,2.1rem)}

/* V2: compact two-column river */
@media (min-width: 1024px){
  body.nf-insights-variant-2 .nf-insights-feed--secondary .nf-insights-feed-list{
    display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px
  }
  body.nf-insights-variant-2 .nf-insights-feed--secondary .nf-insights-article-card{margin-bottom:0 !important}
  body.nf-insights-variant-2 .nf-insights-feed--primary .nf-insights-article-card h2{font-size:2rem}
}

/* V3: single reading lane with sticky filter rail feel */
@media (min-width: 1024px){
  body.nf-insights-variant-3 .nf-insights-topic-tabs{position:sticky;top:86px;z-index:200;background:#fff;padding-top:12px}
  body.nf-insights-variant-3 .nf-insights-feed-list{max-width:860px;margin:0 auto}
  body.nf-insights-variant-3 .nf-insights-article-card h2{font-size:2rem;line-height:1.15}
}

/* V4: dense card wall */
@media (min-width: 1200px){
  body.nf-insights-variant-4 .nf-insights-feed--secondary .nf-insights-feed-list{
    display:grid !important;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px
  }
  body.nf-insights-variant-4 .nf-insights-feed--secondary .nf-insights-article-card{margin-bottom:0 !important}
  body.nf-insights-variant-4 .nf-insights-feed--secondary .nf-insights-article-card img{aspect-ratio:16/10;object-fit:cover}
}

/* V5: magazine feature split */
@media (min-width: 1024px){
  body.nf-insights-variant-5 .nf-insights-feed--primary .nf-insights-feed-list{
    display:grid !important;grid-template-columns:1.35fr .85fr;gap:28px;align-items:start
  }
  body.nf-insights-variant-5 .nf-insights-feed--primary .nf-insights-article-card:first-child{
    border-right:1px solid #e3e8f0;padding-right:26px;margin-bottom:0 !important
  }
  body.nf-insights-variant-5 .nf-insights-feed--primary .nf-insights-article-card:last-child{
    padding-top:18px;margin-bottom:0 !important
  }
}

/* V6: sidebar highlights */
@media (min-width: 1200px){
  body.nf-insights-variant-6 .nf-insights-feed--secondary .nf-insights-feed-list{
    display:grid !important;grid-template-columns:2fr 1fr;gap:30px
  }
  body.nf-insights-variant-6 .nf-insights-feed--secondary .nf-insights-article-card:nth-child(3n){
    border:1px solid #dfe6f1;border-radius:14px;padding:16px
  }
}

/* V7: minimal list scan */
body.nf-insights-variant-7 .nf-insights-article-card img{display:none}
body.nf-insights-variant-7 .nf-insights-article-card{padding:16px 0;border-bottom:1px solid #e4e8ef}
body.nf-insights-variant-7 .nf-insights-feed-list{max-width:980px}
body.nf-insights-variant-7 .nf-insights-article-card h2{font-size:clamp(1.2rem,1.8vw,1.55rem)}

/* V8: mosaic cards */
@media (min-width: 1200px){
  body.nf-insights-variant-8 .nf-insights-feed--secondary .nf-insights-feed-list{
    display:grid !important;grid-template-columns:repeat(12,minmax(0,1fr));gap:20px
  }
  body.nf-insights-variant-8 .nf-insights-feed--secondary .nf-insights-article-card{
    grid-column:span 4;margin-bottom:0 !important
  }
  body.nf-insights-variant-8 .nf-insights-feed--secondary .nf-insights-article-card:nth-child(6n+1){
    grid-column:span 8
  }
  body.nf-insights-variant-8 .nf-insights-feed--secondary .nf-insights-article-card img{aspect-ratio:3/2;object-fit:cover}
}

/* Shared left-rail treatment for V9-V11 */
@media (min-width: 1200px){
  body.nf-insights-variant-9 .nf-left-rail,
  body.nf-insights-variant-10 .nf-left-rail,
  body.nf-insights-variant-11 .nf-left-rail{
    display:block;position:fixed;left:26px;top:156px;width:220px;z-index:260;
    background:#fff;border:1px solid #dce4f0;border-radius:14px;padding:14px 12px;
  }
  body.nf-insights-variant-9 .nf-left-rail h4,
  body.nf-insights-variant-10 .nf-left-rail h4,
  body.nf-insights-variant-11 .nf-left-rail h4{
    margin:0 0 10px;font:700 12px/1.2 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#1d2a3b;
  }
  body.nf-insights-variant-9 .nf-left-rail a,
  body.nf-insights-variant-10 .nf-left-rail a,
  body.nf-insights-variant-11 .nf-left-rail a{
    display:block;padding:7px 8px;margin:2px 0;border-radius:8px;text-decoration:none;color:#2b3a4f;font:500 13px/1.2 Inter,Arial,sans-serif;
  }
  body.nf-insights-variant-9 .nf-left-rail a:hover,
  body.nf-insights-variant-10 .nf-left-rail a:hover,
  body.nf-insights-variant-11 .nf-left-rail a:hover{background:#edf3ff}
  body.nf-insights-variant-9 .nf-insights-feed,
  body.nf-insights-variant-10 .nf-insights-feed,
  body.nf-insights-variant-11 .nf-insights-feed{padding-left:250px !important}
  body.nf-insights-variant-9 .nf-insights-topic-tabs,
  body.nf-insights-variant-10 .nf-insights-topic-tabs,
  body.nf-insights-variant-11 .nf-insights-topic-tabs{margin-left:250px}
  body.nf-insights-variant-9 .nf-insights-article-card .flex.gap-3 span:nth-child(2),
  body.nf-insights-variant-10 .nf-insights-article-card .flex.gap-3 span:nth-child(2),
  body.nf-insights-variant-11 .nf-insights-article-card .flex.gap-3 span:nth-child(2){display:none}
}

/* V9: left rail + horizontal cards */
@media (min-width: 1200px){
  body.nf-insights-variant-9 .nf-insights-feed--secondary .nf-insights-article-card{
    display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start;border-bottom:1px solid #e4eaf4;padding-bottom:22px;
  }
  body.nf-insights-variant-9 .nf-insights-feed--secondary .nf-insights-article-card > a{margin-bottom:0 !important}
  body.nf-insights-variant-9 .nf-insights-feed--secondary .nf-insights-article-card img{aspect-ratio:16/10;object-fit:cover}
}

/* V10: left rail + author spotlight blocks */
@media (min-width: 1200px){
  body.nf-insights-variant-10 .nf-insights-feed--secondary .nf-insights-feed-list{
    display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px
  }
  body.nf-insights-variant-10 .nf-insights-feed--secondary .nf-insights-article-card{
    border:1px solid #dbe4f0;border-radius:14px;padding:14px;background:#fff;margin-bottom:0 !important;
  }
  body.nf-insights-variant-10 .nf-insights-feed--secondary .nf-insights-article-card .flex.gap-3{
    margin-top:10px;padding-top:10px;border-top:1px solid #e8edf5;
  }
}

/* V11: left rail + alternating story rhythm */
@media (min-width: 1200px){
  body.nf-insights-variant-11 .nf-insights-feed--secondary .nf-insights-article-card{
    display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:center;border-bottom:1px solid #e5ebf4;padding:16px 0 22px;
  }
  body.nf-insights-variant-11 .nf-insights-feed--secondary .nf-insights-article-card:nth-child(even) > a{order:2}
  body.nf-insights-variant-11 .nf-insights-feed--secondary .nf-insights-article-card:nth-child(even) > div{order:1}
  body.nf-insights-variant-11 .nf-insights-feed--secondary .nf-insights-article-card > a{margin-bottom:0 !important}
  body.nf-insights-variant-11 .nf-insights-feed--secondary .nf-insights-article-card img{aspect-ratio:21/9;object-fit:cover}
}
</style>
""".strip()

LEFT_RAIL = (
    '<aside class="nf-left-rail" aria-label="Insights side navigation">'
    "<h4>Navigate</h4>"
    '<a href="insights-variants.html">All variations</a>'
    '<a href="insights_2.html">AI</a>'
    '<a href="insights_4.html">Cloud</a>'
    '<a href="insights_6.html">Design</a>'
    '<a href="insights_11.html">Engineering</a>'
    '<a href="insights_31.html">Strategy</a>'
    "</aside>"
)


def build_pages() -> None:
    html = SOURCE.read_text(encoding="utf-8")
    header_match = re.search(r"<header.*?</header>", html, flags=re.DOTALL)
    if not header_match:
        raise RuntimeError("Could not locate header block in insights.html")

    for idx, (filename, label) in enumerate(VARIANTS, start=1):
        page = html
        page = page.replace(header_match.group(0), replacement_header(idx, label), 1)
        page = page.replace(
            '<body data-nf-layout="default" class="nf-insights-index">',
            f'<body data-nf-layout="default" class="nf-insights-index nf-insights-variant nf-insights-variant-{idx}">',
            1,
        )
        page = page.replace("</head>", BASE_STYLE + "</head>", 1)
        if idx >= 9:
            page = page.replace("</header>", "</header>" + LEFT_RAIL, 1)
        page = re.sub(r"<title>.*?</title>", f"<title>Insights | {label}</title>", page, count=1)
        (MIRROR / filename).write_text(page, encoding="utf-8")
        print("wrote", filename)


if __name__ == "__main__":
    build_pages()
