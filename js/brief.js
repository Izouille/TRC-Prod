/* ============================================================
   TRC PROD — Questionnaire de brief conversationnel
   Une question par écran. À la fin : génération d'un prompt
   copiable (§ template ci-dessous) + envoi email optionnel
   (Formspree, avec pièces jointes).

   ✏️  POUR ÉDITER LES QUESTIONS : voir le tableau QUESTIONS plus bas.
       1 objet = 1 écran. L'ordre du tableau = l'ordre à l'écran.
   ============================================================ */

/* ------------------------------------------------------------
   CONFIG — les seules lignes à personnaliser
   ------------------------------------------------------------ */
const CONFIG = {
  brandName: "TRC Prod",
  homeUrl: "https://trc-prod.vercel.app/",   // le logo ramène au portfolio
  contactEmail: "trcprod38@gmail.com",       // secours mailto si Formspree non configuré

  // ⚙️ ENVOI EMAIL + PIÈCES JOINTES (optionnel, non bloquant) :
  //   1. Crée un formulaire sur https://formspree.io (avec trcprod38@gmail.com)
  //   2. Récupère l'identifiant du endpoint : https://formspree.io/f/XXXXXXXX  ->  "XXXXXXXX"
  //   3. Colle-le ci-dessous. (Les pièces jointes nécessitent un plan Formspree payant.)
  //   Tant que c'est vide, le bouton « copier » fonctionne toujours ; l'envoi bascule sur la messagerie du client (sans fichiers).
  formspreeId: "mvzjoqpl"
};

/* ============================================================
   QUESTIONS — configuration (séparée du rendu)
   type :
     text     → saisie courte (Entrée = valider)
     textarea → saisie longue
     single   → un seul choix (options[])           + other:true → ajoute « Autre »
     multi    → plusieurs choix (options[])         + other:true → ajoute « Autre »
     link     → un ou plusieurs liens (URL)
     upload   → dépôt de fichier(s) + champ lien (les deux facultatifs)
     contact  → nom / email / téléphone (seule étape obligatoire)
   skippable : true par défaut (bouton « Passer »). Mettre false pour bloquer.
   ============================================================ */

/* Palettes de couleurs prédéfinies (question "palette"). Éditable librement :
   name = libellé, colors = pastilles affichées (et reprises dans le brief). */
const PALETTES = [
  { id:"sombre-or",     name:"Sombre & or",           colors:["#14151a","#c9b47c","#8c8fa3","#ece9e2"] },
  { id:"pastel",        name:"Pastel & douceur",      colors:["#f4d9d9","#f7e4c4","#d3e6d6","#d4dcf2","#efe3f4"] },
  { id:"vive",          name:"Vive & contrastée",     colors:["#ef4444","#f59e0b","#10b981","#0ea5e9","#6366f1"] },
  { id:"neutre",        name:"Neutre & naturelle",    colors:["#efe9dd","#cabfa6","#93a07f","#6f685b","#3c372f"] },
  { id:"monochrome",    name:"Monochrome",            colors:["#0b0b0d","#3a3a3f","#7a7a80","#bcbcc2","#f2f2f4"] },
  { id:"marine-cuivre", name:"Marine & cuivre",       colors:["#0f2436","#1e3a52","#b87333","#d9c3a3","#f2efe9"] },
  { id:"terracotta",    name:"Terracotta & crème",    colors:["#c1583b","#e08e6d","#e8c9a0","#7a8b6f","#f5efe6"] },
];

/* Vrai si le client a déjà fourni une identité (fichier ou lien) à la question "identite".
   Sert à ne PAS afficher la question palette dans ce cas. */
function hasIdentity(){
  const d = state.identite || {};
  const files = d.files && d.files.length;
  const links = d.links && d.links.filter(Boolean).length;
  return !!(files || links);
}

