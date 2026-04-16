/**
 * Insights index: category tabs; optional per-tab tag filter (native select + custom UI).
 * Cards: [data-nf-insight-card][data-nf-insight-topics][data-nf-insight-tags].
 */
(function () {
  var root = document.querySelector('[data-nf-insights-tabs]');
  if (!root) return;
  /** Redesign owns filters except iteration 7 / 8 / 9 listings, where legacy topic tabs stay active. */
  if (
    document.body.classList.contains('nf-insights-redesign') &&
    !document.body.classList.contains('nf-explore-page-iter7') &&
    !document.body.classList.contains('nf-explore-page-iter8-insights') &&
    !document.body.classList.contains('nf-explore-page-iter9-insights') &&
    !document.body.classList.contains('nf-explore-page-iter8-engineering') &&
    !document.body.classList.contains('nf-explore-page-iter9-engineering')
  )
    return;

  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var cards = document.querySelectorAll('[data-nf-insight-card]');
  var panel = root.querySelector('#nf-insights-pill-panel');
  var statusEl = document.getElementById('nf-insights-tab-status');
  var selectEl = document.getElementById('nf-insights-topic-select');
  var selectWrap = document.getElementById('nf-insights-topic-select-wrap');
  var isEngIter89Listing =
    document.body.classList.contains('nf-explore-page-iter8-engineering') ||
    document.body.classList.contains('nf-explore-page-iter9-engineering');
  /** Iteration 8/9 Insights + Engineering: shared hub topic tabs (same ids as HTML data-nf-tab-topic). */
  var isIter89HubListing =
    isEngIter89Listing ||
    document.body.classList.contains('nf-explore-page-iter8-insights') ||
    document.body.classList.contains('nf-explore-page-iter9-insights');
  var hasTagFilter = !!(selectEl && selectWrap);
  /** Iteration 8/9 hub listings: no “All in this category” field — topic pills drive tab + tag filter. */
  if (isIter89HubListing) {
    hasTagFilter = false;
    if (selectWrap) {
      selectWrap.hidden = true;
      selectWrap.setAttribute('hidden', 'hidden');
      selectWrap.style.display = 'none';
    }
  }

  var customUi = null;
  var triggerBtn = null;
  var triggerTextEl = null;
  var listboxEl = null;
  var topicPopoverOpen = false;

  /** Tag slugs per tab (alphabetical); used for dropdown options. */
  var INSIGHTS_TAGS_BY_TOPIC = {
    build: [
      'backend',
      'd3',
      'developer-tools',
      'graphql',
      'next-js',
      'node-js',
      'react',
      'react-native',
      'redux',
      'sanity',
      'urql',
      'victory',
    ],
    'ai-data': ['ai', 'data'],
    cloud: ['cloud', 'devops', 'engineering', 'platform'],
    product: ['capability', 'content', 'design', 'mobile', 'product'],
    strategy: ['modernisation', 'open-source', 'strategy'],
  };

  var statusByTopic = {
    all: 'Showing all topics.',
    build: 'Showing Build and stacks articles.',
    'ai-data': 'Showing AI and data articles.',
    cloud: 'Showing Cloud and platforms articles.',
    product: 'Showing Product and UX articles.',
    strategy: 'Showing Strategy and change articles.',
  };

  var tabLabelByTopic = {
    all: 'all topics',
    build: 'Build and stacks',
    'ai-data': 'AI and data',
    cloud: 'Cloud and platforms',
    product: 'Product and UX',
    strategy: 'Strategy and change',
  };

  /** Iteration 8/9 hub listings — six topics + All (matches HTML + card data-nf-insight-topics). */
  if (isIter89HubListing) {
    INSIGHTS_TAGS_BY_TOPIC = {
      'ai-native-engineering': [],
      'enterprise-ai-transformation': [],
      'platform-cloud-modernization': [],
      'engineering-excellence': [],
      'digital-product-innovation': [],
      'business-impact-growth': [],
    };
    statusByTopic = {
      all: 'Showing all topics.',
      'ai-native-engineering': 'Showing AI Native Engineering articles.',
      'enterprise-ai-transformation': 'Showing Enterprise AI Transformation articles.',
      'platform-cloud-modernization': 'Showing Platform & Cloud Modernization articles.',
      'engineering-excellence': 'Showing Engineering Excellence articles.',
      'digital-product-innovation': 'Showing Digital Product Innovation articles.',
      'business-impact-growth': 'Showing Business Impact & Growth articles.',
    };
    tabLabelByTopic = {
      all: 'all topics',
      'ai-native-engineering': 'AI Native Engineering',
      'enterprise-ai-transformation': 'Enterprise AI Transformation',
      'platform-cloud-modernization': 'Platform & Cloud Modernization',
      'engineering-excellence': 'Engineering Excellence',
      'digital-product-innovation': 'Digital Product Innovation',
      'business-impact-growth': 'Business Impact & Growth',
    };
  }

  var currentTopic = 'all';
  /** Engineering iter 8/9: when set, only cards whose data-nf-insight-tags include this slug (pill click / ?topic=). */
  var engPillTagSlug = '';

  /** Empty filter message; hide “Load more” when filtered (pagination drops the filter). */
  var emptyState = null;
  var loadMoreWraps = null;
  var paginationNote = null;
  /** null = not verified yet; true = next page responds OK; false = no next page (hide control). */
  var nextPageAvailable = null;

  function formatTagLabel(slug) {
    if (isIter89HubListing && slug && slug !== 'all' && tabLabelByTopic[slug]) {
      return tabLabelByTopic[slug];
    }
    if (slug === 'ai') return 'AI';
    if (slug === 'd3') return 'D3';
    if (slug === 'graphql') return 'GraphQL';
    if (slug === 'node-js') return 'Node.js';
    if (slug === 'next-js') return 'Next.js';
    if (slug === 'react-native') return 'React Native';
    return slug
      .split('-')
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  function rebuildSelectOptions(topic) {
    if (!hasTagFilter) return;
    selectEl.innerHTML = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent =
      topic === 'all' ? 'All articles' : 'All in this category';
    selectEl.appendChild(first);

    if (topic === 'all') return;

    var slugs = INSIGHTS_TAGS_BY_TOPIC[topic] || [];
    slugs.forEach(function (slug) {
      var o = document.createElement('option');
      o.value = slug;
      o.textContent = formatTagLabel(slug);
      selectEl.appendChild(o);
    });
  }

  function closeTopicPopover() {
    if (!listboxEl || !triggerBtn) return;
    topicPopoverOpen = false;
    listboxEl.hidden = true;
    triggerBtn.setAttribute('aria-expanded', 'false');
  }

  function openTopicPopover() {
    if (!hasTagFilter || !listboxEl || !triggerBtn || selectWrap.hidden) return;
    syncTopicListboxOptions();
    topicPopoverOpen = true;
    listboxEl.hidden = false;
    triggerBtn.setAttribute('aria-expanded', 'true');
    var first = listboxEl.querySelector('.nf-insights-topic-select-option');
    if (first) first.focus();
  }

  function syncTopicListboxOptions() {
    if (!listboxEl) return;
    listboxEl.innerHTML = '';
    var opts = selectEl.querySelectorAll('option');
    opts.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
      btn.className = 'nf-insights-topic-select-option';
      if (opt.selected) btn.classList.add('is-selected');
      btn.dataset.value = opt.value;
      btn.textContent = opt.textContent;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        closeTopicPopover();
        triggerBtn.focus();
      });
      listboxEl.appendChild(btn);
    });
  }

  function updateTriggerFromSelect() {
    if (!triggerTextEl || !selectEl) return;
    var sel = selectEl.options[selectEl.selectedIndex];
    triggerTextEl.textContent = sel ? sel.textContent : '';
  }

  function updateListboxSelection() {
    if (!listboxEl) return;
    var val = selectEl.value;
    var buttons = listboxEl.querySelectorAll('.nf-insights-topic-select-option');
    buttons.forEach(function (btn) {
      var sel = btn.dataset.value === val;
      btn.setAttribute('aria-selected', sel ? 'true' : 'false');
      btn.classList.toggle('is-selected', sel);
    });
    updateTriggerFromSelect();
  }

  function syncTopicCustomUi() {
    closeTopicPopover();
    if (!listboxEl) return;
    syncTopicListboxOptions();
    updateTriggerFromSelect();
  }

  function onTopicSelectDocClick(e) {
    if (!customUi || !topicPopoverOpen) return;
    if (customUi.contains(e.target)) return;
    closeTopicPopover();
  }

  function onTopicSelectKeydown(e) {
    if (!topicPopoverOpen || !listboxEl) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTopicPopover();
      triggerBtn.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var buttons = Array.prototype.slice.call(
      listboxEl.querySelectorAll('.nf-insights-topic-select-option'),
    );
    if (!buttons.length) return;
    e.preventDefault();
    var active = document.activeElement;
    var idx = buttons.indexOf(active);
    if (idx === -1) idx = 0;
    else if (e.key === 'ArrowDown') idx = Math.min(buttons.length - 1, idx + 1);
    else idx = Math.max(0, idx - 1);
    buttons[idx].focus();
  }

  function initCustomTopicSelect() {
    if (!hasTagFilter || selectWrap.querySelector('.nf-insights-topic-select-ui')) return;

    var labelEl = selectWrap.querySelector('label');
    if (labelEl && !labelEl.id) labelEl.id = 'nf-insights-topic-select-label';

    selectEl.classList.add('nf-insights-topic-select--native');
    selectEl.tabIndex = -1;

    customUi = document.createElement('div');
    customUi.className = 'nf-insights-topic-select-ui';

    triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'nf-insights-topic-select-trigger';
    triggerBtn.setAttribute('aria-haspopup', 'listbox');
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.setAttribute('aria-controls', 'nf-insights-topic-select-listbox');
    if (labelEl && labelEl.id) {
      triggerBtn.setAttribute(
        'aria-labelledby',
        labelEl.id + ' nf-insights-topic-select-trigger-text',
      );
    }

    triggerTextEl = document.createElement('span');
    triggerTextEl.className = 'nf-insights-topic-select-trigger-text';
    triggerTextEl.id = 'nf-insights-topic-select-trigger-text';

    var chevron = document.createElement('span');
    chevron.className = 'nf-insights-topic-select-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    triggerBtn.appendChild(triggerTextEl);
    triggerBtn.appendChild(chevron);

    listboxEl = document.createElement('div');
    listboxEl.id = 'nf-insights-topic-select-listbox';
    listboxEl.className = 'nf-insights-topic-select-listbox';
    listboxEl.setAttribute('role', 'listbox');
    listboxEl.hidden = true;

    customUi.appendChild(triggerBtn);
    customUi.appendChild(listboxEl);

    selectWrap.insertBefore(customUi, selectEl);

    triggerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (selectWrap.hidden) return;
      if (topicPopoverOpen) closeTopicPopover();
      else openTopicPopover();
    });

    triggerBtn.addEventListener('keydown', function (e) {
      if (selectWrap.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!topicPopoverOpen) openTopicPopover();
      }
    });

    listboxEl.addEventListener('keydown', onTopicSelectKeydown);

    document.addEventListener('click', onTopicSelectDocClick);
  }

  function updateStatus(topic, tagSlug) {
    if (!statusEl) return;
    var base = statusByTopic[topic] || statusByTopic.all;
    if (!tagSlug || topic === 'all') {
      statusEl.textContent = base;
      return;
    }
    statusEl.textContent =
      base.replace(/\.$/, '') +
      ', filtered by tag “' +
      formatTagLabel(tagSlug) +
      '”.';
  }

  function updateSelectAria(topic) {
    if (!hasTagFilter) return;
    var t = tabLabelByTopic[topic] || 'this category';
    var al =
      topic === 'all'
        ? 'Topic filter (all categories)'
        : 'Choose a tag within ' + t;
    selectEl.setAttribute('aria-label', al);
  }

  function formatEmptyMessage(topic, tagSlug) {
    if (topic === 'all') {
      return 'No articles are listed on this page.';
    }
    var label = tabLabelByTopic[topic] || topic;
    if (!tagSlug) {
      return (
        'No articles in “' +
        label +
        '” on this page. Try another topic or choose All topics.'
      );
    }
    return (
      'No articles tagged “' +
      formatTagLabel(tagSlug) +
      '” in “' +
      label +
      '” on this page. Try another tag or All topics.'
    );
  }

  function ensureAuxUi() {
    if (loadMoreWraps !== null) return;
    loadMoreWraps = [];
    document.querySelectorAll('a[target="_self"]').forEach(function (a) {
      if ((a.textContent || '').trim() !== 'Load More') return;
      var wrap = a.closest('.flex-1.mx-auto.mb-16');
      if (wrap && loadMoreWraps.indexOf(wrap) === -1) {
        loadMoreWraps.push(wrap);
      }
    });

    if (loadMoreWraps.length) {
      paginationNote = document.getElementById('nf-insights-filter-pagination-note');
      if (!paginationNote) {
        paginationNote = document.createElement('div');
        paginationNote.id = 'nf-insights-filter-pagination-note';
        paginationNote.className = 'nf-insights-filter-pagination-note';
        paginationNote.setAttribute('role', 'note');
        paginationNote.hidden = true;
        loadMoreWraps[0].parentNode.insertBefore(
          paginationNote,
          loadMoreWraps[0],
        );
      }
    }

    var primaryBox = document.querySelector(
      '.nf-insights-feed--primary .nf-insights-feed-list--stack',
    );
    if (!primaryBox) {
      primaryBox = document.querySelector('.nf-insights-feed-list--stack');
    }
    if (!primaryBox) return;

    emptyState = document.getElementById('nf-insights-filter-empty');
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.id = 'nf-insights-filter-empty';
      emptyState.className = 'nf-insights-filter-empty';
      emptyState.setAttribute('role', 'status');
      emptyState.setAttribute('aria-live', 'polite');
      primaryBox.insertBefore(emptyState, primaryBox.firstChild);
    }
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

    var req = {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'follow',
    };

    fetch(abs, Object.assign({ method: 'HEAD' }, req))
      .then(function (r) {
        if (r.status === 405 || r.status === 501) {
          return fetch(abs, Object.assign({ method: 'GET' }, req)).then(
            function (r2) {
              finish(r2.ok);
            },
          );
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

  function filterIsActive(topic, tagSlug) {
    return topic !== 'all' || !!tagSlug;
  }

  function updateFilterChrome(visible, topic, tagSlug) {
    ensureAuxUi();

    var active = filterIsActive(topic, tagSlug);
    var showLoadMore =
      !active && visible > 0 && nextPageAvailable === true;

    if (loadMoreWraps) {
      loadMoreWraps.forEach(function (w) {
        w.hidden = !showLoadMore;
      });
    }

    if (paginationNote) {
      if (active && visible > 0) {
        paginationNote.textContent =
          'Only articles on this page match this filter. “Load more” opens another page without your filter — choose All topics to browse more articles.';
        paginationNote.hidden = false;
      } else {
        paginationNote.hidden = true;
      }
    }

    if (!emptyState) return;

    if (visible === 0) {
      emptyState.textContent = formatEmptyMessage(topic, tagSlug);
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
  }

  var BENTO_PREFIX = 'nf-insights-bento-slot--';

  function cardFromFeedRow(child) {
    if (child.classList && child.classList.contains('nf-insights-article-card')) {
      return child;
    }
    return child.querySelector
      ? child.querySelector('.nf-insights-article-card')
      : null;
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

  /**
   * Match postprocess-mirror: body / head (hashtags + title) / meta (author row) for flex layout.
   * Safe if wrappers already exist (idempotent).
   */
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

  /**
   * Option 2 — bento / asymmetric grid: primary feeds use a repeating 8-slot pattern
   * on large screens; secondary feeds use uniform tiles. Slot class lives on the grid
   * row (wrapper div or direct card on mobile).
   */
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
      var useStableEngSlots = isEngIter89Listing && isPrimary;
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
        if (!card || card.classList.contains('nf-insights-article-card--hidden')) return;
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

  function applyCardFilter() {
    var topic = currentTopic;
    var tagSlug = '';
    if (isIter89HubListing && engPillTagSlug) {
      tagSlug = engPillTagSlug;
    } else if (hasTagFilter && topic !== 'all' && selectWrap && !selectWrap.hidden) {
      tagSlug = selectEl && selectEl.value ? selectEl.value.trim() : '';
    }

    var visible = 0;
    cards.forEach(function (card) {
      var rawTopics = (card.getAttribute('data-nf-insight-topics') || '').trim();
      var topics = rawTopics ? rawTopics.split(/\s+/) : [];
      var rawTags = (card.getAttribute('data-nf-insight-tags') || '').trim();
      var tags = rawTags ? rawTags.split(/\s+/) : [];

      var show;
      if (topic === 'all') {
        if (!tagSlug) show = true;
        else show = tags.indexOf(tagSlug) !== -1;
      } else if (topics.length === 0 || topics.indexOf(topic) === -1) {
        show = false;
      } else if (!tagSlug) {
        show = true;
      } else {
        show = tags.indexOf(tagSlug) !== -1;
      }

      card.classList.toggle('nf-insights-article-card--hidden', !show);
      if (show) visible += 1;
    });

    updateStatus(topic, tagSlug);
    updateEditorialLayout();
    updateFilterChrome(visible, topic, tagSlug);
    try {
      window.dispatchEvent(new CustomEvent('nf-insights-list-topic-changed', { bubbles: true }));
    } catch (e) {}
  }

  function selectTopic(topic, focusTab, resetDropdown) {
    if (!isIter89HubListing || resetDropdown !== false) {
      engPillTagSlug = '';
    }
    currentTopic = topic;
    var activeId = null;

    tabs.forEach(function (tab) {
      var id = tab.getAttribute('data-nf-tab-topic');
      var sel = id === topic;
      tab.setAttribute('aria-selected', sel ? 'true' : 'false');
      tab.tabIndex = sel ? 0 : -1;
      if (sel) {
        activeId = tab.id;
        if (focusTab) tab.focus();
      }
    });

    if (panel && activeId) panel.setAttribute('aria-labelledby', activeId);

    if (hasTagFilter) {
      if (resetDropdown !== false) {
        rebuildSelectOptions(topic);
        selectEl.value = '';
      }

      if (topic === 'all') {
        selectWrap.hidden = true;
      } else {
        selectWrap.hidden = false;
      }

      updateSelectAria(topic);
      syncTopicCustomUi();
    }

    applyCardFilter();

    if (isIter89HubListing && resetDropdown !== false) {
      try {
        var u2 = new URL(window.location.href);
        if (topic === 'all') {
          u2.searchParams.delete('topic');
        } else {
          u2.searchParams.set('topic', topic);
        }
        var q2 = u2.searchParams.toString();
        history.replaceState({}, '', u2.pathname + (q2 ? '?' + q2 : '') + u2.hash);
      } catch (e3) {}
    }
  }

  /** Iteration 8/9 hub tabs are a fixed six-topic model; keep all visible (empty tabs use the normal empty state). */
  if (hasTagFilter) {
    selectEl.addEventListener('change', function () {
      updateListboxSelection();
      applyCardFilter();
    });
    initCustomTopicSelect();
  }

  function visibleTopicTabs() {
    return tabs.filter(function (t) {
      return t.getAttribute('data-nf-tab-hidden') !== '1';
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.getAttribute('data-nf-tab-hidden') === '1') return;
      selectTopic(tab.getAttribute('data-nf-tab-topic'), false, true);
    });
    tab.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
      if (tab.getAttribute('data-nf-tab-hidden') === '1') return;
      e.preventDefault();
      var vis = visibleTopicTabs();
      var vi = vis.indexOf(tab);
      if (vi === -1) return;
      var next;
      if (key === 'Home') next = 0;
      else if (key === 'End') next = vis.length - 1;
      else if (key === 'ArrowRight') next = (vi + 1) % vis.length;
      else next = (vi - 1 + vis.length) % vis.length;
      var topic = vis[next].getAttribute('data-nf-tab-topic');
      selectTopic(topic, true, true);
    });
  });

  /** Map ?topic= query values (prototype pill destinations) to tab `data-nf-tab-topic` ids. */
  function tabTopicFromUrlParam(raw) {
    if (!raw) return null;
    var k = String(raw).trim().toLowerCase();
    if (isIter89HubListing) {
      var engMap = {
        'ai-native-engineering': 'ai-native-engineering',
        'enterprise-ai-transformation': 'enterprise-ai-transformation',
        'platform-cloud-modernization': 'platform-cloud-modernization',
        'engineering-excellence': 'engineering-excellence',
        'digital-product-innovation': 'digital-product-innovation',
        'business-impact-growth': 'business-impact-growth',
        'ai-data-solutions': 'ai-native-engineering',
        'enterprise-modernisation': 'enterprise-ai-transformation',
        'platform-engineering': 'platform-cloud-modernization',
        'product-design': 'digital-product-innovation',
        'nodejs-backend': 'engineering-excellence',
        'frontend-react': 'engineering-excellence',
      };
      if (engMap[k]) return engMap[k];
    }
    var map = {
      'strategy-change': 'strategy',
      strategy: 'strategy',
      'product-ux': 'product',
      product: 'product',
      'build-stacks': 'build',
      build: 'build',
      'cloud-platforms': 'cloud',
      cloud: 'cloud',
      'ai-data': 'ai-data',
    };
    return map[k] || k;
  }

  var initial = null;
  for (var j = 0; j < tabs.length; j++) {
    if (tabs[j].getAttribute('aria-selected') === 'true') {
      initial = tabs[j];
      break;
    }
  }
  if (!initial) initial = tabs[0];

  var urlTopicRaw = null;
  try {
    urlTopicRaw = new URL(window.location.href).searchParams.get('topic');
  } catch (e) {}
  var urlTabId = tabTopicFromUrlParam(urlTopicRaw);
  var appliedTopicFromUrl = false;
  if (urlTabId && urlTabId !== 'all') {
    var ti;
    for (ti = 0; ti < tabs.length; ti++) {
      var tid = tabs[ti].getAttribute('data-nf-tab-topic');
      if (tid !== urlTabId) continue;
      if (tabs[ti].getAttribute('data-nf-tab-hidden') === '1') break;
      initial = tabs[ti];
      appliedTopicFromUrl = true;
      break;
    }
  }

  if (initial) {
    var resetDd = !(isIter89HubListing && appliedTopicFromUrl);
    selectTopic(initial.getAttribute('data-nf-tab-topic'), false, resetDd);
  }
  if (isIter89HubListing && appliedTopicFromUrl && urlTabId) {
    engPillTagSlug = urlTabId;
    applyCardFilter();
  }

  if (isIter89HubListing) {
    document.addEventListener(
      'click',
      function (e) {
        var a = e.target.closest('a.nf-insight-card-hashtag--iter7');
        if (!a || !a.closest('[data-nf-insight-card]')) return;
        var href = a.getAttribute('href') || '';
        var rawParam = null;
        try {
          var u = new URL(href, window.location.href);
          rawParam = u.searchParams.get('topic');
        } catch (err1) {
          rawParam = null;
        }
        if (!rawParam) return;
        var mapped = tabTopicFromUrlParam(rawParam);
        if (!mapped || mapped === 'all') return;
        e.preventDefault();
        engPillTagSlug = mapped;
        selectTopic(mapped, false, false);
        try {
          var nu = new URL(window.location.href);
          nu.searchParams.set('topic', String(rawParam).trim());
          history.replaceState({}, '', nu.pathname + (nu.search ? nu.search : '') + nu.hash);
        } catch (err2) {}
      },
      true,
    );
  }

  if (appliedTopicFromUrl) {
    requestAnimationFrame(function () {
      var list = document.querySelector(
        '.nf-insights-feed--primary .nf-insights-feed-list--stack',
      );
      if (list) {
        try {
          list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e2) {
          list.scrollIntoView(true);
        }
      }
    });
  }
  verifyNextPageExists();
})();
