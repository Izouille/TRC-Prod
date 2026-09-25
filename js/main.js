/* =========================================================
   TRC PROD — JavaScript principal
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initHeroPause();
  initMobileNav();
  initReveal();
  initGalleries();
  initContactForm();
  initBackToTop();
  initReseaux();
  initScrollProgress();
  initCompteurs();
  initCurseurVoir();
  initBarreMobile();
  initSmoothAnchors();
  initHashScroll();
  initRing3D();
  await initWebProjects(); // les cartes doivent exister avant les deux appels suivants
  initWebPreview();
  initWebRail();
  setYear();
});

/* ---------- Hero : animations en pause quand il est hors écran ----------
   La fumée et le zoom lent n'ont pas à tourner pendant qu'on regarde les sites. */
function initHeroPause() {
  const hero = document.querySelector(".hero");
  if (!hero || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([e]) => hero.classList.toggle("hero--pause", !e.isIntersecting)).observe(hero);
}

/* ---------- Anneau 3D des sites (hero de l'accueil) ----------
   Les captures des sites de data/sites.json posées en cercle, en CSS 3D pur
   (aucune librairie). Il tourne seul, se fait glisser à la souris ou au doigt,
   s'arrête quand le hero sort de l'écran. Un clic sans glisser ouvre le site. */
async function initRing3D() {
  const scene = document.querySelector("[data-ring]");
  if (!scene) return;
  const sites = await loadJSON(scene.dataset.ring);
  if (!sites || !sites.length) return;

  // Une vue par site, puis ses pages intérieures, jusqu'à 10 panneaux
  const vues = sites.map((s) => ({ src: s.poster, site: s }));
  for (let i = 0; i < 3; i++) sites.forEach((s) => {
    if (s.frames && s.frames[i]) vues.push({ src: apercuFixe(s.frames[i]), site: s });
  });
  const panneaux = vues.slice(0, Math.max(8, Math.min(10, vues.length)));
  while (panneaux.length < 8) panneaux.push(...vues.slice(0, 8 - panneaux.length));

  const ring = document.createElement("div");
  ring.className = "ring3d__ring";
  const n = panneaux.length;
  const petit = window.matchMedia("(max-width: 760px)").matches;
  const demiLargeur = petit ? 125 : 220;
  const R = Math.round(demiLargeur / Math.tan(Math.PI / n)) + (petit ? 20 : 60);
  const e = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  panneaux.forEach((v, i) => {
    const p = document.createElement("a");
    p.className = "ring3d__panel";
    p.href = v.site.url;
    p.target = "_blank";
    p.rel = "noopener";
    p.draggable = false;
    p.setAttribute("aria-label", "Ouvrir le site " + v.site.title);
    p.style.transform = `rotateY(${(i * 360) / n}deg) translateZ(${R}px)`;
    p.innerHTML = `<img src="${e(v.src)}" alt="" loading="${i < 3 || i > n - 3 ? "eager" : "lazy"}" onerror="this.remove()"><span>${e(v.site.title)}</span>`;
    ring.appendChild(p);
  });
  scene.appendChild(ring);

  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const croisiere = calme ? 0 : -0.07; // degrés par image
  let angle = 0, vitesse = croisiere, penche = 0, cible = 0, drag = null, glisse = false;

  scene.addEventListener("pointerdown", (ev) => {
    drag = { x: ev.clientX, angle, id: ev.pointerId, actif: false };
  });
  scene.addEventListener("pointermove", (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dx = ev.clientX - drag.x;
    if (!drag.actif) {
      if (Math.abs(dx) < 6) return; // un simple clic reste un clic
      drag.actif = true;
      scene.setPointerCapture(drag.id);
      scene.classList.add("is-drag");
    }
    const a = drag.angle + dx * 0.15;
    vitesse = a - angle;
    angle = a;
  });
  const fin = () => {
    if (drag && drag.actif) { glisse = true; setTimeout(() => { glisse = false; }, 0); }
    drag = null;
    scene.classList.remove("is-drag");
  };
  scene.addEventListener("pointerup", fin);
  scene.addEventListener("pointercancel", fin);
  scene.addEventListener("click", (ev) => { if (glisse) { ev.preventDefault(); ev.stopPropagation(); } }, true);
  if (!calme) window.addEventListener("mousemove", (ev) => { cible = (ev.clientY / window.innerHeight - 0.5) * -6; });

  const hero = scene.closest(".hero");
  const tick = () => {
    if (!hero || !hero.classList.contains("hero--pause")) {
      if (!drag) { angle += vitesse; vitesse += (croisiere - vitesse) * 0.02; }
      penche += (cible - penche) * 0.05;
      ring.style.transform = `translateZ(${-R}px) rotateX(${-6 + penche}deg) rotateY(${angle}deg)`;
    }
    requestAnimationFrame(tick);
  };
  tick();
}

