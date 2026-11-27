/* Page de révision client.
   La page lit sa liste de médias dans <script type="application/json" id="rev-data">.
   Le client commente les images à modifier (brouillon gardé dans son navigateur), puis :
   - « Demander une révision » envoie la liste des commentaires ;
   - « Confirmer » approuve tout tel quel.
   L'envoi passe par Web3Forms si une clé est fournie (champ "cle") ; sinon, ou si l'envoi échoue,
   la page propose d'envoyer le même résumé par courriel ou de le copier. */
(function () {
  var D = JSON.parse(document.getElementById('rev-data').textContent);
  var COURRIEL = D.courriel || 'info@guillaumerouthier.ca';
  var CLE = 'rev:' + D.id + (D.v ? ':' + D.v : '');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  // numérotation par type : « Vidéo 1 », « Photo 3 »
  var nv = 0, np = 0, npg = 0, nsc = 0;
  var WEB = { page: 1, section: 1 }; // éléments d'une maquette de site web
  D.medias.forEach(function (m, i) {
    m.i = i;
    m.nom = m.type === 'video' ? 'Vidéo ' + (++nv) : m.type === 'page' ? (++npg, m.titre || 'Page ' + npg) : m.type === 'section' ? (++nsc, m.titre || 'Section ' + nsc) : 'Photo ' + (++np);
    m.vignette = m.type === 'photo' ? m.src : m.affiche;
  });
  var photos = D.medias.filter(function (m) { return m.type === 'photo'; });

  // ── vue de Guillaume : le lien du courriel porte les commentaires du client après « #vue= »
  //    (dans le fragment de l'adresse, donc jamais envoyé au serveur). La page s'ouvre alors en lecture seule.
  function coder(o) {
    var b = new TextEncoder().encode(JSON.stringify(o)), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/[+]/g, '-').replace(/[/]/g, '_').replace(/=+$/, '');
  }
  function decoder(t) {
    var s = atob(t.replace(/-/g, '+').replace(/_/g, '/')), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(b));
  }
  var VUE = null;
  try { var h = /^#vue=(.+)$/.exec(location.hash); if (h) VUE = decoder(h[1]); } catch (e) { VUE = null; }

  // ── brouillon (navigateur du client)
  var etat = { c: {}, general: '', nom: '', envoi: null };
  if (VUE) etat = { c: VUE.c || {}, general: VUE.g || '', nom: VUE.n || '', envoi: null };
  else try { var s = JSON.parse(localStorage.getItem(CLE)); if (s && typeof s === 'object') etat = Object.assign(etat, s); } catch (e) {}
  var tSauve;
  function sauver() {
    if (VUE) return;
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
    clearTimeout(tSauve);
    tSauve = setTimeout(function () { $('#rv-brouillon').textContent = 'Brouillon enregistré sur cet appareil'; }, 300);
  }
  var txt = function (i) { return (etat.c[i] || '').trim(); };
  var nbComm = function () { return D.medias.filter(function (m) { return txt(m.i); }).length; };
  var pl = function (n, mot) { return n + ' ' + mot + (n > 1 ? 's' : ''); };
  var total = function () {
    var a = [];
    if (np) a.push(pl(np, 'photo'));
    if (nv) a.push(pl(nv, 'vidéo'));
    if (npg) a.push(pl(npg, 'page'));
    if (nsc) a.push(pl(nsc, 'section'));
    return a.join(' et ');
  };

  // ── en-tête
  $('#rv-projet').textContent = D.projet;
  var SITE = npg + nsc > 0 && !np && !nv; // maquette de site web seulement
  var fich = function (m) { return WEB[m.type] ? '' : ' (' + m.src.split('/').pop().split('?')[0] + ')'; };
  var prix = D.offre && D.offre.prix ? D.offre.prix + (D.offre.note ? ' ' + D.offre.note : '') : '';
  $('#rv-lead').textContent = (SITE ? 'Voici la maquette de votre site : ' + total() + ' à valider. Chaque élément s’ouvre dans un nouvel onglet, sur ordinateur comme sur téléphone' : 'Voici ' + total() + ' à valider') + '. Prenez le temps de tout regarder : rien n\'est envoyé avant que vous cliquiez un des deux boutons au bas de la page.';

  // ── offre (prix proposé et ce qu'il comprend), si la page en a une
  var off = $('#rv-offre');
  if (off && D.offre) {
    $('#rv-offre-prix').textContent = D.offre.prix;
    if (D.offre.note) $('#rv-offre-prix').parentNode.appendChild(el('p', 'rv-offre-note', D.offre.note));
    (D.offre.inclus || []).forEach(function (t) { $('#rv-offre-liste').appendChild(el('li', null, t)); });
    off.hidden = false;
  }

  // ── cartes
  var cartes = [];
  function carte(m) {
    var c = el('article', 'rv-carte'); c.id = 'media-' + m.i;
    var media;
    if (WEB[m.type]) {
      media = el('a', 'rv-media rv-media--page'); media.href = m.src; media.target = '_blank'; media.rel = 'noopener';
      media.setAttribute('aria-label', 'Ouvrir ' + m.nom + ' dans un nouvel onglet');
      var ord = el('img', 'rv-ord'); ord.src = m.affiche; ord.alt = 'Aperçu sur ordinateur : ' + m.nom; ord.loading = 'lazy'; ord.decoding = 'async';
      media.appendChild(ord);
      if (m.mobile) { var tel = el('img', 'rv-tel'); tel.src = m.mobile; tel.alt = 'Aperçu sur téléphone'; tel.loading = 'lazy'; tel.decoding = 'async'; media.appendChild(tel); }
    } else if (m.type === 'video') {
      media = el('div', 'rv-media');
      var v = el('video'); v.controls = true; v.playsInline = true; v.preload = 'none'; v.poster = m.affiche; v.src = m.src;
      v.setAttribute('aria-label', m.nom);
      media.appendChild(v);
    } else {
      media = el('button', 'rv-media'); media.type = 'button'; media.setAttribute('aria-label', 'Agrandir : ' + m.nom);
      var im = el('img'); im.src = m.src; im.alt = m.nom; im.loading = 'lazy'; im.decoding = 'async';
      if (m.w) { im.width = m.w; im.height = m.h; }
      media.appendChild(im);
      media.addEventListener('click', function () { ouvrirZoom(m); });
    }
    var ligne = el('div', 'rv-ligne');
    var titre = el('span', 'rv-titre', m.nom);
    titre.appendChild(el('span', 'rv-puce', 'À modifier'));
    var b = el('button', 'rv-btn-comm', 'Commenter'); b.type = 'button';
    ligne.appendChild(titre);
    if (WEB[m.type]) {
      var gr = el('span', 'rv-ligne-b'), ouv = el('a', 'rv-btn-comm rv-btn-ouvrir', m.type === 'section' ? 'Ouvrir la section' : 'Ouvrir la page'); ouv.href = m.src; ouv.target = '_blank'; ouv.rel = 'noopener';
      gr.appendChild(ouv); gr.appendChild(b); ligne.appendChild(gr);
    } else ligne.appendChild(b);

    var zone = el('div', 'rv-zone'); zone.hidden = true;
    var ta = el('textarea'); ta.id = 'c-' + m.i; ta.setAttribute('aria-label', 'Commentaire pour ' + m.nom);
    ta.placeholder = m.type === 'section' ? 'Ce que vous aimeriez changer dans cette section' : m.type === 'page' ? 'Ce que vous aimeriez changer sur cette page' : m.type === 'video' ? 'Ce que vous aimeriez changer dans cette vidéo' : 'Ce que vous aimeriez changer sur cette photo';
    ta.value = etat.c[m.i] || ''; ta.readOnly = !!VUE;
    var outils = el('div', 'rv-outils');
    if (m.type === 'video') {
      var bt = el('button', 'rv-mini', 'Noter le moment de la vidéo'); bt.type = 'button';
      bt.addEventListener('click', function () {
        var t = Math.floor($('video', c).currentTime || 0), mm = Math.floor(t / 60), ss = ('0' + (t % 60)).slice(-2);
        ta.value = (ta.value && !/\s$/.test(ta.value) ? ta.value + ' ' : ta.value) + 'À ' + mm + ':' + ss + ', ';
        ta.focus(); maj();
      });
      outils.appendChild(bt);
    } else outils.appendChild(el('span'));
    var eff = el('button', 'rv-mini', 'Retirer le commentaire'); eff.type = 'button';
    eff.addEventListener('click', function () { ta.value = ''; maj(); zone.hidden = true; b.hidden = false; b.focus(); });
    outils.appendChild(eff);
    zone.appendChild(ta); zone.appendChild(outils);

    function maj() { etat.c[m.i] = ta.value; rafraichir(); sauver(); }
    function sync() { // reflète etat -> carte
      ta.value = etat.c[m.i] || '';
      var a = !!txt(m.i);
      c.classList.toggle('a-comm', a);
      if (a) { zone.hidden = false; b.hidden = true; }
    }
    b.addEventListener('click', function () { zone.hidden = false; b.hidden = true; ta.focus(); });
    ta.addEventListener('input', maj);
    ta.addEventListener('blur', function () { if (!ta.value.trim()) { ta.value = ''; etat.c[m.i] = ''; zone.hidden = true; b.hidden = false; rafraichir(); } });

    c.appendChild(media); c.appendChild(ligne); c.appendChild(zone);
    cartes.push({ m: m, sync: sync, ouvrir: function () { zone.hidden = false; b.hidden = true; ta.focus(); } });
    return c;
  }
  function section(type, titre, id) {
    var liste = D.medias.filter(function (m) { return m.type === type; });
    var sec = $(id);
    if (!sec) return;
    if (!liste.length) { sec.hidden = true; return; }
    $('.rv-compte', sec).textContent = pl(liste.length, type === 'video' ? 'vidéo' : type === 'page' ? 'page' : type === 'section' ? 'section' : 'photo');
    var g = $('.rv-grille', sec);
    liste.forEach(function (m) { g.appendChild(carte(m)); });
  }
  section('page', 'Pages', '#rv-pages');
  section('section', 'Sections', '#rv-sections');
  section('video', 'Vidéos', '#rv-videos');
  section('photo', 'Photos', '#rv-photos');

  var general = $('#rv-general-ta');
  general.value = etat.general || ''; general.readOnly = !!VUE;
  general.addEventListener('input', function () { etat.general = general.value; rafraichir(); sauver(); });

  // ── barre d'action
  var bRev = $('#rv-b-rev'), bOk = $('#rv-b-ok');
  function rafraichir() {
    var n = nbComm(), g = !!(etat.general || '').trim();
    cartes.forEach(function (k) { k.sync(); });
    $('#rv-nb').textContent = n ? pl(n, 'élément') + ' à modifier' : (g ? 'Un commentaire général' : 'Aucun commentaire');
    var rev = n > 0 || g;
    bRev.classList.toggle('est-principal', rev);
    bOk.classList.toggle('est-principal', !rev);
    bRev.textContent = n ? 'Demander une révision (' + n + ')' : 'Demander une révision';
    var e = etat.envoi, bandeau = $('#rv-envoye');
    bandeau.hidden = !e;
    if (e) $('#rv-envoye-txt').innerHTML = (e.type === 'ok' ? '<b>Vous avez confirmé le tout</b>' : '<b>Demande de révision envoyée</b>') + ' le ' + e.quand + '. Vous pouvez encore ajouter des commentaires et renvoyer.';
  }
  var tInfo;
  function info(msg) {
    var i = $('#rv-info'); i.textContent = msg; i.hidden = false;
    clearTimeout(tInfo); tInfo = setTimeout(function () { i.hidden = true; }, 5000);
  }

  // ── résumé + envoi
  var dlg = $('#rv-dlg'), mode = 'rev';
  function lignes() {
    return D.medias.filter(function (m) { return txt(m.i); }).map(function (m) { return { m: m, t: txt(m.i) }; });
  }
  function message() {
    var L = [], g = (etat.general || '').trim(), nom = (etat.nom || '').trim();
    L.push(mode === 'ok' ? 'CONFIRMATION : tout est approuvé tel quel.' : 'DEMANDE DE RÉVISION');
    L.push('Projet : ' + D.projet);
    if (nom) L.push('De : ' + nom);
    L.push('Contenu : ' + total());
    if (prix) L.push('Prix proposé : ' + prix);
    L.push('');
    if (mode === 'rev') {
      lignes().forEach(function (x) { L.push(x.m.nom + fich(x.m) + ' :'); L.push(x.t); L.push(''); });
      if (g) { L.push('Commentaire général :'); L.push(g); L.push(''); }
    }
    L.push('Page : ' + location.href.split('#')[0]);
    return L.join('\n');
  }
  // Courriel automatique : un champ par élément commenté, pour que chaque modification
  // demandée ressorte avec son propre titre (« Photo 3 », « Vidéo 1 ») au lieu d'un seul bloc de texte.
  function champs() {
    var nom = (etat.nom || '').trim(), g = (etat.general || '').trim(), n = nbComm();
    var o = { access_key: D.cle, subject: sujet(), from_name: D.projet, email: nom, botcheck: '' }; // email : adresse de réponse du courriel
    o['Réponse du client'] = mode === 'ok'
      ? 'TOUT EST CONFIRMÉ : aucune modification demandée (' + total() + ').'
      : 'RÉVISION DEMANDÉE : ' + (n ? pl(n, 'élément') + ' à modifier' : 'commentaire général seulement') + ' sur ' + total() + '.';
    if (mode === 'rev') {
      lignes().forEach(function (x) { o['À modifier : ' + x.m.nom + fich(x.m)] = x.t + String.fromCharCode(10) + (WEB[x.m.type] ? 'Page : ' + new URL(x.m.src, location.href).href : 'Image : ' + new URL(x.m.vignette, location.href).href); });
      if (g) o['Commentaire général'] = g;
    }
    o['Voir les commentaires sur les images'] = location.href.split('#')[0] + '#vue=' + coder({ c: propres(), g: mode === 'rev' ? g : '', n: nom, m: mode });
    o['Projet'] = D.projet;
    if (prix) o['Prix proposé'] = prix;
    if (nom) o['Courriel du client'] = nom;
    return o;
  }
  function propres() { var o = {}; if (mode === 'rev') lignes().forEach(function (x) { o[x.m.i] = x.t; }); return o; }
  var sujet = function () { return (mode === 'ok' ? 'Confirmation' : 'Demande de révision') + ' · ' + D.projet; };

  function ouvrirResume(m) {
    mode = m;
    var n = nbComm(), g = (etat.general || '').trim();
    $('#rv-dlg-form').hidden = false; $('#rv-dlg-ok').hidden = true; $('#rv-alerte').hidden = true; $('#rv-envoyer').hidden = false; $('#rv-nom-err').hidden = true;
    var liste = $('#rv-recap'); liste.textContent = '';
    if (mode === 'rev') {
      $('#rv-dlg-t').textContent = 'Votre demande de révision';
      $('#rv-dlg-p').textContent = 'Relisez vos commentaires. Les éléments sans commentaire sont considérés comme approuvés.';
      lignes().forEach(function (x) {
        var li = el('li'), im = el('img'); im.src = x.m.vignette; im.alt = '';
        var d = el('div'); d.appendChild(el('b', null, x.m.nom)); d.appendChild(el('span', null, x.t));
        li.appendChild(im); li.appendChild(d); liste.appendChild(li);
      });
      if (g) { var li = el('li'), d = el('div'); d.appendChild(el('b', null, 'Commentaire général')); d.appendChild(el('span', null, g)); li.appendChild(el('span')); li.appendChild(d); liste.appendChild(li); }
      $('#rv-envoyer').textContent = 'Envoyer la demande';
    } else {
      $('#rv-dlg-t').textContent = 'Tout confirmer ?';
      $('#rv-dlg-p').textContent = (SITE ? 'Vous approuvez la maquette telle quelle (' + total() + ')' + (prix ? ', au prix proposé de ' + prix : '') : 'Vous approuvez tout le contenu tel quel (' + total() + ')') + '. ' +
        (n || g ? 'Attention : vos commentaires ne seront pas envoyés. Pour les envoyer, choisissez plutôt « Demander une révision ».' : 'Aucune modification ne sera demandée.');
      $('#rv-envoyer').textContent = 'Confirmer';
    }
    liste.hidden = !liste.children.length;
    $('#rv-nom').value = etat.nom || '';
    dlg.showModal();
  }
  bRev.addEventListener('click', function () {
    if (!nbComm() && !(etat.general || '').trim()) {
      info('Écrivez d\'abord un commentaire sous l’élément à modifier.');
      var p = $('.rv-carte'); if (p) p.scrollIntoView({ block: 'center' });
      return;
    }
    ouvrirResume('rev');
  });
  bOk.addEventListener('click', function () { ouvrirResume('ok'); });
  $('#rv-annuler').addEventListener('click', function () { dlg.close(); });
  $('#rv-fermer').addEventListener('click', function () { dlg.close(); });
  $('#rv-nom').addEventListener('input', function () { etat.nom = this.value; sauver(); });

  function reussi(parCourriel) { // parCourriel : le client doit encore appuyer sur Envoyer dans son application
    var d = new Date();
    etat.envoi = { type: mode, quand: d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' }) + ' à ' + d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) };
    sauver(); rafraichir();
    $('#rv-dlg-form').hidden = true; $('#rv-dlg-ok').hidden = false;
    $('#rv-ok-t').textContent = parCourriel === true ? 'Votre courriel est prêt.' : (mode === 'ok' ? 'C\'est confirmé, merci.' : 'Demande envoyée, merci.');
    $('#rv-ok-p').textContent = parCourriel === true ? 'Il reste à appuyer sur Envoyer dans votre application de courriel pour que Guillaume le reçoive.' : mode === 'ok' ? 'Guillaume a reçu votre confirmation.' : 'Guillaume a reçu vos commentaires et vous revient avec la version corrigée.';
    $('#rv-fermer').focus();
  }
  function secours() { // l'envoi automatique n'est pas disponible : le client envoie le même résumé lui-même
    $('#rv-alerte').hidden = false; $('#rv-envoyer').hidden = true;
    $('#rv-mailto').href = 'mailto:' + COURRIEL + '?subject=' + encodeURIComponent(sujet()) + '&body=' + encodeURIComponent(message());
  }
  $('#rv-envoyer').addEventListener('click', function () {
    var b = this;
    var ch = $('#rv-nom'), ok = /^[^ @]+@[^ @]+[.][^ @]+$/.test((etat.nom || '').trim());
    $('#rv-nom-err').hidden = ok;
    ch.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok) { ch.focus(); return; }
    if (!D.cle) { secours(); return; }
    b.disabled = true; var lib = b.textContent; b.textContent = 'Envoi en cours…';
    fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(champs())
    }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.success) reussi(false); else secours(); })
      .catch(secours).then(function () { b.disabled = false; b.textContent = lib; });
  });
  $('#rv-mailto').addEventListener('click', function () { setTimeout(function () { reussi(true); }, 600); });
  $('#rv-copier').addEventListener('click', function () {
    var b = this, t = message();
    var fin = function () { b.textContent = 'Résumé copié'; setTimeout(function () { b.textContent = 'Copier le résumé'; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fin, function () {});
    else { var a = el('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); fin(); } catch (e) {} a.remove(); }
  });

  // ── agrandissement d'une photo, avec le même champ de commentaire
  var zoom = $('#rv-zoom'), zi = 0, zta = $('#rv-zoom-ta');
  function montrer() {
    var m = photos[zi];
    $('#rv-zoom-img').src = m.src; $('#rv-zoom-img').alt = m.nom;
    $('#rv-zoom-nom').textContent = m.nom + ' sur ' + photos.length;
    zta.value = etat.c[m.i] || ''; zta.readOnly = !!VUE;
    if (VUE) zta.placeholder = 'Aucun commentaire sur cette photo';
    zta.setAttribute('aria-label', 'Commentaire pour ' + m.nom);
  }
  function ouvrirZoom(m) { zi = photos.indexOf(m); montrer(); zoom.showModal(); }
  function pas(d) { zi = (zi + d + photos.length) % photos.length; montrer(); }
  $('#rv-zoom-g').addEventListener('click', function () { pas(-1); });
  $('#rv-zoom-d').addEventListener('click', function () { pas(1); });
  $('#rv-zoom-x').addEventListener('click', function () { zoom.close(); });
  $('#rv-zoom-ok').addEventListener('click', function () { zoom.close(); });
  zta.addEventListener('input', function () { etat.c[photos[zi].i] = zta.value; rafraichir(); sauver(); });
  zoom.addEventListener('keydown', function (e) {
    if (e.target === zta) return;
    if (e.key === 'ArrowLeft') pas(-1); else if (e.key === 'ArrowRight') pas(1);
  });
  zoom.addEventListener('close', function () { var c = document.getElementById('media-' + photos[zi].i); if (c) c.scrollIntoView({ block: 'nearest' }); });
  [dlg, zoom].forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); });

  $('#rv-envoye-b').addEventListener('click', function () { var p = $('.rv-carte'); if (p) p.scrollIntoView({ block: 'start' }); });
  rafraichir();

  // ── vue de Guillaume : résumé cliquable en haut, tout en lecture seule
  if (VUE) {
    document.body.classList.add('est-vue');
    var qui = (VUE.n || '').trim(), L = D.medias.filter(function (m) { return txt(m.i); });
    $('.rv-top-k').textContent = 'Réponse du client';
    $('.rv-k').textContent = VUE.m === 'ok' ? 'Tout est confirmé' : 'Révision demandée';
    $('.rv-h1 em').textContent = VUE.m === 'ok' ? 'tout est confirmé.' : 'les modifications.';
    $('#rv-lead').textContent = VUE.m === 'ok'
      ? (qui ? qui + ' a' : 'Le client a') + ' approuvé ' + total() + ' sans modification.'
      : (qui ? qui + ' demande' : 'Le client demande') + ' une modification sur ' + pl(L.length, 'élément') + '. Cliquez une ligne pour aller à cet élément ; ceux à modifier sont encadrés plus bas.';
    var sec = $('#rv-vue'), ul = $('#rv-vue-liste');
    L.forEach(function (m) {
      var li = el('li'), a = el('a'); a.href = '#media-' + m.i;
      var im = el('img'); im.src = m.vignette; im.alt = '';
      var d = el('div'); d.appendChild(el('b', null, m.nom)); d.appendChild(el('span', null, txt(m.i)));
      a.appendChild(im); a.appendChild(d); li.appendChild(a); ul.appendChild(li);
    });
    if ((etat.general || '').trim()) {
      var li = el('li'), d = el('div'); d.appendChild(el('b', null, 'Commentaire général')); d.appendChild(el('span', null, etat.general.trim()));
      var a = el('a'); a.href = '#rv-general-t'; a.appendChild(el('span')); a.appendChild(d); li.appendChild(a); ul.appendChild(li);
    }
    sec.hidden = !ul.children.length;
  }
})();

