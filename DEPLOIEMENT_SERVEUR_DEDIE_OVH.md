# Déploiement BBG Company sur serveur dédié OVH (Ubuntu)

Guide complet et pas-à-pas pour héberger l'application **Next.js 14 + Prisma + MySQL 8 + NextAuth** sur un serveur dédié (ou VPS) OVH, avec Nginx en reverse proxy, PM2, HTTPS Let's Encrypt et sauvegardes.

Domaine cible utilisé dans les exemples : `bbg.yakri.com`
Utilisateur applicatif utilisé : `bbg`
Chemin de déploiement : `/var/www/bbgcompany`

---

## 0. Vue d'ensemble de l'architecture

```
Internet
   │  (443/80)
   ▼
Nginx (reverse proxy + TLS Let's Encrypt)
   │  proxy_pass http://127.0.0.1:3000
   ▼
Node.js 20 + Next.js 14 (next start) géré par PM2
   │  Prisma Client (mysql)
   ▼
MySQL 8 (localhost:3306)
```

Points importants pour ce projet :
- L'app **n'est pas** un site statique : elle a des routes API, NextAuth, du SSR dynamique. Il faut donc un **process Node en écoute**, pas un simple dossier de fichiers.
- Le script de build est `prisma generate && next build` (voir `package.json`).
- `prisma/schema.prisma` utilise `DATABASE_URL` **et** `DIRECT_URL`. Sur un serveur dédié avec MySQL local, on met **la même valeur** dans les deux.

---

## 1. Prérequis

### 1.1 Côté OVH
- Un serveur dédié (ou VPS) avec **Ubuntu 22.04 LTS** ou **24.04 LTS**
- Accès `root` via SSH (IP + mot de passe ou clé)
- Un nom de domaine géré (zone DNS OVH)

### 1.2 Côté DNS (à faire tout de suite, la propagation prend du temps)
Dans la zone DNS OVH, créer :

| Type | Sous-domaine | Cible |
|------|--------------|-------|
| A | `bbg` | `IP_PUBLIQUE_DU_SERVEUR` |
| AAAA (si IPv6) | `bbg` | `IPV6_DU_SERVEUR` |

Vérification depuis ton PC (PowerShell) :
```powershell
nslookup bbg.yakri.com
```

### 1.3 Côté poste local
- Git
- Node.js 20 (pour tester le build en local)
- Un client SSH (Windows 10/11 : `ssh` est intégré)

### 1.4 Logiciels à installer sur le serveur
| Logiciel | Rôle | Version cible |
|----------|------|---------------|
| Ubuntu Server | OS | 22.04 / 24.04 LTS |
| Node.js | Runtime app | 20.x LTS |
| npm | Gestionnaire de paquets | fourni avec Node 20 |
| MySQL Server | Base de données | 8.x |
| Nginx | Reverse proxy + TLS | 1.18+ |
| PM2 | Superviseur de process Node | dernière |
| Certbot | Certificats Let's Encrypt | via snap ou apt |
| Git | Récupération du code | 2.x |
| UFW | Pare-feu | fourni |
| Fail2ban | Protection SSH (optionnel) | fourni |

---

## 2. Première connexion et sécurisation du serveur

### 2.1 Connexion root
```bash
ssh root@IP_DU_SERVEUR
```

### 2.2 Mise à jour du système
```bash
apt update && apt upgrade -y
apt install -y curl git unzip ufw fail2ban ca-certificates gnupg
```

### 2.3 Fuseau horaire
```bash
timedatectl set-timezone Europe/Paris
```

### 2.4 Créer l'utilisateur applicatif `bbg`
```bash
adduser bbg
usermod -aG sudo bbg
```

### 2.5 Copier ta clé SSH pour `bbg` (recommandé)
Depuis **ton PC** :
```powershell
ssh-keygen -t ed25519 -C "bbg-deploy"   # si tu n'as pas encore de clé
type $env:USERPROFILE\.ssh\id_ed25519.pub
```
Puis sur le serveur :
```bash
mkdir -p /home/bbg/.ssh
nano /home/bbg/.ssh/authorized_keys   # coller la clé publique
chmod 700 /home/bbg/.ssh
chmod 600 /home/bbg/.ssh/authorized_keys
chown -R bbg:bbg /home/bbg/.ssh
```

