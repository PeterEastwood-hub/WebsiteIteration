/**
 * Insights index: category tabs + single topic dropdown (tags per tab).
 * Cards: [data-nf-insight-card][data-nf-insight-topics][data-nf-insight-tags].
 */
(function () {
  var root = document.querySelector('[data-nf-insights-tabs]');
  if (!root) return;

  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var cards = document.querySelectorAll('[data-nf-insight-card]');
  var panel = root.querySelector('#nf-insights-pill-panel');
  var statusEl = document.getElementById('nf-insights-tab-status');
  var selectEl = document.getElementById('nf-insights-topic-select');
  var selectWrap = document.getElementById('nf-insights-topic-select-wrap');

  if (!selectEl || !selectWrap) return;

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

  var currentTopic = 'all';

  /** Empty filter message; hide “Load more” when filtered (pagination drops the filter). */
  var emptyState = null;
  var loadMoreWraps = null;
  var paginationNote = null;
  /** null = not verified yet; true = next page responds OK; false = no next page (hide control). */
  var nextPageAvailable = null;

  function formatTagLabel(slug) {
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
    if (!listboxEl || !triggerBtn || selectWrap.hidden) return;
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
    if (selectWrap.querySelector('.nf-insights-topic-select-ui')) return;

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

      var n = 0;
      children.forEach(function (child) {
        var card = cardFromFeedRow(child);
        if (!card || card.classList.contains('nf-insights-article-card--hidden')) return;
        card.classList.add('nf-insights-bento-tile');
        ensureInsightCardStackLayout(card);
        if (isPrimary) {
          child.classList.add(BENTO_PREFIX + String(n % 8));
          n += 1;
        } else {
          child.classList.add(BENTO_PREFIX + 'std');
        }
      });
    });
  }

  function applyCardFilter() {
    var topic = currentTopic;
    var tagSlug =
      topic === 'all' || selectWrap.hidden ? '' : selectEl.value.trim();

    var visible = 0;
    cards.forEach(function (card) {
      var rawTopics = (card.getAttribute('data-nf-insight-topics') || '').trim();
      var topics = rawTopics ? rawTopics.split(/\s+/) : [];
      var rawTags = (card.getAttribute('data-nf-insight-tags') || '').trim();
      var tags = rawTags ? rawTags.split(/\s+/) : [];

      var show;
      if (topic === 'all') {
        show = true;
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
  }

  function selectTopic(topic, focusTab, resetDropdown) {
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
    applyCardFilter();
  }

  selectEl.addEventListener('change', function () {
    updateListboxSelection();
    applyCardFilter();
  });

  initCustomTopicSelect();

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      selectTopic(tab.getAttribute('data-nf-tab-topic'), false, true);
    });
    tab.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End')
        return;
      e.preventDefault();
      var next = i;
      if (key === 'Home') next = 0;
      else if (key === 'End') next = tabs.length - 1;
      else if (key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      var topic = tabs[next].getAttribute('data-nf-tab-topic');
      selectTopic(topic, true, true);
    });
  });

  var initial = null;
  for (var j = 0; j < tabs.length; j++) {
    if (tabs[j].getAttribute('aria-selected') === 'true') {
      initial = tabs[j];
      break;
    }
  }
  if (!initial) initial = tabs[0];
  if (initial) {
    selectTopic(initial.getAttribute('data-nf-tab-topic'), false, true);
  }
  verifyNextPageExists();
})();
