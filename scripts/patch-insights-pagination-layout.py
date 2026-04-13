#!/usr/bin/env python3
"""
Apply the same Insights index layout (tabs, filters, feature+river feeds) to
paginated listing pages (insights_*.html, digital-community_*.html) so
"Load More" does not revert to the old two-column grid.

Idempotent: skips files that already look fully patched.
"""

from __future__ import annotations

import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIRROR = os.path.join(ROOT, "site-mirror")

TAB_SNIPPET = (
    '<div class="nf-insights-topic-tabs pt-2" data-nf-insights-tabs="">'
    '<div role="tablist" aria-label="Browse insights by topic" class="nf-insights-topic-tabs__list">'
    '<button type="button" role="tab" id="nf-insights-tab-all" aria-selected="true" '
    'aria-controls="nf-insights-pill-panel" data-nf-tab-topic="all" class="nf-insights-topic-tabs__tab">'
    "All topics</button>"
    '<button type="button" role="tab" id="nf-insights-tab-build" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="build" '
    'class="nf-insights-topic-tabs__tab">Build &amp; stacks</button>'
    '<button type="button" role="tab" id="nf-insights-tab-ai-data" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="ai-data" '
    'class="nf-insights-topic-tabs__tab">AI &amp; data</button>'
    '<button type="button" role="tab" id="nf-insights-tab-cloud" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="cloud" '
    'class="nf-insights-topic-tabs__tab">Cloud &amp; platforms</button>'
    '<button type="button" role="tab" id="nf-insights-tab-product" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="product" '
    'class="nf-insights-topic-tabs__tab">Product &amp; UX</button>'
    '<button type="button" role="tab" id="nf-insights-tab-strategy" aria-selected="false" '
    'aria-controls="nf-insights-pill-panel" tabindex="-1" data-nf-tab-topic="strategy" '
    'class="nf-insights-topic-tabs__tab">Strategy &amp; change</button>'
    "</div>"
    '<div id="nf-insights-pill-panel" role="tabpanel" aria-labelledby="nf-insights-tab-all" '
    'class="nf-insights-topic-tabs__panel nf-insights-topic-tabs__panel-body">'
    '<span id="nf-insights-tab-status" class="nf-insights-tab-status" aria-live="polite"></span>'
    "</div></div></div>"
)

TAB_SECTION = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-0">'
    '<div class="w-full max-w-[1600px] mx-auto"><div>'
    + TAB_SNIPPET
    + "</div></div></section>"
)

SCROLL_TRIGGER = '<div class="w-full opacity-0 h-1" data-type="scroll-trigger-dark"></div>'

# Original scraped tag filter row (pagination links to insights_N / digital-community_N).
PILL_FILTER_SECTION_OPEN = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-0">'
    '<div class="w-full max-w-[1600px] mx-auto"><div>'
    '<div class="flex flex-wrap gap-1 pt-2 lg:gap-3">'
)

TOPIC_BY_SLUG = {
    "sanity": "build",
    "urql": "build",
    "d3": "build",
    "react": "build",
    "backend": "build",
    "next-js": "build",
    "react-native": "build",
    "node-js": "build",
    "redux": "build",
    "victory": "build",
    "graphql": "build",
    "developer-tools": "build",
    "ai": "ai-data",
    "data": "ai-data",
    "cloud": "cloud",
    "devops": "cloud",
    "platform": "cloud",
    "engineering": "cloud",
    "design": "product",
    "product": "product",
    "mobile": "product",
    "content": "product",
    "capability": "product",
    "modernisation": "strategy",
    "strategy": "strategy",
    "open-source": "strategy",
}

FLAIR_NEEDLE = '<script src="js/mirror-flair.js" defer=""></script>'
TABS_SCRIPT = (
    '<script src="js/mirror-flair.js" defer=""></script>'
    '<script src="js/mirror-insights-tabs.js" defer=""></script>'
    '<script src="js/mirror-insights-card-cta.js" defer=""></script>'
)
TABS_ONLY = '<script src="js/mirror-insights-tabs.js" defer=""></script>'
CARD_CTA_SCRIPT = '<script src="js/mirror-insights-card-cta.js" defer=""></script>'

MOBILE_OLD = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 md:hidden">'
    '<div class="w-full max-w-[1600px] mx-auto"><div>'
)
MOBILE_PRI = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 md:hidden '
    'nf-insights-feed nf-insights-feed--primary"><div class="w-full max-w-[1600px] mx-auto">'
    '<div class="nf-insights-feed-list nf-insights-feed-list--stack">'
)
MOBILE_SEC = (
    '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 md:hidden '
    'nf-insights-feed nf-insights-feed--secondary"><div class="w-full max-w-[1600px] mx-auto">'
    '<div class="nf-insights-feed-list nf-insights-feed-list--stack">'
)

