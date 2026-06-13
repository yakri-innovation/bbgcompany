# BBG Company - Analyse de transformation vers un site internet professionnel dynamique

## 1. Objectif du document

Ce document sert de base de décision et de feuille de route pour piloter l'évolution continue de la plateforme BBG Company, déjà en production.

Le template visuel et les formulaires étant déjà validés, l'objectif est de renforcer l'existant comme plateforme digitale complète avec :

- un site vitrine professionnel ;
- des formulaires dynamiques réellement exploitables ;
- un espace client complet ;
- une gestion de dossiers ;
- une gestion documentaire ;
- une gestion des annonces ;
- des paiements ;
- un back-office administrateur ;
- une base technique évolutive.

---

# 2. État actuel du projet

## 2.1 Structure technique constatée

Le projet contient actuellement une base Next.js moderne :

- `app/page.js` : page d'accueil principale du site ;
- `app/espace-client/page.js` : route de l'espace client ;
- `app/layout.js` : layout global ;
- `app/globals.css` : styles globaux ;
- `components/` : composants React du site ;
- `package.json` : projet basé sur Next.js 14.2.5, React 18.3.1 et React DOM 18.3.1.

Le projet contient aussi des fichiers historiques :

- `index.html` ;
- `espace-client.html` ;
- `styles.css` ;
- `script.js`.

Ces fichiers historiques peuvent servir de référence, mais la base à privilégier pour les évolutions produit est la version Next.js dans `app/` et `components/`.

## 2.2 Ce qui est déjà validé

### Template visuel

Le template actuel est cohérent avec l'image souhaitée :

- style premium ;
- couleurs sobres ;
- interface claire ;
- structure moderne ;
- navigation simple ;
- positionnement cabinet de conseil ;
- mise en avant des trois pôles : Gestion, Création, Fusion / Acquisition.

### Parcours principal

Le site permet déjà d'orienter l'utilisateur vers :

- les services de gestion ;
- la création d'entreprise ;
- les annonces de fusion / acquisition ;
- le contact ;
- l'espace client.

### Formulaires validés

Les composants de formulaire existent déjà sous forme interactive :

- `GestionSection.js` : formulaire RH / comptabilité ;
- `CreationSection.js` : parcours de création ou reprise ;
- `AnnonceSection.js` : parcours annonces et contact ;
- `ContactSection.js` : formulaire de contact général.

La logique conditionnelle existe déjà côté interface : affichage progressif, choix successifs, champs conditionnels et redirection vers l'espace client.

### Espace client visuel

`DashboardPage.js` contient une bonne base visuelle pour l'espace client :

- tableau de bord ;
- métriques ;
- suivi des dossiers ;
- timeline d'avancement ;
- documents ;
- profil ;
- paiements ;
- conseiller dédié.

## 2.3 Limites actuelles

La plateforme est opérationnelle, mais certaines briques métier restent à consolider pour un niveau de maturité cible.

### Données statiques

Les données sont écrites directement dans les composants :

- annonces codées en dur ;
- exemple client codé en dur ;
- documents fictifs ;
- paiements fictifs ;
- conseiller fictif ;
- progression de dossier fictive.

### Pas de base de données

Il n'existe pas encore de base pour stocker :

- les clients ;
- les prospects ;
- les réponses aux formulaires ;
- les dossiers ;
- les documents ;
- les paiements ;
- les annonces ;
- les statuts ;
- les historiques d'action.

### Pas d'authentification

L'espace client est accessible directement par `/espace-client`. Il n'y a pas encore :

- connexion ;
- inscription ;
- mot de passe oublié ;
- session sécurisée ;
- rôles ;
- protection des pages client ;
- distinction client / administrateur / conseiller.

### Pas de back-office

Il n'existe pas encore d'interface interne pour :

- consulter les demandes reçues ;
- créer ou modifier les annonces ;
- gérer les dossiers ;
- valider les documents ;
- changer les statuts ;
- attribuer un conseiller ;
- suivre les paiements.

### Pas d'envoi réel

Les formulaires ne créent pas encore de vraie demande. Ils n'envoient pas :

- d'e-mail ;
- de notification ;
- de message WhatsApp ;
- d'entrée en base de données ;
- de dossier client.

### Pas de gestion documentaire réelle

Les boutons de dépôt, téléchargement et signature sont visuels. Il faut prévoir :

- upload sécurisé ;
- stockage des fichiers ;
- droits d'accès ;
- versioning ;
- validation interne ;
- génération éventuelle de documents ;
- traçabilité.

### Pas de paiement réel

La zone paiement doit encore être consolidée sur certains volets métier. Il faut intégrer ou renforcer :

