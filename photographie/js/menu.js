(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;

  // A11y : le menu hors écran est retiré du parcours clavier tant qu'il est fermé.
  function setState(isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    menu.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    menu.toggleAttribute('inert', !isOpen);
    menu.setAttribute('aria-hidden', String(!isOpen));
  }

  setState(false);

  toggle.addEventListener('click', function () {
    setState(this.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setState(false); });
  });

  // Échap ferme le menu
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setState(false);
      toggle.focus();
    }
  });
})();
