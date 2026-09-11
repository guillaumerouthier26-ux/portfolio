/* Liens de menu : passage en gras quand la section correspondante est à
   l'écran (ancres #...). Les liens vers d'autres pages restent gérés par
   aria-current="page". IntersectionObserver → fiable même avec le
   smooth-scroll qui translate le contenu. */
(function () {
  var links = Array.prototype.slice.call(
    document.querySelectorAll('.nav-desktop-link[href^="#"]')
  );
  var pairs = [];
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var section = id && document.getElementById(id);
    if (section) pairs.push({ link: a, section: section });
  });
  if (!pairs.length) return;

  function setActive(link) {
    pairs.forEach(function (p) {
      p.link.classList.toggle('is-active', p.link === link);
    });
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i].section === e.target) { setActive(pairs[i].link); break; }
      }
    });
  }, { rootMargin: '-40% 0px -60% 0px', threshold: 0 });

  pairs.forEach(function (p) { obs.observe(p.section); });
})();
