(function () {
  if (window._transitionsInit) return;
  window._transitionsInit = true;

  var busy = false;
  var IN_MS  = 420;   // le rideau blanc monte pour couvrir l'écran
  var OUT_MS = 520;   // le rideau blanc se retire pour révéler la nouvelle page
  var EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

  function syncCSS(newDoc) {
    var existing = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
      .map(function (l) { return l.href; });
    Array.from(newDoc.head.querySelectorAll('link[rel="stylesheet"]')).forEach(function (l) {
      if (existing.indexOf(l.href) === -1) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = l.href;
        document.head.appendChild(link);
      }
    });
  }

  function runScripts(container) {
    Array.from(container.querySelectorAll('script')).forEach(function (old) {
      if (old.src && old.src.indexOf('transitions.js') !== -1) return;
      var s = document.createElement('script');
      if (old.src) {
        s.src = old.src;
      } else {
        s.textContent = old.textContent;
      }
      old.parentNode.replaceChild(s, old);
    });
  }

  function navigate(href) {
    if (busy) return;
    busy = true;

    // Section cible si l'URL contient un ancrage (ex. index.html#services)
    var targetId = '';
    try { targetId = new URL(href, location.href).hash.slice(1); } catch (e) {}

    // 1) Rideau blanc OPAQUE (sans contenu) qui monte immédiatement pour couvrir
    //    l'écran. On part donc sur du blanc — jamais de flash de la page cible.
    var cover = document.createElement('div');
    cover.style.cssText =
      'position:fixed;inset:0;z-index:998;background:#fff;' +
      'transform:translateY(100%);will-change:transform;pointer-events:none;';
    document.body.appendChild(cover);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        cover.style.transition = 'transform ' + (IN_MS / 1000) + 's ' + EASE;
        cover.style.transform  = 'translateY(0)';
      });
    });

    var t0 = Date.now();

    fetch(href)
      .then(function (r) { return r.text(); })
      .then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); })
      .then(function (newDoc) {
        syncCSS(newDoc);

        // Flag CSS sur <html> — masque l'intro-bg de la page cible avant rendu.
        window._spaNavigation = true;
        document.documentElement.classList.add('js-spa-nav');

        // On échange le contenu seulement une fois le rideau blanc en place.
        var wait = Math.max(0, IN_MS - (Date.now() - t0)) + 20;

        setTimeout(function () {
          var overlay = document.getElementById('page-transition');

          // Retire l'ancien contenu (garde l'overlay de transition + le rideau).
          Array.from(document.body.childNodes).forEach(function (node) {
            if (node === overlay || node === cover) return;
            document.body.removeChild(node);
          });

          // Insère la nouvelle page DERRIÈRE le rideau blanc (invisible pour l'instant).
          Array.from(newDoc.body.childNodes).forEach(function (node) {
            if (node.nodeType === 1 && (
                  node.id === 'page-transition' ||
                  node.id === 'intro-bg' ||
                  node.id === 'intro-video-wrap')) return;
            document.body.insertBefore(document.importNode(node, true), cover);
          });

          document.title = newDoc.title;
          history.pushState({}, newDoc.title, href);
          document.body.style.height = '';
          window.scrollTo(0, 0);

          // Invalide le snap de l'ancienne page ; le nouveau smooth-scroll le
          // redéfinira à son init (scripts rechargés en async).
          window._smoothScrollSnap = null;

          document.body.classList.remove('intro-active');
          document.documentElement.style.overflow = '';
          document.documentElement.classList.remove('js-spa-nav');

          runScripts(document.body);

          // Positionnement DIRECT sur la section ciblée (#services / #projets),
          // sans glissé ni animation du hero. On attend que le nouveau
          // smooth-scroll expose son snap, puis on place d'un coup. Fallback :
          // scroll natif (mobile / pas de smooth-scroll).
          if (targetId) {
            (function () {
              var target = document.getElementById(targetId);
              if (!target) return;
              var tries = 0;
              (function place() {
                if (typeof window._smoothScrollSnap === 'function') {
                  window._smoothScrollSnap(target.offsetTop);
                } else if (tries++ < 60) {
                  requestAnimationFrame(place);
                } else {
                  window.scrollTo(0, target.offsetTop);
                }
              })();
            })();
          }

          // 2) Le rideau blanc se retire vers le haut → révèle la nouvelle page.
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              cover.style.transition = 'transform ' + (OUT_MS / 1000) + 's ' + EASE;
              cover.style.transform  = 'translateY(-100%)';
            });
          });

          setTimeout(function () {
            if (cover.parentNode) cover.parentNode.removeChild(cover);
            busy = false;
          }, OUT_MS + 40);
        }, wait);
      })
      .catch(function () {
        window.location.href = href;
        busy = false;
      });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    try {
      var url = new URL(link.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
    } catch (err) { return; }
    e.preventDefault();
    navigate(link.href);
  });

  window.addEventListener('popstate', function () {
    navigate(location.href);
  });
})();
