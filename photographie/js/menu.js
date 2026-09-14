(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;

  const links = Array.from(menu.querySelectorAll('a'));
  // Piège de focus : le bouton X (dans la navbar) + les liens du menu.
  const focusables = [toggle].concat(links);

  // A11y : menu hors écran retiré du parcours clavier tant qu'il est fermé.
  function setState(isOpen, returnFocus) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    menu.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    menu.toggleAttribute('inert', !isOpen);
    menu.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      if (links[0]) setTimeout(function () { links[0].focus(); }, 60);
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  setState(false);

  toggle.addEventListener('click', function () {
    setState(this.getAttribute('aria-expanded') !== 'true', true);
  });

  links.forEach(function (link) {
    link.addEventListener('click', function () { setState(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (!menu.classList.contains('is-open')) return;

    if (e.key === 'Escape') { setState(false, true); return; }

    if (e.key === 'Tab' && focusables.length) {
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
})();
