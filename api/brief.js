/* ============================================================
   TRC PROD — Réception du brief (fonction serverless Vercel)
   ------------------------------------------------------------
   Le formulaire brief.html poste ICI (même origine : /api/brief),
   ce qui n'est JAMAIS bloqué par les bloqueurs de pub / boucliers
   (Brave, uBlock…) contrairement à un appel direct à formspree.io.
   Cette fonction transmet ensuite le brief à Formspree côté serveur
   (aucun bloqueur ne s'applique côté serveur) → l'email part de façon
   fiable, quel que soit le navigateur du client.
   ============================================================ */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvzjoqpl";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  try {
    // Vercel parse déjà le JSON quand Content-Type = application/json.
    const data = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

    const r = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });

    if (!r.ok) {
      res.status(502).json({ ok: false, error: "Formspree HTTP " + r.status });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
};
