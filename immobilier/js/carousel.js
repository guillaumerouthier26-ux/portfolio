/* Carrousel de témoignages : montre N cases à la fois (3 desktop / 2 / 1),
   flèches prev/next, boucle infinie sans à-coup. */
(function () {
  var root = document.querySelector('.tmc');
  if (!root) return;
  var viewport = root.querySelector('.tmc-viewport');
  var track = root.querySelector('.tmc-track');
  if (!viewport || !track) return;

  var originals = Array.prototype.slice.call(track.children);
  var n = originals.length;
  if (n === 0) return;

  // Clones pour la boucle continue
  originals.forEach(function (c) {
    var cl = c.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    track.appendChild(cl);
  });
  var cards = Array.prototype.slice.call(track.children);

  var GAP = 56;
  var index = 0;
  var step = 0;
  var animating = false;

  function visibleCount() {
    if (window.matchMedia('(min-width: 768px)').matches) return Math.min(2, n);
    return 1;
  }

  function setPos(animate) {
    track.style.transition = animate
      ? 'transform 0.55s cubic-bezier(0.76, 0, 0.24, 1)'
      : 'none';
    track.style.transform = 'translateX(' + (-index * step) + 'px)';
  }

  function layout() {
    var visible = visibleCount();
    var vp = viewport.clientWidth;
    var cardW = (vp - (visible - 1) * GAP) / visible;
    cards.forEach(function (c) { c.style.width = cardW + 'px'; });
    step = cardW + GAP;
    index = ((index % n) + n) % n;
    setPos(false);
  }

  function go(dir) {
    if (animating) return;
    if (dir > 0) {
      index += 1;
      animating = true;
      setPos(true);
    } else {
      if (index <= 0) {
        // saut instantané dans la zone des clones, puis on recule en douceur
        index = n;
        setPos(false);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            index -= 1;
            animating = true;
            setPos(true);
          });
        });
      } else {
        index -= 1;
        animating = true;
        setPos(true);
      }
    }
  }

  track.addEventListener('transitionend', function (e) {
    if (e.propertyName !== 'transform') return;
    animating = false;
    if (index >= n) { index -= n; setPos(false); }
    if (index < 0)  { index += n; setPos(false); }
  });

  root.querySelectorAll('.tmc-arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
      go(parseInt(btn.getAttribute('data-dir'), 10));
    });
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(layout, 150);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layout);
  }
  layout();
})();