### 2.6 Durcir SSH
```bash
nano /etc/ssh/sshd_config
```
Mettre :
```
PermitRootLogin no
PasswordAuthentication no
```
Puis :
```bash
systemctl restart ssh
```

### 2.7 Pare-feu UFW
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
```
> MySQL reste **fermé** de l'extérieur : l'app tourne sur la même machine.

### 2.8 Fail2ban
```bash
systemctl enable --now fail2ban
fail2ban-client status
```

---

## 3. Installation de Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # v20.x
npm -v
```

Installer PM2 globalement :
```bash
sudo npm install -g pm2
pm2 -v
```

---

## 4. Installation et configuration de MySQL 8

### 4.1 Installation
```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo systemctl status mysql --no-pager
```

### 4.2 Sécurisation
```bash
sudo mysql_secure_installation
```
Réponses conseillées :
- Validate password component : `y` (niveau MEDIUM)
- Mot de passe root : **fort**
- Remove anonymous users : `y`
- Disallow root login remotely : `y`
- Remove test database : `y`
- Reload privileges : `y`

### 4.3 Créer la base et l'utilisateur applicatif
```bash
sudo mysql
```
Dans le prompt MySQL :
```sql
CREATE DATABASE bbgcompany CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bbguser'@'localhost' IDENTIFIED BY 'UN_MOT_DE_PASSE_TRES_FORT';
GRANT ALL PRIVILEGES ON bbgcompany.* TO 'bbguser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.4 Vérifier la connexion
```bash
mysql -u bbguser -p -h 127.0.0.1 bbgcompany -e "SELECT VERSION();"
```

### 4.5 S'assurer que MySQL n'écoute qu'en local
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```
Vérifier :
```
bind-address = 127.0.0.1
```
Puis :
```bash
sudo systemctl restart mysql
```

---

## 5. Récupération du code applicatif

### 5.1 Préparer le dossier
```bash
sudo mkdir -p /var/www
sudo chown -R bbg:bbg /var/www
su - bbg
cd /var/www
```

### 5.2 Cloner le dépôt
```bash
git clone https://github.com/yakri-innovation/bbgcompany.git bbgcompany
cd /var/www/bbgcompany
```
> Pour un repo privé, créer un **Personal Access Token** GitHub ou une **deploy key** SSH.

Option deploy key (recommandé) :
```bash
ssh-keygen -t ed25519 -C "bbg-server" -f ~/.ssh/id_ed25519_github
cat ~/.ssh/id_ed25519_github.pub
# → ajouter dans GitHub : Repo > Settings > Deploy keys
```
`~/.ssh/config` :
```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
```

---

## 6. Variables d'environnement

### 6.1 Générer un secret NextAuth
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6.2 Créer le fichier `.env`
```bash
nano /var/www/bbgcompany/.env
```
Contenu :
```env
# --- Base de données (MySQL local) ---
DATABASE_URL="mysql://bbguser:UN_MOT_DE_PASSE_TRES_FORT@127.0.0.1:3306/bbgcompany"
DIRECT_URL="mysql://bbguser:UN_MOT_DE_PASSE_TRES_FORT@127.0.0.1:3306/bbgcompany"

# --- Application / Auth ---
NODE_ENV="production"
NEXTAUTH_URL="https://bbg.yakri.com"
NEXTAUTH_SECRET="COLLER_LE_SECRET_GENERE"
APP_URL="https://bbg.yakri.com"

# --- Comptes de seed (à changer après le premier import) ---
SEED_ADMIN_EMAIL="admin@bbg-company.fr"
SEED_ADMIN_PASSWORD="ChangeMoi123!"
SEED_CLIENT_EMAIL="client@bbg-company.fr"
SEED_CLIENT_PASSWORD="ChangeMoi123!"

# --- Paiements Stripe (si utilisés) ---
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# --- Notifications email (si utilisées) ---
NOTIFICATION_EMAIL_WEBHOOK_URL=""
NOTIFICATION_EMAIL_WEBHOOK_SECRET=""
```