DESKTOP_OLD = (
    '<section class="w-full items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 hidden md:block">'
    '<div class="w-full max-w-[1600px] mx-auto"><div class="grid grid-cols-2 gap-12">'
)
DESKTOP_PRI = (
    '<section class="w-full items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 hidden md:block '
    'nf-insights-feed nf-insights-feed--primary"><div class="w-full max-w-[1600px] mx-auto">'
    '<div class="nf-insights-feed-list nf-insights-feed-list--stack">'
)
DESKTOP_SEC = (
    '<section class="w-full items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 hidden md:block '
    'nf-insights-feed nf-insights-feed--secondary"><div class="w-full max-w-[1600px] mx-auto">'
    '<div class="nf-insights-feed-list nf-insights-feed-list--stack">'
)

CARD_OPEN = '<div class="mb-8"><a class="group overflow-hidden block mb-4 w-full"'


def consume_div_root(sub: str) -> int:
    depth = 0
    i = 0
    while i < len(sub):
        if sub[i : i + 4] == "<div" and (i + 4 >= len(sub) or sub[i + 4] in " >"):
            depth += 1
            i += 4
            continue
        if sub[i : i + 6] == "</div>":
            depth -= 1
            i += 6
            if depth == 0:
                return i
            continue
        i += 1
    return -1


def topics_for_block(block: str) -> str:
    m = re.search(
        r'<a class="group overflow-hidden block mb-4 w-full" target="_self" href="([^"]+)"',
        block,
    )
    main_href = m.group(1) if m else None
    topics: list[str] = []
    seen: set[str] = set()
    for href, label in re.findall(
        r'<a target="_self" href="([^"]+)">([^<]+)</a>', block
    ):
        if main_href and href == main_href:
            continue
        slug = label.strip().lower()
        t = TOPIC_BY_SLUG.get(slug)
        if t and t not in seen:
            seen.add(t)
            topics.append(t)
    return " ".join(topics)


def tags_for_block(block: str) -> str:
    m = re.search(
        r'<a class="group overflow-hidden block mb-4 w-full" target="_self" href="([^"]+)"',
        block,
    )
    main_href = m.group(1) if m else None
    tags: list[str] = []
    seen: set[str] = set()
    for href, label in re.findall(
        r'<a target="_self" href="([^"]+)">([^<]+)</a>', block
    ):
        if main_href and href == main_href:
            continue
        slug = label.strip().lower()
        if slug and slug not in seen:
            seen.add(slug)
            tags.append(slug)
    return " ".join(tags)


def is_listing_page(s: str) -> bool:
    return CARD_OPEN in s or 'class="grid grid-cols-2 gap-12"' in s


def already_patched(s: str) -> bool:
    return (
        "nf-insights-index" in s
        and "data-nf-insights-tabs" in s
        and "nf-insights-feed--primary" in s
        and "nf-insights-article-card" in s
    )


def patch_card_cta_script(s: str) -> tuple[str, bool]:
    """Append card CTA script after tabs when missing (idempotent)."""
    if "mirror-insights-card-cta.js" in s:
        return s, False
    if TABS_ONLY not in s:
        return s, False
    s = s.replace(
        TABS_ONLY,
        TABS_ONLY + CARD_CTA_SCRIPT,
        1,
    )
    return s, True


def patch_body_and_script(s: str) -> str:
    if 'class="nf-insights-index"' not in s and '<body data-nf-layout="default">' in s:
        s = s.replace(
            '<body data-nf-layout="default">',
            '<body data-nf-layout="default" class="nf-insights-index">',
            1,
        )
    if "mirror-insights-tabs.js" not in s and FLAIR_NEEDLE in s:
        s = s.replace(FLAIR_NEEDLE, TABS_SCRIPT, 1)
    else:
        s, _ = patch_card_cta_script(s)
    return s


def fix_paginated_filter_tabs(s: str) -> tuple[str, bool]:
    """
    Paginated mirrors had tabs inserted immediately before the scroll trigger (near the
    bottom) while the old pill row stayed at the top. Move tabs to replace that pill
    section and remove the duplicate tab block before the scroll trigger.
    Idempotent.
    """
    changed = False
    j = s.find(PILL_FILTER_SECTION_OPEN)
    if j != -1:
        k = s.find("</section>", j)
        if k != -1:
            pill_block = s[j : k + len("</section>")]
            if 'href="insights_' in pill_block or 'href="digital-community_' in pill_block:
                s = s[:j] + TAB_SECTION + s[k + len("</section>") :]
                changed = True
    combo = TAB_SECTION + SCROLL_TRIGGER
    if combo in s:
        s = s.replace(combo, SCROLL_TRIGGER, 1)
        changed = True
    return s, changed


