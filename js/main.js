/* =========================================================
   TRC PROD — JavaScript principal
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileNav();
  initReveal();
  initGalleries();
  initContactForm();
  initBackToTop();
  initSmoothAnchors();
  initHashScroll();
  setYear();
});

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