- création de factures ;
- paiement en ligne ;
- statut de paiement ;
- historique ;
- téléchargement de justificatifs ;
- synchronisation avec les dossiers.

---

# 3. État de l'art recommandé

## 3.1 Vision moderne d'un site professionnel dynamique

Un site professionnel dynamique ne doit pas seulement afficher des pages. Il doit devenir un système centralisé capable de gérer le parcours complet :

1. acquisition du prospect ;
2. qualification via formulaire intelligent ;
3. création d'un dossier ;
4. création ou activation d'un compte client ;
5. suivi du dossier dans l'espace client ;
6. échanges avec le conseiller ;
7. dépôt et validation de documents ;
8. paiement ;
9. finalisation ;
10. archivage et relance.

## 3.2 Architecture recommandée

Pour BBG Company, l'architecture cible doit être composée de quatre grandes zones.

### Zone 1 - Site public

Objectif : rassurer, expliquer et convertir.

Fonctions attendues :

- accueil professionnel ;
- pages services ;
- annonces ;
- fiches annonces ;
- contact ;
- SEO ;
- responsive mobile ;
- formulaires de qualification.

### Zone 2 - Espace client

Objectif : permettre au client de suivre et compléter son dossier.

Fonctions attendues :

- connexion sécurisée ;
- tableau de bord ;
- profil ;
- dossiers ;
- étapes de dossier ;
- documents à déposer ;
- documents disponibles ;
- paiements ;
- messages ou demandes ;
- notifications.

### Zone 3 - Back-office administrateur

Objectif : permettre à BBG Company de gérer l'activité.

Fonctions attendues :

- liste des prospects ;
- liste des clients ;
- liste des dossiers ;
- détails d'un dossier ;
- modification des statuts ;
- validation des documents ;
- publication des annonces ;
- suivi des paiements ;
- attribution des conseillers ;
- historique des actions.

### Zone 4 - Services techniques

Objectif : connecter le site aux vrais outils métier.

Services nécessaires :

- base de données ;
- authentification ;
- stockage fichiers ;
- envoi d'e-mails ;
- paiement en ligne ;
- journalisation ;
- sauvegardes ;
- monitoring ;
- conformité RGPD.

## 3.3 Stack technique conseillée

La base Next.js est pertinente et doit être conservée.

### Frontend

Recommandation :

- Next.js App Router ;
- React ;
- composants organisés par domaine métier ;
- CSS global existant à conserver au départ ;
- évolution progressive vers un design system plus structuré si nécessaire.

### Formulaires

Recommandation :

- React Hook Form pour gérer les formulaires complexes ;
- Zod pour valider les données ;
- sauvegarde progressive des réponses ;
- validation côté client et côté serveur ;
- messages d'erreur clairs ;
- anti-spam sur les formulaires publics.

### Base de données

Recommandation principale :

- PostgreSQL ;
- Prisma ORM.

Pourquoi :

- fiable ;
- robuste ;
- adapté aux relations client / dossier / document / paiement ;
- évolutif ;
- compatible avec de nombreux hébergeurs.

### Authentification

Options recommandées :

- Auth.js / NextAuth si l'on veut rester totalement dans l'écosystème Next.js ;
- Supabase Auth si l'on veut accélérer avec une solution intégrée ;
- Clerk si l'on veut une solution premium prête à l'emploi.

Pour un MVP rapide et robuste, Supabase peut accélérer la mise en place. Pour une architecture plus personnalisée et maîtrisée, Auth.js + PostgreSQL + Prisma est une très bonne base.

### Stockage documentaire

Recommandation :

- stockage objet compatible S3 ;
- dossiers privés ;
- URLs signées temporaires ;
- contrôle des droits par utilisateur ;
- limitation des formats ;
- antivirus ou vérification côté serveur à prévoir en phase avancée.

### Paiement

Recommandation :

- Stripe pour paiement en ligne ;
- webhooks pour mettre à jour automatiquement les statuts ;
- génération ou stockage de factures ;
- historique visible dans l'espace client.

### E-mails et notifications

Recommandation :

- Brevo, Resend, Mailgun ou équivalent ;
- modèles d'e-mails transactionnels ;
- notifications internes lors d'une nouvelle demande ;
- notifications client lors d'un changement de statut.

### WhatsApp

Approche progressive :

- MVP : lien WhatsApp ou collecte du numéro ;
- phase 2 : notifications manuelles depuis le back-office ;
- phase 3 : intégration WhatsApp Business API si nécessaire.

### Hébergement

Point important : un site dynamique Next.js avec authentification, base de données, documents et paiements ne doit pas être traité comme un simple site statique.

Options possibles :

