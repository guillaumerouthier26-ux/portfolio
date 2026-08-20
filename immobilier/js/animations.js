(function () {
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Accessibilité : animations réduites → on retire l'intro et on laisse tout
// le contenu visible à sa position finale, sans révélation ni parallaxe.
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  ['intro-bg', 'intro-video-wrap'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  });
  document.body.classList.remove('intro-active');
  document.documentElement.style.overflow = '';
  return;
}

// Positionnement initial : soit une section ciblée (navigation vers #services /
// #projets - posée par transitions.js, ou hash direct dans l'URL), soit le haut.
// Le smooth-scroll a déjà été initialisé (scripts en ordre), donc on peut placer
// directement, sans glissé ni animation du hero.
(function () {
  var tid = window._scrollTargetId || (location.hash ? location.hash.slice(1) : '');
  window._scrollTargetId = '';
  var tgt = tid ? document.getElementById(tid) : null;
  if (tgt) {
    if (window._smoothScrollActive && window._smoothScrollSnap) {
      window._smoothScrollSnap(tgt.offsetTop);
    } else {
      window.scrollTo(0, tgt.offsetTop);
    }
  } else {
    window.scrollTo(0, 0);
  }
})();

// ─── SCROLL ANIMATIONS ───────────────────────────────────────────────────────

const OFFSET = 50;
const EASE     = 'cubic-bezier(0.76, 0, 0.24, 1)';   // rideaux / intro (symétrique)
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';    // entrées (décélération)
const REVEAL_DUR = '0.55s';                            // durée unique des révélations

const TITLE_SEL = [
  '.services-header .t-titre',
  '.service-item h3',
  '.projets-header .t-titre',
].join(',');
const VERT_SEL = '.projet-labels .t-courant-vert';

// ─── WRAP RISE ───────────────────────────────────────────────────────────────

function wrapRise(el, isInline, marginTop, marginBottom) {
  const wrapper = document.createElement(isInline ? 'span' : 'div');
  wrapper.style.display  = isInline ? 'inline-block' : 'block';
  wrapper.style.clipPath = 'inset(-100px 0 0px 0)';
  if (isInline) wrapper.style.verticalAlign = 'bottom';
  if (!isInline) {
    wrapper.style.marginTop    = marginTop;
    wrapper.style.marginBottom = marginBottom;
    el.style.marginTop    = '0';
    el.style.marginBottom = '0';
  }
  // Transférer le placement grid au wrapper (sinon il tombe en colonne "auto"
  // et le clip-path peut couper le texte).
  const _cs = getComputedStyle(el);
  if (_cs.gridColumn && _cs.gridColumn !== 'auto' && _cs.gridColumn !== 'auto / auto') {
    wrapper.style.gridColumn = _cs.gridColumn;
  }
  if (_cs.gridRow && _cs.gridRow !== 'auto' && _cs.gridRow !== 'auto / auto') {
    wrapper.style.gridRow = _cs.gridRow;
  }
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  el.style.translate  = '0 100%';
  el.style.transition = 'translate ' + REVEAL_DUR + ' ' + EASE_OUT;
  el._wrapper = wrapper;
}

// ─── WRAP LINES (ligne par ligne, texte pur seulement) ───────────────────────

