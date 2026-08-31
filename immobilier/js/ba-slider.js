/* Comparateur avant / après vertical : divise l'image par une ligne
   horizontale qu'on glisse de haut en bas (souris et tactile). */
(function () {
  var items = document.querySelectorAll('.cp-ba');
  if (!items.length) return;

  items.forEach(function (ba) {
    var dragging = false;

    function setFromClientY(clientY) {
      var r = ba.getBoundingClientRect();
      var pct = ((clientY - r.top) / r.height) * 100;
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty('--y', pct + '%');
    }

    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      setFromClientY(e.clientY);
      e.preventDefault();
    });
    ba.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setFromClientY(e.clientY);
    });
    ba.addEventListener('pointerup', function () { dragging = false; });
    ba.addEventListener('pointercancel', function () { dragging = false; });
  });
})();
