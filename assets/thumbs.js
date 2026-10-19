// Draws simple black & white placeholder artwork into every .thumb[data-art].
// Replace a placeholder with a real picture by putting an <img> inside the .thumb instead.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  var art = {
    wave: function (s) {
      var d = 'M0 60';
      for (var x = 0; x <= 160; x += 2) d += ' L' + x + ' ' + (60 + Math.sin(x / 6) * Math.sin(x / 31) * 40);
      s.appendChild(el('path', { d: d, fill: 'none', stroke: '#000', 'stroke-width': 1.5 }));
    },
    rings: function (s) {
      for (var r = 6; r < 90; r += 7) s.appendChild(el('circle', { cx: 80, cy: 60, r: r, fill: 'none', stroke: '#000', 'stroke-width': 1 }));
    },
    bars: function (s) {
      for (var i = 0; i < 32; i++) {
        var h = 10 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * 90;
        s.appendChild(el('rect', { x: 4 + i * 4.8, y: 60 - h / 2, width: 2.4, height: h, fill: '#000' }));
      }
    },
    grid: function (s) {
      for (var x = 0; x < 160; x += 10)
        for (var y = 0; y < 120; y += 10)
          s.appendChild(el('circle', { cx: x + 5, cy: y + 5, r: 1 + ((x * y) % 7) / 2, fill: '#000' }));
    },
    lines: function (s) {
      for (var i = 0; i < 40; i++) s.appendChild(el('line', { x1: i * 4, y1: 0, x2: 160 - i * 4, y2: 120, stroke: '#000', 'stroke-width': .6 }));
    },
    block: function (s) {
      s.appendChild(el('rect', { x: 0, y: 0, width: 160, height: 120, fill: '#000' }));
      s.appendChild(el('circle', { cx: 112, cy: 48, r: 26, fill: '#fff' }));
    }
  };
  document.querySelectorAll('.thumb[data-art]').forEach(function (t) {
    var s = el('svg', { viewBox: '0 0 160 120', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    s.appendChild(el('rect', { width: 160, height: 120, fill: '#fff' }));
    (art[t.dataset.art] || art.wave)(s);
    t.appendChild(s);
  });
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
