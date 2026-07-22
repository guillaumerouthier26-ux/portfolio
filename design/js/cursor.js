(function () {
  if (window.innerWidth < 1024) return;
  // A11y : pas de curseur personnalisé si pointeur non fin (tactile) ou
  // animations réduites — l'utilisateur garde son curseur natif.
  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var dot = document.createElement('div');
  dot.className = 'custom-cursor';
  var label = document.createElement('span');
  label.className = 'custom-cursor-label';
  label.textContent = 'Voir →';
  dot.appendChild(label);
  document.body.appendChild(dot);
  // Le curseur natif n'est masqué que si le curseur perso existe vraiment.
  document.documentElement.classList.add('has-custom-cursor');

  document.addEventListener('mousemove', function (e) {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  });

  // États au survol : projet → disque « Voir → », lien/bouton → point élargi.
  document.addEventListener('mouseover', function (e) {
    var project = e.target.closest('.projet-item, .service-item--link');
    var link = e.target.closest('a, button, [role="button"], label');
    if (project) {
      dot.classList.add('is-project');
      dot.classList.remove('is-link');
    } else if (link) {
      dot.classList.add('is-link');
      dot.classList.remove('is-project');
    } else {
      dot.classList.remove('is-project', 'is-link');
    }
  });
})();