/* ---------- Sites réalisés (cartes construites depuis data/sites.json) ----------
   L'ordre du fichier = l'ordre d'affichage. Se modifie avec admin-sites.html. */
async function initWebProjects() {
  const tracks = [...document.querySelectorAll("[data-sites]")];
  if (!tracks.length) return;
  const items = await loadJSON(tracks[0].dataset.sites);
  if (!items || !items.length) return;
  tracks.forEach((track) => { track.innerHTML = items.map(webProjectHTML).join(""); });
}

// Capture fixe d'une page de site (générée par « node captures-apercus.mjs »)
function apercuFixe(url) {
  return "assets/img/apercus/" +
    url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() + ".jpg";
}

function webProjectHTML(site) {
  const e = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const frames = site.frames || [];
  const tiles = ["work", "about", "contact"]
    .map((n, i) => frames[i] ? `<div class="mondrian__tile mondrian__tile--${n}" data-frame="${e(frames[i])}">
            <img class="mondrian__poster" src="${e(apercuFixe(frames[i]))}" alt="" loading="lazy" onerror="this.remove()">
          </div>` : "")
    .join("");
  // Un site peut fournir une vidéo (ex : une animation 3D filmée) : elle remplace
  // alors l'aperçu en direct sur la grande tuile, qui n'est qu'une image figée.
  const grandeTuile = site.video
    ? `<div class="mondrian__tile mondrian__tile--hero">
            <video class="mondrian__video" src="${e(site.video)}" poster="${e(site.videoPoster || site.poster)}"
                   muted loop playsinline preload="none" aria-hidden="true"></video>
          </div>`
    : `<div class="mondrian__tile mondrian__tile--hero" data-frame="${e(site.url)}">
            <img class="mondrian__poster" src="${e(site.poster)}" alt="${e(site.alt || site.title)}">
          </div>`;
  return `
    <article class="webproject">
      <div class="webcase__media">
        <div class="mondrian">
          ${grandeTuile}
          ${tiles}
        </div>
        <a class="mondrian__link" href="${e(site.url)}" target="_blank" rel="noopener" aria-label="Ouvrir le site ${e(site.title)} dans un nouvel onglet">
          <span class="mondrian__hint">Voir le site en mouvement ↗</span>
        </a>
      </div>
      <div class="webproject__info">
        <span class="webproject__tag">${e(site.tag)}</span>
        <h3>${e(site.title)}</h3>
        <p class="webproject__desc">${e(site.desc)}</p>
        <a href="${e(site.url)}" target="_blank" rel="noopener" class="btn">Voir le site ↗</a>
      </div>
    </article>`;
}

/* ---------- Aperçu « site en direct » (mosaïque Mondrian) ----------
   Au repos : captures fixes. Au survol d'une carte, le site du client se
   charge dans des iframes mises à l'échelle façon rendu bureau (une seule
   carte vivante à la fois). Sur mobile ou si l'animation est désactivée,
   on garde la capture statique. */