/* Défilement doux à la molette, comme sur le portfolio (même douceur : 0.1).
   La page garde son défilement normal : on adoucit seulement la molette. Rien ne change sur
   écran tactile, pour qui a demandé moins de mouvement, ni quand une fenêtre (résumé, photo en
   grand) ou une zone de texte est sous la souris. */
(function () {
  if (window.innerWidth < 1024) return;
  if (!window.matchMedia || matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var DOUCEUR = 0.1, cible = 0, courant = 0, actif = false;

  // vrai si l'élément sous la souris défile déjà tout seul
  function defileSeul(n) {
    for (; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
      if (/^(TEXTAREA|DIALOG|IFRAME|SELECT)$/.test(n.tagName)) return true;
      var s = getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return true;
    }
    return false;
  }
  function pas() {
    courant += (cible - courant) * DOUCEUR;
    if (Math.abs(cible - courant) < 0.5) { courant = cible; actif = false; }
    window.scrollTo({ top: courant, behavior: 'instant' });
    if (actif) requestAnimationFrame(pas);
  }
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented || document.querySelector('dialog[open]') || defileSeul(e.target)) return;
    e.preventDefault();
    var d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    if (!actif) cible = courant = window.scrollY; // repart d'où la page est vraiment (clavier, lien, barre de défilement)
    cible = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, cible + d));
    if (!actif) { actif = true; requestAnimationFrame(pas); }
  }, { passive: false });
})();