function wrapLines(el) {
  const text = el.textContent.trim();
  if (!text) return;
  const words = text.split(/\s+/);

  el.innerHTML = words.map(w => `<span>${w}</span>`).join(' ');

  const spans = [...el.querySelectorAll('span')];
  const groups = [];
  let prevTop = null;

  spans.forEach(s => {
    const top = s.getBoundingClientRect().top;
    if (prevTop === null || Math.abs(top - prevTop) > 4) { groups.push([]); prevTop = top; }
    groups[groups.length - 1].push(s.textContent);
  });

  el.innerHTML = groups.map(g =>
    `<span class="_lclip"><span class="_lin">${g.join(' ')}</span></span>`
  ).join('');

  [...el.querySelectorAll('._lin')].forEach(li => {
    const clip = li.parentElement;
    clip.style.display  = 'block';
    clip.style.clipPath = 'inset(0 0 0px 0)';
    li.style.display    = 'block';
    li.style.translate  = '0 100%';
    li.style.transition = 'translate ' + REVEAL_DUR + ' ' + EASE_OUT;
    li._lineClip = clip;
  });

  el._lines = [...el.querySelectorAll('._lin')];
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

const allText = [];

[...document.querySelectorAll(TITLE_SEL)].forEach(el => {
  if (el.closest('.nav-menu')) return;
  const s = getComputedStyle(el);
  wrapRise(el, s.display.includes('inline'), s.marginTop, s.marginBottom);
  allText.push(el);
});

[...document.querySelectorAll('.t-courant')].forEach(el => {
  if (el.closest('.nav-menu')) return;
  if (el._wrapper) return;
  const s      = getComputedStyle(el);
  const inline = s.display.includes('inline');
  // Corps mono : révélé en bloc, retour à la ligne natif (pas de lignes rigides).
  wrapRise(el, inline, s.marginTop, s.marginBottom);
  allText.push(el);
});

const projetWraps = [...document.querySelectorAll('.projet-img-wrap')];
const projetCards = projetWraps.map(wrap => ({
  wrap,
  numEl: wrap.querySelector('.t-courant-num'),
}));

projetCards.forEach(({ numEl }) => {
  if (!numEl) return;
  numEl.style.display = 'inline-block';
  wrapRise(numEl, true, '0', '0');
});

const vertEls = [...document.querySelectorAll(VERT_SEL)];
const vertCharGroups = vertEls.map(el => {
  const charH = parseFloat(getComputedStyle(el).fontSize);
  const text   = el.textContent;
  el.textContent = '';
  return [...text].map(char => {
    const outer = document.createElement('span');
    outer.style.display  = 'inline-block';
    outer.style.overflow = 'hidden';
    outer.style.height   = charH + 'px';
    const inner = document.createElement('span');
    inner.style.display    = 'inline-block';
    inner.style.translate  = `0 -${charH}px`;
    inner.style.transition = 'translate 0.45s ease-in-out';
    inner.textContent = char === ' ' ? ' ' : char;
    outer.appendChild(inner);
    el.appendChild(outer);
    return inner;
  });
});

// ─── IMAGES : reveal clip-path au scroll (grilles services + projets) ─────────

const imgs = [...document.querySelectorAll('.service-img, .projet-img')];
imgs.forEach(img => {
  img.style.clipPath  = 'inset(100% 0 0 0)';
  img.style.transition = 'clip-path 0.7s ' + EASE_OUT + ', scale 0.6s ' + EASE_OUT;
});

function checkImgs(conditionFn) {
  const vh = window.innerHeight;
  imgs.forEach(img => {
    if (img.dataset.anim) return;
    const rect = img.getBoundingClientRect();
    if (conditionFn(rect, vh)) {
      img.dataset.anim = '1';
      img.style.clipPath = 'inset(0 0 0 0)';
    }
  });
}

// ─── TRIGGER ─────────────────────────────────────────────────────────────────

function triggerText(conditionFn) {
  const vh = window.innerHeight;
  const pending = [];
  allText.forEach(el => {
    if (el.dataset.anim) return;
    const rect = el._lines ? el.getBoundingClientRect() : el.parentElement.getBoundingClientRect();
    if (conditionFn(rect, vh)) pending.push({ el, top: rect.top, left: rect.left });
  });
  pending.sort((a, b) => Math.round(a.top / 5) - Math.round(b.top / 5) || a.left - b.left);
  pending.forEach(({ el }, i) => {
    el.dataset.anim = '1';
    const baseDelay = i * 40;
    if (el._lines) {
      el._lines.forEach((li, j) => {
        setTimeout(() => {
          li.style.translate = '0 0';
          if (li._lineClip) setTimeout(() => {
            const desc = parseFloat(getComputedStyle(li).fontSize) * 0.3;
            li._lineClip.style.transition = 'clip-path 0.3s ' + EASE_OUT;
            li._lineClip.style.clipPath   = 'inset(0 0 -' + desc + 'px 0)';
          }, 300);
        }, baseDelay + j * 45);
      });
    } else {
      setTimeout(() => {
        el.style.translate = '0 0';
        if (el._wrapper) setTimeout(() => {
          const desc = parseFloat(getComputedStyle(el).fontSize) * 0.3;
          el._wrapper.style.transition = 'clip-path 0.3s ' + EASE_OUT;
          el._wrapper.style.clipPath   = 'inset(-100px 0 -' + desc + 'px 0)';
        }, 300);
      }, baseDelay);
    }
  });
}

function check() {
  const vh = window.innerHeight;
  triggerText((rect, vh) => rect.bottom < vh - OFFSET);
  checkImgs((rect, vh) => rect.top < vh + 150);

  projetCards.forEach(({ wrap, numEl }) => {
    if (!numEl || numEl.dataset.anim) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.top < vh) {
      setTimeout(() => { numEl.dataset.anim = '1'; numEl.style.translate = '0 0'; }, 350);
    }
  });

  vertEls.forEach((el, gi) => {
    if (el.dataset.anim) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < vh - OFFSET) {
      el.dataset.anim = '1';
      vertCharGroups[gi].forEach((inner, ci) => {
        inner.style.transitionDelay = `${ci * 50}ms`;
        inner.style.translate = '0 0';
      });
    }
  });
}