- Vercel / Netlify / Render pour le frontend Next.js ;
- Supabase / Neon / Railway / OVH PostgreSQL pour la base ;
- OVH VPS ou serveur Node si l'objectif est de rester chez OVH ;
- stockage S3 compatible OVH Object Storage ou équivalent.

Si l'hébergement actuel est un hébergement mutualisé OVH classique, il peut être insuffisant pour une application Next.js dynamique complète. Il faut alors prévoir soit un VPS, soit une plateforme compatible Node.js.

---

# 4. Architecture fonctionnelle cible

## 4.1 Parcours visiteur

### Étape 1 - Arrivée sur le site

Le visiteur arrive sur la page d'accueil et comprend immédiatement :

- qui est BBG Company ;
- quels sont les trois pôles ;
- comment prendre contact ;
- comment accéder à son espace client.

### Étape 2 - Choix du besoin

Le visiteur sélectionne :

- Gestion ;
- Création ;
- Fusion / Acquisition.

### Étape 3 - Formulaire intelligent

Le visiteur répond à un formulaire progressif adapté à son besoin.

Le formulaire doit :

- afficher uniquement les champs nécessaires ;
- sauvegarder les réponses ;
- valider les champs obligatoires ;
- permettre la reprise du parcours ;
- créer un prospect ou un dossier.

### Étape 4 - Création de la demande

À la fin du formulaire, le système crée :

- une demande ;
- un prospect ;
- un dossier si le besoin est qualifié ;
- une notification interne ;
- éventuellement un compte client.

### Étape 5 - Activation de l'espace client

Le client reçoit un lien pour :

- créer son mot de passe ;
- se connecter ;
- compléter son profil ;
- suivre son dossier.

## 4.2 Parcours client

Le client connecté doit pouvoir :

- consulter son tableau de bord ;
- voir ses dossiers ;
- connaître l'étape actuelle ;
- voir les actions attendues ;
- déposer un document ;
- télécharger un document validé ;
- régler une prestation ;
- contacter son conseiller ;
- modifier son profil.

## 4.3 Parcours administrateur

L'administrateur doit pouvoir :

- se connecter à un back-office sécurisé ;
- consulter les nouveaux prospects ;
- transformer un prospect en client ;
- créer un dossier ;
- associer un client à un dossier ;
- mettre à jour les étapes ;
- demander un document ;
- valider ou refuser un document ;
- ajouter un document téléchargeable ;
- créer une demande de paiement ;
- publier une annonce ;
- modifier une annonce ;
- archiver une annonce ;
- suivre l'historique.

---

# 5. Modules à réaliser

## 5.1 Module Authentification

### Fonctions à prévoir

- page de connexion ;
- page mot de passe oublié ;
- page création ou activation de compte ;
- session sécurisée ;
- déconnexion ;
- protection des routes ;
- rôles utilisateur.

### Rôles recommandés

- `VISITOR` : visiteur non connecté ;
- `CLIENT` : client connecté ;
- `ADVISOR` : conseiller ;
- `ADMIN` : administrateur ;
- `SUPER_ADMIN` : gestion complète.

### Étapes de réalisation

1. Choisir la solution d'authentification.
2. Créer le modèle utilisateur en base.
3. Créer les pages de connexion.
4. Protéger `/espace-client`.
5. Créer les rôles.
6. Tester l'accès client.
7. Tester l'accès administrateur.

## 5.2 Module Prospects et formulaires

### Fonctions à prévoir

- sauvegarde des réponses ;
- validation des champs ;
- création d'une demande ;
- notification interne ;
- suivi du statut de la demande ;
- anti-spam ;
- consentement RGPD.

### Formulaires concernés

- Gestion RH ;
- Gestion comptabilité ;
- Création d'entreprise ;
- Reprise d'une annonce ;
- Contact annonce ;
- Contact général.

### Étapes de réalisation

1. Lister tous les champs validés dans les formulaires actuels.
2. Créer un schéma de données pour chaque type de demande.
3. Remplacer le state local par un vrai formulaire contrôlé.
4. Ajouter la validation côté client.
5. Ajouter la validation côté serveur.
6. Enregistrer la demande en base.
7. Envoyer un e-mail interne à BBG Company.
8. Afficher une confirmation claire à l'utilisateur.
9. Prévoir la transformation de la demande en dossier.

## 5.3 Module Clients

### Fonctions à prévoir

- profil client ;
- informations personnelles ;
- informations entreprise ;
- coordonnées ;
- préférences de contact ;
- rattachement à un ou plusieurs dossiers ;
- historique.

### Étapes de réalisation