Sécuriser le fichier :
```bash
chmod 600 /var/www/bbgcompany/.env
```

> **Important** : `DIRECT_URL` est requis car `prisma/schema.prisma` déclare `directUrl`. Sur un serveur dédié avec MySQL local, mets la **même valeur** que `DATABASE_URL`.
> Si le mot de passe contient `@ : / ? # &`, encode-le en URL (`@` → `%40`).

---

## 7. Installation des dépendances, migration et build

### 7.1 Dépendances
```bash
cd /var/www/bbgcompany
npm ci
```
> Si `package-lock.json` est absent : `npm install`.

### 7.2 Générer le client Prisma
```bash
npx prisma generate
```

### 7.3 Créer le schéma en base
Option A — sans historique de migrations (rapide) :
```bash
npx prisma db push
```
Option B — avec migrations versionnées (recommandé en prod) :
```bash
npx prisma migrate deploy   # si le dossier prisma/migrations existe
```

Vérifier les tables :
```bash
mysql -u bbguser -p bbgcompany -e "SHOW TABLES;"
```

### 7.4 Injecter les données initiales
```bash
npm run db:seed
npm run db:seed:announcements
# jeu de données MVP complet (optionnel)
npm run db:seed:mvp
```

### 7.5 Build de production
```bash
npm run build
```
Attendu : compilation réussie et dossier `.next/` créé.

### 7.6 Test manuel avant PM2
```bash
npm run start
# Dans un autre terminal :
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:3000/api/health
```
Arrêter avec `Ctrl + C`.

---

## 8. Mise en service avec PM2

### 8.1 Fichier de configuration PM2
```bash
nano /var/www/bbgcompany/ecosystem.config.js
```
```javascript
module.exports = {
  apps: [
    {
      name: "bbgcompany",
      cwd: "/var/www/bbgcompany",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1"
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "600M",
      autorestart: true,
      error_file: "/var/www/bbgcompany/logs/pm2-error.log",
      out_file: "/var/www/bbgcompany/logs/pm2-out.log",
      time: true
    }
  ]
};
```

### 8.2 Démarrer
```bash
mkdir -p /var/www/bbgcompany/logs
cd /var/www/bbgcompany
pm2 start ecosystem.config.js
pm2 status
pm2 logs bbgcompany --lines 50
```

### 8.3 Démarrage automatique au boot
```bash
pm2 save
pm2 startup systemd -u bbg --hp /home/bbg
# → copier/coller la commande sudo affichée puis :
pm2 save
```

### 8.4 Commandes PM2 utiles
```bash
pm2 restart bbgcompany
pm2 reload bbgcompany
pm2 stop bbgcompany
pm2 delete bbgcompany
pm2 monit
```

---

## 9. Nginx en reverse proxy

### 9.1 Installation
```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

### 9.2 Configuration du site
```bash
sudo nano /etc/nginx/sites-available/bbgcompany
```
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bbg.yakri.com;

    client_max_body_size 25M;

    access_log /var/log/nginx/bbgcompany.access.log;
    error_log  /var/log/nginx/bbgcompany.error.log;

    # Fichiers statiques Next.js (cache long)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

### 9.3 Activer et tester
```bash
sudo ln -s /etc/nginx/sites-available/bbgcompany /etc/nginx/sites-enabled/bbgcompany
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Test HTTP :
```bash
curl -I http://bbg.yakri.com
```

---

## 10. HTTPS avec Let's Encrypt (Certbot)

### 10.1 Installation
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Obtenir le certificat
```bash
sudo certbot --nginx -d bbg.yakri.com
```
Choisir la redirection HTTP → HTTPS quand c'est proposé.

### 10.3 Vérifier le renouvellement automatique
```bash
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

### 10.4 Vérifier le site
```bash
curl -I https://bbg.yakri.com
```

---

## 11. Vérifications fonctionnelles post-déploiement

À tester dans le navigateur sur `https://bbg.yakri.com` :