function initWebPreview() {
  const mosaics = [...document.querySelectorAll(".mondrian")];
  if (!mosaics.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.matchMedia("(max-width: 760px)").matches;
  const RENDER_W = 1180; // largeur de rendu « bureau » avant mise à l'échelle
  const allFrames = []; // {tile, f} de toutes les mosaïques (pour le resize)

  const sizeFrame = (tile, f) => {
    const w = tile.clientWidth, h = tile.clientHeight;
    if (!w || !h) return;
    const scale = w / RENDER_W;
    f.style.width = RENDER_W + "px";
    f.style.height = Math.ceil(h / scale) + "px";
    f.style.transform = "scale(" + scale + ")";
    f.style.transformOrigin = "top left";
  };

  // File d'attente : les sites se chargent UN PAR UN (jamais 15 d'un coup,
  // sinon le navigateur sature et toute la page rame)
  const file = [];
  let enCours = false;
  const chargerSuivant = () => {
    if (enCours || !file.length) return;
    const f = file.shift();
    enCours = true;
    let fini = false;
    const suite = () => {
      if (fini) return;
      fini = true; enCours = false;
      setTimeout(chargerSuivant, 250); // petite respiration entre deux sites
    };
    f.addEventListener("load", () => { if (f.src !== "about:blank") f.parentNode.classList.add("is-pret"); suite(); }, { once: true });
    setTimeout(suite, 2500); // un site lent ne bloque pas les suivants
    f.src = f.dataset.src;
  };
  const mettreEnFile = (mos) => {
    mos.querySelectorAll(".mondrian__frame").forEach((f) => { if (!file.includes(f)) file.push(f); });
    chargerSuivant();
  };

  const build = (mos, tiles) => {
    tiles.forEach((tile) => {
      const f = document.createElement("iframe");
      f.className = "mondrian__frame";
      f.dataset.src = tile.dataset.frame;
      f.tabIndex = -1;
      f.setAttribute("aria-hidden", "true");
      f.setAttribute("scrolling", "no");
      sizeFrame(tile, f);
      tile.appendChild(f);
      allFrames.push({ tile, f });
    });
    mos.classList.add("mondrian--live");
  };

  mosaics.forEach((mos) => {
    const tiles = [...mos.querySelectorAll("[data-frame]")];
    // Mobile / animation désactivée : on garde la capture statique
    if (reduce || small) { mos.classList.add("mondrian--static"); return; }

    // La vidéo de tuile (légère) tourne seulement quand la carte est à l'écran
    const videos = [...mos.querySelectorAll("video")];
    if (videos.length && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => videos.forEach((v) => {
        if (e.isIntersecting) {
          if (v.preload !== "auto") { v.preload = "auto"; v.load(); }
          v.play().catch(() => {});
        } else v.pause();
      })), { threshold: 0.25 }).observe(mos);
    }

    // Les sites en direct (lourds) : uniquement au survol de la carte.
    // Au repos, les captures fixes suffisent : zéro site qui tourne en fond.
    if (!tiles.length) return;
    const carte = mos.closest(".webcase__media") || mos;
    let entree, sortie;
    carte.addEventListener("mouseenter", () => {
      clearTimeout(sortie);
      entree = setTimeout(() => {
        if (!mos.classList.contains("mondrian--live")) build(mos, tiles);
        reprendre(mos);
      }, 200); // un simple passage de souris ne déclenche rien
    });
    carte.addEventListener("mouseleave", () => {
      clearTimeout(entree);
      sortie = setTimeout(() => suspendre(mos), 1200);
    });
  });

  // Fin du survol : on vide les cadres, les captures fixes réapparaissent
  function suspendre(mos) {
    if (!mos.classList.contains("mondrian--on")) return;
    mos.classList.remove("mondrian--on");
    mos.querySelectorAll(".mondrian__frame").forEach((f) => {
      const i = file.indexOf(f);
      if (i > -1) file.splice(i, 1);
      f.parentNode.classList.remove("is-pret");
      f.src = "about:blank";
    });
  }
  function reprendre(mos) {
    if (mos.classList.contains("mondrian--on")) return;
    mos.classList.add("mondrian--on");
    mettreEnFile(mos);
  }

  // Un seul écouteur de redimensionnement pour tous les cadres
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => allFrames.forEach(({ tile, f }) => sizeFrame(tile, f)), 150);
  });
}

/* ---------- Rail horizontal des sites réalisés ----------
   Une seule ligne de cartes : flèches, glisser à la souris ou au doigt.
   La molette verticale n'est jamais détournée : la page défile normalement. */