1. Créer le modèle client.
2. Relier le client à un utilisateur connecté.
3. Créer la page profil client.
4. Permettre la modification des coordonnées.
5. Journaliser les modifications importantes.
6. Afficher les informations dans l'espace client.

## 5.4 Module Dossiers

### Types de dossiers

- Gestion RH ;
- Gestion comptabilité ;
- Création de société ;
- Reprise ;
- Fusion / Acquisition ;
- Annonce ;
- Autre demande.

### Statuts recommandés

- nouveau ;
- en attente de validation ;
- en cours ;
- document demandé ;
- document reçu ;
- paiement demandé ;
- en traitement ;
- finalisé ;
- archivé ;
- annulé.

### Fonctions à prévoir

- création d'un dossier ;
- association à un client ;
- timeline ;
- étapes ;
- statut ;
- actions attendues ;
- notes internes ;
- conseiller assigné ;
- documents associés ;
- paiements associés.

### Étapes de réalisation

1. Créer le modèle dossier.
2. Créer le modèle étape de dossier.
3. Créer les statuts standard.
4. Relier les dossiers aux clients.
5. Afficher les dossiers dans l'espace client.
6. Créer une page détail dossier.
7. Créer une interface admin pour modifier les statuts.
8. Envoyer une notification client à chaque changement important.

## 5.5 Module Documents

### Fonctions à prévoir côté client

- voir les documents demandés ;
- déposer un document ;
- remplacer un document refusé ;
- voir le statut ;
- télécharger les documents disponibles ;
- recevoir une notification en cas de validation ou refus.

### Fonctions à prévoir côté admin

- demander un document ;
- consulter un document ;
- valider ;
- refuser avec motif ;
- ajouter un document final ;
- gérer les versions.

### Statuts recommandés

- demandé ;
- déposé ;
- en vérification ;
- validé ;
- refusé ;
- expiré ;
- disponible.

### Étapes de réalisation

1. Choisir le stockage fichiers.
2. Créer le modèle document.
3. Ajouter l'upload sécurisé.
4. Limiter les formats autorisés.
5. Limiter la taille des fichiers.
6. Créer les URLs privées temporaires.
7. Afficher les documents côté client.
8. Créer la validation côté admin.
9. Ajouter l'historique des versions.

## 5.6 Module Paiements

### Fonctions à prévoir

- demande de paiement ;
- paiement en ligne ;
- statut de paiement ;
- reçu ou facture ;
- historique ;
- lien avec le dossier ;
- notification automatique.

### Statuts recommandés

- brouillon ;
- demandé ;
- en attente ;
- payé ;
- échoué ;
- remboursé ;
- annulé.

### Étapes de réalisation

1. Choisir le prestataire de paiement.
2. Créer le modèle paiement.
3. Créer les demandes de paiement côté admin.
4. Afficher les paiements côté client.
5. Intégrer la page de paiement.
6. Gérer les webhooks.
7. Mettre à jour automatiquement le statut.
8. Générer ou stocker les reçus.

## 5.7 Module Annonces

### Fonctions publiques

- liste d'annonces ;
- filtres ;
- catégories ;
- fiche détail ;
- demande de contact ;
- passerelle vers reprise / création.

### Fonctions admin

- création d'annonce ;
- modification ;
- publication ;
- dépublication ;
- archivage ;
- gestion des images ;
- gestion des prix ;
- suivi des demandes reçues.

### Catégories actuelles

- sociétés commerciales ;
- fonds de commerce ;
- sociétés civiles immobilières.

### Étapes de réalisation

1. Créer le modèle annonce.
2. Migrer les annonces codées en dur vers la base de données.
3. Créer la page liste dynamique.
4. Créer les filtres dynamiques.
5. Créer la page détail `/annonces/[slug]`.
6. Créer le formulaire de demande d'information.
7. Créer l'interface admin de publication.
8. Relier une annonce à un dossier de reprise.

## 5.8 Module Back-office

### Pages recommandées

- `/admin` : tableau de bord ;
- `/admin/prospects` : demandes reçues ;
- `/admin/clients` : clients ;
- `/admin/dossiers` : dossiers ;
- `/admin/documents` : documents à traiter ;
- `/admin/paiements` : paiements ;
- `/admin/annonces` : annonces ;
- `/admin/utilisateurs` : utilisateurs et rôles.

### Étapes de réalisation

1. Créer une zone admin protégée.
2. Ajouter les rôles admin.
3. Créer un dashboard interne simple.
4. Ajouter la liste des prospects.
5. Ajouter la fiche client.
6. Ajouter la fiche dossier.
7. Ajouter la gestion documentaire.
8. Ajouter la gestion des annonces.
9. Ajouter la gestion des paiements.
10. Ajouter les historiques d'action.

