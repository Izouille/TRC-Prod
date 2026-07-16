# TRC Prod — Portfolio d'Ethan Trincanato

Site vitrine luxe (photo & vidéo). 100 % statique : rapide, sans base de données, facile à héberger.

## 🗂️ Structure

```
index.html            → Accueil
photo.html            → Portfolio photo
video.html            → Portfolio vidéo
about.html            → À propos
contact.html          → Contact
mentions-legales.html → Mentions légales
brief.html            → Questionnaire de brief (projet de site client)
css/style.css         → Tout le design (couleurs, typo de la charte)
css/brief.css         → Design du questionnaire de brief
js/main.js            → Galeries, lightbox, menu, formulaire
js/brief.js           → 👉 QUESTIONS du brief + génération du prompt
data/photos.json      → 👉 TES PHOTOS
data/videos.json      → 👉 TES VIDÉOS
assets/img/           → 👉 Mets tes fichiers images ici
assets/brand/         → Logos + charte graphique
```

## ▶️ Voir le site en local

Les galeries chargent des fichiers `.json` : il faut un petit serveur local (un double-clic sur le `.html` ne suffit pas).

Ouvre un terminal dans le dossier puis lance :

```bash
python3 -m http.server 8000
```

Puis va sur **http://localhost:8000** dans ton navigateur.
(Astuce : avec VS Code, l'extension « Live Server » fait pareil en un clic.)

## ➕ Ajouter une PHOTO

1. Mets ton image dans `assets/img/` (ex : `parfum-01.jpg`).
2. Ouvre `data/photos.json` et ajoute un bloc :

```json
{
  "title": "Nom du projet",
  "category": "Luxe",
  "image": "assets/img/parfum-01.jpg",
  "year": "2026"
}
```

> Les catégories deviennent automatiquement des filtres sur la page Photo.
> Sépare chaque bloc par une virgule. Le dernier bloc n'a pas de virgule après.

## ➕ Ajouter une VIDÉO

Héberge ta vidéo sur **YouTube** ou **Vimeo** (meilleure performance), récupère son ID, puis dans `data/videos.json` :

```json
{
  "title": "Film de marque — Parfum",
  "category": "Publicité",
  "thumbnail": "assets/img/miniature.jpg",
  "provider": "youtube",
  "id": "ABC123xyz",
  "year": "2026"
}
```

- `provider` : `"youtube"` ou `"vimeo"`
- `id` : pour `https://youtu.be/ABC123xyz` → l'ID est `ABC123xyz`
  pour `https://vimeo.com/76979871` → l'ID est `76979871`
- `thumbnail` : une image d'aperçu (dans `assets/img/`)

## ✉️ Recevoir les messages du formulaire

Par défaut, le bouton « Envoyer » ouvre ta messagerie vers **trcprod38@gmail.com**.
Pour recevoir les messages directement dans ta boîte (mieux) :

1. Crée un compte gratuit sur **https://formspree.io**
2. Récupère ton lien (ex : `https://formspree.io/f/abcd1234`)
3. Dans `contact.html`, remplace `action="#"` par `action="https://formspree.io/f/abcd1234"`

## ✏️ À personnaliser (cherche les commentaires dans le code)

- `about.html` → ton vrai parcours (paragraphe marqué `✏️`)
- `mentions-legales.html` → SIRET, statut, hébergeur (obligatoire en France)
- Liens réseaux : vérifie l'URL exacte de ton LinkedIn dans tous les fichiers
- Remplace les photos d'exemple par tes vrais visuels

## 📝 Le questionnaire de brief (`brief.html`)

Page conversationnelle (une question à la fois, façon Typeform) qu'un prospect remplit
pour décrire son projet de site. En **3 à 5 minutes**, sans inscription. À la dernière
étape, il colle un **lien SwissTransfer** avec ses fichiers (logo, charte, photos, textes…),
puis la page **compile toutes ses réponses en un prompt structuré et me l'envoie
automatiquement par email** (via Formspree). Le client **ne voit jamais** le récapitulatif :
juste un écran de remerciement. Presque toutes les questions sont facultatives ; seules les
coordonnées (nom + email) sont obligatoires. Les réponses sont sauvegardées automatiquement
dans le navigateur du client (il ne perd rien s'il recharge la page).

> 💡 La question **« palette de couleurs »** (pastilles cliquables) ne s'affiche que si le
> client n'a **pas** déjà fourni son identité visuelle à la question « identité » (fichier ou
> lien). Pour éditer les palettes proposées : tableau **`PALETTES`** en haut de `js/brief.js`.

### ➕ / ✏️ Modifier les questions

Tout est dans **`js/brief.js`**, en haut du fichier, dans le tableau **`QUESTIONS`**.
**1 objet = 1 écran.** L'ordre du tableau = l'ordre à l'écran. Pour ajouter une question,
copie un bloc existant et change les valeurs :

```js
{ id:"budget", section:"Style, références & contenus", type:"single", cols:2,
  title:"Votre <em>budget</em> indicatif&nbsp;?",     // le mot en <em> est en italique doré
  help:"Texte d'aide facultatif.",
  options:["Moins de 1 000 €","1 000 – 2 500 €","…"] },
```

- `type` : `text` (saisie courte) · `textarea` (longue) · `single` (un choix) ·
  `multi` (plusieurs choix) · `palette` (pastilles de couleurs) · `link` (un ou plusieurs liens) ·
  `upload` (fichiers + lien) · `swiss` (dépôt SwissTransfer) · `contact` (nom/email/tél, obligatoire).
- `other:true` ajoute une option **« Autre »** avec champ libre.
- `cols:2` affiche les choix sur deux colonnes.
- `skippable:false` rend la question obligatoire (par défaut tout est « passable »).
- `showIf:()=>...` n'affiche la question que si la condition est vraie (ex : la palette).

> ⚠️ N'utilise **pas** `css/style.css` pour cette page : `brief.css` est volontairement
> autonome (mêmes couleurs/typo que le site, mais noms de classes séparés pour éviter les
> conflits avec `.card`, `.nav`, `.field` du site principal).

### 📬 Recevoir les briefs par email (Formspree)

L'envoi du brief se fait par **email automatique** via Formspree :

1. Crée un formulaire gratuit sur **https://formspree.io** (avec `trcprod38@gmail.com`).
2. Récupère l'identifiant du endpoint : `https://formspree.io/f/`**`XXXXXXXX`** → copie `XXXXXXXX`.
3. Dans `js/brief.js`, en haut, renseigne `CONFIG.formspreeId: "XXXXXXXX"`.
4. **Une fois en ligne, fais un envoi test** : Formspree envoie un mail *« Confirm your email »* —
   clique le lien, sinon les briefs n'arrivent pas. Pense à créer un **filtre Gmail**
   `from:formspree.io` → *« Ne jamais envoyer dans les spams »* (ils y tombent souvent au début).

> **Fichiers** : le brief part en **texte** (livré de façon fiable sur tous les plans). Les
> fichiers ne sont **pas** joints à l'email — le client les regroupe dans un **lien SwissTransfer**
> (dernière étape du questionnaire) que tu reçois dans le brief, et tu télécharges tout d'un coup.
> Si Formspree échoue, la messagerie du client s'ouvre en secours (jamais bloquant).

Autres réglages dans `CONFIG` (haut de `js/brief.js`) : `brandName`, `homeUrl` (le logo
ramène au portfolio), `contactEmail` (secours mailto).

## 🚀 Mettre en ligne

Le site étant statique, tu peux l'héberger gratuitement sur **Netlify**, **Vercel** ou **GitHub Pages** : glisse-dépose le dossier, c'est en ligne. Ensuite tu branches ton nom de domaine (ex : trcprod.fr).