- **Accueil** : `/` s'affiche, annonces publiées visibles
- **Santé API** : `/api/health` renvoie du JSON
- **Catalogue** : `/annonces` et une fiche `/annonces/<slug>`
- **Pages vitrines** : `/services`, `/gestion`, `/creation`, `/contact`, `/a-propos`
- **Connexion** : `/connexion` avec le compte seed admin
- **Espace client** : `/espace-client` et `/espace-client/profil`
- **Back-office** : `/admin`, `/manager`, `/gestion` selon le rôle
- **Formulaires** : envoi d'un lead depuis `/contact` puis vérification en base :
```bash
mysql -u bbguser -p bbgcompany -e "SELECT id, type, email, createdAt FROM Lead ORDER BY createdAt DESC LIMIT 5;"
```

Après validation : **changer immédiatement les mots de passe des comptes seed**.

---

## 12. Procédure de mise à jour (déploiement continu manuel)

### 12.1 Script de déploiement
```bash
nano /var/www/bbgcompany/deploy.sh
```
```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/bbgcompany"
cd "$APP_DIR"

echo "==> Récupération du code"
git pull origin main

echo "==> Dépendances"
npm ci

echo "==> Prisma"
npx prisma generate
npx prisma migrate deploy || npx prisma db push

echo "==> Build"
npm run build

echo "==> Redémarrage"
pm2 reload bbgcompany

echo "==> Terminé"
pm2 status
```
```bash
chmod +x /var/www/bbgcompany/deploy.sh
```

### 12.2 Utilisation
```bash
su - bbg
/var/www/bbgcompany/deploy.sh
```

---

## 13. Sauvegardes

### 13.1 Script de dump MySQL
```bash
sudo nano /usr/local/bin/backup-bbg.sh
```
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/bbgcompany"
STAMP="$(date +%F_%H-%M)"
mkdir -p "$BACKUP_DIR"

mysqldump -u bbguser -p'UN_MOT_DE_PASSE_TRES_FORT' \
  --single-transaction --routines --triggers \
  bbgcompany | gzip > "$BACKUP_DIR/bbgcompany_$STAMP.sql.gz"

# Rétention 14 jours
find "$BACKUP_DIR" -name "bbgcompany_*.sql.gz" -mtime +14 -delete
```
```bash
sudo chmod 700 /usr/local/bin/backup-bbg.sh
```

### 13.2 Planification (tous les jours à 3h)
```bash
sudo crontab -e
```
```
0 3 * * * /usr/local/bin/backup-bbg.sh >> /var/log/backup-bbg.log 2>&1
```

### 13.3 Restauration
```bash
gunzip -c /var/backups/bbgcompany/bbgcompany_2026-08-13_03-00.sql.gz | mysql -u bbguser -p bbgcompany
```

---

## 14. Supervision et logs

```bash
# Application
pm2 logs bbgcompany --lines 100
pm2 monit

# Nginx
sudo tail -f /var/log/nginx/bbgcompany.error.log
sudo tail -f /var/log/nginx/bbgcompany.access.log

# MySQL
sudo journalctl -u mysql -n 100 --no-pager

# Ressources
htop
df -h
free -m
```

Rotation des logs PM2 :
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 14
```

---

## 15. Dépannage (erreurs déjà rencontrées sur ce projet)

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| `Failed to collect page data for /api/...` au build | Client Prisma non généré ou `DATABASE_URL` absent | `npx prisma generate` avant `next build` (déjà dans `npm run build`), vérifier `.env` |
| `PrismaClientInitializationError: Can't reach database server` | Mauvais host/port, MySQL arrêté, pare-feu | `systemctl status mysql`, tester `mysql -u bbguser -p -h 127.0.0.1` |
| `P1017: Server has closed the connection` | Proxy/TLS ou timeout côté base distante | Sur serveur dédié : base en local, donc vérifier `bind-address` et les droits utilisateur |
| `Environment variable not found: DIRECT_URL` | `directUrl` déclaré dans le schéma | Ajouter `DIRECT_URL` dans `.env` (même valeur que `DATABASE_URL`) |
| Erreur 502 Bad Gateway | Process Node arrêté | `pm2 status`, `pm2 restart bbgcompany`, lire `pm2 logs` |
| Redirection infinie sur `/connexion` | `NEXTAUTH_URL` incorrect | Mettre l'URL HTTPS exacte du domaine |
| `Application error: a server-side exception` | Exception SSR (souvent DB) | Lire `pm2 logs`, corriger la cause, `pm2 reload` |
| Le site sert l'ancien code | Build non refait | `npm run build` puis `pm2 reload bbgcompany` |