---

# 6. Modèle de données recommandé

## 6.1 Tables principales

### User

Représente un compte de connexion.

Champs recommandés :

- id ;
- email ;
- passwordHash ou provider auth ;
- role ;
- status ;
- createdAt ;
- updatedAt ;
- lastLoginAt.

### ClientProfile

Représente les informations client.

Champs recommandés :

- id ;
- userId ;
- firstName ;
- lastName ;
- phone ;
- whatsapp ;
- companyName ;
- preferredContactMethod ;
- address ;
- createdAt ;
- updatedAt.

### Lead

Représente une demande venant d'un formulaire public.

Champs recommandés :

- id ;
- type ;
- source ;
- firstName ;
- lastName ;
- email ;
- phone ;
- payload JSON ;
- status ;
- assignedToId ;
- createdAt ;
- updatedAt.

### Dossier

Représente un accompagnement métier.

Champs recommandés :

- id ;
- clientId ;
- leadId ;
- advisorId ;
- type ;
- title ;
- status ;
- currentStep ;
- priority ;
- createdAt ;
- updatedAt ;
- closedAt.

### DossierStep

Représente les étapes visibles dans la timeline.

Champs recommandés :

- id ;
- dossierId ;
- title ;
- description ;
- order ;
- status ;
- dueDate ;
- completedAt.

### Document

Représente un fichier demandé, déposé ou disponible.

Champs recommandés :

- id ;
- dossierId ;
- clientId ;
- type ;
- title ;
- fileKey ;
- fileName ;
- mimeType ;
- size ;
- status ;
- rejectionReason ;
- version ;
- uploadedById ;
- validatedById ;
- createdAt ;
- updatedAt.

### Payment

Représente une demande de paiement ou un paiement effectué.

Champs recommandés :

- id ;
- dossierId ;
- clientId ;
- label ;
- amount ;
- currency ;
- status ;
- provider ;
- providerSessionId ;
- providerPaymentId ;
- invoiceUrl ;
- createdAt ;
- paidAt.

### Announcement

Représente une annonce.

Champs recommandés :

- id ;
- title ;
- slug ;
- category ;
- city ;
- price ;
- priceBand ;
- description ;
- details JSON ;
- status ;
- publishedAt ;
- createdAt ;
- updatedAt.

### Notification

Représente une notification envoyée ou à afficher.

Champs recommandés :

- id ;
- userId ;
- dossierId ;
- type ;
- title ;
- message ;
- channel ;
- status ;
- readAt ;
- createdAt.

### AuditLog

Représente l'historique des actions sensibles.

Champs recommandés :

- id ;
- actorId ;
- entityType ;
- entityId ;
- action ;
- metadata JSON ;
- createdAt.

---

# 7. Arborescence cible du site

## 7.1 Pages publiques

- `/` : accueil ;
- `/services/gestion` : service gestion ;
- `/services/creation` : service création ;
- `/services/fusion-acquisition` : service fusion / acquisition ;
- `/annonces` : liste des annonces ;
- `/annonces/[slug]` : fiche annonce ;
- `/contact` : contact ;
- `/connexion` : connexion ;
- `/mot-de-passe-oublie` : récupération ;
- `/mentions-legales` : mentions légales ;
- `/politique-confidentialite` : politique de confidentialité.

## 7.2 Pages espace client

- `/espace-client` : tableau de bord ;
- `/espace-client/profil` : profil ;
- `/espace-client/dossiers` : liste des dossiers ;
- `/espace-client/dossiers/[id]` : détail d'un dossier ;
- `/espace-client/documents` : documents ;
- `/espace-client/paiements` : paiements ;
- `/espace-client/messages` : messages ou demandes.

## 7.3 Pages admin

- `/admin` : tableau de bord admin ;
- `/admin/prospects` ;
- `/admin/clients` ;
- `/admin/dossiers` ;
- `/admin/documents` ;
- `/admin/paiements` ;
- `/admin/annonces` ;
- `/admin/utilisateurs` ;
- `/admin/parametres`.

---

# 8. Plan step-by-step de réalisation

## Phase 0 - Stabilisation de la base existante

Objectif : nettoyer la base sans casser le template validé.

### Étapes

1. Conserver Next.js comme base principale.
2. Identifier les fichiers historiques HTML/CSS/JS comme référence uniquement.
3. Vérifier que la version Next.js reproduit bien le template validé.
4. Vérifier le responsive mobile, tablette et desktop.
5. Corriger les éventuels écarts visuels sans changer la direction artistique.
6. Créer une branche ou sauvegarde avant travaux dynamiques.
7. Définir les variables d'environnement nécessaires.