function initWebRail() {
  // Largeur de la barre de défilement, pour que la ligne pleine largeur ne déborde pas
  const setScrollbarWidth = () => {
    const w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--sbw", Math.max(0, w) + "px");
  };
  setScrollbarWidth();
  window.addEventListener("resize", setScrollbarWidth);

  document.querySelectorAll(".webrail").forEach((rail) => {
    const track = rail.querySelector(".webgrid");
    const prev = rail.querySelector(".webrail__nav--prev");
    const next = rail.querySelector(".webrail__nav--next");
    if (!track) return;

    const maxScroll = () => track.scrollWidth - track.clientWidth;
    // Un « pas » = une carte + l'espace qui la sépare de la suivante
    const step = () => {
      const card = track.querySelector(".webproject");
      if (!card) return track.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const sync = () => {
      const max = maxScroll();
      rail.classList.toggle("webrail--full", max <= 1);
      const x = track.scrollLeft;
      if (prev) prev.disabled = x <= 1;
      if (next) next.disabled = x >= max - 1;
    };

    if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));

    // La molette verticale reste à la page (sinon le scroll accroche en passant
    // sur le rail) : on déplace la ligne aux flèches, au doigt ou en glissant.
    let drag = null;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // le tactile glisse déjà tout seul
      if (maxScroll() <= 1) return;
      drag = { x: e.clientX, left: track.scrollLeft, actif: false, id: e.pointerId };
    });
    track.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      // On n'attrape la ligne qu'après quelques pixels, pour ne pas gêner les clics
      if (!drag.actif) {
        if (Math.abs(dx) < 6) return;
        drag.actif = true;
        track.setPointerCapture(drag.id);
        track.classList.add("webgrid--drag");
      }
      e.preventDefault();
      track.scrollLeft = drag.left - dx;
    });
    const finDrag = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.actif) {
        track.classList.remove("webgrid--drag");
        glisse = true;
        setTimeout(() => { glisse = false; }, 0); // le temps que le clic passe
      }
      drag = null;
    };
    // Le clic qui termine un glissement ne doit pas ouvrir la carte
    let glisse = false;
    track.addEventListener("click", (e) => {
      if (!glisse) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    track.addEventListener("pointerup", finDrag);
    track.addEventListener("pointercancel", finDrag);

    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    // Les images arrivent après coup : on recalcule quand la page a fini de charger
    window.addEventListener("load", sync);
  });
}

/* ---------- Défilement doux pour les ancres internes (#services, #photo…) ---------- */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  });
}

/* ---------- Arrivée depuis une autre page sur une ancre (ex: index.html#services) ---------- */
function initHashScroll() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;
  // Saut net (pas d'animation depuis le haut) + recalages quand les images finissent de charger
  const jump = () => target.scrollIntoView({ behavior: "auto" });
  window.addEventListener("load", () => { jump(); setTimeout(jump, 350); setTimeout(jump, 800); });
}

/* ---------- Bouton retour en haut ---------- */
function initBackToTop() {
  const btn = document.createElement("button");
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Retour en haut");
  btn.innerHTML = "&#8593;";
  document.body.appendChild(btn);
  const onScroll = () => btn.classList.toggle("show", window.scrollY > 600);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---------- Réseaux en bulles ----------
   Une seule liste, posée à trois endroits : la colonne flottante (ordinateur),
   le menu mobile et le pied de page. Pour ajouter un réseau : une ligne ici. */
const RESEAUX = [
  { nom: "Instagram", href: "https://instagram.com/trc.prod",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>' },
  { nom: "LinkedIn", href: "https://www.linkedin.com/in/ethan-trincanato",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5 2.5 2.5 0 0 0 4.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.290-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9z"/></svg>' },
  { nom: "Email", href: "mailto:trcprod38@gmail.com",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>' },
];
function bullesHTML() {
  return RESEAUX.map((r) => {
    const ext = r.href.startsWith("http") ? ' target="_blank" rel="noopener"' : "";
    return `<a class="bubble" href="${r.href}"${ext} aria-label="${r.nom}"><span class="bubble__icon">${r.svg}</span><span class="bubble__label">${r.nom}</span></a>`;
  }).join("");
}
function initReseaux() {
  if (document.body.classList.contains("no-dock")) return;
  const dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = bullesHTML();
  document.body.appendChild(dock);
  const nav = document.querySelector(".nav");
  if (nav) {
    const row = document.createElement("div");
    row.className = "nav__social";
    row.innerHTML = bullesHTML();
    nav.appendChild(row);
  }
  document.querySelectorAll(".footer__social").forEach((f) => {
    f.classList.add("footer__social--bubbles");
    f.innerHTML = bullesHTML();
  });
}

/* ---------- Compteurs animés ----------
   <b data-compte="data/photos.json"></b> : compte les éléments du fichier,
   ou <b data-compte="12"></b> pour un nombre fixe. Le chiffre défile à l'écran. */
function initCompteurs() {
  const els = [...document.querySelectorAll("[data-compte]")];
  if (!els.length) return;
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animer = (el, fin) => {
    if (calme || !("IntersectionObserver" in window)) { el.textContent = fin; return; }
    el.textContent = "0";
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), duree = 1100;
      const pas = (t) => {
        const k = Math.min(1, (t - t0) / duree);
        el.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))); // easeOutCubic
        if (k < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }, { threshold: 0.6 });
    io.observe(el);
  };
  els.forEach(async (el) => {
    const src = el.dataset.compte;
    if (/^\d+$/.test(src)) return animer(el, +src);
    const liste = await loadJSON(src);
    if (liste && liste.length) animer(el, liste.length);
  });
}

