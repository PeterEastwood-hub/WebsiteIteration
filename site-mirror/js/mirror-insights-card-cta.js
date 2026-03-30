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

  function enhanceCard(card) {
    removeLearnMore(card);
    convertPillsToHashtags(card);
    unwrapImageLink(card);
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
