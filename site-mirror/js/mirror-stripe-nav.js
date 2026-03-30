/**
 * Stripe-like desktop nav: hover grace period + keyboard parity (roving focus,
 * Tab boundaries, Escape). Progressive enhancement — without this script,
 * native Tailwind group-hover behaviour remains.
 */
(function () {
  function init() {
    var header = document.querySelector('body > header.font-sans.fixed');
    var center = header && header.querySelector('[data-testid="header-center"]');
    if (!center) return;

    var items = [];
    center.querySelectorAll(':scope > li').forEach(function (li, idx) {
      var group = li.querySelector(':scope > .group.relative');
      if (!group) return;
      var panel = group.querySelector(':scope > div.absolute.top-full');
      if (!panel) return;
      var trigger = group.querySelector(':scope > a[href]');
      if (!trigger) return;
      var inner = panel.querySelector(':scope > .rounded-lg') || panel;
      var triggerId = 'nf-stripe-trigger-' + idx;
      var panelId = 'nf-stripe-submenu-' + idx;
      if (!trigger.id) trigger.id = triggerId;
      if (!inner.id) inner.id = panelId;
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', inner.id);
      inner.setAttribute('role', 'group');
      inner.setAttribute('aria-labelledby', trigger.id);

      items.push({
        li: li,
        panel: panel,
        group: group,
        trigger: trigger,
        inner: inner,
      });
    });
    if (items.length === 0) return;

    center.classList.add('nf-stripe-nav-js');

    var closeTimer = null;
    var active = null;

    function panelLinks(entry) {
      return Array.prototype.slice.call(entry.inner.querySelectorAll('a[href]'));
    }

    function clearClose() {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function setAriaExpanded(entry, open) {
      items.forEach(function (x) {
        x.trigger.setAttribute('aria-expanded', x === entry && open ? 'true' : 'false');
      });
    }

    function setActive(entry) {
      clearClose();
      active = entry;
      items.forEach(function (x) {
        x.li.classList.toggle('nf-stripe-nav-active', x === entry);
      });
      setAriaExpanded(entry, !!entry);
    }

    function closeAll() {
      clearClose();
      active = null;
      items.forEach(function (x) {
        x.li.classList.remove('nf-stripe-nav-active');
      });
      setAriaExpanded(null, false);
    }

    function scheduleClose() {
      clearClose();
      closeTimer = window.setTimeout(function () {
        active = null;
        items.forEach(function (x) {
          x.li.classList.remove('nf-stripe-nav-active');
        });
        setAriaExpanded(null, false);
        closeTimer = null;
      }, 200);
    }

    function topLevelFocusables() {
      return Array.prototype.slice.call(center.querySelectorAll(':scope > li')).map(function (li) {
        var g = li.querySelector(':scope > .group.relative');
        if (g) {
          var t = g.querySelector(':scope > a[href]');
          if (t) return t;
        }
        return li.querySelector(':scope > a[href]');
      }).filter(Boolean);
    }

    function nextTopLevelAfter(li) {
      var lis = Array.prototype.slice.call(center.querySelectorAll(':scope > li'));
      var i = lis.indexOf(li);
      if (i < 0) return null;
      var chain = topLevelFocusables();
      var cur = lis[i].querySelector(':scope > .group > a[href], :scope > a[href]');
      var j = cur ? chain.indexOf(cur) : -1;
      if (j >= 0 && j + 1 < chain.length) return chain[j + 1];
      return null;
    }

    function prevTopLevelBefore(li) {
      var chain = topLevelFocusables();
      var cur = li.querySelector(':scope > .group > a[href], :scope > a[href]');
      var j = cur ? chain.indexOf(cur) : -1;
      if (j > 0) return chain[j - 1];
      return null;
    }

    items.forEach(function (x) {
      x.li.addEventListener('mouseenter', function () {
        setActive(x);
      });
      x.li.addEventListener('mouseleave', function (e) {
        if (!center.contains(e.relatedTarget)) scheduleClose();
      });

      x.li.addEventListener('focusin', function () {
        setActive(x);
      });

      x.li.addEventListener('focusout', function (e) {
        if (x.li.contains(e.relatedTarget)) return;
        window.requestAnimationFrame(function () {
          if (!center.contains(document.activeElement)) scheduleClose();
        });
      });

      x.trigger.addEventListener('keydown', function (e) {
        var links = panelLinks(x);
        /* Enter follows the link (about/services landing); arrows open the submenu */
        if (e.key === 'ArrowDown' || e.key === ' ') {
          if (links.length === 0) return;
          if (e.key === ' ') e.preventDefault();
          setActive(x);
          links[0].focus();
          e.preventDefault();
        } else if (e.key === 'ArrowUp' && links.length) {
          e.preventDefault();
          setActive(x);
          links[links.length - 1].focus();
        }
      });

      x.inner.addEventListener('keydown', function (e) {
        var links = panelLinks(x);
        if (links.length === 0) return;
        var i = links.indexOf(document.activeElement);
        if (i < 0) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          var next = links[Math.min(i + 1, links.length - 1)];
          if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (i === 0) {
            x.trigger.focus();
          } else {
            links[i - 1].focus();
          }
        } else if (e.key === 'Home') {
          e.preventDefault();
          links[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          links[links.length - 1].focus();
        } else if (e.key === 'Tab' && !e.shiftKey && i === links.length - 1) {
          var n = nextTopLevelAfter(x.li);
          if (n) {
            e.preventDefault();
            closeAll();
            n.focus();
          }
        } else if (e.key === 'Tab' && e.shiftKey && i === 0) {
          e.preventDefault();
          x.trigger.focus();
        }
      });
    });

    center.querySelectorAll(':scope > li').forEach(function (li) {
      var hasPanel = items.some(function (x) {
        return x.li === li;
      });
      if (hasPanel) return;
      li.addEventListener('mouseenter', function () {
        closeAll();
      });
      li.addEventListener('focusin', function () {
        closeAll();
      });
    });

    center.addEventListener('mouseenter', clearClose);
    center.addEventListener('mouseleave', function (e) {
      if (!header.contains(e.relatedTarget)) scheduleClose();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var inside = center.contains(document.activeElement);
      if (!inside) return;
      var focusedEntry = null;
      for (var k = 0; k < items.length; k++) {
        if (items[k].li.contains(document.activeElement)) {
          focusedEntry = items[k];
          break;
        }
      }
      e.preventDefault();
      closeAll();
      if (focusedEntry) focusedEntry.trigger.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
