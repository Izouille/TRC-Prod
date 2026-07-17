/* ============================================================
   TRC PROD — Réception du brief (fonction serverless Vercel)
   ------------------------------------------------------------
   Le formulaire brief.html envoie ICI (même origine : /api/envoi).
   L'email part TOUJOURS côté serveur (aucun bloqueur de pub /
   bouclier navigateur ne s'applique côté serveur) :

     1. Si la variable d'environnement RESEND_API_KEY est définie
        → envoi direct et fiable via Resend (recommandé, sans quota
        de 50/mois, sans spam). Voir README pour la mise en place.
     2. Sinon → repli automatique sur Formspree (comportement
        historique — rien ne casse tant que la clé n'est pas posée).

   Deux façons d'appeler cette fonction (le client tente les deux) :
     • fetch JSON  → on répond en JSON  {ok:true}
     • soumission de <form> (navigation) → on répond une PAGE HTML
       de remerciement. Ce 2e canal sert de secours : un bloqueur
       peut couper un fetch, jamais une navigation de formulaire.
   ============================================================ */

const RESEND_ENDPOINT   = "https://api.resend.com/emails";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvzjoqpl";
const TO   = "trcprod38@gmail.com";                 // destinataire des briefs
const FROM = "TRC Prod <onboarding@resend.dev>";    // expéditeur Resend (sans domaine à vérifier)

/* --- Corps de requête : JSON (fetch) ou urlencoded (form) --- */
function parseBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "object") return b;              // Vercel a déjà parsé
  if (typeof b === "string") {
    const s = b.trim();
    if (s.startsWith("{")) { try { return JSON.parse(s); } catch (e) {} }
    const out = {};
    new URLSearchParams(s).forEach((v, k) => { out[k] = v; });
    return out;
  }
  return {};
}

/* La requête vient-elle d'une navigation de formulaire (→ réponse HTML) ? */
function wantsHtml(req, data) {
  if (data && (data._nav === "1" || data._nav === 1)) return true;
  const a = (req.headers && req.headers.accept) || "";
  return a.indexOf("text/html") !== -1 && a.indexOf("application/json") === -1;
}

/* Envoi via Resend. Renvoie {tried:false} si aucune clé configurée. */
async function sendViaResend(data) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { tried: false };
  const subject = data._subject || "Nouveau brief — TRC Prod";
  const text = [
    data.Nom ? "Nom : " + data.Nom : null,
    data.email ? "Email : " + data.email : null,
    data["Téléphone"] ? "Téléphone : " + data["Téléphone"] : null,
    "",
    data.Brief || ""
  ].filter(x => x !== null).join("\n");

  const r = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: data.email || undefined,   // répondre = écrire directement au client
      subject,
      text
    })
  });
  return { tried: true, ok: r.ok, status: r.status };
}

/* Repli : relais vers Formspree (côté serveur → jamais bloqué). */
async function sendViaFormspree(data) {
  const r = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  return { ok: r.ok, status: r.status };
}

/* Page HTML de remerciement (secours navigation) — sobre, aux couleurs du site. */
function thankYouPage(ok) {
  const title = ok ? "Merci infiniment" : "Un instant…";
  const msg = ok
    ? "Votre demande a bien été envoyée. Je reviens vers vous très vite avec une proposition."
    : "L'envoi automatique a rencontré un souci. Écrivez-moi directement à <a style=\"color:#c9b47c\" href=\"mailto:" + TO + "\">" + TO + "</a> — je m'en occupe aussitôt.";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — TRC Prod</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#14151a;color:#f3f1ea;
       font-family:Georgia,"Cormorant Garamond",serif;text-align:center;padding:24px}
  .card{max-width:560px}
  .ic{width:66px;height:66px;border:1px solid #c9b47c;border-radius:50%;display:grid;place-items:center;margin:0 auto 24px}
  .ic svg{width:30px;height:30px}
  .eyebrow{letter-spacing:.28em;text-transform:uppercase;font-size:.72rem;color:#c9b47c}
  h1{font-size:clamp(2rem,6vw,3.2rem);margin:12px 0 16px;font-weight:500}
  em{color:#c9b47c;font-style:italic}
  p{font-size:1.12rem;line-height:1.6;color:#c8c6bd;margin:0 auto}
  a.home{display:inline-block;margin-top:28px;color:#c9b47c;text-decoration:none;border-bottom:1px solid #c9b47c}
</style></head><body>
  <div class="card">
    <div class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 6" stroke="#c9b47c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="eyebrow">${ok ? "C'est envoyé" : "Presque"}</div>
    <h1>${ok ? "Merci <em>infiniment</em>" : "Un petit <em>souci</em>"}</h1>
    <p>${msg}</p>
    <a class="home" href="https://trc-prod.vercel.app/">Retour au site TRC Prod</a>
  </div>
</body></html>`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  const data = parseBody(req);
  const html = wantsHtml(req, data);

  try {
    let ok = false, detail = "";
    const resend = await sendViaResend(data);
    if (resend.tried) { ok = resend.ok; detail = "resend " + resend.status; }
    if (!ok) {
      const fs = await sendViaFormspree(data);
      ok = ok || fs.ok;
      detail += (detail ? " | " : "") + "formspree " + fs.status;
    }

    if (html) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(ok ? 200 : 502).send(thankYouPage(ok));
      return;
    }
    if (!ok) { res.status(502).json({ ok: false, error: detail }); return; }
    res.status(200).json({ ok: true });
  } catch (e) {
    if (html) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(500).send(thankYouPage(false));
      return;
    }
    res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
};
