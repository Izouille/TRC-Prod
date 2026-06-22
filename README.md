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
css/style.css         → Tout le design (couleurs, typo de la charte)
js/main.js            → Galeries, lightbox, menu, formulaire
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

## 🚀 Mettre en ligne

Le site étant statique, tu peux l'héberger gratuitement sur **Netlify**, **Vercel** ou **GitHub Pages** : glisse-dépose le dossier, c'est en ligne. Ensuite tu branches ton nom de domaine (ex : trcprod.fr).