/* ---------- Curseur « Voir » sur les projets ----------
   Un rond qui suit la souris (avec un léger retard) au-dessus des projets.
   Seulement avec une vraie souris et si les animations sont permises. */
function initCurseurVoir() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rond = document.createElement("div");
  rond.className = "curseur-voir";
  rond.setAttribute("aria-hidden", "true");
  rond.textContent = "Voir";
  document.body.appendChild(rond);
  let x = 0, y = 0, cx = 0, cy = 0, actif = false, anim = 0;
  const cible = ".webcase__media, .card, .worktile, .ring3d__panel";
  const boucle = () => {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    rond.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${actif ? 1 : 0})`;
    anim = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 || actif ? requestAnimationFrame(boucle) : 0;
  };
  document.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    const sur = e.target.closest && e.target.closest(cible);
    if (sur) rond.textContent = sur.closest(".card") && sur.querySelector(".card__play") ? "Lire" : "Voir";
    if (!!sur !== actif) { actif = !!sur; rond.classList.toggle("on", actif); }
    if (!actif && !anim) { cx = x; cy = y; }
    if (!anim) anim = requestAnimationFrame(boucle);
  }, { passive: true });
}

/* ---------- Barre d'action mobile (bas d'écran) ----------
   Sur téléphone : « Créer mon site » toujours à portée de pouce, plus un raccourci
   vers le contact. Elle se cache près du pied de page pour ne rien masquer. */
function initBarreMobile() {
  if (document.body.classList.contains("sans-barre")) return;
  const barre = document.createElement("div");
  barre.className = "barre-mobile";
  barre.innerHTML = `<a href="brief.html" class="btn btn--solid">Créer mon site →</a>
    <a href="contact.html" class="bubble" aria-label="Me contacter"><span class="bubble__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span></a>`;
  document.body.appendChild(barre);
  const pied = document.querySelector(".footer");
  const maj = () => {
    const basPage = pied && pied.getBoundingClientRect().top < window.innerHeight;
    barre.classList.toggle("show", window.scrollY > 500 && !basPage);
  };
  maj();
  window.addEventListener("scroll", maj, { passive: true });
}

/* ---------- Barre de progression de lecture (haut de page) ---------- */
function initScrollProgress() {
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);
  let prevu = false;
  const maj = () => {
    prevu = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener("scroll", () => { if (!prevu) { prevu = true; requestAnimationFrame(maj); } }, { passive: true });
  maj();
}

/* ---------- Header au scroll ---------- */
function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;
  // Fond au scroll, et le header s'efface quand on descend (revient dès qu'on remonte)
  let avant = window.scrollY, prevu = false;
  const onScroll = () => {
    prevu = false;
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);
    const menuOuvert = document.documentElement.classList.contains("menu-ouvert");
    if (Math.abs(y - avant) > 6) {
      header.classList.toggle("header--cache", y > avant && y > 320 && !menuOuvert);
      avant = y;
    }
  };
  onScroll();
  window.addEventListener("scroll", () => { if (!prevu) { prevu = true; requestAnimationFrame(onScroll); } }, { passive: true });
}