### Résultat attendu

Une base frontend stable, validée et prête à recevoir les fonctions dynamiques.

## Phase 1 - Socle technique dynamique

Objectif : installer les fondations nécessaires.

### Étapes

1. Choisir l'hébergement cible.
2. Choisir la base de données.
3. Installer Prisma ou l'outil équivalent.
4. Créer le schéma de base initial.
5. Ajouter l'authentification.
6. Créer les rôles utilisateur.
7. Protéger les routes sensibles.
8. Créer les premières migrations.
9. Préparer les variables d'environnement.
10. Tester localement la connexion à la base.

### Résultat attendu

Le site peut créer des utilisateurs, protéger l'espace client et lire/écrire dans une base de données.

## Phase 2 - Formulaires réels

Objectif : transformer les formulaires validés en formulaires exploitables.

### Étapes

1. Lister tous les champs de `GestionSection.js`.
2. Lister tous les champs de `CreationSection.js`.
3. Lister tous les champs de `AnnonceSection.js`.
4. Lister tous les champs de `ContactSection.js`.
5. Créer les schémas de validation.
6. Remplacer progressivement les states dispersés par une gestion de formulaire robuste.
7. Enregistrer chaque demande en base.
8. Envoyer une notification interne.
9. Afficher une confirmation utilisateur.
10. Prévoir la création automatique ou manuelle d'un dossier.

### Résultat attendu

Chaque formulaire validé produit une vraie donnée exploitable par BBG Company.

## Phase 3 - Espace client connecté

Objectif : enrichir le tableau de bord client avec les prochains volets métier.

### Étapes

1. Protéger `/espace-client`.
2. Charger les informations du client connecté.
3. Remplacer les données fictives par les données de la base.
4. Créer la liste des dossiers client.
5. Créer le détail d'un dossier.
6. Afficher la timeline réelle.
7. Afficher les documents demandés.
8. Afficher les paiements réels.
9. Ajouter la modification du profil.
10. Ajouter une page de messages ou demandes.

### Résultat attendu

Un client connecté voit uniquement ses propres dossiers, documents et paiements.

## Phase 4 - Back-office MVP

Objectif : permettre à BBG Company de gérer les demandes et les dossiers.

### Étapes

1. Créer `/admin` protégé par rôle.
2. Afficher les nouvelles demandes.
3. Créer la fiche prospect.
4. Créer la fiche client.
5. Transformer un prospect en client.
6. Créer ou modifier un dossier.
7. Changer les statuts d'un dossier.
8. Demander un document.
9. Valider ou refuser un document.
10. Créer une demande de paiement simple.

### Résultat attendu

BBG Company peut gérer opérationnellement les clients sans modifier le code.

## Phase 5 - Documents réels

Objectif : permettre le dépôt et la validation des fichiers.

### Étapes

1. Choisir le stockage fichier.
2. Créer le modèle document.
3. Ajouter l'upload côté client.
4. Sécuriser les accès.
5. Ajouter la validation côté admin.
6. Ajouter les statuts documentaires.
7. Ajouter les motifs de refus.
8. Ajouter le téléchargement privé.
9. Ajouter les documents finaux.
10. Ajouter la notification automatique.

### Résultat attendu

Le client peut déposer ses documents et BBG Company peut les traiter dans le back-office.

## Phase 6 - Paiements

Objectif : permettre le règlement en ligne.

### Étapes

1. Créer le modèle paiement.
2. Créer une demande de paiement depuis l'admin.
3. Afficher la demande côté client.
4. Intégrer le prestataire de paiement.
5. Gérer les webhooks.
6. Mettre à jour le statut automatiquement.
7. Afficher l'historique.
8. Permettre le téléchargement d'un justificatif ou reçu.

### Résultat attendu

Le client peut payer en ligne et le dossier se met à jour automatiquement.

## Phase 7 - Annonces dynamiques

Objectif : remplacer les annonces codées en dur par un vrai catalogue.

### Étapes

1. Créer le modèle annonce.
2. Créer une interface admin d'ajout d'annonce.
3. Créer les catégories.
4. Créer les filtres.
5. Créer les fiches annonces.
6. Ajouter les statuts brouillon / publié / archivé.
7. Connecter le bouton d'intérêt à une demande réelle.
8. Relier une annonce à un dossier de reprise.

### Résultat attendu

BBG Company peut publier et gérer ses annonces sans intervention technique.

## Phase 8 - Notifications et automatisations

Objectif : réduire le traitement manuel.

### Étapes