const QUESTIONS = [
  /* ---- Section 1 — Votre activité & votre marque ---- */
  { id:"marque", section:"Votre activité & votre marque", type:"text",
    title:"Votre nom, celui de votre marque ou entreprise&nbsp;?",
    placeholder:"Ex : Maison Aurélie, Studio Vél, Jean Dupont…" },

  { id:"secteur", section:"Votre activité & votre marque", type:"single", other:true, cols:2,
    title:"Votre <em>secteur d'activité</em>&nbsp;?",
    options:["Commerce","Restauration","Artisanat","Service","Artiste / Créatif","Immobilier","Événementiel"] },

  { id:"activite", section:"Votre activité & votre marque", type:"text",
    title:"En une phrase, que <em>faites-vous</em>&nbsp;?",
    placeholder:"Ex : je crée des bijoux en argent faits main." },

  { id:"cible", section:"Votre activité & votre marque", type:"multi", other:true, cols:2,
    title:"À qui vous <em>adressez-vous</em>&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["Particuliers","Entreprises","Marques haut de gamme","Local / proximité","Grand public"] },

  { id:"ton", section:"Votre activité & votre marque", type:"multi", other:true, cols:2,
    title:"Comment décririez-vous le <em>ton</em> de votre marque&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["Élégant","Premium","Moderne","Chaleureux","Audacieux","Minimaliste","Créatif","Sérieux / institutionnel"] },

  { id:"identite", section:"Votre activité & votre marque", type:"upload",
    title:"Avez-vous déjà une <em>identité visuelle</em>&nbsp;?",
    help:"Déposez votre logo et votre charte graphique si vous les avez — ou collez un lien (Drive, WeTransfer…).",
    dropLabel:"Déposez logo / charte graphique",
    linkLabel:"…ou collez un lien vers vos fichiers" },

  /* ---- Section 2 — Objectif & type de site ---- */
  { id:"objectifs", section:"Objectif & type de site", type:"multi", other:true, cols:2,
    title:"Quel est l'<em>objectif principal</em> du site&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["Présenter mon activité","Générer des contacts / devis","Vendre en ligne","Prendre des rendez-vous","Montrer un portfolio","Gagner en crédibilité"] },

  { id:"typeSite", section:"Objectif & type de site", type:"single", other:true, cols:2,
    title:"Quel <em>type de site</em>&nbsp;?",
    options:["Site vitrine","Portfolio","One-page","E-commerce / boutique","Blog","Sur-mesure / je ne sais pas"] },

  { id:"siteActuel", section:"Objectif & type de site", type:"link", single:true,
    title:"Avez-vous <em>déjà un site</em> aujourd'hui&nbsp;?",
    help:"Si oui, collez son adresse. Sinon, passez cette question.",
    placeholder:"https://votre-site-actuel.fr" },

  /* ---- Section 3 — Pages & fonctionnalités ---- */
  { id:"pages", section:"Pages & fonctionnalités", type:"multi", other:true, cols:2,
    title:"Quelles <em>pages</em> souhaitez-vous&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["Accueil","À propos","Services / Prestations","Portfolio / Galerie","Tarifs","Blog / Actus","Contact","FAQ","Boutique"] },

  { id:"fonctions", section:"Pages & fonctionnalités", type:"multi", other:true, cols:2,
    title:"Quelles <em>fonctionnalités</em> voulez-vous&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["Formulaire de contact","Prise de RDV en ligne","Galerie photo / vidéo","Paiement en ligne","Newsletter","Espace membre","Multilingue","Avis clients","Carte / plan d'accès","Liens réseaux sociaux"] },

  { id:"langues", section:"Pages & fonctionnalités", type:"single", other:true,
    title:"Site en <em>plusieurs langues</em>&nbsp;?",
    options:["Français uniquement","Français + Anglais"] },

  /* ---- Section 4 — Style, références & contenus ---- */
  { id:"ambiance", section:"Style, références & contenus", type:"multi", other:true, cols:2,
    title:"Quelle <em>ambiance visuelle</em> vous attire&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["Épuré / minimaliste","Sombre / premium","Coloré / vibrant","Chaleureux / naturel","Artistique / éditorial","Corporate / institutionnel","Rétro"] },

  { id:"palette", section:"Style, références & contenus", type:"palette",
    showIf:()=>!hasIdentity(),      // masquée si le client a déjà fourni son identité visuelle
    title:"Quelle <em>palette de couleurs</em> vous parle&nbsp;?",
    help:"Si vous n'avez pas encore de charte graphique, choisissez l'ambiance colorée qui vous ressemble." },

  { id:"references", section:"Style, références & contenus", type:"link",
    title:"Des <em>sites que vous aimez</em>&nbsp;?",
    help:"Concurrents ou non — collez les liens qui vous inspirent.",
    placeholder:"https://un-site-que-jaime.com" },

  { id:"moodboard", section:"Style, références & contenus", type:"upload",
    title:"Un <em>moodboard</em> ou des images d'inspiration&nbsp;?",
    help:"Déposez vos images — ou collez un lien (Pinterest, Drive…).",
    dropLabel:"Déposez vos images d'inspiration",
    linkLabel:"…ou collez un lien (Pinterest, Drive…)" },

  { id:"contenus", section:"Style, références & contenus", type:"multi", other:true, cols:2,
    title:"Où en êtes-vous de vos <em>contenus</em>&nbsp;?",
    help:"Plusieurs réponses possibles.",
    options:["J'ai déjà mes textes","J'ai déjà mes photos / vidéos","J'ai une partie","J'ai besoin d'aide pour la rédaction","J'ai besoin de photos / vidéos"] },

  { id:"contenusFichiers", section:"Style, références & contenus", type:"upload",
    title:"Déposez vos <em>contenus existants</em>",
    help:"Photos, textes… si vous le souhaitez. Sinon, passez.",
    dropLabel:"Déposez vos contenus (photos, textes…)",
    linkLabel:"…ou collez un lien vers vos fichiers" },

  { id:"budget", section:"Style, références & contenus", type:"single", cols:2,
    title:"<em>Budget</em> indicatif&nbsp;?",
    help:"Reste confidentiel — ça m'aide à calibrer la proposition.",
    options:["Moins de 1 000 €","1 000 – 2 500 €","2 500 – 5 000 €","5 000 € +","Je ne sais pas encore"] },

  { id:"delai", section:"Style, références & contenus", type:"single", cols:2,
    title:"<em>Délai</em> souhaité&nbsp;?",
    options:["Le plus vite possible","~ 1 mois","2 – 3 mois","Flexible"] },

  /* ---- Coordonnées (seule étape obligatoire) ---- */
  { id:"contact", section:"Vos coordonnées", type:"contact", skippable:false,
    title:"Vos <em>coordonnées</em> pour vous recontacter",
    help:"Nom et email suffisent — je reviens vers vous très vite." },

  /* ---- Dépôt des fichiers (SwissTransfer) — dernière page ---- */
  { id:"swiss", section:"Vos fichiers", type:"swiss",
    title:"Un dernier geste&nbsp;: <em>déposez vos fichiers</em>",
    help:"Rassemblez tous vos fichiers dans un seul envoi <b>SwissTransfer</b> bien rangé&nbsp;: logo, charte graphique, images d'inspiration, photos et textes existants. Nommez-les clairement, puis collez le lien ci-dessous.<br>C'est facultatif — vous pouvez aussi le faire plus tard." }
];

/* ============================================================
   ÉTAT
   ============================================================ */
const state = {};              // réponses par id de question
let idx = 0;                   // position dans le FLOW
const FLOW = ["intro", ...QUESTIONS.map(q=>q.id), "end"];
const byId = Object.fromEntries(QUESTIONS.map(q=>[q.id,q]));

const app = document.getElementById("app");
const progressEl = document.getElementById("progress");
const barFill = document.getElementById("barFill");
const curStepEl = document.getElementById("curStep");
const totStepEl = document.getElementById("totStep");
const stepTitleEl = document.getElementById("stepTitle");
const resetBtn = document.getElementById("resetBtn");
totStepEl.textContent = QUESTIONS.length;

const CHECK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 6" stroke="#14151a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK_GOLD = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 6" stroke="#c9b47c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ============================================================
   RENDU — routeur d'écran
   ============================================================ */
function render(){
  const key = FLOW[idx];
  window.scrollTo({top:0,behavior:"smooth"});
  if(key==="intro"){ progressEl.hidden = true; renderIntro(); return; }
  if(key==="end"){ progressEl.hidden = true; renderEnd(); return; }

  // Écran de question
  progressEl.hidden = false;
  const q = byId[key];
  const vis = visibleQuestions();
  const pos = vis.indexOf(q) + 1;        // rang parmi les questions réellement affichées
  const isLast = pos === vis.length;     // dernière étape → bouton d'envoi
  curStepEl.textContent = pos;
  totStepEl.textContent = vis.length;
  barFill.style.width = (pos/vis.length*100)+"%";
  stepTitleEl.textContent = q.section;

  const skippable = q.skippable !== false && !isLast;
  const nextLabel = isLast ? "Envoyer ma demande →" : "Suivant →";
  app.innerHTML = `
    <div class="screen" data-qid="${q.id}">
      <div class="q-section eyebrow">${q.section}</div>
      <h2 class="q-title">${q.title}</h2>
      ${q.help ? `<p class="q-help">${q.help}</p>` : ``}
      <div class="q-body">${renderField(q)}</div>
      <div class="actions">
        <button type="button" class="btn ghost" data-act="prev">← Retour</button>
        ${skippable ? `<button type="button" class="skip" data-act="skip">Passer</button>` : ``}
        <span class="spacer"></span>
        <button type="button" class="btn primary" data-act="next">${nextLabel}</button>
      </div>
    </div>`;
  bindField(q);
  bindNav();
  focusFirst(q);
}

/* Questions réellement affichées (celles dont showIf() est vrai) */
function isQuestion(key){ return key!=="intro" && key!=="end"; }
function isVisible(q){ return !q.showIf || q.showIf(state); }
function visibleQuestions(){ return QUESTIONS.filter(isVisible); }

/* ------------------------------------------------------------
   Champs (rendu HTML par type)
   ------------------------------------------------------------ */
function renderField(q){
  const v = state[q.id];
  switch(q.type){
    case "text":
      return `<input type="text" id="i_${q.id}" placeholder="${esc(q.placeholder||"")}" value="${esc(v||"")}">`;
    case "textarea":
      return `<textarea id="i_${q.id}" placeholder="${esc(q.placeholder||"")}">${esc(v||"")}</textarea>`;

    case "single":
    case "multi":{
      const multi = q.type==="multi";
      const sel = multi ? (Array.isArray(v)?v:[]) : v;
      const cls = q.cols===2 ? "choices cols-2" : "choices";
      let opts = q.options.map(o=>{
        const on = multi ? sel.includes(o) : sel===o;
        return choiceHTML(q.id, o, on, multi);
      }).join("");
      let otherBlock = "";
      if(q.other){
        const otherVal = state[q.id+"__other"]||"";
        const on = multi ? sel.includes("__other__") : sel==="__other__";
        opts += choiceHTML(q.id, "Autre", on, multi, "__other__");
        otherBlock = `<div class="other-wrap ${on?"open":""}" data-other="${q.id}">
          <input type="text" id="oi_${q.id}" placeholder="Précisez…" value="${esc(otherVal)}"></div>`;
      }
      return `<div class="choices ${q.cols===2?"cols-2":""}" data-group="${q.id}" data-multi="${multi}">${opts}</div>${otherBlock}`;
    }

    case "link":{
      const arr = Array.isArray(v) ? v : (v?[v]:[""]);
      const list = (arr.length?arr:[""]).map((u,i)=>
        `<input type="url" data-link="${q.id}" data-i="${i}" placeholder="${esc(q.placeholder||"https://…")}" value="${esc(u)}">`
      ).join("");
      const addBtn = q.single ? "" :
        `<button type="button" class="linkrow__add" data-addlink="${q.id}">+ Ajouter un lien</button>`;
      return `<div class="linkrow" data-linkrow="${q.id}">${list}${addBtn}</div>`;
    }

    case "upload":{
      const data = state[q.id] || {files:[],links:[""]};
      return `
        <label class="drop" data-drop="${q.id}">
          <svg class="drop__ic" viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5l5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" stroke-linecap="round"/></svg>
          <div class="drop__t"><b>${q.dropLabel||"Déposez vos fichiers"}</b></div>
          <div class="drop__s">Glissez-déposez ou cliquez — facultatif</div>
          <input type="file" multiple data-file="${q.id}">
        </label>
        <div class="files" data-files="${q.id}"></div>
        <div class="or-sep">ou</div>
        <div class="linkrow" data-linkrow="${q.id}">
          <input type="url" data-link="${q.id}" data-i="0" placeholder="${esc(q.linkLabel||"Collez un lien (Drive, WeTransfer…)")}" value="${esc((data.links&&data.links[0])||"")}">
        </div>`;
    }

    case "contact":{
      const c = state.contact || {};
      return `<div class="contact-grid">
        <input type="text"  id="c_nom"   placeholder="Votre nom *"        value="${esc(c.nom||"")}">
        <input type="email" id="c_email" placeholder="Votre email *"      value="${esc(c.email||"")}">
        <input type="tel"   id="c_tel"   placeholder="Téléphone (facultatif)" value="${esc(c.tel||"")}">
      </div>`;
    }

    case "palette":{
      const sel = state[q.id];
      let cards = PALETTES.map(p=>`
        <label class="choice palette-choice ${sel===p.id?"checked":""}" data-choice="${p.id}">
          <input type="radio" name="${q.id}" value="${p.id}" ${sel===p.id?"checked":""}>
          <span class="box">${CHECK}</span>
          <span class="palette-choice__body">
            <span class="txt">${esc(p.name)}</span>
            <span class="swatches">${p.colors.map(c=>`<span class="swatch" style="background:${c}"></span>`).join("")}</span>
          </span>
        </label>`).join("");
      // Échappatoire : le client a déjà sa charte
      cards += choiceHTML(q.id, "J'ai déjà ma charte, on la verra dans mes fichiers", sel==="__charte__", false, "__charte__");
      return `<div class="choices" data-group="${q.id}" data-multi="false">${cards}</div>`;
    }

    case "swiss":{
      const link = state[q.id] || "";
      return `
        <a class="swiss__link" href="https://www.swisstransfer.com" target="_blank" rel="noopener">Vous ne connaissez pas ? Créez un envoi sur swisstransfer.com ↗</a>
        <div class="linkrow" data-linkrow="${q.id}">
          <input type="url" id="i_${q.id}" data-link="${q.id}" placeholder="Collez ici votre lien SwissTransfer" value="${esc(link)}">
        </div>`;
    }
  }
  return "";
}

function choiceHTML(qid, label, on, multi, valueOverride){
  const val = valueOverride || label;
  return `<label class="choice ${on?"checked":""}" data-choice="${esc(val)}">
    <input type="${multi?"checkbox":"radio"}" name="${qid}" value="${esc(val)}" ${on?"checked":""}>
    <span class="box">${CHECK}</span><span class="txt">${esc(label)}</span></label>`;
}

/* ------------------------------------------------------------
   Champs (comportement / capture)
   ------------------------------------------------------------ */
function bindField(q){
  switch(q.type){
    case "text":
    case "textarea":{
      const el = document.getElementById("i_"+q.id);
      el.addEventListener("input",()=>{ state[q.id]=el.value; save(); });
      if(q.type==="text") onEnter(el, next);
      break;
    }
    case "palette":            // même mécanique qu'un choix unique
    case "single":
    case "multi":{
      const multi = q.type==="multi";
      const group = app.querySelector(`[data-group="${q.id}"]`);
      const otherWrap = app.querySelector(`[data-other="${q.id}"]`);
      const otherInput = document.getElementById("oi_"+q.id);
      group.querySelectorAll(".choice").forEach(ch=>{
        ch.addEventListener("click",e=>{
          e.preventDefault();
          const val = ch.dataset.choice;
          if(!multi){
            group.querySelectorAll(".choice").forEach(c=>c.classList.remove("checked"));
            ch.classList.add("checked");
            state[q.id]=val;
            toggleOther(otherWrap, val==="__other__", otherInput);
            save();
            // Auto-avance (façon Typeform) sauf si « Autre » (l'utilisateur doit préciser)
            if(val!=="__other__") setTimeout(next, 260);
          }else{
            const on = ch.classList.toggle("checked");
            let arr = Array.isArray(state[q.id])?state[q.id].slice():[];
            if(on){ if(!arr.includes(val)) arr.push(val); }
            else arr = arr.filter(x=>x!==val);
            state[q.id]=arr;
            if(val==="__other__") toggleOther(otherWrap, on, otherInput);
            save();
          }
        });
      });
      if(otherInput){
        otherInput.addEventListener("input",()=>{ state[q.id+"__other"]=otherInput.value; save(); });
        onEnter(otherInput, next);
      }
      break;
    }
    case "link":
      bindLinkRow(q.id);
      break;
    case "upload":
      bindUpload(q);
      bindLinkRow(q.id, true);
      break;
    case "contact":{
      ["nom","email","tel"].forEach(k=>{
        const el = document.getElementById("c_"+k);
        el.addEventListener("input",()=>{
          state.contact = state.contact || {};
          state.contact[k]=el.value; save();
        });
        onEnter(el, next);
      });
      break;
    }
    case "swiss":{
      const el = document.getElementById("i_"+q.id);
      el.addEventListener("input",()=>{ state[q.id]=el.value.trim(); save(); });
      onEnter(el, next);
      break;
    }
  }
}

function toggleOther(wrap, open, input){
  if(!wrap) return;
  wrap.classList.toggle("open", open);
  if(open && input) setTimeout(()=>input.focus(), 60);
}

/* -- Liens (répétables) -- */
function bindLinkRow(qid, isUpload){
  const row = app.querySelector(`[data-linkrow="${qid}"]`);
  const readLinks = ()=>{
    const links = [...row.querySelectorAll("[data-link]")].map(i=>i.value.trim()).filter(Boolean);
    if(isUpload){
      state[qid] = state[qid] || {files:[],links:[]};
      state[qid].links = links;
    }else{
      state[qid] = links;
    }
    save();
  };
  row.addEventListener("input", readLinks);
  row.querySelectorAll("[data-link]").forEach(el=>onEnter(el, next));
  const add = app.querySelector(`[data-addlink="${qid}"]`);
  if(add){
    add.addEventListener("click",()=>{
      const inp = document.createElement("input");
      inp.type="url"; inp.dataset.link=qid;
      inp.placeholder = byId[qid].placeholder||"https://…";
      row.insertBefore(inp, add);
      onEnter(inp, next); inp.focus();
    });
  }
}

/* -- Upload de fichiers (stockés en mémoire pour l'envoi Formspree) -- */
function bindUpload(q){
  const drop = app.querySelector(`[data-drop="${q.id}"]`);
  const input = app.querySelector(`[data-file="${q.id}"]`);
  const filesBox = app.querySelector(`[data-files="${q.id}"]`);
  state[q.id] = state[q.id] || {files:[],links:[""]};

  const renderChips = ()=>{
    filesBox.innerHTML = state[q.id].files.map((f,i)=>
      `<span class="filechip"><span>${esc(f.name)}</span><button type="button" class="filechip__x" data-rm="${i}" aria-label="Retirer">×</button></span>`
    ).join("");
    filesBox.querySelectorAll("[data-rm]").forEach(b=>{
      b.addEventListener("click",()=>{ state[q.id].files.splice(+b.dataset.rm,1); renderChips(); });
    });
  };
  const addFiles = list=>{
    [...list].forEach(f=>state[q.id].files.push(f));
    renderChips();
    // NB : les fichiers ne sont pas sauvegardés en localStorage (non sérialisables)
  };
  input.addEventListener("change",e=>addFiles(e.target.files));
  ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag");}));
  ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag");}));
  drop.addEventListener("drop",e=>{ if(e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files); });
  renderChips();
}

/* Entrée = valider (sur les champs sur une seule ligne) */
function onEnter(el, fn){
  el.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); fn(); } });
}
function focusFirst(q){
  const first = app.querySelector("input[type=text],input[type=email],input[type=url],input[type=tel],textarea");
  if(first && ["text","textarea","link","contact","swiss"].includes(q.type)) first.focus({preventScroll:true});
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function bindNav(){
  app.querySelectorAll("[data-act]").forEach(b=>{
    b.addEventListener("click",()=>{
      const a=b.dataset.act;
      if(a==="next") next();
      else if(a==="prev") prev();
      else if(a==="skip") next(true);
    });
  });
}

function next(skip){
  const key = FLOW[idx];
  if(isQuestion(key)){
    const q = byId[key];
    if(!skip && q.skippable===false && !validate(q)) return;
  }
  do { idx = Math.min(idx+1, FLOW.length-1); }
  while(idx < FLOW.length-1 && isQuestion(FLOW[idx]) && !isVisible(byId[FLOW[idx]]));
  save(); render();
}
function prev(){
  do { idx = Math.max(idx-1, 0); }
  while(idx > 0 && isQuestion(FLOW[idx]) && !isVisible(byId[FLOW[idx]]));
  save(); render();
}

function validate(q){
  if(q.type==="contact"){
    const c = state.contact||{};
    const email = (c.email||"").trim();
    const okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if(!(c.nom||"").trim() || !okEmail){
      const nom=document.getElementById("c_nom"), em=document.getElementById("c_email");
      if(!(c.nom||"").trim()){ nom.classList.add("invalid"); nom.focus(); }
      else { em.classList.add("invalid"); em.focus(); }
      toast(okEmail?"Votre nom, s'il vous plaît":"Un email valide, s'il vous plaît", true);
      return false;
    }
  }
  return true;
}

/* ============================================================
   ÉCRAN D'INTRO
   ============================================================ */
function renderIntro(){
  app.innerHTML = `
    <div class="screen intro">
      <div class="eyebrow hero-eyebrow">Prenons votre projet en main</div>
      <h1>Parlons de votre <em>futur site</em></h1>
      <p class="lead">Quelques questions pour cerner votre projet. Comptez <b>3 à 5 minutes</b>, sans inscription. À la fin, vous m'envoyez votre brief en un clic.</p>
      <div class="intro__meta">
        <span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>3 à 5 minutes</span>
        <span><svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>Question par question</span>
        <span><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>Sans inscription</span>
      </div>
      <div class="actions">
        <button type="button" class="btn primary" data-act="start">Commencer →</button>
      </div>
    </div>`;
  app.querySelector("[data-act=start]").addEventListener("click",()=>{ idx=1; save(); render(); });
}

/* ============================================================
   GÉNÉRATION DU PROMPT (template §7)
   ============================================================ */
/* Valeur lisible d'une question, ou "" si vide */
function val(id){
  const q = byId[id]; const v = state[id];
  if(q && (q.type==="single"||q.type==="multi")){
    const arr = q.type==="multi" ? (Array.isArray(v)?v:[]) : (v?[v]:[]);
    const out = arr.map(x=>{
      if(x==="__other__"){ const o=(state[id+"__other"]||"").trim(); return o?("Autre : "+o):""; }
      return x;
    }).filter(Boolean);
    return out.join(", ");
  }
  if(q && q.type==="link"){ const a=Array.isArray(v)?v:(v?[v]:[]); return a.filter(Boolean).join(", "); }
  if(q && q.type==="upload"){ return (v&&v.links?v.links.filter(Boolean):[]).join(", "); }
  if(q && q.type==="palette"){
    if(v==="__charte__") return "Le client a déjà sa charte (voir fichiers)";
    const p = PALETTES.find(x=>x.id===v);
    return p ? `${p.name} (${p.colors.join(" ")})` : "";
  }
  return (v||"").toString().trim();
}
/* Résumé d'un dépôt de fichiers (noms + liens) */
function uploadSummary(id){
  const d = state[id]||{}; const parts=[];
  if(d.files&&d.files.length) parts.push(d.files.map(f=>f.name).join(", "));
  if(d.links) parts.push(...d.links.filter(Boolean));
  return parts.join(" · ");
}
function identityLine(){
  const s = uploadSummary("identite");
  return s ? ("Oui — "+s) : "Non / à créer";
}
function contactLine(){
  const c = state.contact||{};
  return [c.nom, c.email, c.tel].map(x=>(x||"").trim()).filter(Boolean).join(" · ");
}

function buildPrompt(){
  // Une ligne "- Label : valeur" seulement si la valeur n'est pas vide
  const L = (label,value)=> value ? `- ${label} : ${value}` : null;
  const block = (title,lines)=>{
    const kept = lines.filter(Boolean);
    return kept.length ? [`# ${title}`, ...kept].join("\n") : null;
  };

  const parts = [
    "Crée un site internet pour le client suivant. Respecte scrupuleusement les infos ci-dessous.",
    block("Client",[
      L("Marque / nom", val("marque")),
      L("Secteur", val("secteur")),
      L("Activité", val("activite")),
      L("Cible", val("cible")),
      L("Ton de marque", val("ton")),
      L("Identité visuelle fournie", identityLine()),
    ]),
    block("Objectif du site",[
      L("Objectifs", val("objectifs")),
      L("Type de site", val("typeSite")),
      L("Site actuel", val("siteActuel")),
    ]),
    block("Pages & fonctionnalités",[
      L("Pages", val("pages")),
      L("Fonctionnalités", val("fonctions")),
      L("Langues", val("langues")),
    ]),
    block("Direction artistique",[
      L("Ambiance visuelle", val("ambiance")),
      L("Palette de couleurs", val("palette")),
      L("Sites de référence", val("references")),
      L("Moodboard / inspiration", uploadSummary("moodboard")),
      L("Contenus disponibles", val("contenus")),
      L("Contenus fournis", uploadSummary("contenusFichiers")),
    ]),
    block("Cadre",[
      L("Budget", val("budget")),
      L("Délai", val("delai")),
    ]),
    block("Fichiers du client",[
      L("Lien SwissTransfer (logo, charte, photos, textes…)", (state.swiss||"").trim()),
    ]),
    block("Contact client",[ contactLine() ? `- ${contactLine()}` : null ]),
    "Livre un site responsive, moderne et soigné, cohérent avec le ton et l'ambiance ci-dessus."
  ];
  return parts.filter(Boolean).join("\n\n");
}

/* ============================================================
   ÉCRAN DE FIN — envoi automatique + remerciement sobre
   Le client ne voit JAMAIS le récapitulatif ni le prompt : à l'arrivée sur
   cet écran, le brief est compilé et envoyé automatiquement par email, puis
   seul un message de remerciement s'affiche.
   ============================================================ */
let submitted = false;
function renderEnd(){
  if(!submitted){ submitted = true; submitBrief(); }   // envoi automatique, une seule fois
  app.innerHTML = `
    <div class="screen end" style="text-align:center">
      <div class="ic" style="width:66px;height:66px;border:1px solid var(--gold);border-radius:50%;display:grid;place-items:center;margin:8px auto 24px">${CHECK_GOLD}</div>
      <div class="eyebrow">C'est envoyé</div>
      <h1 style="font-size:clamp(2rem,6vw,3.4rem);margin:12px 0 16px">Merci <em>infiniment</em></h1>
      <p class="lead" style="margin:0 auto">Votre demande a bien été envoyée. Je reviens vers vous très vite avec une proposition. À très bientôt.</p>
    </div>`;
  clear();                    // les réponses sont parties : on nettoie la sauvegarde locale
  resetBtn.hidden = true;
  window.scrollTo({top:0,behavior:"smooth"});
}

/* Compile toutes les réponses (+ lien SwissTransfer) et envoie le brief par email.
   Silencieux côté client. Repli messagerie en cas d'échec réseau.
   ⚠️ Envoi en TEXTE (JSON), livré de façon fiable sur tous les plans Formspree.
   Le lien SwissTransfer figure dans le brief → Ethan télécharge tous les fichiers d'un coup. */
async function submitBrief(){
  const prompt = buildPrompt();
  const c = state.contact||{};
  const subject = `Brief site web — ${val("marque")||c.nom||"Nouveau projet"}`;
  const id = (CONFIG.formspreeId||"").trim();

  if(!id){ mailtoFallback(subject, prompt); return; }   // pas de Formspree → secours messagerie

  try{
    const res = await fetch(`https://formspree.io/f/${id}`,{
      method:"POST",
      headers:{"Content-Type":"application/json", Accept:"application/json"},
      body: JSON.stringify({
        _subject: subject,
        email: c.email||"",         // permet à Formspree de définir le reply-to
        Nom: c.nom||"",
        "Téléphone": c.tel||"",
        Brief: prompt
      })
    });
    if(!res.ok) throw new Error("HTTP "+res.status);
  }catch(e){
    mailtoFallback(subject, prompt);   // rien n'est perdu : on ouvre la messagerie du client
  }
}
/* Secours : ouvre la messagerie du client, pré-remplie */
function mailtoFallback(subject, prompt){
  const body = prompt + "\n\n(Pensez à joindre vos fichiers via SwissTransfer si ce n'est pas déjà fait.)";
  window.location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ============================================================
   TOAST
   ============================================================ */
let toastT;
function toast(msg, err){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.toggle("err", !!err);
  t.classList.add("show"); clearTimeout(toastT);
  toastT = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ============================================================
   SAUVEGARDE LOCALE (les fichiers ne sont pas persistés)
   ============================================================ */
const LS_KEY = "trc_brief_v2";
function serialize(){
  const clean = {};
  for(const k in state){
    const v = state[k];
    if(v && typeof v==="object" && Array.isArray(v.files)){
      clean[k] = {links: v.links||[]};      // on ne garde que les liens
    }else clean[k]=v;
  }
  return {state:clean, idx};
}
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(serialize())); }catch(e){} }
function clear(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} }
function load(){
  try{
    const d = JSON.parse(localStorage.getItem(LS_KEY)||"null");
    if(d && d.state){
      Object.assign(state, d.state);
      // Réhydrate la structure des uploads (fichiers repartent vides)
      QUESTIONS.filter(q=>q.type==="upload").forEach(q=>{
        const cur = state[q.id];
        state[q.id] = {files:[], links:(cur&&cur.links)?cur.links:[""]};
      });
      if(typeof d.idx==="number") idx = Math.max(0, Math.min(d.idx, FLOW.length-1));
      return true;
    }
  }catch(e){}
  return false;
}

/* ============================================================
   INIT
   ============================================================ */
document.getElementById("year").textContent = new Date().getFullYear();
if(CONFIG.homeUrl){ const bh=document.getElementById("brandHome"); if(bh) bh.href=CONFIG.homeUrl; }
document.getElementById("brandName").textContent = CONFIG.brandName;

const had = load();
if(had && (idx>0 || Object.keys(state).length)) resetBtn.hidden = false;
resetBtn.addEventListener("click",()=>{
  if(confirm("Effacer toutes vos réponses et recommencer ?")){
    clear();
    for(const k in state) delete state[k];
    idx=0; resetBtn.hidden=true; render();
  }
});
render();