/* ---------- Menu mobile ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav__toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", "false");
  const ouvrir = (oui) => {
    nav.classList.toggle("open", oui);
    toggle.classList.toggle("is-open", oui);
    toggle.setAttribute("aria-expanded", String(oui));
    document.documentElement.classList.toggle("menu-ouvert", oui); // bloque le défilement derrière
  };
  toggle.addEventListener("click", () => ouvrir(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => ouvrir(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) ouvrir(false); });
}

/* ---------- Apparition au scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ---------- Galeries Photo & Vidéo ---------- */
async function initGalleries() {
  const photoEl = document.querySelector("[data-gallery='photos']");
  const videoEl = document.querySelector("[data-gallery='videos']");

  if (photoEl) {
    const items = await loadJSON(photoEl.dataset.src || "data/photos.json");
    if (items) renderPhotos(photoEl, items);
  }
  if (videoEl) {
    const items = await loadJSON(videoEl.dataset.src || "data/videos.json");
    if (items) renderVideos(videoEl, items);
  }
}

async function loadJSON(url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.warn("Impossible de charger", url, err);
    return null;
  }
}

function renderPhotos(container, items) {
  const limit = parseInt(container.dataset.limit || "0", 10);
  const list = limit ? items.slice(0, limit) : items;
  const masonry = container.classList.contains("gallery--masonry");
  container.innerHTML = "";

  // filtres (si demandés)
  let filtersHost = null;
  if (container.dataset.filters === "true") {
    const cats = ["Tous", ...new Set(items.map(i => i.category).filter(Boolean))];
    filtersHost = document.createElement("div");
    filtersHost.className = "filters";
    cats.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "filter" + (i === 0 ? " active" : "");
      b.textContent = c;
      b.dataset.cat = c;
      filtersHost.appendChild(b);
    });
    container.parentNode.insertBefore(filtersHost, container);
  }

  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "card reveal";
    card.dataset.cat = item.category || "";
    card.dataset.index = idx;
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" ${masonry ? "" : 'loading="lazy"'}>
      <div class="card__overlay">
        <span class="card__tag">${item.category || ""}</span>
        <span class="card__title">${item.title}</span>
      </div>`;
    card.addEventListener("click", () => openLightbox({ type: "image", list, index: idx }));
    container.appendChild(card);
  });

  if (filtersHost) {
    filtersHost.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      filtersHost.querySelectorAll(".filter").forEach(f => f.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      container.querySelectorAll(".card").forEach(c => {
        c.style.display = (cat === "Tous" || c.dataset.cat === cat) ? "" : "none";
      });
      if (container._relayout) container._relayout();
    });
  }
  if (masonry) setupMasonry(container);
  initReveal();
}

/* ---------- Masonry (mur de photos, comble les trous) ---------- */
function setupMasonry(container) {
  const relayout = () => layoutMasonry(container);
  container._relayout = relayout;

  // Recalcule à chaque image chargée (les hauteurs ne sont connues qu'après)
  container.querySelectorAll("img").forEach(img => {
    if (!img.complete) img.addEventListener("load", relayout);
  });
  relayout();

  // Recalcule au redimensionnement de la fenêtre (une seule fois branché)
  if (!window.__masonryBound) {
    window.__masonryBound = true;
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        document.querySelectorAll(".gallery--masonry").forEach(c => c._relayout && c._relayout());
      }, 120);
    });
  }
}

function layoutMasonry(container) {
  const width = container.clientWidth;
  if (!width) return;
  const cards = [...container.children].filter(c => c.style.display !== "none");
  const gap = parseFloat(getComputedStyle(container).rowGap) || 16;

  let cols = 3;
  if (width < 560) cols = 2;
  else if (width < 900) cols = 2;

  const colWidth = (width - gap * (cols - 1)) / cols;
  const colHeights = new Array(cols).fill(0);

  container.style.position = "relative";
  cards.forEach(card => {
    card.style.position = "absolute";
    card.style.width = colWidth + "px";
    let min = 0;
    for (let i = 1; i < cols; i++) if (colHeights[i] < colHeights[min]) min = i;
    card.style.left = min * (colWidth + gap) + "px";
    card.style.top = colHeights[min] + "px";
    colHeights[min] += card.offsetHeight + gap;
  });
  container.style.height = Math.max(...colHeights) + "px";
}

function renderVideos(container, items) {
  const limit = parseInt(container.dataset.limit || "0", 10);
  const list = limit ? items.slice(0, limit) : items;
  container.innerHTML = "";
  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "card card--wide reveal";
    card.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
      <div class="card__play"></div>
      <div class="card__overlay">
        <span class="card__tag">${item.category || ""}</span>
        <span class="card__title">${item.title}</span>
      </div>`;
    card.addEventListener("click", () => openLightbox({ type: "video", item }));
    container.appendChild(card);
  });
  initReveal();
}

