(function () {
  if (window.innerWidth < 1024) return;

  // Tablettes : pas de smooth-scroll. La largeur seule ne suffit pas à les
  // écarter (iPad Pro = 1024 en portrait, 1366 en paysage), et le défilement
  // inertiel du système entre en conflit avec l'interpolation.
  // iPadOS se déclare « MacIntel » : on le reconnaît à ses points tactiles.
  var ua = navigator.userAgent;
  var estIOS = /iP(hone|ad|od)/.test(ua) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var estAndroid = /Android/.test(ua);
  var pointeurGrossier = window.matchMedia &&
                         window.matchMedia('(pointer: coarse)').matches;
  if (estIOS || estAndroid || pointeurGrossier) return;

  window._smoothScrollActive = true;

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;will-change:transform;background:#fff;';

  Array.from(document.body.children).forEach(function (child) {
    if (getComputedStyle(child).position !== 'fixed') {
      wrapper.appendChild(child);
    }
  });
  document.body.appendChild(wrapper);

  function syncHeight() {
    document.body.style.height = wrapper.scrollHeight + 'px';
  }
  syncHeight();
  window.addEventListener('resize', syncHeight);
  if (window.ResizeObserver) new ResizeObserver(syncHeight).observe(wrapper);

  var current  = window.scrollY || 0;
  var EASE     = 0.1;
  var vsEvent  = new Event('virtualscroll');
  var lastCurrent = -1;

  function lerp(a, b, t) { return a + (b - a) * t; }

  (function tick() {
    // Arrêter la boucle si le wrapper a été retiré du DOM (swap de page)
    if (!document.body.contains(wrapper)) return;
    current = lerp(current, window.scrollY, EASE);
    if (Math.abs(window.scrollY - current) < 0.05) current = window.scrollY;

    if (current !== lastCurrent) {
      wrapper.style.transform = 'translateY(' + (-current) + 'px)';
      window.dispatchEvent(vsEvent);
      lastCurrent = current;
    }

    requestAnimationFrame(tick);
  })();

  // Positionnement INSTANTANÉ (sans easing) - utilisé lors d'une navigation
  // vers une section (#services / #projets) pour éviter le glissé depuis le haut.
  window._smoothScrollSnap = function (y) {
    current = y;
    lastCurrent = y;
    window.scrollTo(0, y);
    wrapper.style.transform = 'translateY(' + (-y) + 'px)';
    window.dispatchEvent(vsEvent);
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    var dest = href && href !== '#' ? document.querySelector(href) : null;
    e.preventDefault();
    window.scrollTo(0, dest ? dest.offsetTop : 0);
  });

  new MutationObserver(function () {
    if (document.documentElement.style.overflow === 'hidden') current = 0;
  }).observe(document.documentElement, { attributeFilter: ['style'] });
})();
