# Guide de Déploiement OVH - BBG Company

## Prérequis

- Accès FTP au serveur OVH (bbg.yakri.com)
- Client FTP (FileZilla, WinSCP, ou ligne de commande)
- Node.js installé en local (pour le build)

---

## Étape 1 : Build du projet (export statique)

### 1.1 Vérifier la configuration
Le fichier `next.config.mjs` est déjà configuré pour l'export statique :
```javascript
output: 'export',
distDir: 'dist',
images: { unoptimized: true }
```

### 1.2 Lancer le build
```bash
cd c:\Users\user\Documents\clicablebbg
npm run build
```

**Résultat attendu :**
- Un dossier `dist/` est créé à la racine
- Contient tous les fichiers HTML, CSS, JS statiques
- Pas d'erreur dans la console

---

## Étape 2 : Vérifier le build local

### 2.1 Ouvrir le fichier index.html
Ouvrir directement dans le navigateur :
```
c:\Users\user\Documents\clicablebbg\dist\index.html
```

### 2.2 Vérifier les éléments critiques
- [ ] Logo BBG visible en header
- [ ] Photos des sections Hero et Services chargées
- [ ] Formulaires Gestion, Création, Annonces fonctionnels
- [ ] Navigation entre les sections
- [ ] Espace client accessible

---

## Étape 3 : Connexion FTP au serveur OVH

### 3.1 Informations de connexion
```
Hôte : bbg.yakri.com (ou ftp.yakri.com selon configuration OVH)
Protocole : FTP ou FTPS (recommandé)
Port : 21 (FTP) ou 990 (FTPS)
Utilisateur : [votre_login_ftp_ovh]
Mot de passe : [votre_mot_de_passe_ftp]
```

### 3.2 Avec FileZilla
1. Ouvrir FileZilla
2. Menu **Fichier > Gestionnaire de sites**
3. Nouveau site → Nommer "BBG OVH"
4. Remplir les informations :
   - Hôte : `bbg.yakri.com`
   - Protocole : `FTP - File Transfer Protocol`
   - Chiffrement : `Utiliser FTPS explicite sur TLS si disponible`
   - Type d'identification : `Normal`
   - Utilisateur : votre login OVH
   - Mot de passe : votre mot de passe
5. Cliquer **Connexion**

---

## Étape 4 : Upload des fichiers

### 4.1 Localiser le répertoire distant
Sur le serveur OVH, le répertoire web est généralement :
```
/www/
```
OU
```
/public_html/
```

**Remarque :** Selon votre offre OVH, cela peut être `/www/bbg/` ou directement `/www/`

### 4.2 Procédure d'upload sécurisée

#### Option A : Suppression + Upload complet (recommandé pour première install)

1. **Sauvegarder l'ancienne version** (si existe) :
   - Créer un dossier `backup-[date]` sur le serveur
   - Déplacer les anciens fichiers dedans