1. Ajouter les e-mails transactionnels.
2. Notifier BBG Company à chaque nouvelle demande.
3. Notifier le client lors d'un changement de statut.
4. Notifier le client lors d'un document refusé.
5. Notifier le client lors d'un paiement demandé.
6. Ajouter des rappels automatiques.
7. Préparer l'intégration WhatsApp Business si nécessaire.

### Résultat attendu

Le client et l'équipe interne sont informés automatiquement des actions importantes.

## Phase 9 - Sécurité, conformité et production

Objectif : rendre le site professionnellement exploitable.

### Étapes

1. Ajouter les mentions légales.
2. Ajouter la politique de confidentialité.
3. Ajouter les consentements formulaires.
4. Sécuriser les uploads.
5. Vérifier les droits d'accès.
6. Ajouter les logs d'audit.
7. Ajouter les sauvegardes.
8. Ajouter le monitoring.
9. Tester les parcours critiques.
10. Déployer en production.

### Résultat attendu

Le site est prêt pour une exploitation professionnelle.

---

# 9. MVP recommandé

## 9.1 Objectif du MVP

Le MVP doit permettre de lancer rapidement une version dynamique utile, sans attendre toutes les fonctions avancées.

## 9.2 Fonctions à inclure absolument

### Site public

- accueil validé ;
- services validés ;
- formulaires enregistrés en base ;
- contact réel ;
- annonces simples dynamiques ;
- responsive complet.

### Espace client

- connexion ;
- tableau de bord ;
- profil ;
- dossiers ;
- documents demandés ;
- paiements affichés.

### Admin

- connexion admin ;
- liste des demandes ;
- liste des clients ;
- liste des dossiers ;
- changement de statut ;
- demande de document ;
- gestion simple des annonces.

## 9.3 Fonctions à reporter après MVP

- signature électronique avancée ;
- génération automatique complexe de documents ;
- WhatsApp Business API ;
- scoring commercial ;
- tableaux de bord analytiques avancés ;
- automatisations complexes ;
- multi-conseillers avancé ;
- facturation comptable complète.

---

# 10. Priorités de développement

## Priorité 1 - Sécurité et données

À réaliser avant toute exploitation réelle :

- base de données ;
- authentification ;
- rôles ;
- protection des routes ;
- validation serveur ;
- stockage sécurisé.

## Priorité 2 - Conversion commerciale

À réaliser rapidement pour générer des prospects :

- formulaires enregistrés ;
- notifications e-mail ;
- confirmation utilisateur ;
- contact WhatsApp ou mail ;
- tableau de suivi interne.

## Priorité 3 - Expérience client

À réaliser pour professionnaliser le service :

- espace client connecté ;
- dossiers ;
- timeline ;
- documents ;
- paiements ;
- profil.

## Priorité 4 - Autonomie interne

À réaliser pour ne plus dépendre du code :

- back-office ;
- gestion des annonces ;
- gestion des statuts ;
- gestion documentaire ;
- gestion des paiements.

---

# 11. Exigences responsive et UX

## 11.1 Responsive

Le site doit être parfaitement utilisable sur :

- mobile ;
- tablette ;
- ordinateur portable ;
- écran large.

Points à vérifier :

- navigation mobile ;
- lisibilité des formulaires ;
- taille des boutons ;
- tableaux transformés en cartes sur mobile ;
- upload de documents depuis mobile ;
- paiement mobile ;
- espace client mobile.

## 11.2 UX formulaires

Les formulaires doivent respecter ces principes :

- une question principale à la fois quand le parcours est complexe ;
- progression claire ;
- sauvegarde automatique si possible ;
- messages rassurants ;
- erreurs visibles ;
- bouton de retour ;
- résumé avant validation finale ;
- confirmation claire après envoi.

## 11.3 Accessibilité

À prévoir :

- labels correctement liés aux champs ;
- navigation clavier ;
- contrastes suffisants ;
- textes alternatifs images ;
- états focus visibles ;
- messages d'erreur accessibles.

---

# 12. Sécurité et conformité

## 12.1 Sécurité minimale obligatoire

- mots de passe sécurisés ;
- sessions protégées ;
- routes privées ;
- validation côté serveur ;
- protection CSRF selon l'architecture choisie ;
- limitation anti-spam ;
- limitation des uploads ;
- permissions par rôle ;
- logs d'actions sensibles.

## 12.2 RGPD

À prévoir :

- politique de confidentialité ;
- mentions légales ;
- consentement au traitement des données ;
- durée de conservation ;
- droit de suppression ;
- droit d'accès ;
- sécurisation des documents ;
- minimisation des données collectées.

## 12.3 Documents sensibles

Les documents client doivent être traités comme des données sensibles.

Règles recommandées :