function onLoadVisible() {
  const inView = (rect, vh) => rect.top < vh && rect.bottom > 0;
  triggerText(inView);
  checkImgs(inView);
}

// Révélations : on écoute les DEUX événements (scroll natif + virtualscroll du
// smooth-scroll) + resize, pour ne jamais rater un déclenchement.
window.addEventListener('scroll', check, { passive: true });
window.addEventListener('virtualscroll', check, { passive: true });
window.addEventListener('resize', check, { passive: true });
// Filet de sécurité : on repasse plusieurs fois après le chargement (police,
// images, mise en page tardive) pour révéler ce qui est déjà à l'écran, et on
// relance si l'onglet redevient visible. Le texte ne peut plus rester bloqué.
[80, 250, 600, 1200, 2500].forEach(function (t) { setTimeout(onLoadVisible, t); });
window.addEventListener('load', function () { setTimeout(onLoadVisible, 60); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) onLoadVisible(); });

// ─── HERO ANIMATIONS ─────────────────────────────────────────────────────────

function startHeroAnimations(baseDelay) {
  baseDelay = baseDelay || 0;
  function r(min, max) { return Math.random() * (max - min) + min; }

  function heroWrapRise(el, delay) {
    if (!el) return;
    const isInline = getComputedStyle(el).display.includes('inline');
    const wrap = document.createElement(isInline ? 'span' : 'div');
    wrap.style.display  = isInline ? 'inline-block' : 'block';
    wrap.style.overflow = 'hidden';
    if (isInline) wrap.style.verticalAlign = 'bottom';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    el.style.translate = '0 100%';
    requestAnimationFrame(() => {
      el.style.transition = 'translate 0.65s ease-in-out';
      setTimeout(() => { el.style.translate = '0 0'; }, baseDelay + delay);
    });
  }

  function heroExpand(el, delay) {
    if (!el) return;
    el.style.transformOrigin = 'left center';
    el.style.transform = 'scaleX(0)';
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.9s ease-in-out';
      setTimeout(() => { el.style.transform = 'scaleX(1)'; }, baseDelay + delay);
    });
  }

  function heroRise(el, offset, delay) {
    if (!el) return;
    el.style.translate = `0 ${offset}`;
    requestAnimationFrame(() => {
      el.style.transition = 'translate 0.65s ease-in-out';
      setTimeout(() => { el.style.translate = '0 0'; }, baseDelay + delay);
    });
  }

  heroExpand(document.querySelector('.nav-filet'),  r( 80,  280));
  heroRise  (document.querySelector('.nav-logo'),   '60px', r(200, 450));
  heroRise  (document.querySelector('.nav-toggle'), '60px', r(300, 580));
  heroWrapRise(document.querySelector('.hero-ticker-wrap'), r(680, 1050));
  heroExpand  (document.querySelector('.hero-filet'),       r(720, 1020));
  heroRise    (document.querySelector('.hero-more'), '100vh', r(850, 1250));
}

// Révèle le wordmark central « Guillaume / Routhier » ligne par ligne.
function revealHeroWordmark(delay) {
  delay = delay || 0;
  const lines = document.querySelectorAll('.hero-wordmark .hw-in');
  lines.forEach(function (el, i) {
    el.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
    setTimeout(function () { el.style.transform = 'translateY(0)'; },
      delay + i * 150);
  });

  // L'accroche monte juste après la dernière ligne du nom.
  const tag = document.querySelector('.hero-tagline');
  if (tag) {
    tag.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
    setTimeout(function () { tag.style.transform = 'translateY(0)'; },
      delay + lines.length * 150);
  }

  // La bascule vers l'autre volet monte ensuite, avec la même animation.
  const sw = document.querySelector('.hero-switch');
  if (sw) {
    sw.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
    setTimeout(function () { sw.style.transform = 'translateY(0)'; },
      delay + (lines.length + 1) * 150);
  }
}

// ─── INTRO SEQUENCE ──────────────────────────────────────────────────────────
// Panneau blanc qui se lève (« l'animation du début »), coupé AVANT tout logo :
// dès que le panneau révèle l'image de fond, le texte du hero s'anime.

