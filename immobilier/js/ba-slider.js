/* Comparateur avant / après horizontal : divise l'image par une ligne
   verticale qu'on glisse de gauche à droite (souris et tactile). */
(function () {
  var items = document.querySelectorAll('.cp-ba');
  if (!items.length) return;

  items.forEach(function (ba) {
    var dragging = false;

    function setFromClientX(clientX) {
      var r = ba.getBoundingClientRect();
      var pct = ((clientX - r.left) / r.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty('--x', pct + '%');
    }

    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
      e.preventDefault();
    });
    ba.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setFromClientX(e.clientX);
    });
    ba.addEventListener('pointerup', function () { dragging = false; });
    ba.addEventListener('pointercancel', function () { dragging = false; });
  });
})();
