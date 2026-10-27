// Full-screen tile visual on the Letters page: a blue → green grid of squares
// that slowly shimmers, and sends a ripple of light outward from every click or tap.
(function () {
  var hero = document.querySelector('.hero');
  var canvas = hero && hero.querySelector('canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var BLUE = [12, 52, 160];    // top-left
  var TEAL = [8, 112, 140];    // middle
  var GREEN = [14, 170, 110];  // bottom-right
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w, h, size, cols, rows, phase = [], ripples = [], running = false, visible = true;

  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function base(t) { return t < 0.5 ? mix(BLUE, TEAL, t * 2) : mix(TEAL, GREEN, (t - 0.5) * 2); }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = Math.max(40, Math.min(90, w / 24));
    cols = Math.ceil(w / size); rows = Math.ceil(h / size);
    phase = [];
    for (var i = 0; i < cols * rows; i++) phase.push(Math.random() * Math.PI * 2);
    draw(performance.now());
  }

  function draw(now) {
    var s = now / 1000;
    ripples = ripples.filter(function (r) { return s - r.t < 2.5; });
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var cx = (x + 0.5) * size, cy = (y + 0.5) * size;
        // Diagonal gradient with a slow drifting wave so the colours flow.
        var t = (x / cols) * 0.65 + (y / rows) * 0.35 + 0.08 * Math.sin(s * 0.25 + x * 0.15 - y * 0.1);
        var c = base(Math.max(0, Math.min(1, t)));
        var light = still ? 0 : 0.07 * Math.sin(s * 0.8 + phase[y * cols + x]);
        for (var i = 0; i < ripples.length; i++) {
          var r = ripples[i], age = s - r.t;
          var d = Math.hypot(cx - r.x, cy - r.y) - age * 650;
          if (Math.abs(d) < size * 1.5) light += 0.35 * (1 - Math.abs(d) / (size * 1.5)) * (1 - age / 2.5);
        }
        // light > 0 blends toward white, < 0 toward black.
        var k = Math.abs(light), to = light > 0 ? 255 : 0;
        ctx.fillStyle = 'rgb(' + (c[0] + (to - c[0]) * k | 0) + ',' + (c[1] + (to - c[1]) * k | 0) + ',' + (c[2] + (to - c[2]) * k | 0) + ')';
        ctx.fillRect(x * size, y * size, Math.ceil(size), Math.ceil(size));
      }
    }
  }

  function loop(now) {
    draw(now);
    if (visible && (!still || ripples.length)) requestAnimationFrame(loop);
    else running = false;
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  hero.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a')) return;
    var box = hero.getBoundingClientRect();
    ripples.push({ x: e.clientX - box.left, y: e.clientY - box.top, t: performance.now() / 1000 });
    start();
  });

  // Pause the animation while the visual is scrolled out of view.
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(hero);

  window.addEventListener('resize', resize);
  resize();
  start();
})();
