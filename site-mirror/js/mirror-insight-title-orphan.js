/**
 * Insight article H1: avoid a single word alone on the last line when the title wraps.
 * Keeps the last two words together (nowrap) unless they overflow the title width.
 */
(function () {
  'use strict';

  function isSpaceSpan(el) {
    return el.tagName === 'SPAN' && /^[\s\u00A0]*$/.test(el.textContent || '');
  }

  function unwrapTails(row) {
    row.querySelectorAll('.nf-insight-title-tail').forEach(function (tail) {
      var p = tail.parentNode;
      if (!p) return;
      while (tail.firstChild) p.insertBefore(tail.firstChild, tail);
      tail.remove();
    });
  }

  function endOfWord(children, start) {
    var j = start;
    while (j < children.length && !isSpaceSpan(children[j])) j++;
    return j - 1;
  }

  function processLetterRow(row, h1) {
    unwrapTails(row);
    var children = Array.from(row.children);
    if (!children.length) return;

    var wordStarts = [];
    var i = 0;
    while (i < children.length) {
      if (isSpaceSpan(children[i])) {
        i++;
        continue;
      }
      wordStarts.push(i);
      i = endOfWord(children, i) + 1;
    }

    var n = wordStarts.length;
    if (n < 2) return;

    var startIdx = wordStarts[n - 2];
    var endIdx = endOfWord(children, wordStarts[n - 1]);
    if (startIdx > endIdx) return;

    var toMove = [];
    for (var k = startIdx; k <= endIdx; k++) toMove.push(children[k]);

    var wrap = document.createElement('span');
    wrap.className = 'nf-insight-title-tail';

    row.insertBefore(wrap, toMove[0]);
    toMove.forEach(function (node) {
      wrap.appendChild(node);
    });

    if (wrap.scrollWidth > h1.clientWidth + 4) {
      while (wrap.firstChild) row.insertBefore(wrap.firstChild, wrap);
      wrap.remove();
    }
  }

  function processPlainH1(h1) {
    if (h1.querySelector('.nf-insight-title-tail')) return;
    var text = h1.textContent.replace(/\s+/g, ' ').trim();
    var words = text.split(' ').filter(Boolean);
    if (words.length < 2) return;
    var tailText = words.slice(-2).join(' ');
    var headText = words.slice(0, -2).join(' ');
    h1.textContent = '';
    if (headText) h1.appendChild(document.createTextNode(headText + '\u00A0'));
    var span = document.createElement('span');
    span.className = 'nf-insight-title-tail';
    span.textContent = tailText;
    h1.appendChild(span);
    if (span.scrollWidth > h1.clientWidth + 4) {
      h1.textContent = text;
    }
  }

  function run() {
    var h1 = document.querySelector(
      'body[data-nf-layout="insight-article"] main > section:first-of-type h1',
    );
    if (!h1) return;

    var block = h1.querySelector('span.relative.block');
    if (block) {
      block.querySelectorAll('span[aria-hidden="true"]').forEach(function (row) {
        if (row.classList.contains('sr-only')) return;
        if (!row.querySelector(':scope > span')) return;
        processLetterRow(row, h1);
      });
      return;
    }

    processPlainH1(h1);
  }

  var t;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(run, 120);
  }

  function bindResize(h1) {
    if (typeof ResizeObserver === 'undefined') return;
    var ro = new ResizeObserver(schedule);
    ro.observe(h1);
  }

  function start() {
    run();
    var h1 = document.querySelector(
      'body[data-nf-layout="insight-article"] main > section:first-of-type h1',
    );
    if (h1) bindResize(h1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
