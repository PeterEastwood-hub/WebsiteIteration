/**
 * Timeline explore layout: sort article rows by published date (parsed from card markup).
 * Only runs on body.nf-explore-page-list.
 */
(function () {
  if (!document.body || !document.body.classList.contains('nf-explore-page-list')) {
    return;
  }

  var MONTHS = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  function parseDateFromCard(card) {
    var row = card.querySelector('.flex.gap-3');
    if (!row) return NaN;
    var spans = row.querySelectorAll('span');
    var i;
    var text;
    var m;
    for (i = spans.length - 1; i >= 0; i--) {
      text = (spans[i].textContent || '').trim();
      m = text.match(/^(\d{1,2}) (\w{3}) (\d{4})$/);
      if (!m) continue;
      if (MONTHS[m[2]] === undefined) continue;
      return new Date(
        parseInt(m[3], 10),
        MONTHS[m[2]],
        parseInt(m[1], 10),
      ).getTime();
    }
    return NaN;
  }

  function rowTime(listRow) {
    var card = listRow.matches('[data-nf-insight-card]')
      ? listRow
      : listRow.querySelector('[data-nf-insight-card]');
    if (!card) return NaN;
    return parseDateFromCard(card);
  }

  function sortList(listEl, newestFirst) {
    var children = Array.prototype.slice.call(listEl.children);
    var items = children.map(function (el) {
      return { el: el, t: rowTime(el) };
    });
    items.sort(function (a, b) {
      var aOk = !isNaN(a.t);
      var bOk = !isNaN(b.t);
      if (!aOk && !bOk) return 0;
      if (!aOk) return 1;
      if (!bOk) return -1;
      return newestFirst ? b.t - a.t : a.t - b.t;
    });
    items.forEach(function (x) {
      listEl.appendChild(x.el);
    });
  }

  function sortAllFeeds(newestFirst) {
    document.querySelectorAll('.nf-insights-feed-list--stack').forEach(function (list) {
      sortList(list, newestFirst);
    });
  }

  function buildToolbar() {
    var tabs = document.querySelector('[data-nf-insights-tabs]');
    if (!tabs) return;
    var parent = tabs.parentElement;
    if (!parent || parent.querySelector('.nf-timeline-sort')) return;

    var wrap = document.createElement('div');
    wrap.className = 'nf-timeline-sort';
    wrap.setAttribute('role', 'toolbar');
    wrap.setAttribute('aria-label', 'Sort articles by date');

    var label = document.createElement('span');
    label.className = 'nf-timeline-sort__label';
    label.id = 'nf-timeline-sort-label';
    label.textContent = 'Sort by date';

    var group = document.createElement('div');
    group.className = 'nf-timeline-sort__buttons';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', 'nf-timeline-sort-label');

    function wire(btn, newest) {
      btn.addEventListener('click', function () {
        sortAllFeeds(newest);
        group.querySelectorAll('.nf-timeline-sort__btn').forEach(function (x) {
          x.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
      });
    }

    var btnNew = document.createElement('button');
    btnNew.type = 'button';
    btnNew.className = 'nf-timeline-sort__btn';
    btnNew.textContent = 'Newest first';
    btnNew.setAttribute('aria-pressed', 'true');
    wire(btnNew, true);

    var btnOld = document.createElement('button');
    btnOld.type = 'button';
    btnOld.className = 'nf-timeline-sort__btn';
    btnOld.textContent = 'Oldest first';
    btnOld.setAttribute('aria-pressed', 'false');
    wire(btnOld, false);

    group.appendChild(btnNew);
    group.appendChild(btnOld);
    wrap.appendChild(label);
    wrap.appendChild(group);
    parent.appendChild(wrap);
  }

  function init() {
    buildToolbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
