// Full-screen tile visual on the Letters page.
// Small tiles flow between blue and green on their own slow rhythm; moving the
// cursor (or scrolling under it) leaves a trail of wrinkles, and a click or tap
// sends a ripple outward.
(function () {
  var hero = document.querySelector('.hero');
  var canvas = hero && hero.querySelector('canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var off = document.createElement('canvas'), octx = off.getContext('2d');

  var TILE = 9; // tile size in CSS pixels
  var STOPS = [ // blue → cyan → green
    [0.00, [10, 28, 160]],
    [0.30, [0, 92, 255]],
    [0.55, [0, 176, 230]],
    [0.80, [0, 212, 160]],
    [1.00, [70, 230, 120]]
  ];
  var TRAIL_LIFE = 1.4, RIPPLE_LIFE = 2.5, WRINKLE_R = 170;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w, h, cols, rows, img, grain, phase;
  var trail = [], ripples = [], pointer = null, lastPush = 0;
  var running = false, visible = true;

  function colour(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    for (var i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i], k = (t - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k];
      }
    }
    return STOPS[STOPS.length - 1][1];
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / TILE); rows = Math.ceil(h / TILE);
    off.width = cols; off.height = rows;
    img = octx.createImageData(cols, rows);
    grain = new Float32Array(cols * rows);
    phase = new Float32Array(cols * rows);
    for (var i = 0; i < grain.length; i++) { grain[i] = Math.random() * 2 - 1; phase[i] = Math.random() * 6.283; }
    draw(performance.now());
  }

  function draw(now) {
    var s = now / 1000, d = img.data, i = 0;
    trail = trail.filter(function (p) { return s - p.t < TRAIL_LIFE; });
    ripples = ripples.filter(function (r) { return s - r.t < RIPPLE_LIFE; });
    var motion = still ? 0 : s;

    for (var y = 0; y < rows; y++) {
      var v = y / rows, py = (y + 0.5) * TILE;
      for (var x = 0; x < cols; x++, i++) {
        var u = x / cols, px = (x + 0.5) * TILE;
        // Two interlocking slow waves give the colours their own rhythm.
        var n = 0.5 * Math.sin(u * 3.1 + motion * 0.35 + Math.sin(v * 4.2 - motion * 0.27) * 1.3)
              + 0.5 * Math.sin(v * 2.6 - motion * 0.22 + Math.sin(u * 5.1 + motion * 0.31) * 1.1);
        var t = u * 0.62 + v * 0.42 + n * 0.26 - 0.08;
        var light = n * 0.06 + grain[i] * 0.05 + (still ? 0 : 0.04 * Math.sin(s * 1.4 + phase[i]));

        for (var j = 0; j < trail.length; j++) {
          var p = trail[j], dx = px - p.x, dy = py - p.y;
          if (dx > WRINKLE_R || dx < -WRINKLE_R || dy > WRINKLE_R || dy < -WRINKLE_R) continue;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= WRINKLE_R) continue;
          var age = s - p.t, env = (1 - age / TRAIL_LIFE) * (1 - dist / WRINKLE_R) * p.k;
          var wave = Math.sin(dist * 0.11 - age * 10);
          light += 0.22 * env * wave;
          t += 0.08 * env * wave;
        }
        for (j = 0; j < ripples.length; j++) {
          var r = ripples[j], ra = s - r.t;
          var band = Math.abs(Math.hypot(px - r.x, py - r.y) - ra * 600);
          if (band < 60) light += 0.4 * (1 - band / 60) * (1 - ra / RIPPLE_LIFE);
        }

        var c = colour(t), k = light < 0 ? -light : light, to = light > 0 ? 255 : 0;
        if (k > 1) k = 1;
        d[i * 4] = c[0] + (to - c[0]) * k;
        d[i * 4 + 1] = c[1] + (to - c[1]) * k;
        d[i * 4 + 2] = c[2] + (to - c[2]) * k;
        d[i * 4 + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, cols * TILE, rows * TILE);
    // Hairline gaps between tiles make the grid read as fine mosaic.
    ctx.fillStyle = 'rgba(0, 16, 48, 0.16)';
    for (x = 1; x < cols; x++) ctx.fillRect(x * TILE, 0, 1, h);
    for (y = 1; y < rows; y++) ctx.fillRect(0, y * TILE, w, 1);
  }

  function loop(now) {
    draw(now);
    if (visible && (!still || trail.length || ripples.length)) requestAnimationFrame(loop);
    else running = false;
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  // Add a wrinkle point where the cursor is over the visual. Stronger when moving fast.
  function wrinkle(clientX, clientY, strength) {
    var box = hero.getBoundingClientRect();
    var x = clientX - box.left, y = clientY - box.top;
    if (x < 0 || y < 0 || x > box.width || y > box.height) return;
    var now = performance.now();
    if (now - lastPush < 24) return;
    lastPush = now;
    trail.push({ x: x, y: y, t: now / 1000, k: strength });
    if (trail.length > 28) trail.shift();
    start();
  }

  window.addEventListener('pointermove', function (e) {
    var speed = pointer ? Math.min(1, Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) / 30) : 0.5;
    pointer = { x: e.clientX, y: e.clientY };
    wrinkle(e.clientX, e.clientY, 0.4 + 0.6 * speed);
  }, { passive: true });

  // Scrolling moves the visual under a still cursor, so it wrinkles too.
  window.addEventListener('scroll', function () {
    if (pointer) wrinkle(pointer.x, pointer.y, 0.8);
  }, { passive: true });

  hero.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a')) return;
    var box = hero.getBoundingClientRect();
    ripples.push({ x: e.clientX - box.left, y: e.clientY - box.top, t: performance.now() / 1000 });
    start();
  });

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(hero);

  window.addEventListener('resize', resize);
  resize();
  start();
})();