2. **Upload du nouveau build** :
   - Local (gauche) : `c:\Users\user\Documents\clicablebbg\dist\`
   - Distant (droite) : `/www/` ou `/public_html/`
   - Sélectionner tous les fichiers du dossier `dist/`
   - Glisser-déposer vers le répertoire distant
   - Attendre la fin du transfert (barre de progression en bas)

#### Option B : Upload incrémental (pour mises à jour futures)

1. Comparer les dates de modification
2. Ne remplacer que les fichiers modifiés
3. Attention : Next.js génère des noms de fichiers JS avec hash, donc l'option A est plus sûre

### 4.3 Vérifier les permissions
Les fichiers doivent avoir les permissions :
- Fichiers : `644` (rw-r--r--)
- Dossiers : `755` (rwxr-xr-x)

Dans FileZilla : Clic droit sur fichier/dossier → Droits d'accès au fichier

---

## Étape 5 : Configuration .htaccess (IMPORTANT)

### 5.1 Créer le fichier .htaccess
Créer un fichier `.htaccess` à la racine du dossier `/www/` avec ce contenu :

```apache
# Redirection vers HTTPS (décommenter si certificat SSL actif)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Gestion du routage SPA (Single Page Application)
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache navigateur
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/svg+xml "access plus 1 year"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Sécurité
Options -Indexes
ServerSignature Off
```

### 5.2 Upload le fichier .htaccess
Placer le fichier `.htaccess` dans le même dossier que `index.html`

---

## Étape 6 : Tests post-déploiement

### 6.1 Accéder au site
```
https://bbg.yakri.com/
```

### 6.2 Checklist de vérification

#### Pages principales
- [ ] https://bbg.yakri.com/ (Homepage)
- [ ] https://bbg.yakri.com/#services (Services)
- [ ] https://bbg.yakri.com/#gestion (Formulaire Gestion)
- [ ] https://bbg.yakri.com/#creation (Formulaire Création)
- [ ] https://bbg.yakri.com/#annonces (Annonces)
- [ ] https://bbg.yakri.com/espace-client (Espace client)

#### Fonctionnalités
- [ ] Logo BBG visible
- [ ] Images des sections Hero et Services chargées
- [ ] Navigation fluide entre les sections
- [ ] Formulaires interactifs fonctionnels
- [ ] Timeline de création visible
- [ ] Section réassurance affichée
- [ ] Formulaire de contact opérationnel

#### Responsive
- [ ] Test sur mobile (iPhone/Android)
- [ ] Test sur tablette
- [ ] Test sur desktop

---

## Étape 7 : Configuration DNS (si nécessaire)

Si le domaine n'est pas encore pointé sur le serveur OVH :

### 7.1 Vérifier les DNS chez votre registrar
Les enregistrements doivent pointer vers OVH :
```
Type A : bbg.yakri.com → [IP_du_serveur_OVH]
OU
Type CNAME : bbg.yakri.com → [votre_serveur_ovh].ovh.net
```

### 7.2 Attendre la propagation DNS
Délai : 1 à 48 heures (généralement 2-4 heures)

Vérifier avec : https://www.whatsmydns.net/

---

## Étape 8 : Optimisation SEO post-déploiement

### 8.1 Vérifier le sitemap
Le fichier `sitemap.xml` doit être présent à la racine.

### 8.2 Soumettre à Google Search Console
1. Aller sur https://search.google.com/search-console
2. Ajouter la propriété : `https://bbg.yakri.com/`
3. Valider avec méthode DNS ou fichier HTML
4. Soumettre le sitemap : `https://bbg.yakri.com/sitemap.xml`

### 8.3 Test de vitesse
- https://pagespeed.web.dev/
- https://gtmetrix.com/

---

## Dépannage courant

### Problème : Page blanche ou erreur 404
**Cause probable :** Mauvais routage SPA
**Solution :** Vérifier que le fichier `.htaccess` est présent et correct

### Problème : Images ne s'affichent pas
**Cause probable :** URLs absolues incorrectes
**Solution :** Vérifier que les images utilisent des URLs HTTPS complètes

### Problème : Formulaires ne fonctionnent pas
**Cause probable :** Le site est statique (HTML/JS uniquement)
**Solution :** Les formulaires actuels sont en frontend uniquement. Pour un vrai traitement, il faut :
- Option 1 : Connecter à un service tiers (Formspree, Netlify Forms)
- Option 2 : Ajouter un backend PHP sur OVH
- Option 3 : Utiliser Google Forms avec iframe

### Problème : CSS/JS ne charge pas
**Cause probable :** Chemins relatifs incorrects
**Solution :** Vérifier dans les DevTools (F12) l'onglet Network → voir les erreurs 404

---

## Prochaines étapes recommandées

### Court terme
1. [ ] Configurer le certificat SSL (HTTPS) via OVH
2. [ ] Connecter les formulaires à un service de collecte
3. [ ] Installer Google Analytics 4
4. [ ] Créer une page 404 personnalisée

### Moyen terme
1. [ ] Ajouter un backend PHP pour les formulaires
2. [ ] Créer un système d'authentification réel pour l'espace client
3. [ ] Base de données pour stocker les dossiers clients
4. [ ] Système de gestion des annonces (CRUD)

---

## Commandes utiles

### Build rapide
```bash
cd c:\Users\user\Documents\clicablebbg && npm run build
```

### Vérifier le contenu du build
```bash
dir dist /s
```

### Créer un ZIP pour upload manuel
```bash
cd c:\Users\user\Documents\clicablebbg\dist
Compress-Archive -Path * -DestinationPath ..\bbg-deploy.zip
```

---

## Support OVH

- **Espace client OVH :** https://www.ovh.com/manager/
- **Documentation OVH Hébergement :** https://docs.ovh.com/fr/hosting/
- **Contact support :** Via espace client ou 1007 (appel gratuit)

---

## Résumé des fichiers à uploader

```
dist/
├── index.html          ← Page d'accueil
├── espace-client.html  ← Espace client
├── _next/              ← Assets JS/CSS compilés
│   ├── static/
│   └── ...
├── logo-bbg.svg        ← Logo
├── logo-bbg-light.svg  ← Logo version claire
├── sitemap.xml         ← Sitemap SEO
└── .htaccess           ← Configuration Apache (créer manuellement)
```

**Total :** Environ 6-10 Mo à uploader
