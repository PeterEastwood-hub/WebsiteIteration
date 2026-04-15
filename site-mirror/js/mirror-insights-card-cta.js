/**
 * Insights listing cards: strip “Learn more” CTA, replace topic pill links with hashtag text,
 * and unwrap the hero image so only the title links to the article — including iteration 8/9
 * Engineering listings so article layout matches iteration 8/9 Insights.
 * Idempotent; runs on pages with [data-nf-insight-card].
 */
(function () {
  function isPaginationHref(href) {
    if (!href) return true;
    return (
      /^insights_\d+\.html$/i.test(href) || /^digital-community_\d+\.html$/i.test(href)
    );
  }

  /** Hub / listing URLs used as topic pills (index + “You may also like” cards). */
  function isListingOrCategoryHref(href) {
    if (!href) return false;
    var base = href
      .trim()
      .split(/[?#]/)[0]
      .replace(/^\.\//, '');
    return (
      /^insights(?:_\d+)?\.html$/i.test(base) ||
      /^digital-community(?:_\d+)?\.html$/i.test(base)
    );
  }

  function removeLearnMore(card) {
    var cta = card.querySelector('.nf-insight-card-cta');
    if (cta) cta.remove();
  }

  function pillsRowForCard(card) {
    var rows = card.querySelectorAll('div.flex.flex-wrap');
    var i;
    var j;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row.classList.contains('gap-1')) continue;
      var links = row.querySelectorAll('a[href]');
      if (links.length === 0) continue;
      var allMetaLinks = true;
      for (j = 0; j < links.length; j++) {
        var href = (links[j].getAttribute('href') || '').trim();
        if (!isPaginationHref(href) && !isListingOrCategoryHref(href)) {
          allMetaLinks = false;
          break;
        }
      }
      if (allMetaLinks) return row;
    }
    return null;
  }

  function convertPillsToHashtags(card) {
    var row = pillsRowForCard(card);
    if (!row || row.getAttribute('data-nf-hashtags') === '1') return;
    row.setAttribute('data-nf-hashtags', '1');
    var labels = [];
    row.querySelectorAll('a[href]').forEach(function (a) {
      var t = (a.textContent || '').trim();
      if (t) labels.push(t);
    });
    row.textContent = '';
    row.classList.add('nf-insight-card-hashtags');
    labels.forEach(function (label) {
      var span = document.createElement('span');
      span.className = 'nf-insight-card-hashtag';
      span.textContent = '#' + label.replace(/^#+\s*/, '');
      row.appendChild(span);
    });
  }

  function removeEngineeringCommunityLandingRows() {
    var b = document.body;
    if (
      !b.classList.contains('nf-explore-page-iter8-engineering') &&
      !b.classList.contains('nf-explore-page-iter9-engineering')
    )
      return;
    document.querySelectorAll('.nf-insights-article-card--community-landing').forEach(function (el) {
      el.remove();
    });
  }

  function unwrapImageLink(card) {
    if (card.getAttribute('data-nf-image-unwrapped') === '1') return;
    var imgLink = card.querySelector(':scope > a');
    if (!imgLink || !imgLink.querySelector('img') || imgLink.querySelector('h3')) return;
    var div = document.createElement('div');
    div.className = imgLink.className;
    while (imgLink.firstChild) div.appendChild(imgLink.firstChild);
    imgLink.parentNode.replaceChild(div, imgLink);
    card.setAttribute('data-nf-image-unwrapped', '1');
  }

  function formatBadgeLabel(slug) {
    var map = {
      opinion: 'Opinion',
      interview: 'Interview',
      tutorial: 'Tutorial',
      'deep-dive': 'Deep dive',
      report: 'Report',
      news: 'News',
      'event-recap': 'Event recap',
      'case-study': 'Case study',
      'open-source-release': 'Open Source Release',
    };
    return map[slug] || slug;
  }

  function injectFormatAndReading(card) {
    if (card.getAttribute('data-nf-format-injected') === '1') return;
    var fmt = (card.getAttribute('data-nf-insight-format') || '').trim();
    var mins = (card.getAttribute('data-nf-insight-reading-minutes') || '').trim();
    var industry = (card.getAttribute('data-nf-insight-industry') || '').trim();
    if (!fmt && !mins && !industry) return;
    card.setAttribute('data-nf-format-injected', '1');

    var head = card.querySelector('.nf-insight-related-card-head');
    if (!head) return;

    if (fmt) {
      var badge = document.createElement('span');
      badge.className =
        'nf-insight-card-format-badge nf-insight-card-format-badge--' +
        fmt.replace(/[^a-z-]/g, '');
      badge.setAttribute('data-nf-insight-format-badge', fmt);
      badge.textContent = formatBadgeLabel(fmt);
      head.insertBefore(badge, head.firstChild);
    }

    if (industry) {
      var labels = {
        'banking-financial-services': 'Banking & Financial Services',
        healthcare: 'Healthcare',
        'retail-ecommerce': 'Retail & E-commerce',
        telecommunications: 'Telecommunications & Media',
      };
      var ind = document.createElement('span');
      ind.className = 'nf-insight-card-industry-badge';
      ind.textContent = labels[industry] || industry;
      var hashRow = head.querySelector('.nf-insight-card-hashtags');
      if (hashRow && hashRow.nextSibling) head.insertBefore(ind, hashRow.nextSibling);
      else head.appendChild(ind);
    }

    if (mins) {
      var meta = card.querySelector(
        '.nf-insight-related-card-body > .flex.gap-3.nf-insight-related-card-meta',
      );
      if (meta) {
        var rt = document.createElement('span');
        rt.className = 'nf-insight-card-reading-time';
        rt.textContent = mins + ' min read';
        meta.appendChild(rt);
      }
    }
  }

  /** Query keys for ?topic= on iter 8/9 listing pill links (see build prompt). */
  function topicParamFromDisplayLabel(lab) {
    var b = document.body;
    if (
      b.classList.contains('nf-explore-page-iter8-engineering') ||
      b.classList.contains('nf-explore-page-iter9-engineering') ||
      b.classList.contains('nf-explore-page-iter8-insights') ||
      b.classList.contains('nf-explore-page-iter9-insights')
    ) {
      var hub = {
        'AI & Data Solutions': 'ai-data-solutions',
        'Enterprise Modernisation': 'enterprise-modernisation',
        'Platform Engineering': 'platform-engineering',
        'Product & Design': 'product-design',
        'Node.js & Backend': 'nodejs-backend',
        'Frontend & React': 'frontend-react',
      };
      if (hub[lab]) return hub[lab];
    }
    var m = {
      'AI & data': 'ai-data',
      'Strategy & change': 'strategy-change',
      'Product & UX': 'product-ux',
      'Build & stacks': 'build-stacks',
      'Cloud & platforms': 'cloud-platforms',
    };
    return m[lab] || null;
  }

  /** Iteration 7+ — human-readable topic chips (max 2) aligned with hub topic tabs. */
  function applyIter7ConsolidatedTopicTags(card) {
    var cl = document.body.classList;
    if (
      !cl.contains('nf-explore-page-iter7') &&
      !cl.contains('nf-explore-page-iter8-insights') &&
      !cl.contains('nf-explore-page-iter9-insights') &&
      !cl.contains('nf-explore-page-iter8-engineering') &&
      !cl.contains('nf-explore-page-iter9-engineering')
    )
      return;
    var useTopicLinks =
      cl.contains('nf-explore-page-iter8-insights') ||
      cl.contains('nf-explore-page-iter9-insights') ||
      cl.contains('nf-explore-page-iter8-engineering') ||
      cl.contains('nf-explore-page-iter9-engineering');
    var listingFile = '';
    if (useTopicLinks) {
      try {
        listingFile = (window.location.pathname || '').split('/').pop() || '';
      } catch (e) {
        listingFile = '';
      }
    }
    var row = card.querySelector('.nf-insight-card-hashtags');
    if (!row) return;
    var raw = (card.getAttribute('data-nf-insight-tags') || '').trim();
    if (!raw) return;
    var slugs = raw.split(/\s+/).filter(Boolean);
    var labelBySlug = {
      ai: 'AI & data',
      data: 'AI & data',
      strategy: 'Strategy & change',
      modernisation: 'Strategy & change',
      'open-source': 'Open source & tools',
      'developer-tools': 'Open source & tools',
      mobile: 'Product & UX',
      design: 'Product & UX',
      product: 'Product & UX',
      content: 'Product & UX',
      capability: 'Product & UX',
      engineering: 'Build & stacks',
      backend: 'Build & stacks',
      cloud: 'Cloud & platforms',
      devops: 'Cloud & platforms',
      platform: 'Cloud & platforms',
      'node-js': 'Build & stacks',
      react: 'Build & stacks',
      'next-js': 'Build & stacks',
      'react-native': 'Build & stacks',
      graphql: 'Build & stacks',
      'redux': 'Build & stacks',
      d3: 'Build & stacks',
      sanity: 'Build & stacks',
      urql: 'Build & stacks',
      victory: 'Build & stacks',
      testing: 'Build & stacks',
      performance: 'Build & stacks',
      security: 'Build & stacks',
      infrastructure: 'Build & stacks',
    };
    if (
      cl.contains('nf-explore-page-iter8-engineering') ||
      cl.contains('nf-explore-page-iter9-engineering') ||
      cl.contains('nf-explore-page-iter8-insights') ||
      cl.contains('nf-explore-page-iter9-insights')
    ) {
      Object.assign(labelBySlug, {
        'ai-data-solutions': 'AI & Data Solutions',
        'enterprise-modernisation': 'Enterprise Modernisation',
        'platform-engineering': 'Platform Engineering',
        'product-design': 'Product & Design',
        'nodejs-backend': 'Node.js & Backend',
        'frontend-react': 'Frontend & React',
      });
    }
    row.textContent = '';
    var used = {};
    var n = 0;
    slugs.forEach(function (slug) {
      if (n >= 2) return;
      var lab = labelBySlug[slug];
      if (!lab || used[lab]) return;
      used[lab] = true;
      n += 1;
      var topicQ = topicParamFromDisplayLabel(lab);
      if (useTopicLinks && listingFile && topicQ) {
        var a = document.createElement('a');
        a.className = 'nf-insight-card-hashtag nf-insight-card-hashtag--iter7';
        a.href = listingFile + '?topic=' + encodeURIComponent(topicQ);
        a.textContent = lab;
        row.appendChild(a);
      } else {
        var span = document.createElement('span');
        span.className = 'nf-insight-card-hashtag nf-insight-card-hashtag--iter7';
        span.textContent = lab;
        var tabTopic = (card.getAttribute('data-nf-insight-topics') || '').trim();
        if (tabTopic) span.setAttribute('data-nf-iter7-topic', tabTopic);
        row.appendChild(span);
      }
    });
  }

  function enhanceCard(card) {
    removeLearnMore(card);
    convertPillsToHashtags(card);
    applyIter7ConsolidatedTopicTags(card);
    unwrapImageLink(card);
    injectFormatAndReading(card);
  }

  function run() {
    removeEngineeringCommunityLandingRows();
    document
      .querySelectorAll(
        '[data-nf-insight-card], .nf-insights-article-card, .nf-insight-related-card',
      )
      .forEach(enhanceCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
