/**
 * Promo grid links: class for hover lift (CSS in mirror-a11y-flair.css).
 * Section scroll reveals are handled by mirror-motion.js (Motion / Framer-style springs).
 */
(function () {
  function promos() {
    var grids = document.querySelectorAll(
      'main a > div.grid.grid-cols-12.gap-0.relative.overflow-hidden',
    );
    grids.forEach(function (grid) {
      var a = grid.parentElement;
      if (!a || a.tagName !== 'A') return;
      a.classList.add('nf-flair-promo');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', promos);
  } else {
    promos();
  }
})();
