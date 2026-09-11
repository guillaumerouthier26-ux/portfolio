(function () {
  if (window.innerWidth < 1024) return;

  var sections = [
    { selector: '.sv-hero',      align: 'start'  },
    { selector: '.sv-img-duo',   align: 'center' },
    { selector: '.sv-accordion', align: 'center' },
    { selector: '.sv-full-img',  align: 'start'  },
    { selector: '.sv-finale',    align: 'center' }
  ];

  var els = sections.map(function (s) {
    return { el: document.querySelector(s.selector), align: s.align };
  }).filter(function (s) { return s.el; });

  function targetY(s) {
    var top = s.el.offsetTop;
    var h   = s.el.offsetHeight;
    var vh  = window.innerHeight;
    if (s.align === 'center') return Math.max(0, top - (vh - h) / 2);
    return top;
  }

  function nearest() {
    var scrollY = window.scrollY;
    var vh = window.innerHeight;
    var best = null, bestDist = Infinity;
    els.forEach(function (s) {
      var y = targetY(s);
      var dist = Math.abs(scrollY - y);
      if (dist < bestDist) { bestDist = dist; best = { s: s, y: y }; }
    });
    /* seulement si on est dans les 35% du viewport du point de snap */
    return bestDist < vh * 0.35 ? best : null;
  }

  var timer, snapping = false;

  window.addEventListener('scroll', function () {
    if (snapping) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var target = nearest();
      if (!target) return;
      snapping = true;
      window.scrollTo({ top: target.y });
      setTimeout(function () { snapping = false; }, 700);
    }, 250);
  });
})();