def insert_tab_section(s: str) -> str:
    if "data-nf-insights-tabs" in s:
        return s
    if SCROLL_TRIGGER in s:
        return s.replace(
            SCROLL_TRIGGER,
            TAB_SECTION + SCROLL_TRIGGER,
            1,
        )
    mob = '<section class="w-full flex items-center px-5 md:px-7 lg:px-8 pt-16 pb-12 md:hidden">'
    j = s.find(mob)
    if j == -1:
        return s
    return s[:j] + TAB_SECTION + s[j:]


def patch_feed_sections(s: str) -> str:
    if s.count(MOBILE_OLD) >= 1:
        s = s.replace(MOBILE_OLD, MOBILE_PRI, 1)
    if s.count(MOBILE_OLD) >= 1:
        s = s.replace(MOBILE_OLD, MOBILE_SEC, 1)

    if s.count(DESKTOP_OLD) >= 1:
        s = s.replace(DESKTOP_OLD, DESKTOP_PRI, 1)
    if s.count(DESKTOP_OLD) >= 1:
        s = s.replace(DESKTOP_OLD, DESKTOP_SEC, 1)
    return s


def patch_article_cards(s: str) -> str:
    pos = 0
    while True:
        j = s.find(CARD_OPEN, pos)
        if j < 0:
            break
        inner_end = j + consume_div_root(s[j:])
        if inner_end < 0:
            break
        block = s[j:inner_end]
        k = block.find('><a class="group overflow-hidden block mb-4 w-full')
        if k < 0:
            pos = j + 1
            continue
        if "data-nf-insight-card" in block[: k + 5]:
            pos = inner_end
            continue
        topics = topics_for_block(block)
        tags = tags_for_block(block)
        new_open = (
            '<div class="mb-8 nf-insights-article-card" data-nf-insight-card '
            f'data-nf-insight-topics="{topics}" data-nf-insight-tags="{tags}">'
            '<a class="group overflow-hidden block mb-4 w-full"'
        )
        new_block = new_open + block[len(CARD_OPEN) :]
        s = s[:j] + new_block + s[inner_end:]
        pos = j + len(new_block)
    return s


def patch_file(path: str) -> bool:
    with open(path, encoding="utf-8") as f:
        s = f.read()

    if not is_listing_page(s):
        return False
    if already_patched(s):
        return False

    s = patch_body_and_script(s)
    s = insert_tab_section(s)
    s = patch_feed_sections(s)
    s = patch_article_cards(s)
    s, _ = fix_paginated_filter_tabs(s)
    s, _ = patch_card_cta_script(s)

    with open(path, "w", encoding="utf-8") as f:
        f.write(s)
    return True


def main() -> int:
    patterns = [
        os.path.join(MIRROR, "insights_*.html"),
        os.path.join(MIRROR, "digital-community_*.html"),
    ]
    done = 0
    fixed_tabs = 0
    fixed_cta = 0
    for pat in patterns:
        for path in sorted(glob.glob(pat)):
            base = os.path.basename(path)
            if base == "insights.html":
                continue
            try:
                if patch_file(path):
                    done += 1
                    print("patched", base)
            except Exception as e:
                print("error", base, e, file=sys.stderr)
                return 1
    # Re-run tab placement fix on already-patched pages (pill row + duplicate tabs).
    # Do not gate on is_listing_page(): patched files use nf-insights-article-card markup.
    for pat in patterns:
        for path in sorted(glob.glob(pat)):
            base = os.path.basename(path)
            if base == "insights.html":
                continue
            try:
                with open(path, encoding="utf-8") as f:
                    s = f.read()
                s2, ch = fix_paginated_filter_tabs(s)
                if ch:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(s2)
                    fixed_tabs += 1
                    print("fixed filter tabs", base)
            except Exception as e:
                print("error", base, e, file=sys.stderr)
                return 1
    # Add Learn-more card script to paginated pages that already had tabs only.
    for pat in patterns:
        for path in sorted(glob.glob(pat)):
            base = os.path.basename(path)
            if base == "insights.html":
                continue
            try:
                with open(path, encoding="utf-8") as f:
                    s = f.read()
                s2, ch = patch_card_cta_script(s)
                if ch:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(s2)
                    fixed_cta += 1
                    print("added card CTA script", base)
            except Exception as e:
                print("error", base, e, file=sys.stderr)
                return 1
    print("total patched:", done)
    print("total filter tab fixes:", fixed_tabs)
    print("total card CTA script inserts:", fixed_cta)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
