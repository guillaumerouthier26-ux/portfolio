(function () {
// Accessibilité : si l'utilisateur a désactivé les animations, on ne cache/anime
// rien — le texte et les images restent visibles à leur position naturelle.
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  return;
}

var OFFSET = 50;
var EASE       = 'cubic-bezier(0.76, 0, 0.24, 1)';   // rideaux / nav
var EASE_OUT   = 'cubic-bezier(0.16, 1, 0.3, 1)';    // entrées (décélération)
var REVEAL_DUR = '0.55s';                              // durée unique des révélations

// ─── SÉLECTEURS ──────────────────────────────────────────────────────────────

var TITLE_SEL = [
  // Générique : tous les titres typographiques (hors menu, filtré plus bas).
  '.t-titre',
  // Sélecteurs spéciaux qui ne portent pas .t-titre.
  '.sv-img-caption span',
  '.sv-acc-line-outer',
  '.pj-desc-subtitle',
  '.pj-label',
  '.pj-caption-row span',
].join(',');

// Images/vidéos de contenu : sélection générique. On prend toutes les <img> et
// <video> SAUF celles de la navigation, du menu, du footer et du curseur — pour
// que chaque page (et toute nouvelle) soit couverte automatiquement, sans liste
// de classes à maintenir.
function isContentMedia(el) {
  if (el.closest('.navbar, .nav-menu, .footer, .custom-cursor')) return false;
  if (el.classList.contains('footer-logo-img')) return false;
  return true;
}

// ─── WRAP RISE (bloc entier) ──────────────────────────────────────────────────

function wrapRise(el, isInline, marginTop, marginBottom) {
  var wrap = document.createElement(isInline ? 'span' : 'div');
  wrap.style.display  = isInline ? 'inline-block' : 'block';
  wrap.style.clipPath = 'inset(-100px 0 0px 0)';
  if (isInline) {
    wrap.style.verticalAlign = 'bottom';
  } else {
    wrap.style.marginTop    = marginTop;
    wrap.style.marginBottom = marginBottom;
    el.style.marginTop    = '0';
    el.style.marginBottom = '0';
  }
  // Si l'élément est un item de grille (ex. .contact-titre en grid-column),
  // c'est le WRAPPER qui devient l'item : on lui transfère le placement,
  // sinon le wrapper tombe en colonne "auto" et le clip-path coupe le texte.
  var _cs = getComputedStyle(el);
  if (_cs.gridColumn && _cs.gridColumn !== 'auto' && _cs.gridColumn !== 'auto / auto') {
    wrap.style.gridColumn = _cs.gridColumn;
  }
  if (_cs.gridRow && _cs.gridRow !== 'auto' && _cs.gridRow !== 'auto / auto') {
    wrap.style.gridRow = _cs.gridRow;
  }
  el.parentNode.insertBefore(wrap, el);
  wrap.appendChild(el);
  el.style.translate  = '0 100%';
  el.style.transition = 'translate ' + REVEAL_DUR + ' ' + EASE_OUT;
  el._wrapper = wrap;
}

// ─── WRAP LINES PAR <br> (titres avec sauts de ligne explicites) ──────────────

function wrapLinesBR(el) {
  var html  = el.innerHTML.trim();
  var parts = html.split(/<br\s*\/?>/i).map(function(p) { return p.trim(); }).filter(Boolean);

  if (parts.length <= 1) {
    // Une seule ligne : wrapRise classique
    var s = getComputedStyle(el);
    wrapRise(el, s.display.indexOf('inline') !== -1, s.marginTop, s.marginBottom);
    return;
  }

  el.innerHTML = parts.map(function(p) {
    return '<span class="_lclip"><span class="_lin">' + p + '</span></span>';
  }).join('');

  Array.prototype.slice.call(el.querySelectorAll('._lin')).forEach(function(li) {
    var clip = li.parentElement;
    clip.style.display  = 'block';
    clip.style.clipPath = 'inset(0 0 0px 0)';
    li.style.display    = 'block';
    li.style.translate  = '0 100%';
    li.style.transition = 'translate ' + REVEAL_DUR + ' ' + EASE_OUT;
    li._lineClip = clip;
  });

  el._lines = Array.prototype.slice.call(el.querySelectorAll('._lin'));
}

// ─── WRAP LINES (ligne par ligne, texte pur seulement) ───────────────────────

function wrapLines(el) {
  var text = el.textContent.trim();
  if (!text) return;

  var words = text.split(/ +/);

  // Remplir temporairement avec des spans par mot pour mesurer les lignes
  el.innerHTML = words.map(function(w) { return '<span>' + w + '</span>'; }).join(' ');

  var spans   = Array.prototype.slice.call(el.querySelectorAll('span'));
  var groups  = [];
  var prevTop = null;

  spans.forEach(function(s) {
    var top = s.getBoundingClientRect().top;
    if (prevTop === null || Math.abs(top - prevTop) > 4) {
      groups.push([]);
      prevTop = top;
    }
    groups[groups.length - 1].push(s.textContent);
  });

  // Reconstruire avec une enveloppe par ligne
  el.innerHTML = groups.map(function(g) {
    return '<span class="_lclip"><span class="_lin">' + g.join(' ') + '</span></span>';
  }).join('');

  Array.prototype.slice.call(el.querySelectorAll('._lin')).forEach(function(li) {
    var clip = li.parentElement;
    clip.style.display  = 'block';
    clip.style.clipPath = 'inset(0 0 0px 0)';
    li.style.display    = 'block';
    li.style.translate  = '0 100%';
    li.style.transition = 'translate ' + REVEAL_DUR + ' ' + EASE_OUT;
    li._lineClip = clip;
  });

  el._lines = Array.prototype.slice.call(el.querySelectorAll('._lin'));
}

// ─── IMAGES : clip-path wipe ─────────────────────────────────────────────────

function setupImg(img) {
  img.style.clipPath   = 'inset(100% 0 0 0)';
  img.style.transition = 'clip-path 0.7s ' + EASE_OUT;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

var allText = [];
var imgs    = Array.prototype.slice.call(document.querySelectorAll('img, video')).filter(isContentMedia);

// Titres : ligne par ligne si <br> présents, wrapRise sinon
Array.prototype.slice.call(document.querySelectorAll(TITLE_SEL)).forEach(function(el) {
  if (el.closest('.nav-menu, .navbar, .footer')) return;
  var s = getComputedStyle(el);

  // Élément avec split mobile/desktop : animer l'enfant desktop visible
  var desktopSpan = el.querySelector('.pj-desktop-only');
  if (desktopSpan) {
    if (/<br/i.test(desktopSpan.innerHTML)) {
      wrapLinesBR(desktopSpan);
      if (desktopSpan._lines) el._lines = desktopSpan._lines;
    } else {
      wrapRise(el, s.display.indexOf('inline') !== -1, s.marginTop, s.marginBottom);
    }
  } else if (/<br/i.test(el.innerHTML)) {
    // Titre avec <br> directs
    wrapLinesBR(el);
  } else {
    // Titre simple ligne : wrapRise classique
    wrapRise(el, s.display.indexOf('inline') !== -1, s.marginTop, s.marginBottom);
  }

  allText.push(el);
});

// Texte courant : ligne par ligne (br ou mesure), wrapRise pour inline/complexe
Array.prototype.slice.call(document.querySelectorAll('.t-courant, .t-courant-gras')).forEach(function(el) {
  if (el.closest('.nav-menu')) return;
  if (el._wrapper || el._lines) return; // déjà traité via TITLE_SEL
  var s      = getComputedStyle(el);
  var inline = s.display.indexOf('inline') !== -1;
  if (!inline && /<br/i.test(el.innerHTML)) {
    wrapLinesBR(el);
  } else {
    // Tout corps de texte mono : révélé EN BLOC avec retour à la ligne NATIF.
    // (reflow correct à n'importe quelle largeur — plus de lignes rigides mal
    // coupées, ni en 1 colonne ni en 2 colonnes, ni au chargement de la police.)
    wrapRise(el, inline, s.marginTop, s.marginBottom);
  }
  allText.push(el);
});

// Images : toutes clippées au départ, révélées au scroll (reveal montant)
imgs.forEach(function(img) { setupImg(img); });

// ─── NAV : filet + logo + bouton menu ────────────────────────────────────────

(function() {
  var filet  = document.querySelector('.nav-filet');
  var logo   = document.querySelector('.nav-logo');
  var toggle = document.querySelector('.nav-toggle');

  function heroExpand(el, delay) {
    if (!el) return;
    el.style.transformOrigin = 'left center';
    el.style.transform = 'scaleX(0)';
    requestAnimationFrame(function() {
      el.style.transition = 'transform 0.9s ' + EASE;
      setTimeout(function() { el.style.transform = 'scaleX(1)'; }, delay);
    });
  }
  function heroRise(el, delay) {
    if (!el) return;
    el.style.translate = '0 60px';
    requestAnimationFrame(function() {
      el.style.transition = 'translate 0.65s ' + EASE;
      setTimeout(function() { el.style.translate = '0 0'; }, delay);
    });
  }

  heroExpand(filet,  100);
  heroRise  (logo,   220);
  heroRise  (toggle, 340);
})();

// ─── CHECK ───────────────────────────────────────────────────────────────────

function triggerText(els, conditionFn) {
  var vh = window.innerHeight;
  var pending = [];
  els.forEach(function(el) {
    if (el.dataset.anim) return;
    var rect = el._lines
      ? el.getBoundingClientRect()
      : el.parentElement.getBoundingClientRect();
    if (conditionFn(rect, vh)) {
      pending.push({ el: el, top: rect.top, left: rect.left });
    }
  });
  pending.sort(function(a, b) {
    return Math.round(a.top / 5) - Math.round(b.top / 5) || a.left - b.left;
  });
  pending.forEach(function(item, i) {
    item.el.dataset.anim = '1';
    var baseDelay = i * 40;

    if (item.el._lines) {
      // Ligne par ligne
      item.el._lines.forEach(function(li, j) {
        setTimeout(function() {
          li.style.translate = '0 0';
          if (li._lineClip) setTimeout(function() {
            var desc = parseFloat(getComputedStyle(li).fontSize) * 0.3;
            li._lineClip.style.transition = 'clip-path 0.3s ' + EASE_OUT;
            li._lineClip.style.clipPath   = 'inset(0 0 -' + desc + 'px 0)';
          }, 300);
        }, baseDelay + j * 45);
      });
    } else {
      // wrapRise standard
      setTimeout(function() {
        item.el.style.translate = '0 0';
        if (item.el._wrapper) setTimeout(function() {
          var desc = parseFloat(getComputedStyle(item.el).fontSize) * 0.3;
          item.el._wrapper.style.transition = 'clip-path 0.3s ' + EASE_OUT;
          item.el._wrapper.style.clipPath   = 'inset(-100px 0 -' + desc + 'px 0)';
        }, 300);
      }, baseDelay);
    }
  });
}

function checkImgs(conditionFn) {
  var vh = window.innerHeight;
  imgs.forEach(function(img) {
    if (img.dataset.anim || img._noAnim) return;
    var rect = img.getBoundingClientRect();
    if (conditionFn(rect, vh)) {
      img.dataset.anim = '1';
      img.style.clipPath = 'inset(0 0 0 0)';
    }
  });
}

function onLoadVisible() {
  var inView = function(rect, vh) { return rect.top < vh && rect.bottom > 0; };
  checkImgs(inView);
  setTimeout(function() { triggerText(allText, inView); }, 200);
}

function onScroll() {
  // Déclenchement quand le haut de l'élément entre dans la vue (un peu avant le bas),
  // unifié desktop / mobile.
  var trigger = function(rect, vh) { return rect.top < vh + 150; };
  checkImgs(trigger);
  triggerText(allText, trigger);
}

// Révélations : on écoute les DEUX événements (scroll natif + virtualscroll du
// smooth-scroll) + resize, pour ne jamais rater un déclenchement.
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('virtualscroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// Filet de sécurité : plusieurs passages après le chargement (police, images,
// mise en page tardive) + relance quand l'onglet redevient visible. Le texte
// ne peut plus rester bloqué invisible en attendant un refresh.
[80, 250, 600, 1200, 2500].forEach(function(t) { setTimeout(onLoadVisible, t); });
window.addEventListener('load', function() { setTimeout(onLoadVisible, 60); });
document.addEventListener('visibilitychange', function() { if (!document.hidden) onLoadVisible(); });
})();
