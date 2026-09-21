/* =========================================================
   TRC PROD — JavaScript principal
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initMobileNav();
  initReveal();
  initGalleries();
  initContactForm();
  initBackToTop();
  initSmoothAnchors();
  initHashScroll();
  await initWebProjects(); // les cartes doivent exister avant les deux appels suivants
  initWebPreview();
  initWebRail();
  setYear();
});

/* ---------- Sites réalisés (cartes construites depuis data/sites.json) ----------
   L'ordre du fichier = l'ordre d'affichage. Se modifie avec admin-sites.html. */
async function initWebProjects() {
  const tracks = [...document.querySelectorAll("[data-sites]")];
  if (!tracks.length) return;
  const items = await loadJSON(tracks[0].dataset.sites);
  if (!items || !items.length) return;
  tracks.forEach((track) => { track.innerHTML = items.map(webProjectHTML).join(""); });
}

function webProjectHTML(site) {
  const e = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const frames = site.frames || [];
  const tiles = ["work", "about", "contact"]
    .map((n, i) => frames[i] ? `<div class="mondrian__tile mondrian__tile--${n}" data-frame="${e(frames[i])}"></div>` : "")
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
   Injecte le site du client dans des iframes, mises à l'échelle façon
   rendu bureau, uniquement quand la section approche (perf). Sur mobile
   ou si l'animation est désactivée, on garde la capture statique. */
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

  const build = (mos, tiles) => {
    tiles.forEach((tile) => {
      const f = document.createElement("iframe");
      f.className = "mondrian__frame";
      f.src = tile.dataset.frame;
      f.loading = "lazy";
      f.tabIndex = -1;
      f.setAttribute("aria-hidden", "true");
      f.setAttribute("scrolling", "no");
      sizeFrame(tile, f);
      tile.appendChild(f);
      allFrames.push({ tile, f });
    });
    lancerVideos(mos);
    mos.classList.add("mondrian--live");
  };

  // Les vidéos de tuile ne se chargent qu'au moment où la mosaïque s'anime
  const lancerVideos = (mos) => {
    mos.querySelectorAll("video").forEach((v) => {
      v.preload = "auto";
      const jouer = () => v.play().catch(() => {});
      v.readyState >= 2 ? jouer() : v.addEventListener("canplay", jouer, { once: true });
      v.load();
    });
  };

  mosaics.forEach((mos) => {
    const tiles = [...mos.querySelectorAll("[data-frame]")];
    // Mobile / animation désactivée : on garde la capture statique
    if (reduce || small || !tiles.length) { mos.classList.add("mondrian--static"); return; }
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { build(mos, tiles); io.disconnect(); } });
      }, { rootMargin: "250px" });
      io.observe(mos);
    } else {
      build(mos, tiles);
    }
  });

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

/* ---------- Header au scroll ---------- */
function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Menu mobile ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav__toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
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