/* ---------- Lightbox ---------- */
function openLightbox(payload) {
  let lb = document.querySelector(".lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Fermer">&times;</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Précédent">&#8249;</button>
      <div class="lightbox__media"></div>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Suivant">&#8250;</button>`;
    document.body.appendChild(lb);
    lb.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lb.querySelector(".lightbox__nav--prev").click();
      if (e.key === "ArrowRight") lb.querySelector(".lightbox__nav--next").click();
    });
  }
  const media = lb.querySelector(".lightbox__media");
  const prev = lb.querySelector(".lightbox__nav--prev");
  const next = lb.querySelector(".lightbox__nav--next");

  const render = () => {
    if (payload.type === "image") {
      const it = payload.list[payload.index];
      media.innerHTML = `<img src="${it.image}" alt="${it.title}">`;
      prev.style.display = next.style.display = payload.list.length > 1 ? "" : "none";
    } else {
      const it = payload.item;
      const src = it.provider === "vimeo"
        ? `https://player.vimeo.com/video/${it.id}?autoplay=1`
        : `https://www.youtube.com/embed/${it.id}?autoplay=1`;
      media.innerHTML = `<iframe src="${src}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      prev.style.display = next.style.display = "none";
    }
  };

  prev.onclick = (e) => { e.stopPropagation(); payload.index = (payload.index - 1 + payload.list.length) % payload.list.length; render(); };
  next.onclick = (e) => { e.stopPropagation(); payload.index = (payload.index + 1) % payload.list.length; render(); };

  render();
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lb = document.querySelector(".lightbox");
  if (!lb) return;
  lb.classList.remove("open");
  lb.querySelector(".lightbox__media").innerHTML = "";
  document.body.style.overflow = "";
}

/* ---------- Formulaire de contact ---------- */
function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const action = form.getAttribute("action") || "";

    // Backend non configuré (Formspree pas encore branché) -> fallback mailto.
    if (!action.includes("formspree") || action.includes("VOTRE_ID")) {
      const data = new FormData(form);
      const subject = encodeURIComponent(`Projet — ${data.get("name") || ""}`);
      const body = encodeURIComponent(
        `Nom: ${data.get("name") || ""}\nEmail: ${data.get("email") || ""}\nType de projet: ${data.get("type") || ""}\n\n${data.get("message") || ""}`
      );
      window.location.href = `mailto:trcprod38@gmail.com?subject=${subject}&body=${body}`;
      return;
    }

    // Backend Formspree -> envoi AJAX, message inline (l'utilisateur ne quitte pas la page).
    const btn = form.querySelector("button[type=submit]");
    const original = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Envoi…"; }
    setFormStatus(status, "", "");

    try {
      const res = await fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        form.reset();
        setFormStatus(status, "Merci ! Votre message a bien été envoyé. Je vous réponds rapidement.", "ok");
      } else {
        const json = await res.json().catch(() => null);
        const msg = json && json.errors
          ? json.errors.map(x => x.message).join(", ")
          : "Une erreur est survenue. Réessayez ou écrivez-moi directement à trcprod38@gmail.com.";
        setFormStatus(status, msg, "err");
      }
    } catch (err) {
      setFormStatus(status, "Connexion impossible. Réessayez ou écrivez-moi directement à trcprod38@gmail.com.", "err");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = original; }
    }
  });
}

function setFormStatus(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = "form-status" + (type ? " form-status--" + type : "");
}

/* ---------- Année footer ---------- */
function setYear() {
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
}
