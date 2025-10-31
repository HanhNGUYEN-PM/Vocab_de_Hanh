# Capitaine Calcul

Une application web ludique pour aider Florian (9 ans) à réviser plusieurs missions scolaires. Chaque partie propose 10
questions : tables de multiplication ou exercices de français (et/est, a/à, on/ont, son/sont, ces/ses/c'est/s'est, eau/eaux/au/aux/o/ô/os/ot) avec un suivi de score et un journal des
résultats.

## ✨ Fonctionnalités principales

- Interface colorée pensée pour les enfants avec une mascotte motivante.
- Deux matières disponibles : **Maths** (tables de multiplication aléatoires) et **Français** (phrases à compléter).
- 3 propositions de réponse par question en maths et boutons de réponses adaptés pour les phrases à trous en français.
- Six missions d'orthographe française : et/est, a/à, on/ont, son/sont, ces/ses/c'est/s'est et terminaisons eau/eaux/au/aux/o/ô/os/ot.
- Grands répertoires de phrases françaises (20 par mission) pour varier les questions à chaque partie.
- Algorithme anti-répétition : au maximum 2 questions sur 10 peuvent être reprises de la partie précédente, même en rejouant immédiatement.
- Suivi du score, de la progression et des séries de bonnes réponses.
- Journal des dernières missions avec date, note et matière révisée.
- Écran de résultats avec badge de réussite et récapitulatif détaillé.
- Bouton « Rejouer la mission » pour lancer un nouveau test instantanément.

## 🛠️ Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus récent
- npm (installé avec Node.js)

## 🚀 Démarrage rapide

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Lancer l'application en local**

   ```bash
   npm run dev
   ```

   Le serveur Vite s'ouvre par défaut sur [http://localhost:5173](http://localhost:5173).

3. **Construire la version de production**

   ```bash
   npm run build
   ```

   Les fichiers optimisés sont générés dans le dossier `dist`.

## 🌐 Déployer facilement sur GitHub Pages

Ce projet est déjà configuré pour être publié sur GitHub Pages via la branche `gh-pages`.

1. **Configurer l'URL du dépôt**
   - Par défaut, le champ `homepage` de `package.json` pointe vers `https://hanhnguyen-pm.github.io/Vocab_de_Hanh/`, ce qui correspond à l'URL publique générée par GitHub Pages pour ce dépôt précis.
   - Cette adresse fonctionne immédiatement après le déploiement :

     ```text
     https://hanhnguyen-pm.github.io/Vocab_de_Hanh/
     ```

   - Si vous souhaitez publier à la racine `https://hanhnguyen-pm.github.io/`, il faudra utiliser un dépôt nommé `hanhnguyen-pm.github.io` (spécificité GitHub Pages) ou copier les fichiers du dossier `dist` vers ce dépôt dédié.
   - Les chemins générés dans `dist` sont désormais relatifs : vous pouvez donc copier le dossier de build vers n'importe quel emplacement (même `https://hanhnguyen-pm.github.io/`) sans modification supplémentaire.
   - Pour un cas très spécifique où un chemin absolu est requis, vous pouvez toujours forcer la valeur via la variable d'environnement `VITE_BASE_PATH` lors du build (ex. `VITE_BASE_PATH=/chemin-personnalise/ npm run build`).

2. **Construire et déployer**

   ```bash
   npm run deploy
   ```

   Cette commande exécute `npm run build` puis publie le contenu de `dist` sur la branche `gh-pages` grâce au paquet `gh-pages`.

3. **Activer GitHub Pages**
   - Dans les paramètres du dépôt, section **Pages**, choisissez la branche `gh-pages` et le dossier `/ (root)`.
   - Une fois la page active, l'application sera disponible à l'adresse indiquée dans `homepage` (`https://hanhnguyen-pm.github.io/Vocab_de_Hanh/` avec la configuration actuelle).

## 🔗 Partager l'application sans compte Vercel

Tout le monde peut accéder à la mission via un simple lien, sans se connecter à Vercel :

1. **Construire la version finale**

   ```bash
   npm run build
   ```

   Les fichiers statiques prêts à l'emploi se trouvent dans le dossier `dist`.

2. **Héberger le dossier `dist` où vous voulez**
   - **GitHub Pages** (voir ci-dessus) ou tout autre service de pages statiques comme Netlify, Render, Cloudflare Pages, etc.
   - **Hébergement manuel** : uploadez le contenu de `dist` sur un serveur web ou glissez-le dans un dossier partagé (Google Drive, Dropbox…) en activant l'hébergement statique.

3. **Partager l'URL obtenue**

   Grâce à la configuration du projet, tous les chemins sont relatifs : il suffit donc d'ouvrir `dist/index.html` pour que l'application fonctionne, même en local (double-clic sur le fichier), sans authentification.

## 🔧 Personnalisation rapide

- Pour modifier le nombre de questions, la plage des tables ou les listes de phrases françaises, ajustez les constantes situées en haut de `src/App.tsx` (chaque mission possède son propre tableau de phrases).
- Les messages de motivation par matière et les badges de fin de partie se trouvent également dans `src/App.tsx`.
- Vous pouvez ajouter de nouvelles catégories (maths ou français) en dupliquant les modèles existants dans `src/App.tsx` et en fournissant vos propres textes.
- Le style visuel (couleurs, animations, mise en page) est défini dans `src/index.css`.

## 📄 Licence

Projet publié sous licence MIT — libre à vous de l'adapter et de le partager.