- jamais de fichier public direct ;
- accès uniquement au client concerné et aux admins autorisés ;
- URL temporaire pour téléchargement ;
- historique des accès si nécessaire ;
- suppression ou archivage maîtrisé.

---

# 13. Risques identifiés

## Risque 1 - Sous-estimer l'hébergement

Un site dynamique complet ne fonctionne pas comme un site HTML statique. Il faut un environnement compatible avec Next.js serveur, base de données, stockage et webhooks.

## Risque 2 - Garder trop longtemps les données codées en dur

Les composants actuels sont solides sur l'UX, mais ils doivent rester connectés à la base en continu pour garantir la cohérence produit.

## Risque 3 - Construire l'espace client avant les modèles de données

L'espace client dépend des modèles client, dossier, document et paiement. Il faut donc définir la base avant de développer les écrans finaux.

## Risque 4 - Négliger l'admin

Sans back-office, chaque changement nécessitera une intervention technique. Le back-office est indispensable pour un site professionnel dynamique.

## Risque 5 - Lancer les paiements sans webhooks solides

Le statut payé ne doit pas dépendre uniquement du retour navigateur. Il faut utiliser les webhooks du prestataire de paiement.

## Risque 6 - Mauvaise gestion des droits documents

Les documents doivent être strictement privés. Une mauvaise configuration de stockage peut exposer des fichiers sensibles.

---

# 14. Décisions à prendre avant développement

## Décision 1 - Hébergement

Choisir entre :

- plateforme spécialisée Next.js ;
- OVH VPS ;
- autre serveur Node ;
- solution hybride.

## Décision 2 - Authentification

Choisir entre :

- Auth.js / NextAuth ;
- Supabase Auth ;
- Clerk.

## Décision 3 - Base de données

Confirmer :

- PostgreSQL recommandé ;
- hébergeur de la base ;
- stratégie de sauvegarde.

## Décision 4 - Paiement

Confirmer :

- Stripe ou autre prestataire ;
- types de paiements ;
- factures ;
- remboursements ;
- paiements récurrents ou non.

## Décision 5 - Documents

Confirmer :

- stockage ;
- taille maximale ;
- formats acceptés ;
- durée de conservation ;
- validation interne.

## Décision 6 - Niveau MVP

Confirmer ce qui doit être livré en premier :

- site public dynamique seulement ;
- espace client connecté ;
- back-office simple ;
- documents ;
- paiements.

---

# 15. Checklist opérationnelle

## Avant développement

- [ ] Valider l'hébergement cible.
- [ ] Valider la base de données.
- [ ] Valider le système d'authentification.
- [ ] Valider le prestataire e-mail.
- [ ] Valider le stockage documents.
- [ ] Valider le prestataire de paiement.
- [ ] Valider les rôles utilisateurs.
- [ ] Valider les statuts de dossier.
- [ ] Valider les statuts documentaires.
- [ ] Valider les statuts de paiement.

## Pendant développement

- [ ] Mettre en place la base.
- [ ] Mettre en place l'authentification.
- [ ] Protéger l'espace client.
- [ ] Créer les modèles principaux.
- [ ] Connecter les formulaires.
- [ ] Créer le back-office MVP.
- [ ] Connecter les dossiers.
- [ ] Connecter les documents.
- [ ] Connecter les paiements.
- [ ] Connecter les annonces.

## Avant mise en ligne

- [ ] Tester le parcours prospect.
- [ ] Tester le parcours client.
- [ ] Tester le parcours admin.
- [ ] Tester l'upload document.
- [ ] Tester le téléchargement document.
- [ ] Tester le paiement.
- [ ] Tester les notifications e-mail.
- [ ] Tester le responsive mobile.
- [ ] Tester les droits d'accès.
- [ ] Vérifier RGPD et mentions légales.
- [ ] Préparer les sauvegardes.
- [ ] Préparer le monitoring.

---

# 16. Recommandation finale

La direction recommandée est claire : conserver le template Next.js validé, ne pas repartir de zéro, et construire progressivement le socle dynamique autour de l'existant.

L'ordre idéal est :

1. stabiliser la base Next.js ;
2. ajouter base de données et authentification ;
3. connecter les formulaires validés ;
4. créer les vrais dossiers client ;
5. transformer l'espace client en espace connecté ;
6. créer le back-office ;
7. ajouter documents ;
8. ajouter paiements ;
9. rendre les annonces dynamiques ;
10. sécuriser, tester et déployer.

Le projet dispose déjà d'une très bonne base UX. Le vrai changement à réaliser maintenant est le passage d'une interface validée à une plateforme métier : données réelles, comptes utilisateurs, dossiers, documents, paiements, annonces et administration.
