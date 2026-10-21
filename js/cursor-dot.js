/* Curseur du site : un point de 10 px, en « différence » pour rester visible
   sur le crème comme sur les photos. Souris seulement (le tactile garde le sien). */
(function () {
  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;

  // Navigation sans rechargement (transitions.js) : le <body> est remplacé et ce
  // script ré-exécuté. On réinsère le point existant au lieu d'en créer un second.
  if (window._dotCursor) {
    if (!window._dotCursor.isConnected) document.body.appendChild(window._dotCursor);
    return;
  }

  var css = document.createElement('style');
  css.id = 'dot-cursor-css';
  css.textContent =
    'html.has-dot-cursor, html.has-dot-cursor * { cursor: none !important; }' +
    '.dot-cursor { position: fixed; top: 0; left: 0; z-index: 100000; width: 10px; height: 10px;' +
    ' margin: -5px 0 0 -5px; border-radius: 50%; background: #fff; mix-blend-mode: difference;' +
    ' pointer-events: none; opacity: 0; transition: opacity .2s ease; will-change: transform; }' +
    '.dot-cursor.is-on { opacity: 1; }';
  document.head.appendChild(css);

  var dot = document.createElement('div');
  dot.className = 'dot-cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  window._dotCursor = dot;
  document.documentElement.classList.add('has-dot-cursor');

  var x = 0, y = 0, raf = 0;
  function draw() { raf = 0; dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
  document.addEventListener('mousemove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(draw);
    if (!dot.isConnected) document.body.appendChild(dot);
    dot.classList.add('is-on');
  }, { passive: true });
  // la souris quitte la fenêtre : le point disparaît
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) dot.classList.remove('is-on'); });
})();
