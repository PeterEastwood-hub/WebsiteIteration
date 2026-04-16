/**
 * Insights explore — iterations 8 & 9: featured hero on Insights and Engineering listings;
 * format/topic drawer is handled in mirror-insights-redesign.js (disabled for these pages).
 * Cross-stream modules at list foot; topic pills on cards are filter links (see mirror-insights-card-cta.js).
 */
(function () {
  var b = document.body;
  var is8i = b.classList.contains('nf-explore-page-iter8-insights');
  var is9i = b.classList.contains('nf-explore-page-iter9-insights');
  var is8e = b.classList.contains('nf-explore-page-iter8-engineering');
  var is9e = b.classList.contains('nf-explore-page-iter9-engineering');
  if (!is8i && !is9i && !is8e && !is9e) return;

  var engListing =
    is8i || is8e ? 'insights-explore-iter8-engineering.html' : 'insights-explore-iter9-engineering.html';

  var insListing =
    is8i || is8e ? 'insights-explore-iter8.html' : 'insights-explore-iter9.html';

  var HERO_INSIGHTS = {
    href: 'moving-beyond-the-hype-engineering-for-the-ai-era.html',
    title: 'Moving beyond the hype: Engineering for the AI era',
    img:
      'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_1600,h_900/Frame_9',
    excerpt:
      'Our teams and enterprise partners are leading this next wave of digital evolution, setting new standards in how software is conceived, built and trusted at scale.',
    author: 'Cian Clarke',
    date: '11 Mar 2026',
    read: '6 min read',
    format: 'Deep dive',
  };

  /** Same featured shell as Insights; article appears in the Engineering primary feed — duplicate row removed below. */
  var HERO_ENGINEERING = {
    href: 'implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html',
    title: 'WebMCP: Turning web pages into tools for AI agents',
    img:
      'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_1600,h_900/A_2',
    excerpt:
      'A practical walkthrough of the Model Context Protocol and how we wire real systems so agents can use your product surfaces safely and predictably.',
    author: 'Nearform',
    date: '10 Dec 2025',
    read: '8 min read',
    format: 'Tutorial',
  };

  /** Curated strategic / business Insights articles (mirrors cross-stream on Engineering listings). */
  var INSIGHTS_STREAM_CARDS = [
    {
      href: 'finops-isn-t-just-a-cost-saver-it-s-a-revenue-driver.html',
      title: 'FinOps isn’t just a cost saver — it’s a revenue driver',
      img: 'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_800,h_450/insights_10.jpg',
      format: 'Opinion',
      author: 'Dan Klose, Luca Lanziani',
      date: '14 Apr 2023',
    },
    {
      href: 'are-we-automating-inefficiency-with-ai-systems.html',
      title: 'Are we automating inefficiency with AI systems?',
      img:
        'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_800,h_450/Frame_91',
      format: 'Opinion',
      author: 'James Malone',
      date: '26 Aug 2025',
    },
    {
      href: 'beyond-borders-building-an-open-enterprise-that-attracts-top-tech-talent.html',
      title: 'Beyond borders: Building an open enterprise that attracts top tech talent',
      img: 'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_800,h_450/insights_7.jpg',
      format: 'Opinion',
      author: 'Damo Girling',
      date: '24 Aug 2023',
    },
  ];

  var COMMUNITY_CARDS = [
    {
      href: 'implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html',
      title: 'WebMCP: Turning web pages into tools for AI agents',
      img:
        'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_800,h_450/A_2',
      format: 'Tutorial',
      author: 'Nearform',
      date: '10 Dec 2025',
    },
    {
      href: 'testing-llm-based-applications.html',
      title: 'From AI prototype to production: how to build evals for reliable agents',
      img:
        'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_800,h_450/B',
      format: 'Deep dive',
      author: 'Ludovico Besana',
      date: '26 Sept 2025',
    },
    {
      href: 'why-plan-mode-is-not-enough-better-outcomes-with-spec-driven-development.html',
      title: 'Why plan mode is not enough: better outcomes with spec-driven development',
      img:
        'https://res.cloudinary.com/nearform-website/image/upload/f_auto,q_auto,w_800,h_450/Option_G',
      format: 'Tutorial',
      author: 'Luca Lanziani',
      date: '18 Mar 2026',
    },
  ];

  function removeFeaturedDuplicateFromPrimaryFeeds() {
    document.querySelectorAll('.nf-insights-feed--primary [data-nf-insight-featured="1"]').forEach(
      function (card) {
        var row = card.closest('.mb-8');
        if (row && row.parentNode) row.parentNode.removeChild(row);
      },
    );
  }

  /** Remove grid row whose card links to the same article as the featured hero (avoids duplicate listing). */
  function removePrimaryFeedRowForArticleHref(href) {
    if (!href) return;
    document.querySelectorAll('.nf-insights-feed--primary [data-nf-insight-card]').forEach(function (card) {
      var a = card.querySelector('a[href$=".html"]');
      if (!a) return;
      var h = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
      var target = href.split('#')[0].split('?')[0];
      if (h === target) {
        var row = card.closest('.mb-8');
        if (row && row.parentNode) row.parentNode.removeChild(row);
      }
    });
  }

  function insertFeaturedHero(hero) {
    var H = hero || HERO_INSIGHTS;
    if (document.getElementById('nf-explore-iter7-featured')) return;
    var firstPrimary = document.querySelector('section.nf-insights-feed--primary');
    if (!firstPrimary || !firstPrimary.parentNode) return;

    var el = document.createElement('section');
    el.id = 'nf-explore-iter7-featured';
    el.className =
      'nf-explore-iter7-featured nf-explore-iter7-featured--iter89 w-full flex items-center px-5 md:px-7 lg:px-8 pt-6 pb-0 mb-7';
    el.setAttribute('aria-label', 'Featured article');
    el.innerHTML =
      '<div class="nf-explore-iter7-featured__shell w-full max-w-[1600px] mx-auto min-w-0">' +
      '<div class="nf-explore-iter7-featured__inner">' +
      '<a class="nf-explore-iter7-featured__media" href="' +
      H.href +
      '"><img src="' +
      H.img +
      '" alt="" width="1600" height="900" loading="lazy" decoding="async" /></a>' +
      '<div class="nf-explore-iter7-featured__body">' +
      '<span class="nf-explore-iter7-featured__kicker"><span class="nf-explore-iter7-featured__pick">Featured</span>' +
      '<span class="nf-explore-iter7-featured__fmt">' +
      H.format +
      '</span></span>' +
      '<h2 class="nf-explore-iter7-featured__title"><a href="' +
      H.href +
      '">' +
      H.title +
      '</a></h2>' +
      '<p class="nf-explore-iter7-featured__meta">' +
      H.author +
      ' · ' +
      H.date +
      ' · ' +
      H.read +
      '</p>' +
      '<p class="nf-explore-iter7-featured__excerpt">' +
      H.excerpt +
      '</p>' +
      '<a class="nf-explore-iter7-featured__cta" href="' +
      H.href +
      '">Read article →</a>' +
      '</div></div></div>';
    firstPrimary.parentNode.insertBefore(el, firstPrimary);
    removeFeaturedDuplicateFromPrimaryFeeds();
    removePrimaryFeedRowForArticleHref(H.href);
    try {
      window.dispatchEvent(new CustomEvent('nf-insights-list-topic-changed'));
    } catch (e) {}
  }

  function communityCardHtml(c) {
    return (
      '<article class="nf-explore-iter7-ec__card">' +
      '<a class="nf-explore-iter7-ec__card-media" href="' +
      c.href +
      '"><img src="' +
      c.img +
      '" alt="" loading="lazy" decoding="async" /></a>' +
      '<span class="nf-explore-iter7-ec__fmt">' +
      c.format +
      '</span>' +
      '<h3 class="nf-explore-iter7-ec__title"><a href="' +
      c.href +
      '">' +
      c.title +
      '</a></h3>' +
      '<p class="nf-explore-iter7-ec__meta">' +
      c.author +
      ' · ' +
      c.date +
      '</p>' +
      '</article>'
    );
  }

  function replaceInsightsStreamModule() {
    if (document.getElementById('nf-explore-iter7-insights-module')) return;
    document.querySelectorAll('section.nf-insights-feed--secondary').forEach(function (sec) {
      sec.parentNode.removeChild(sec);
    });

    var mod = document.createElement('section');
    mod.id = 'nf-explore-iter7-insights-module';
    mod.className = 'nf-explore-iter7-insights-module';
    mod.setAttribute('aria-label', 'Looking for business insights');
    mod.innerHTML =
      '<div class="nf-explore-iter7-ec__inner">' +
      '<header class="nf-explore-iter7-ec__head">' +
      '<h2 class="nf-explore-iter7-ec__h">Looking for business insights?</h2>' +
      '<p class="nf-explore-iter7-ec__sub">Strategy, AI and transformation thinking from our leadership team.</p>' +
      '</header>' +
      '<div class="nf-explore-iter7-ec__grid">' +
      INSIGHTS_STREAM_CARDS.map(communityCardHtml).join('') +
      '</div>' +
      '<a class="nf-explore-iter7-ec__all" href="' +
      insListing +
      '">Explore Insights →</a>' +
      '</div>';

    var loadWrap = document.querySelector('.flex-1.mx-auto.mb-16');
    if (loadWrap && loadWrap.parentNode) {
      loadWrap.parentNode.insertBefore(mod, loadWrap.nextSibling);
    } else {
      var feeds = document.querySelectorAll('section.nf-insights-feed--primary');
      var last = feeds[feeds.length - 1];
      if (last && last.parentNode) last.parentNode.appendChild(mod);
    }
  }

  function replaceEngineeringCommunityModule() {
    if (document.getElementById('nf-explore-iter7-engineering-module')) return;
    document.querySelectorAll('section.nf-insights-feed--secondary').forEach(function (sec) {
      sec.parentNode.removeChild(sec);
    });

    var mod = document.createElement('section');
    mod.id = 'nf-explore-iter7-engineering-module';
    mod.className = 'nf-explore-iter7-engineering-module';
    mod.setAttribute('aria-label', 'Looking for technical content');
    mod.innerHTML =
      '<div class="nf-explore-iter7-ec__inner">' +
      '<header class="nf-explore-iter7-ec__head">' +
      '<h2 class="nf-explore-iter7-ec__h">Looking for technical content?</h2>' +
      '<p class="nf-explore-iter7-ec__sub">Deep-dives, tutorials and open source releases from our engineering team.</p>' +
      '</header>' +
      '<div class="nf-explore-iter7-ec__grid">' +
      COMMUNITY_CARDS.map(communityCardHtml).join('') +
      '</div>' +
      '<a class="nf-explore-iter7-ec__all" href="' +
      engListing +
      '">Explore Engineering →</a>' +
      '</div>';

    var loadWrap = document.querySelector('.flex-1.mx-auto.mb-16');
    if (loadWrap && loadWrap.parentNode) {
      loadWrap.parentNode.insertBefore(mod, loadWrap.nextSibling);
    } else {
      var feeds = document.querySelectorAll('section.nf-insights-feed--primary');
      var last = feeds[feeds.length - 1];
      if (last && last.parentNode) last.parentNode.appendChild(mod);
    }
  }

  /**
   * Insights iter8/9: remove the extra “Load More” row that sits after the in-page
   * “Looking for technical content?” module and before the footer cross-stream CTA.
   */
  function removeIter89InsightsLoadMoreBelowTechnicalModule() {
    if (!is8i && !is9i) return;
    var cross = document.querySelector('.nf-cross-stream-cta--to-engineering');
    var engMod = document.getElementById('nf-explore-iter7-engineering-module');
    if (!cross || !engMod) return;
    document.querySelectorAll('div.flex-1.mx-auto.mb-16').forEach(function (wrap) {
      var a = wrap.querySelector('a[target="_self"]');
      if (!a || (a.textContent || '').trim() !== 'Load More') return;
      var afterEng = engMod.compareDocumentPosition(wrap) & Node.DOCUMENT_POSITION_FOLLOWING;
      var beforeCross = wrap.compareDocumentPosition(cross) & Node.DOCUMENT_POSITION_FOLLOWING;
      if (afterEng && beforeCross && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    });
  }

  /** Engineering listings ship without a Load more row; add one when missing. */
  function ensureIter89LoadMoreRow() {
    if (!is8e && !is9e) return;
    var hasLoad = false;
    document.querySelectorAll('a[target="_self"]').forEach(function (a) {
      if ((a.textContent || '').trim() === 'Load More') hasLoad = true;
    });
    if (hasLoad) return;
    var href = 'insights-engineering-community.html';
    var wrap = document.createElement('div');
    wrap.className = 'flex-1 mx-auto mb-16';
    wrap.innerHTML =
      '<div class="group relative overflow-hidden inline-flex justify-center items-center font-sans rounded-full px-4 py-2.5 cursor-pointer link-button-transition dark:text-white disabled:pointer-events-none disabled:opacity-40 disabled:text-nf-deep-grey disabled:bg-nf-grey text-nf-deep-navy border border-nf-green hover:bg-nf-green hover:text-nf-deep-navy dark:border-nf-green dark:hover:bg-nf-green dark:hover:text-nf-deep-navy text-base/4 tracking-[0.1em] inline-flex items-center">' +
      '<span class="relative inline-block transition-transform duration-300 ease-in-out">' +
      '<a target="_self" href="' +
      href +
      '">Load More</a></span></div>';
    var mod =
      document.getElementById('nf-explore-iter7-insights-module') ||
      document.getElementById('nf-explore-iter7-engineering-module');
    if (mod && mod.parentNode) {
      mod.parentNode.insertBefore(wrap, mod);
      return;
    }
    var feeds = document.querySelectorAll('section.nf-insights-feed--primary');
    var last = feeds[feeds.length - 1];
    if (last && last.parentNode) {
      last.parentNode.insertBefore(wrap, last.nextSibling);
    }
  }

  if (is8i || is9i) {
    insertFeaturedHero(HERO_INSIGHTS);
  }
  if (is8e || is9e) {
    insertFeaturedHero(HERO_ENGINEERING);
  }
  if (is8i || is9i) {
    replaceEngineeringCommunityModule();
  }
  if (is8e || is9e) {
    replaceInsightsStreamModule();
  }
  ensureIter89LoadMoreRow();
  removeIter89InsightsLoadMoreBelowTechnicalModule();
})();