(function () {
  const introBg   = document.getElementById('intro-bg');
  const introWrap = document.getElementById('intro-video-wrap');
  const video     = document.getElementById('intro-video');

  // Arrivée depuis la page d'accueil : le glissement d'entrée a DÉJÀ eu lieu
  // là-bas, l'écran est couvert. On reprend l'animation où elle en est,
  // sans rejouer d'entrée et sans jamais laisser voir le hero.
  const flagContinue = sessionStorage.getItem('introContinue') === '1';
  if (flagContinue) sessionStorage.removeItem('introContinue');

  // Filet de secours : même si le drapeau se perd (cache, onglet restauré),
  // on rejoue l'intro dès qu'on arrive de la page d'accueil.
  const refIsLanding = (function () {
    try {
      const u = new URL(document.referrer);
      return u.origin === location.origin &&
             /\/$/.test(u.pathname) &&
             u.pathname !== location.pathname &&
             location.pathname.indexOf(u.pathname) === 0;
    } catch (e) { return false; }
  })();

  const fromLanding = flagContinue || refIsLanding;

  // Timings de l'intro
  const SLIDE_IN = 700;  // glissement d'entrée du panneau + de l'animation
  const CUT  = 1850;   // on coupe l'intro AVANT que le logo se forme
  const WIPE = 1100;   // durée du balayage du panneau blanc vers le haut

  function skip(delay) {
    if (introBg)   introBg.remove();
    if (introWrap) introWrap.remove();
    startHeroAnimations(delay);
    revealHeroWordmark(delay + 300);
  }

  if (!introBg || !introWrap || !video) { skip(200); return; }

  // WebKit (iOS/Safari) ne lit pas l'alpha WebM → fond noir : on saute l'intro.
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  if (isIOS || isSafari) { skip(200); return; }

  // Détection navigation interne / déjà vue → pas d'intro
  const alreadySeen = sessionStorage.getItem('introShown');
  const navEntry = performance.getEntriesByType('navigation')[0];
  const isReload = navEntry ? navEntry.type === 'reload' : performance.navigation.type === 1;
  const ref = document.referrer;
  const isInternalNav = !isReload && ref !== '' && (function () {
    try {
      const u = new URL(ref);
      return u.origin === location.origin && u.pathname !== location.pathname;
    } catch (e) { return false; }
  })();

  if (location.hash && !fromLanding) { skip(200); return; }

  if (isReload) {
    sessionStorage.removeItem('introShown');
  } else if (!fromLanding && (isInternalNav || window._spaNavigation || alreadySeen)) {
    window._spaNavigation = false;
    skip(200);
    return;
  }

  sessionStorage.setItem('introShown', '1');

  // Révèle la vidéo pile à la 1re frame décodée (pas de flash noir) : on voit
  // le DÉBUT de l'animation par-dessus le panneau blanc.
  const revealVideo = function () { video.style.opacity = '1'; };
  try { video.currentTime = 0; } catch (e) {}
  if ('requestVideoFrameCallback' in video) {
    video.requestVideoFrameCallback(function () { revealVideo(); });
  } else {
    video.addEventListener('loadeddata', revealVideo, { once: true });
  }
  video.play().catch(function () {});

  // On verrouille le scroll pendant l'intro
  document.body.classList.add('intro-active');
  document.documentElement.style.overflow = 'hidden';

  // Le panneau est déjà en place (arrivée depuis l'accueil) : on avance la
  // vidéo du temps déjà écoulé pour que l'animation soit continue.
  const cutDelay = flagContinue ? (CUT - SLIDE_IN) : CUT;
  if (flagContinue) {
    try { video.currentTime = SLIDE_IN / 1000; } catch (e) {}
  }

  // À la coupe : PAS de fondu. Le panneau blanc ET la vidéo se soulèvent
  // ensemble hors du cadre (les éléments sortent par le haut), révélant le hero.
  setTimeout(function () {
    const ease = 'cubic-bezier(0.76, 0, 0.24, 1)';
    introBg.style.transition   = 'transform ' + (WIPE / 1000) + 's ' + ease;
    introBg.style.transform    = 'translateY(-100%)';
    introWrap.style.transition = 'transform ' + (WIPE / 1000) + 's ' + ease;
    introWrap.style.transform  = 'translate(-50%, calc(-50% - 100vh))';
  }, cutDelay);

  // Le mobilier du hero (filet, logo, ticker) monte pendant le balayage…
  startHeroAnimations(cutDelay);
  // …et le texte central s'anime une fois l'image de fond révélée.
  revealHeroWordmark(cutDelay + WIPE - 250);

  // Déverrouillage + nettoyage
  setTimeout(function () {
    document.body.classList.remove('intro-active');
    document.documentElement.style.overflow = '';
  }, cutDelay + WIPE);
  setTimeout(function () { introBg.remove(); introWrap.remove(); }, CUT + WIPE + 100);
})();
})();
