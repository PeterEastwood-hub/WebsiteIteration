/**
 * Insights explore — iteration 7 only: featured hero, Engineering Community module,
 * dedupe helpers (primary feed duplicate is handled in CSS).
 */
(function () {
  if (!document.body.classList.contains('nf-explore-page-iter7')) return;

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

  /** Prototype titles per spec; hrefs point to closest mirrored Engineering Community articles. */
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
    el.className = 'nf-explore-iter7-featured';
    el.setAttribute('aria-label', 'Featured article');
    el.innerHTML =
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
      '</div></div>';
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

  function replaceEngineeringCommunityModule() {
    if (document.getElementById('nf-explore-iter7-engineering-module')) return;
    document.querySelectorAll('section.nf-insights-feed--secondary').forEach(function (sec) {
      sec.parentNode.removeChild(sec);
    });

    var mod = document.createElement('section');
    mod.id = 'nf-explore-iter7-engineering-module';
    mod.className = 'nf-explore-iter7-engineering-module';
    mod.setAttribute('aria-label', 'From our Engineering Community');
    mod.innerHTML =
      '<div class="nf-explore-iter7-ec__inner">' +
      '<header class="nf-explore-iter7-ec__head">' +
      '<h2 class="nf-explore-iter7-ec__h">From our Engineering Community</h2>' +
      '<p class="nf-explore-iter7-ec__sub">Technical deep-dives and tutorials for engineers and practitioners.</p>' +
      '</header>' +
      '<div class="nf-explore-iter7-ec__grid">' +
      COMMUNITY_CARDS.map(communityCardHtml).join('') +
      '</div>' +
      '<a class="nf-explore-iter7-ec__all" href="insights-engineering-community.html">See all technical articles →</a>' +
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

  function wireTopicTagClicks() {
    document.body.addEventListener('click', function (e) {
      var span = e.target.closest('.nf-insight-card-hashtag--iter7[data-nf-iter7-topic]');
      if (!span) return;
      var topic = span.getAttribute('data-nf-iter7-topic');
      if (!topic) return;
      var tab = document.querySelector(
        '.nf-insights-topic-tabs__tab[data-nf-tab-topic="' + topic + '"]',
      );
      if (tab) tab.click();
    });
  }

  insertFeaturedHero();
  replaceEngineeringCommunityModule();
  wireTopicTagClicks();
})();
