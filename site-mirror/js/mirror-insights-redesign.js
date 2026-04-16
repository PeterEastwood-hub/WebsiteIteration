/**
 * Insights index redesign: grouped filters, URL state, result counts, append-only Load more,
 * featured hero card. Requires body.nf-insights-redesign + postprocess card data-* attributes.
 */
(function () {
  if (!document.body.classList.contains('nf-insights-redesign')) return;
  var isIter7 =
    document.body.classList.contains('nf-explore-page-iter7') ||
    document.body.classList.contains('nf-explore-page-iter8-insights') ||
    document.body.classList.contains('nf-explore-page-iter9-insights') ||
    document.body.classList.contains('nf-explore-page-iter8-engineering') ||
    document.body.classList.contains('nf-explore-page-iter9-engineering');
  /** Iterations 8 & 9 — Insights + Engineering listings: topic tabs only (no redesign format/topic drawer). */
  var isIter789DualStream =
    document.body.classList.contains('nf-explore-page-iter8-insights') ||
    document.body.classList.contains('nf-explore-page-iter9-insights') ||
    document.body.classList.contains('nf-explore-page-iter8-engineering') ||
    document.body.classList.contains('nf-explore-page-iter9-engineering');
  /** Engineering iter 8/9: each article keeps the same bento slot as on “All topics” (feed DOM order, incl. hidden). */
  var isEngIter89EngOnly =
    document.body.classList.contains('nf-explore-page-iter8-engineering') ||
    document.body.classList.contains('nf-explore-page-iter9-engineering');
  var root = document.querySelector('[data-nf-insights-tabs]');
  if (!root) return;

  var INSIGHTS_TOPIC_DEFS = [
    { id: 'ai-machine-learning', label: 'AI & Machine Learning' },
    { id: 'engineering-architecture', label: 'Engineering & Architecture' },
    { id: 'data', label: 'Data' },
    { id: 'strategy-transformation', label: 'Strategy & Transformation' },
    { id: 'design-product', label: 'Design & Product' },
    { id: 'open-source-tools', label: 'Open Source & Tools' },
  ];
  var topicListForLabels = INSIGHTS_TOPIC_DEFS;
  var FORMATS = [
    { id: 'opinion', label: 'Opinion' },
    { id: 'interview', label: 'Interview' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'deep-dive', label: 'Deep Dive' },
    { id: 'report', label: 'Report' },
    { id: 'news', label: 'News' },
    { id: 'event-recap', label: 'Event Recap' },
    { id: 'case-study', label: 'Case study' },
    { id: 'open-source-release', label: 'Open Source Release' },
  ];

  var tabList = root.querySelector('.nf-insights-topic-tabs__list');
  var panel = root.querySelector('#nf-insights-pill-panel');
  var statusEl = document.getElementById('nf-insights-tab-status');
  if (!panel) return;

  var cards = function () {
    return document.querySelectorAll('.nf-insights-feed--primary [data-nf-insight-card]');
  };

  var state = {
    topics: [],
    format: '',
  };

  var emptyState = null;
  var loadMoreWraps = null;
  var paginationNote = null;
  var nextPageAvailable = null;
  var primaryList = null;

  var BENTO_PREFIX = 'nf-insights-bento-slot--';

  function cardFromFeedRow(child) {
    if (child.classList && child.classList.contains('nf-insights-article-card')) return child;
    return child.querySelector ? child.querySelector('.nf-insights-article-card') : null;
  }

  function cardRowHiddenForEngFilter(card) {
    if (!isEngIter89EngOnly || !card) return false;
    var el = card;
    while (el && el.parentElement) {
      var par = el.parentElement;
      if (par.classList && par.classList.contains('nf-insights-feed-list--stack')) {
        return el.classList && el.classList.contains('nf-insights-eng-feed-row--hidden');
      }
      el = par;
    }
    return false;
  }

  function clearBentoSlotClass(el) {
    if (!el || !el.classList) return;
    var cl = el.classList;
    var rm = [];
    var i;
    for (i = 0; i < cl.length; i++) {
      var c = cl.item(i);
      if (c.indexOf(BENTO_PREFIX) === 0) rm.push(c);
    }
    rm.forEach(function (c) {
      cl.remove(c);
    });
  }

  function ensureInsightCardStackLayout(card) {
    if (!card || !card.children || card.children.length < 2) return;
    var body = card.children[1];
    if (!body || body.tagName !== 'DIV') return;
    body.classList.add('nf-insight-related-card-body');
    var ci;
    for (ci = 0; ci < body.children.length; ci++) {
      var row = body.children[ci];
      if (row.classList.contains('nf-insight-related-card-head')) continue;
      var rowCls = (row.getAttribute('class') || '').toLowerCase();
      if (row.tagName === 'DIV' && /\bflex\b/.test(rowCls) && /\bgap-3\b/.test(rowCls)) {
        row.classList.add('nf-insight-related-card-meta');
      }
    }
    var hi;
    for (hi = 0; hi < body.children.length; hi++) {
      if (body.children[hi].classList.contains('nf-insight-related-card-head')) return;
    }
    var c0 = body.children[0];
    var c1 = body.children[1];
    if (!c0) return;
    var cls0 = (c0.getAttribute('class') || '').toLowerCase();
    var tagsFirst =
      cls0.indexOf('flex-wrap') !== -1 ||
      cls0.indexOf('nf-insight-card-hashtags') !== -1 ||
      c0.querySelector('.nf-insight-card-hashtag');
    var titleSecond = c1 && c1.tagName === 'A' && c1.querySelector('h3');
    var titleFirst = c0.tagName === 'A' && c0.querySelector('h3');
    var head = document.createElement('div');
    head.className = 'nf-insight-related-card-head';
    if (tagsFirst && titleSecond) {
      head.appendChild(c0);
      head.appendChild(c1);
      body.insertBefore(head, body.firstChild);
    } else if (titleFirst) {
      head.appendChild(c0);
      body.insertBefore(head, body.firstChild);
    }
  }

  function updateEditorialLayout() {
    var lists = document.querySelectorAll('.nf-insights-feed-list--stack');
    lists.forEach(function (list) {
      var feed = list.closest('.nf-insights-feed');
      if (!feed) return;
      var isPrimary = feed.classList.contains('nf-insights-feed--primary');
      var children = Array.prototype.slice.call(list.children);

      children.forEach(function (child) {
        clearBentoSlotClass(child);
        var card = cardFromFeedRow(child);
        if (card) {
          card.classList.remove(
            'nf-insights-article-card--feature',
            'nf-insights-article-card--river',
            'nf-insights-bento-tile',
          );
        }
      });

      var slotForRow = new WeakMap();
      var useStableEngSlots = isEngIter89EngOnly && isPrimary;
      if (useStableEngSlots) {
        var ord = 0;
        children.forEach(function (child) {
          var c = cardFromFeedRow(child);
          if (!c) return;
          if (c.classList.contains('nf-insights-article-card--community-landing')) return;
          if (c.getAttribute && c.getAttribute('data-nf-insight-featured') === '1') return;
          slotForRow.set(child, ord % 8);
          ord += 1;
        });
      }

      var n = 0;
      children.forEach(function (child) {
        var card = cardFromFeedRow(child);
        if (!card) return;
        if (!isEngIter89EngOnly && card.classList.contains('nf-insights-article-card--hidden')) return;
        card.classList.add('nf-insights-bento-tile');
        ensureInsightCardStackLayout(card);
        if (isPrimary) {
          if (useStableEngSlots && slotForRow.has(child)) {
            child.classList.add(BENTO_PREFIX + String(slotForRow.get(child)));
          } else {
            child.classList.add(BENTO_PREFIX + String(n % 8));
            n += 1;
          }
        } else {
          child.classList.add(BENTO_PREFIX + 'std');
        }
      });
    });
  }

  function readUrlState() {
    var u = new URL(window.location.href);
    if (isIter789DualStream) {
      state.topics = [];
      state.format = '';
      return;
    }
    state.topics = u.searchParams.getAll('topic').filter(Boolean).slice(0, 2);
    state.format = u.searchParams.get('format') || '';
  }

  function writeUrlState(replace) {
    var u = new URL(window.location.href);
    u.search = '';
    state.topics.forEach(function (t) {
      u.searchParams.append('topic', t);
    });
    if (state.format) u.searchParams.set('format', state.format);
    var next = u.pathname + (u.search ? u.search : '') + u.hash;
    if (replace) history.replaceState({}, '', next);
    else history.pushState({}, '', next);
  }

  function labelFor(id, list) {
    var src = list || topicListForLabels || INSIGHTS_TOPIC_DEFS;
    var i;
    for (i = 0; i < src.length; i++) {
      if (src[i].id === id) return src[i].label;
    }
    return id;
  }

  function countCardsMatchingFilter() {
    var n = 0;
    cards().forEach(function (card) {
      if (isEngIter89EngOnly) {
        if (!cardRowHiddenForEngFilter(card)) n += 1;
      } else if (!card.classList.contains('nf-insights-article-card--hidden')) {
        n += 1;
      }
    });
    return n;
  }

  /** Same topic rules as mirror-insights-tabs (iteration 7 legacy tabs). */
  function cardMatchesTabTopicOnly(card) {
    var tab = document.querySelector('.nf-insights-topic-tabs__tab[aria-selected="true"]');
    var topic = tab ? (tab.getAttribute('data-nf-tab-topic') || 'all') : 'all';
    var selectEl = document.getElementById('nf-insights-topic-select');
    var selectWrap = document.getElementById('nf-insights-topic-select-wrap');
    var tagSlug = '';
    if (selectEl && selectWrap && topic !== 'all' && !selectWrap.hidden) {
      tagSlug = (selectEl.value || '').trim();
    }
    var rawTopics = (card.getAttribute('data-nf-insight-topics') || '').trim();
    var topics = rawTopics ? rawTopics.split(/\s+/) : [];
    var rawTags = (card.getAttribute('data-nf-insight-tags') || '').trim();
    var tags = rawTags ? rawTags.split(/\s+/) : [];
    if (topic === 'all') return true;
    if (topics.length === 0 || topics.indexOf(topic) === -1) return false;
    if (!tagSlug) return true;
    return tags.indexOf(tagSlug) !== -1;
  }

  /** Topic scope only (ignores format filter) — used for format option list and card visibility. */
  function topicFilterMatches(card) {
    /** Legacy topic tabs (iter 7–9 listings): match visible tab + optional tag — not redesign URL state. */
    if (isIter7 || isIter789DualStream) return cardMatchesTabTopicOnly(card);
    if (!state.topics.length) return true;
    var cats = (card.getAttribute('data-nf-insight-categories') || '').trim().split(/\s+/).filter(Boolean);
    var t;
    for (t = 0; t < state.topics.length; t++) {
      if (cats.indexOf(state.topics[t]) === -1) return false;
    }
    return true;
  }

  function cardMatches(card) {
    var fmt = (card.getAttribute('data-nf-insight-format') || '').trim();
    if (!topicFilterMatches(card)) return false;
    if (!isIter789DualStream && state.format && fmt !== state.format) return false;
    return true;
  }

  function applyCardFilter() {
    refreshFormatFilterButtons();
    if (state.format && formatCount(state.format) === 0) {
      state.format = '';
      writeUrlState(true);
    }
    /** Topic visibility + empty/load-more chrome for these pages live in mirror-insights-tabs.js. */
    if (isIter789DualStream) {
      updateEditorialLayout();
      syncUiFromState();
      return;
    }
    var visible = 0;
    cards().forEach(function (card) {
      var show = cardMatches(card);
      card.classList.toggle('nf-insights-article-card--hidden', !show);
      if (show) visible += 1;
    });
    updateStatusText(visible);
    updateEditorialLayout();
    updateFilterChrome(visible);
    syncUiFromState();
  }

  function updateStatusText(visible) {
    if (!statusEl) return;
    if (isIter789DualStream) return;
    var parts = [];
    if (state.topics.length) {
      parts.push(
        state.topics.map(function (id) {
          return labelFor(id, topicListForLabels);
        }).join(' + '),
      );
    }
    if (state.format) parts.push(labelFor(state.format, FORMATS));
    var filterBit = parts.length ? ' for ' + parts.join(' · ') : '';
    statusEl.textContent =
      visible === 0
        ? 'No articles match these filters.'
        : 'Showing ' + visible + ' article' + (visible === 1 ? '' : 's') + filterBit + '.';
  }

  function ensureAuxUi() {
    if (loadMoreWraps !== null) return;
    loadMoreWraps = [];
    document.querySelectorAll('a[target="_self"]').forEach(function (a) {
      if ((a.textContent || '').trim() !== 'Load More') return;
      var wrap = a.closest('.flex-1.mx-auto.mb-16');
      if (wrap && loadMoreWraps.indexOf(wrap) === -1) loadMoreWraps.push(wrap);
    });

    if (loadMoreWraps.length) {
      paginationNote = document.getElementById('nf-insights-filter-pagination-note');
      if (!paginationNote) {
        paginationNote = document.createElement('div');
        paginationNote.id = 'nf-insights-filter-pagination-note';
        paginationNote.className = 'nf-insights-filter-pagination-note';
        paginationNote.setAttribute('role', 'note');
        paginationNote.hidden = true;
        loadMoreWraps[0].parentNode.insertBefore(paginationNote, loadMoreWraps[0]);
      }
    }

    primaryList = document.querySelector(
      '.nf-insights-feed--primary .nf-insights-feed-list--stack',
    );
    if (!primaryList) primaryList = document.querySelector('.nf-insights-feed-list--stack');

    emptyState = document.getElementById('nf-insights-filter-empty');
    if (primaryList && !emptyState) {
      emptyState = document.createElement('div');
      emptyState.id = 'nf-insights-filter-empty';
      emptyState.className = 'nf-insights-filter-empty';
      emptyState.setAttribute('role', 'status');
      emptyState.setAttribute('aria-live', 'polite');
      primaryList.insertBefore(emptyState, primaryList.firstChild);
    }
  }

  function filterIsActive() {
    if (isIter789DualStream) return false;
    return state.topics.length > 0 || !!state.format;
  }

  function updateFilterChrome(visible) {
    ensureAuxUi();
    var active = filterIsActive();
    var showLoadMore = !active && visible > 0 && nextPageAvailable === true;

    if (loadMoreWraps) {
      loadMoreWraps.forEach(function (w) {
        w.hidden = !showLoadMore;
      });
    }

    if (paginationNote) {
      if (active && visible > 0) {
        paginationNote.textContent =
          'Filters apply to articles on this page only. Use “Load more” when no filters are active to fetch the next page.';
        paginationNote.hidden = false;
      } else {
        paginationNote.hidden = true;
      }
    }

    if (!emptyState) return;
    if (visible === 0) {
      if (!emptyState.querySelector('.nf-insights-redesign-clear-btn')) {
        emptyState.innerHTML =
          '<p>No articles match these filters.</p><button type="button" class="nf-insights-redesign-clear-btn">Clear filters</button>';
        var btn = emptyState.querySelector('button');
        if (btn)
          btn.addEventListener('click', function () {
            clearAllFilters();
          });
      }
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }
  }

  function applyIter7PaginationPrototype() {
    ensureAuxUi();
    if (!loadMoreWraps || !loadMoreWraps.length) return;
    loadMoreWraps.forEach(function (w) {
      w.hidden = false;
      w.innerHTML =
        '<p class="nf-insights-iter7-pagination-note" role="note">Showing 8 of 24 articles — pagination will load dynamically in production.</p>';
    });
  }

  function verifyNextPageExists() {
    ensureAuxUi();
    if (!loadMoreWraps || !loadMoreWraps.length) return;

    if (window.location.protocol === 'file:') {
      nextPageAvailable = true;
      applyCardFilter();
      return;
    }

    var a = loadMoreWraps[0].querySelector('a[href]');
    var href = a ? a.getAttribute('href') : null;
    if (!href) {
      nextPageAvailable = false;
      applyCardFilter();
      return;
    }

    var abs;
    try {
      abs = new URL(href, window.location.href).href;
    } catch (e) {
      nextPageAvailable = false;
      applyCardFilter();
      return;
    }

    function finish(ok) {
      nextPageAvailable = !!ok;
      applyCardFilter();
    }

    var req = { cache: 'no-store', credentials: 'same-origin', redirect: 'follow' };
    fetch(abs, Object.assign({ method: 'HEAD' }, req))
      .then(function (r) {
        if (r.status === 405 || r.status === 501) {
          return fetch(abs, Object.assign({ method: 'GET' }, req)).then(function (r2) {
            finish(r2.ok);
          });
        }
        finish(r.ok);
      })
      .catch(function () {
        fetch(abs, Object.assign({ method: 'GET' }, req))
          .then(function (r) {
            finish(r.ok);
          })
          .catch(function () {
            finish(true);
          });
      });
  }

  function existingHrefs() {
    var set = {};
    cards().forEach(function (card) {
      var a = card.querySelector('a[href$=".html"]');
      if (a) set[a.getAttribute('href')] = 1;
    });
    return set;
  }

  function wireLoadMoreAppend() {
    ensureAuxUi();
    if (!loadMoreWraps || !loadMoreWraps.length || !primaryList) return;
    var wrap = loadMoreWraps[0];
    var link = wrap.querySelector('a[href]');
    if (!link || link.getAttribute('data-nf-append-bound') === '1') return;
    link.setAttribute('data-nf-append-bound', '1');
    link.addEventListener('click', function (e) {
      if (filterIsActive()) return;
      e.preventDefault();
      var href = link.getAttribute('href');
      if (!href) return;
      var abs = new URL(href, window.location.href).href;
      var orig = link.textContent;
      link.textContent = 'Loading…';
      link.setAttribute('aria-busy', 'true');
      fetch(abs, { credentials: 'same-origin', cache: 'no-store' })
        .then(function (r) {
          return r.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var remoteList = doc.querySelector(
            '.nf-insights-feed--primary .nf-insights-feed-list--stack',
          );
          if (!remoteList) return;
          var seen = existingHrefs();
          var rows = remoteList.querySelectorAll(':scope > div');
          rows.forEach(function (row) {
            var card = cardFromFeedRow(row);
            if (!card) return;
            var a = card.querySelector('a[href$=".html"]');
            var h = a ? a.getAttribute('href') : '';
            if (h && seen[h]) return;
            if (h) seen[h] = 1;
            var imported = document.importNode(row, true);
            primaryList.appendChild(imported);
          });
          var nextBtn = doc.querySelector('.flex-1.mx-auto.mb-16 a[href]');
          if (nextBtn && (nextBtn.textContent || '').trim() === 'Load More') {
            link.setAttribute('href', nextBtn.getAttribute('href') || href);
          } else {
            wrap.hidden = true;
            nextPageAvailable = false;
          }
        })
        .catch(function () {})
        .finally(function () {
          link.textContent = orig;
          link.removeAttribute('aria-busy');
          applyCardFilter();
        });
    });
  }

  function clearAllFilters() {
    state.topics = [];
    state.format = '';
    writeUrlState(true);
    applyCardFilter();
  }

  function toggleTopic(id) {
    var i = state.topics.indexOf(id);
    if (i !== -1) {
      state.topics.splice(i, 1);
    } else if (state.topics.length < 2) {
      state.topics.push(id);
    } else {
      state.topics.shift();
      state.topics.push(id);
    }
    writeUrlState(true);
    applyCardFilter();
  }

  function setFormat(id) {
    state.format = state.format === id ? '' : id;
    writeUrlState(true);
    applyCardFilter();
  }

  function topicCount(id) {
    var n = 0;
    cards().forEach(function (card) {
      var cats = (card.getAttribute('data-nf-insight-categories') || '').trim().split(/\s+/).filter(Boolean);
      if (cats.indexOf(id) !== -1) n += 1;
    });
    return n;
  }

  /** Count cards with this format among those matching the current topic tab / topic drawer. */
  function formatCount(id) {
    var n = 0;
    cards().forEach(function (card) {
      if (!topicFilterMatches(card)) return;
      if ((card.getAttribute('data-nf-insight-format') || '') === id) n += 1;
    });
    return n;
  }

  function refreshFormatFilterButtons() {
    var body = document.getElementById('nf-redesign-format');
    if (!body) return;
    var html = FORMATS.map(function (t) {
      var c = formatCount(t.id);
      if (c === 0) return '';
      return (
        '<button type="button" class="nf-insights-redesign-opt" data-kind="format" data-id="' +
        t.id +
        '">' +
        t.label +
        ' <span class="nf-insights-redesign-count">(' +
        c +
        ')</span></button>'
      );
    }).join('');
    body.innerHTML =
      html || '<p class="nf-insights-redesign-muted">No formats for this topic.</p>';
  }

  function buildFilterPanel() {
    var wrap = document.createElement('div');
    wrap.className = 'nf-insights-redesign-filters';
    wrap.innerHTML =
      '<div class="nf-insights-redesign-filters__mobile-bar">' +
      '<button type="button" class="nf-insights-redesign-filters__toggle" aria-expanded="false">Filters</button>' +
      '</div>' +
      '<div class="nf-insights-redesign-filters__drawer" hidden>' +
      '<div class="nf-insights-redesign-filters__sections" id="nf-insights-redesign-sections"></div>' +
      '</div>' +
      '<div class="nf-insights-redesign-chips" id="nf-insights-redesign-chips" hidden></div>' +
      '<button type="button" class="nf-insights-redesign-clearall" id="nf-insights-redesign-clearall" hidden>Clear all</button>';

    var drawerEl = wrap.querySelector('.nf-insights-redesign-filters__drawer');
    var sections = wrap.querySelector('#nf-insights-redesign-sections');
    function addSection(title, id, innerHtml, variant) {
      var sec = document.createElement('section');
      sec.className =
        'nf-insights-redesign-section nf-insights-redesign-section--' + (variant || 'topic');
      sec.innerHTML =
        '<button type="button" class="nf-insights-redesign-section__head" aria-expanded="true" aria-controls="' +
        id +
        '">' +
        '<span class="nf-insights-redesign-section__head-label">' +
        '<span class="nf-insights-redesign-section__icon" aria-hidden="true"></span>' +
        '<span class="nf-insights-redesign-section__title-text">' +
        title +
        '</span>' +
        '</span>' +
        '<span class="nf-insights-redesign-section__chev" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="nf-insights-redesign-section__body" id="' +
        id +
        '"></div>';
      sections.appendChild(sec);
      sec.querySelector('#' + id).innerHTML = innerHtml;
      var head = sec.querySelector('.nf-insights-redesign-section__head');
      if (head) {
        head.addEventListener('click', function () {
          var expanded = head.getAttribute('aria-expanded') === 'true';
          head.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          sec.classList.toggle('is-collapsed', expanded);
        });
      }
    }

    topicListForLabels = INSIGHTS_TOPIC_DEFS;

    var topicButtonsHtml = INSIGHTS_TOPIC_DEFS.map(function (t) {
      var c = topicCount(t.id);
      if (c === 0) return '';
      if (isIter7) {
        return (
          '<button type="button" class="nf-insights-redesign-opt" data-kind="topic" data-id="' +
          t.id +
          '">' +
          t.label +
          '</button>'
        );
      }
      return (
        '<button type="button" class="nf-insights-redesign-opt" data-kind="topic" data-id="' +
        t.id +
        '">' +
        t.label +
        ' <span class="nf-insights-redesign-count">(' +
        c +
        ')</span></button>'
      );
    }).join('');

    var formatButtonsHtml = FORMATS.map(function (t) {
      var c = formatCount(t.id);
      if (c === 0) return '';
      return (
        '<button type="button" class="nf-insights-redesign-opt" data-kind="format" data-id="' +
        t.id +
        '">' +
        t.label +
        ' <span class="nf-insights-redesign-count">(' +
        c +
        ')</span></button>'
      );
    }).join('');

    if (!isIter7) {
      addSection(
        'Topic',
        'nf-redesign-topic',
        topicButtonsHtml || '<p class="nf-insights-redesign-muted">No topic counts on this page.</p>',
        'topic',
      );
    }
    addSection(
      'Format',
      'nf-redesign-format',
      formatButtonsHtml || '<p class="nf-insights-redesign-muted">No formats on this page.</p>',
      'format',
    );

    if (isIter789DualStream) {
      var fmtSection = wrap.querySelector('.nf-insights-redesign-section--format');
      if (fmtSection) {
        fmtSection.classList.remove('is-collapsed');
        var fmtHead = fmtSection.querySelector('.nf-insights-redesign-section__head');
        if (fmtHead) fmtHead.setAttribute('aria-expanded', 'true');
      }
    }

    panel.insertBefore(wrap, panel.firstChild);

    var toggle = wrap.querySelector('.nf-insights-redesign-filters__toggle');
    toggle.addEventListener('click', function () {
      var willOpen = drawerEl.hidden;
      drawerEl.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      wrap.classList.toggle('nf-insights-redesign-filters--drawer-open', willOpen);
    });

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.nf-insights-redesign-opt');
      if (!btn) return;
      var kind = btn.getAttribute('data-kind');
      var id = btn.getAttribute('data-id');
      if (kind === 'topic') toggleTopic(id);
      else if (kind === 'format') setFormat(id);
    });

    document.getElementById('nf-insights-redesign-clearall').addEventListener('click', clearAllFilters);

    window.addEventListener('popstate', function () {
      readUrlState();
      applyCardFilter();
    });

    function syncDrawerVisibility() {
      if (!drawerEl) return;
      if (window.matchMedia('(min-width: 900px)').matches) {
        drawerEl.removeAttribute('hidden');
        wrap.classList.add('nf-insights-redesign-filters--drawer-open');
      } else {
        drawerEl.hidden = true;
        wrap.classList.remove('nf-insights-redesign-filters--drawer-open');
      }
    }
    syncDrawerVisibility();
    window.addEventListener('resize', syncDrawerVisibility);
  }

  function syncUiFromState() {
    var wrap = document.querySelector('.nf-insights-redesign-filters');
    if (!wrap) return;
    wrap.querySelectorAll('.nf-insights-redesign-opt').forEach(function (btn) {
      var kind = btn.getAttribute('data-kind');
      var id = btn.getAttribute('data-id');
      var on = false;
      if (kind === 'topic') on = state.topics.indexOf(id) !== -1;
      else if (kind === 'format') on = state.format === id;
      btn.classList.toggle('is-active', on);
    });

    var chips = document.getElementById('nf-insights-redesign-chips');
    var clearAll = document.getElementById('nf-insights-redesign-clearall');
    if (!chips || !clearAll) return;
    chips.innerHTML = '';
    var has = filterIsActive();
    chips.hidden = !has;
    clearAll.hidden = !has;
    if (!has) return;

    function addChip(label, onRemove) {
      var span = document.createElement('span');
      span.className = 'nf-insights-redesign-chip';
      span.innerHTML =
        '<span class="nf-insights-redesign-chip__text"></span><button type="button" class="nf-insights-redesign-chip__x" aria-label="Remove filter">×</button>';
      span.querySelector('.nf-insights-redesign-chip__text').textContent = label;
      span.querySelector('button').addEventListener('click', onRemove);
      chips.appendChild(span);
    }

    state.topics.forEach(function (id) {
      addChip(labelFor(id, topicListForLabels), function () {
        state.topics = state.topics.filter(function (x) {
          return x !== id;
        });
        writeUrlState(true);
        applyCardFilter();
      });
    });
    if (state.format) {
      addChip(labelFor(state.format, FORMATS), function () {
        state.format = '';
        writeUrlState(true);
        applyCardFilter();
      });
    }
  }

  function hideLegacyTabs() {
    if (tabList) {
      tabList.setAttribute('aria-hidden', 'true');
      tabList.classList.add('nf-insights-redesign-tabs--hidden');
    }
  }

  function promoteFeaturedCard() {
    if (!primaryList) return;
    var featured = primaryList.querySelector('[data-nf-insight-featured="1"]');
    if (!featured) return;
    var row = featured.closest('.mb-8') || featured.parentElement;
    if (!row || !primaryList.contains(row)) return;
    row.classList.add('nf-insights-feature-row');
    featured.classList.add('nf-insights-article-card--hero-feature');
    var ex = featured.getAttribute('data-nf-insight-excerpt');
    if (ex && !featured.querySelector('.nf-insights-article-card__excerpt')) {
      var p = document.createElement('p');
      p.className = 'nf-insights-article-card__excerpt';
      p.textContent = ex;
      var head = featured.querySelector('.nf-insight-related-card-head');
      if (head) head.appendChild(p);
    }
    var badge = document.createElement('span');
    badge.className = 'nf-insights-feature-pill';
    badge.textContent = 'Featured';
    var head = featured.querySelector('.nf-insight-related-card-head');
    if (head) head.insertBefore(badge, head.firstChild);
    primaryList.insertBefore(row, primaryList.firstChild);
  }

  if (!isIter7) hideLegacyTabs();
  ensureAuxUi();
  if (!isIter789DualStream) {
    buildFilterPanel();
  } else {
    window.addEventListener('popstate', function () {
      readUrlState();
      applyCardFilter();
    });
  }
  readUrlState();
  if (!isIter7) promoteFeaturedCard();

  /** Legacy topic tabs (iteration 7) update card visibility independently — resync format list + combined filter. */
  window.addEventListener('nf-insights-list-topic-changed', function () {
    applyCardFilter();
  });

  applyCardFilter();
  /** Only iteration 7 uses the static “8 of 24” pagination note; iter8/9 keep real Load more + fetch wiring. */
  if (document.body.classList.contains('nf-explore-page-iter7')) {
    applyIter7PaginationPrototype();
  } else {
    verifyNextPageExists();
    wireLoadMoreAppend();
  }
})();
