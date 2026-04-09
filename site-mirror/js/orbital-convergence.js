(function () {
  var root = document.getElementById('orbital-convergence');
  if (!root) return;
  if (root.classList.contains('orbital-static-export')) return;
  if (root.classList.contains('orbital-figma-raster-scene')) return;

  var reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    root.classList.add('orbital-in-view');
    var glow = root.querySelector('.orbital-core-glow');
    if (glow) glow.classList.add('oc-pulse-shadow');
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        root.classList.add('orbital-in-view');
        var g = root.querySelector('.orbital-core-glow');
        if (g) g.classList.add('oc-pulse-shadow');
      });
    },
    { rootMargin: '-80px', threshold: 0.12 },
  );

  io.observe(root);
})();
