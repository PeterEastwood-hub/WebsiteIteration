/**
 * Practice pages: orbit below the section H2 in the left column; grid row spans
 * so it aligns with the copy column. Unwraps legacy orbit-in-right-cell layout.
 */
(function () {
  var WORDS = {
    strategy: ['Insight', 'Direction', 'Delivery'],
    product: ['Design', 'Engineer', 'Launch'],
    'ai-solutions': ['Models', 'Agents', 'Scale'],
    data: ['Pipeline', 'Quality', 'Impact'],
    modernisation: ['Legacy', 'Cloud', 'Velocity'],
    platform: ['APIs', 'Reliability', 'Scale'],
    'lifecycle-services': ['Operate', 'Evolve', 'Sustain'],
  };

  var ANGLES = ['0deg', '120deg', '240deg'];

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function unwrapLegacyOrbitRow(textCell) {
    var row = textCell.querySelector(':scope > .nf-svc-orbit-row');
    if (!row) return;
    var copy = row.querySelector('.nf-svc-orbit-row__copy');
    if (copy) {
      while (copy.firstChild) {
        textCell.appendChild(copy.firstChild);
      }
    }
    row.remove();
  }

  function buildOrbit(words) {
    var root = el('div', 'nf-svc-orbit');
    root.setAttribute('aria-hidden', 'true');

    var stage = el('div', 'nf-svc-orbit__stage');

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'nf-svc-orbit__svg nf-svc-orbit__svg--drift');
    svg.setAttribute('viewBox', '0 0 240 240');
    var defs = document.createElementNS(svgNS, 'defs');
    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'nf-svc-orbit-grad');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '100%');
    var s1 = document.createElementNS(svgNS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#00c78c');
    var s2 = document.createElementNS(svgNS, 'stop');
    s2.setAttribute('offset', '50%');
    s2.setAttribute('stop-color', '#8b5cf6');
    var s3 = document.createElementNS(svgNS, 'stop');
    s3.setAttribute('offset', '100%');
    s3.setAttribute('stop-color', '#0ea5e9');
    grad.appendChild(s1);
    grad.appendChild(s2);
    grad.appendChild(s3);
    defs.appendChild(grad);
    svg.appendChild(defs);

    var c1 = document.createElementNS(svgNS, 'circle');
    c1.setAttribute('class', 'nf-svc-orbit__track');
    c1.setAttribute('cx', '120');
    c1.setAttribute('cy', '120');
    c1.setAttribute('r', '88');
    svg.appendChild(c1);

    var c2 = document.createElementNS(svgNS, 'circle');
    c2.setAttribute('class', 'nf-svc-orbit__glow-ring');
    c2.setAttribute('cx', '120');
    c2.setAttribute('cy', '120');
    c2.setAttribute('r', '88');
    svg.appendChild(c2);

    stage.appendChild(svg);

    var core = el('div', 'nf-svc-orbit__core');
    stage.appendChild(core);

    var labelsLayer = el('div', 'nf-svc-orbit__labels');
    for (var i = 0; i < 3; i++) {
      var node = el('div', 'nf-svc-orbit__node');
      node.style.setProperty('--nf-orbit-a', ANGLES[i]);
      var label = el('span', 'nf-svc-orbit__label');
      label.textContent = words[i];
      node.appendChild(label);
      labelsLayer.appendChild(node);
    }
    stage.appendChild(labelsLayer);

    root.appendChild(stage);
    return root;
  }

  function inject() {
    var key = document.body && document.body.getAttribute('data-nf-service-orbit');
    if (!key) return;
    var words = WORDS[key];
    if (!words || words.length !== 3) return;

    var section = document.querySelector('main > section:nth-of-type(2)');
    if (!section) return;
    var cells = section.querySelectorAll('[data-type="page-section-content"]');
    var titleCell = cells[0];
    var textCell = cells[1];
    if (!titleCell || !textCell) return;

    unwrapLegacyOrbitRow(textCell);

    if (titleCell.querySelector('.nf-svc-orbit')) return;

    var h2 = titleCell.querySelector('h2');
    if (!h2) return;

    var headingBlock = titleCell.querySelector('[data-type="headingBlock"]');
    var anchor = headingBlock || h2;
    anchor.insertAdjacentElement('afterend', buildOrbit(words));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
