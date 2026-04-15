/**
 * Insights explore — iteration 7 only: stream labels, cross-links, content hub CTA.
 * Runs after mirror-insights-redesign.js (same defer order in head).
 */
(function () {
  if (!document.body.classList.contains('nf-explore-page-iter7')) return;

  function insertStreamIntro(targetSection, opts) {
    if (!targetSection || targetSection.getAttribute('data-nf-iter7-intro') === '1') return;
    var prev = targetSection.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('nf-explore-iter7-stream-intro')) return;

    var wrap = document.createElement('div');
    wrap.className = 'nf-explore-iter7-stream-intro';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', opts.ariaLabel || opts.title);
    wrap.innerHTML =
      '<h2 class="nf-explore-iter7-stream-intro__title">' +
      opts.title +
      '</h2>' +
      '<p class="nf-explore-iter7-stream-intro__text">' +
      opts.text +
      '</p>' +
      '<p class="nf-explore-iter7-stream-intro__links">' +
      (opts.links || '') +
      '</p>';
    targetSection.parentNode.insertBefore(wrap, targetSection);
    targetSection.setAttribute('data-nf-iter7-intro', '1');
  }

  function firstSection(selector) {
    var el = document.querySelector(selector);
    return el && el.closest('section') ? el.closest('section') : el;
  }

  var primary = firstSection('.nf-insights-feed--primary');
  if (primary) {
    insertStreamIntro(primary, {
      ariaLabel: 'Insights stream',
      title: 'Insights',
      text:
        'Strategic points of view, industry commentary, executive interviews, trend reports, and thought leadership for business decision-makers, clients, and prospects.',
      links:
        '<a class="nf-explore-iter7-stream-intro__link" href="insights.html">Default Insights listing</a> · ' +
        '<a class="nf-explore-iter7-stream-intro__link" href="content-hub.html">Content hub (both streams)</a>',
    });
  }

  var secondary = firstSection('.nf-insights-feed--secondary');
  if (secondary) {
    insertStreamIntro(secondary, {
      ariaLabel: 'Engineering Community stream',
      title: 'Engineering Community',
      text:
        'Tutorials, tooling, open source releases, and technical deep dives for engineers and practitioners. (Mirror uses engineering community listing; production target path is /engineering/.)',
      links:
        '<a class="nf-explore-iter7-stream-intro__link" href="insights-engineering-community.html">Open Engineering Community</a> · ' +
        '<a class="nf-explore-iter7-stream-intro__link" href="content-hub.html">Content hub</a>',
    });
  }
})();