Commandes de diagnostic rapides :
```bash
curl -I http://127.0.0.1:3000          # l'app répond-elle localement ?
sudo ss -tlnp | grep -E '3000|3306|80|443'
sudo nginx -t
pm2 describe bbgcompany
```

---

## 16. Checklist finale de mise en ligne

- [ ] DNS `bbg.yakri.com` pointe vers l'IP du serveur
- [ ] Serveur à jour, utilisateur `bbg` créé, SSH par clé, root SSH désactivé
- [ ] UFW actif (22, 80, 443 uniquement)
- [ ] Node.js 20 + PM2 installés
- [ ] MySQL 8 installé, sécurisé, `bind-address = 127.0.0.1`
- [ ] Base `bbgcompany` + utilisateur `bbguser` créés
- [ ] Code cloné dans `/var/www/bbgcompany`
- [ ] `.env` complet (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `APP_URL`) et `chmod 600`
- [ ] `npm ci` + `npx prisma generate` + `prisma db push` / `migrate deploy` OK
- [ ] Seeds exécutés, mots de passe seed changés
- [ ] `npm run build` réussi
- [ ] PM2 démarré + `pm2 save` + `pm2 startup`
- [ ] Nginx configuré, `nginx -t` OK
- [ ] HTTPS Certbot actif, renouvellement testé
- [ ] Parcours fonctionnels validés (accueil, connexion, espace client, admin, formulaires)
- [ ] Sauvegardes MySQL planifiées et restauration testée
- [ ] Logs et rotation en place

---

## Annexe A — Ordre condensé des commandes

```bash
# 1. Système
apt update && apt upgrade -y
apt install -y curl git unzip ufw fail2ban nginx
timedatectl set-timezone Europe/Paris
adduser bbg && usermod -aG sudo bbg
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# 2. Node + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs && npm install -g pm2

# 3. MySQL
apt install -y mysql-server && mysql_secure_installation
mysql -e "CREATE DATABASE bbgcompany CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER 'bbguser'@'localhost' IDENTIFIED BY 'MDP_FORT';"
mysql -e "GRANT ALL PRIVILEGES ON bbgcompany.* TO 'bbguser'@'localhost'; FLUSH PRIVILEGES;"

# 4. Application
su - bbg
cd /var/www && git clone https://github.com/yakri-innovation/bbgcompany.git bbgcompany
cd bbgcompany && nano .env        # variables d'environnement
npm ci
npx prisma generate
npx prisma db push
npm run db:seed && npm run db:seed:announcements
npm run build
pm2 start ecosystem.config.js && pm2 save

# 5. Nginx + TLS (en sudo)
sudo nano /etc/nginx/sites-available/bbgcompany
sudo ln -s /etc/nginx/sites-available/bbgcompany /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bbg.yakri.com
```

---

## Annexe B — Variables d'environnement de référence

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `DATABASE_URL` | Oui | Connexion MySQL utilisée par Prisma Client |
| `DIRECT_URL` | Oui (schéma) | Connexion directe MySQL (même valeur en local) |
| `NEXTAUTH_URL` | Oui | URL publique HTTPS du site |
| `NEXTAUTH_SECRET` | Oui | Signature des sessions JWT NextAuth |
| `NODE_ENV` | Oui | `production` |
| `APP_URL` | Recommandé | URL utilisée pour les retours de paiement |
| `STRIPE_SECRET_KEY` | Si paiements | Clé API Stripe |
| `STRIPE_WEBHOOK_SECRET` | Si paiements | Vérification des webhooks Stripe |
| `NOTIFICATION_EMAIL_WEBHOOK_URL` | Si emails | Webhook d'envoi d'emails |
| `NOTIFICATION_EMAIL_WEBHOOK_SECRET` | Si emails | Secret du webhook emails |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seed only | Compte admin initial |
| `SEED_CLIENT_EMAIL` / `SEED_CLIENT_PASSWORD` | Seed only | Compte client de démonstration |
