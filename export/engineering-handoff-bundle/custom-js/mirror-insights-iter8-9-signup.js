/**
 * Iterations 8 & 9 — mailing list signup (prompt 3).
 * Hub: inline block below article grid, above cross-stream CTA on four listing pages only.
 * Articles: floating card on insight-article pages that include .nf-article-explore-gate
 * (all iter 8/9 engineering + gated insights mirrors — not only two hard-coded filenames).
 * Session state: localStorage key nf_signup_complete after subscribe.
 * Dismiss is not persisted (refresh shows the prompt again); legacy nf_signup_dismissed is cleared on load.
 */
(function () {
  var LS_COMPLETE = 'nf_signup_complete';
  var LS_DISMISSED = 'nf_signup_dismissed';

  function signupResetRequested() {
    try {
      if (!window.location) return false;
      var s = (window.location.search || '') + (window.location.hash || '');
      return /[?#&]nf_signup_reset(?:=1)?(?:&|$)/.test(s);
    } catch (e0) {}
    return false;
  }

  try {
    if (typeof window !== 'undefined' && signupResetRequested()) {
      localStorage.removeItem(LS_COMPLETE);
      localStorage.removeItem(LS_DISMISSED);
    }
  } catch (eReset) {}

  try {
    localStorage.removeItem(LS_DISMISSED);
  } catch (eRmDismiss) {}

  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function lsSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  var b = document.body;
  var isListing =
    b &&
    (b.classList.contains('nf-explore-page-iter8-insights') ||
      b.classList.contains('nf-explore-page-iter9-insights') ||
      b.classList.contains('nf-explore-page-iter8-engineering') ||
      b.classList.contains('nf-explore-page-iter9-engineering'));

  function isArticleFloatPage() {
    try {
      var body = document.body;
      if (!body) return false;
      if ((body.getAttribute('data-nf-layout') || '').trim() !== 'insight-article') return false;
      return !!document.querySelector('.nf-article-explore-gate');
    } catch (e2) {
      return false;
    }
  }

  if (!isListing && !isArticleFloatPage()) return;

  var inlineConfirmHtml =
    '<div class="nf-iter89-signup-inline__shell">' +
    '<div class="nf-iter89-signup-inline__success" role="status">' +
    "<p class=\"nf-iter89-signup-inline__success-title\">You're subscribed ✓</p>" +
    "<p class=\"nf-iter89-signup-inline__success-msg\">Thanks — we'll be in touch with the best of Nearform's thinking.</p>" +
    '</div></div>';

  function wireInline(root) {
    var input = root.querySelector('.nf-iter89-signup-inline__input');
    var err = root.querySelector('.nf-iter89-signup-inline__err');
    var btn = root.querySelector('.nf-iter89-signup-inline__submit');
    if (!input || !btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var v = (input.value || '').trim();
      if (!v) {
        if (err) {
          err.hidden = false;
          err.textContent = 'Please enter your email address';
        }
        return;
      }
      if (err) err.hidden = true;
      lsSet(LS_COMPLETE, '1');
      root.innerHTML = inlineConfirmHtml;
    });
  }

  function mountInlineSignup() {
    if (!isListing) return;
    if (lsGet(LS_COMPLETE) === '1') return;
    if (document.getElementById('nf-iter89-signup-inline')) return;

    var anchor =
      document.getElementById('nf-explore-iter7-engineering-module') ||
      document.getElementById('nf-explore-iter7-insights-module');
    if (!anchor || !anchor.parentNode) {
      return false;
    }

    var sec = document.createElement('section');
    sec.id = 'nf-iter89-signup-inline';
    sec.className = 'nf-iter89-signup-inline';
    sec.setAttribute('aria-label', 'Newsletter signup');
    sec.innerHTML =
      '<div class="nf-iter89-signup-inline__shell">' +
      '<h2 class="nf-iter89-signup-inline__h">Stay in the loop</h2>' +
      '<p class="nf-iter89-signup-inline__lead">Get the latest thinking from Nearform — AI, engineering, strategy and digital transformation — delivered to your inbox.</p>' +
      '<div class="nf-iter89-signup-inline__row">' +
      '<label class="nf-iter89-signup-inline__label"><span class="sr-only">Email address</span>' +
      '<input type="email" class="nf-iter89-signup-inline__input" name="email" autocomplete="email" placeholder="Email address" /></label>' +
      '<button type="button" class="nf-iter89-signup-inline__submit">Subscribe →</button>' +
      '</div>' +
      '<p class="nf-iter89-signup-inline__fine" role="note">No spam. Unsubscribe any time.</p>' +
      '<p class="nf-iter89-signup-inline__err" hidden="" role="alert"></p>' +
      '</div>';

    anchor.parentNode.insertBefore(sec, anchor);
    wireInline(sec);
    return true;
  }

  function tryMountInline() {
    if (!isListing) return;
    if (mountInlineSignup()) return;
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (mountInlineSignup() || n > 40) clearInterval(t);
    }, 50);
  }

  function floatFormHtml() {
    return (
      '<div class="nf-iter89-signup-float__panel" data-nf-float-panel="form">' +
      '<p class="nf-iter89-signup-float__h">Enjoyed this article?</p>' +
      '<p class="nf-iter89-signup-float__sub">Get more thinking like this from Nearform, straight to your inbox.</p>' +
      '<div class="nf-iter89-signup-float__row">' +
      '<label class="nf-iter89-signup-float__label"><span class="sr-only">Email</span>' +
      '<input type="email" class="nf-iter89-signup-float__input" autocomplete="email" placeholder="Email address" /></label>' +
      '<button type="button" class="nf-iter89-signup-float__submit">Subscribe →</button>' +
      '</div>' +
      '</div>'
    );
  }

  function floatSuccessHtml() {
    return (
      '<div class="nf-iter89-signup-float__panel nf-iter89-signup-float__panel--success" data-nf-float-panel="ok">' +
      "<p class=\"nf-iter89-signup-float__success-title\">You're subscribed ✓</p>" +
      "<p class=\"nf-iter89-signup-float__success-msg\">Thanks — we'll be in touch.</p>" +
      '</div>'
    );
  }

  function mountFloatCard() {
    if (!isArticleFloatPage()) return false;
    if (lsGet(LS_COMPLETE) === '1') return false;
    if (document.getElementById('nf-iter89-signup-float')) return false;

    var aside = document.createElement('aside');
    try {
      aside.id = 'nf-iter89-signup-float';
      aside.className = 'nf-iter89-signup-float';
      aside.setAttribute('role', 'dialog');
      aside.setAttribute('aria-label', 'Newsletter signup');
      aside.innerHTML =
        '<button type="button" class="nf-iter89-signup-float__close" aria-label="Dismiss">×</button>' +
        floatFormHtml();

      document.body.appendChild(aside);

      var closeBtn = aside.querySelector('.nf-iter89-signup-float__close');
      var input = aside.querySelector('.nf-iter89-signup-float__input');
      var submit = aside.querySelector('.nf-iter89-signup-float__submit');
      if (!closeBtn || !submit) {
        if (aside.parentNode) aside.parentNode.removeChild(aside);
        return false;
      }

      function dismissFloat(fade) {
        if (fade) {
          aside.classList.add('nf-iter89-signup-float--leaving');
          setTimeout(function () {
            if (aside.parentNode) aside.parentNode.removeChild(aside);
          }, 160);
        } else if (aside.parentNode) {
          aside.parentNode.removeChild(aside);
        }
      }

      closeBtn.addEventListener('click', function () {
        dismissFloat(true);
      });

      submit.addEventListener('click', function (e) {
        e.preventDefault();
        var v = input ? (input.value || '').trim() : '';
        if (!v) return;
        lsSet(LS_COMPLETE, '1');
        aside.innerHTML =
          '<button type="button" class="nf-iter89-signup-float__close" aria-label="Dismiss">×</button>' +
          floatSuccessHtml();
        aside.classList.add('is-visible');
        var close2 = aside.querySelector('.nf-iter89-signup-float__close');
        if (close2)
          close2.addEventListener('click', function () {
            dismissFloat(true);
          });
        setTimeout(function () {
          dismissFloat(true);
        }, 3000);
      });

      requestAnimationFrame(function () {
        aside.classList.add('is-visible');
      });
      return true;
    } catch (eMount) {
      if (aside.parentNode) aside.parentNode.removeChild(aside);
      return false;
    }
  }

  function initArticleScrollTrigger() {
    if (!isArticleFloatPage()) return;
    if (lsGet(LS_COMPLETE) === '1') return;
    if (initArticleScrollTrigger._nfInstalled) return;
    initArticleScrollTrigger._nfInstalled = true;

    var triggered = false;
    var ioRef = null;
    var pollId = null;
    var mainEl = null;
    var scrollOpts = { passive: true };

    function gateIntersectsViewport() {
      var g = document.querySelector('.nf-article-explore-gate');
      if (!g) return false;
      var r = g.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      var overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (overlap > 1) return true;
      /*
       * Show as the reader approaches the “There’s a lot more to explore” block — not only when
       * it already overlaps the viewport (IO + strict overlap missed some mirrors / scroll roots).
       */
      var lead = 360;
      if (r.height <= 0 && r.width <= 0) return false;
      if (r.top < vh + lead && r.bottom > -lead) return true;
      try {
        var sy = window.scrollY || window.pageYOffset || 0;
        var scrollBottom = sy + vh;
        var gateTopDoc = r.top + sy;
        if (scrollBottom >= gateTopDoc - lead) return true;
      } catch (eDoc) {}
      return false;
    }

    function cleanupScrollWatchers() {
      window.removeEventListener('scroll', onScrollOrResize, scrollOpts);
      document.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, scrollOpts);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('scroll', onScrollOrResize);
        window.visualViewport.removeEventListener('resize', onScrollOrResize);
      }
      if (mainEl) {
        mainEl.removeEventListener('scroll', onScrollOrResize, scrollOpts);
        mainEl = null;
      }
      if (pollId != null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    }

    function fire() {
      if (triggered) return;
      var mounted = mountFloatCard();
      if (!mounted) return;
      triggered = true;
      if (ioRef) {
        try {
          ioRef.disconnect();
        } catch (e3) {}
        ioRef = null;
      }
      cleanupScrollWatchers();
    }

    function onScrollOrResize() {
      if (triggered) return;
      if (gateIntersectsViewport()) fire();
    }

    var gate = document.querySelector('.nf-article-explore-gate');
    if (gate && typeof IntersectionObserver !== 'undefined') {
      ioRef = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var en = entries[i];
            if (en.isIntersecting || en.intersectionRatio > 0) {
              fire();
              return;
            }
          }
        },
        { root: null, rootMargin: '0px 0px 45% 0px', threshold: [0, 0.01, 0.02, 0.05] }
      );
      ioRef.observe(gate);
    }

    mainEl = document.querySelector('body > main');
    if (mainEl) mainEl.addEventListener('scroll', onScrollOrResize, scrollOpts);

    window.addEventListener('scroll', onScrollOrResize, scrollOpts);
    document.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, scrollOpts);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', onScrollOrResize);
      window.visualViewport.addEventListener('resize', onScrollOrResize);
    }

    pollId = window.setInterval(onScrollOrResize, 250);
    window.setTimeout(function () {
      if (pollId != null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    }, 90000);

    onScrollOrResize();
    requestAnimationFrame(function () {
      requestAnimationFrame(onScrollOrResize);
    });
    window.setTimeout(onScrollOrResize, 400);
    window.setTimeout(onScrollOrResize, 2000);
    window.addEventListener('load', onScrollOrResize, { passive: true, once: true });
    window.addEventListener(
      'pageshow',
      function () {
        if (triggered) return;
        onScrollOrResize();
      },
      { passive: true }
    );
  }

  function bootSignup() {
    tryMountInline();
    initArticleScrollTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSignup);
  } else {
    bootSignup();
  }
  window.addEventListener('load', bootSignup, { passive: true, once: true });
})();
