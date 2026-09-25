// Captures fixes des petites tuiles de la mosaïque (réalisations, services, contact…).
// Elles s'affichent par défaut ; le site en direct ne se lance qu'au survol de la carte.
// À relancer après avoir ajouté un site dans admin-sites.html :
//   node captures-apercus.mjs
import { createRequire } from "node:module";
import { readFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Playwright n'est pas une dépendance du site : on prend celui du cache npx
const npx = join(homedir(), ".npm/_npx");
const dossier = readdirSync(npx).map((d) => join(npx, d, "node_modules"))
  .find((d) => existsSync(join(d, "playwright/package.json")));
if (!dossier) { console.error("Playwright introuvable : lance « npx playwright install chromium »"); process.exit(1); }
const { chromium } = createRequire(join(dossier, "x.js"))("playwright");

// Même règle que apercuFixe() dans js/main.js
const nom = (url) => "assets/img/apercus/" +
  url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() + ".jpg";

const sites = JSON.parse(readFileSync("data/sites.json", "utf8"));
mkdirSync("assets/img/apercus", { recursive: true });

// Chromium déjà téléchargé (la version attendue par ce Playwright peut manquer)
const cache = join(homedir(), ".cache/ms-playwright");
const shell = existsSync(cache) && readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort().pop();
const executablePath = shell ? join(cache, shell, "chrome-headless-shell-linux64/chrome-headless-shell") : undefined;
const nav = await chromium.launch({ executablePath });
// Même largeur « bureau » que les iframes (RENDER_W), réduite de moitié pour rester léger
const page = await nav.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 0.5 });
for (const site of sites) {
  for (const url of site.frames || []) {
    const fichier = nom(url);
    if (existsSync(fichier) && !process.argv.includes("--tout")) { console.log("déjà là  ", fichier); continue; }
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500); // laisse finir les animations d'entrée
      await page.screenshot({ path: fichier, type: "jpeg", quality: 72 });
      console.log("capturé  ", fichier);
    } catch (e) {
      console.warn("échec    ", url, e.message.split("\n")[0]);
    }
  }
}
await nav.close();
