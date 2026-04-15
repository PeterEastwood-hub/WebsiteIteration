/**
 * Insights explore — iterations 8 & 9: featured hero on Insights listings only; Engineering
 * listings start at filters + grid (no hero). Cross-stream modules at list foot; topic pills
 * on cards are filter links (see mirror-insights-card-cta.js).
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

  var HERO = {
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

  function insertFeaturedHero() {
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
      HERO.href +
      '"><img src="' +
      HERO.img +
      '" alt="" width="1600" height="900" loading="lazy" decoding="async" /></a>' +
      '<div class="nf-explore-iter7-featured__body">' +
      '<span class="nf-explore-iter7-featured__kicker"><span class="nf-explore-iter7-featured__pick">Featured</span>' +
      '<span class="nf-explore-iter7-featured__fmt">' +
      HERO.format +
      '</span></span>' +
      '<h2 class="nf-explore-iter7-featured__title"><a href="' +
      HERO.href +
      '">' +
      HERO.title +
      '</a></h2>' +
      '<p class="nf-explore-iter7-featured__meta">' +
      HERO.author +
      ' · ' +
      HERO.date +
      ' · ' +
      HERO.read +
      '</p>' +
      '<p class="nf-explore-iter7-featured__excerpt">' +
      HERO.excerpt +
      '</p>' +
      '<a class="nf-explore-iter7-featured__cta" href="' +
      HERO.href +
      '">Read article →</a>' +
      '</div></div></div>';
    firstPrimary.parentNode.insertBefore(el, firstPrimary);
    removeFeaturedDuplicateFromPrimaryFeeds();
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
      loadWrap.parentNode.insertBefore(mod, loadWrap);
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
      loadWrap.parentNode.insertBefore(mod, loadWrap);
    } else {
      var feeds = document.querySelectorAll('section.nf-insights-feed--primary');
      var last = feeds[feeds.length - 1];
      if (last && last.parentNode) last.parentNode.appendChild(mod);
    }
  }

  if (is8i || is9i) {
    insertFeaturedHero();
  }
  if (is8i || is9i) {
    replaceEngineeringCommunityModule();
  }
  if (is8e || is9e) {
    replaceInsightsStreamModule();
  }
})();
