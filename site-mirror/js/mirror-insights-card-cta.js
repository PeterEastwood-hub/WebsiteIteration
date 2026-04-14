/**
 * Insights listing cards: strip “Learn more” CTA, replace topic pill links with hashtag text,
 * and unwrap the hero image so only the title links to the article.
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
      'deep-dive': 'Deep Dive',
      report: 'Report',
      news: 'News',
      'event-recap': 'Event Recap',
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
      var meta = card.querySelector('.nf-insight-related-card-meta');
      if (meta) {
        var rt = document.createElement('span');
        rt.className = 'nf-insight-card-reading-time';
        rt.textContent = mins + ' min read';
        meta.appendChild(rt);
      }
    }
  }

  function enhanceCard(card) {
    removeLearnMore(card);
    convertPillsToHashtags(card);
    unwrapImageLink(card);
    injectFormatAndReading(card);
  }

  function run() {
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
