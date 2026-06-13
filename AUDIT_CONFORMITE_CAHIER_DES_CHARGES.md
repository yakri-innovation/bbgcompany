# Audit de conformité au cahier des charges

## Source de référence

Cahier des charges analysé : `MAQUETTE_TEXTUELLE_BBG.md`.

Périmètre comparé : front-office, formulaires, authentification, espace client, annonces, paiements, notifications, back-office admin, API.

---

## Résumé exécutif

- **Niveau global** : **conformité partielle élevée (MVP avancé)**.
- **Points conformes forts** :
  - Formulaires intelligents (Gestion + Création + Contact) avec logique conditionnelle.
  - Catalogue annonces dynamique (public + admin) avec filtres et pagination.
  - Espace client connecté avec dossiers/documents/paiements/notifications.
  - Back-office admin (leads, annonces, paiements) avec workflows opérationnels.
  - Notifications APP + EMAIL (fallback APP) + marquage lu.
- **Écarts majeurs restants** :
  - Pages légales/manquantes de l’arborescence (`/a-propos`, mentions légales, politique confidentialité).
  - Gestion documentaire encore surtout en lecture (pas de dépôt sécurisé complet côté client/admin).
  - Exigences dynamiques avancées non finalisées (barre d’avancement formulaires, autosave brouillon, génération réelle identifiant/mot de passe + email activation à l’issue du Step 12).
  - Liaison « paiement débloque document » non matérialisée par règle stricte d’accès.

---

## Matrice de conformité (exigences clés)

### 1) Vision / structure globale

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| 3 entrées principales visibles (Gestion, Création, Fusion/Acquisition) | Conforme | `app/page.js`, `components/ServiceCards.js`, `components/SiteHeader.js` | Présence des sections et navigation principale. |
| Espace client et page connexion | Conforme | `app/espace-client/page.js`, `app/connexion/page.js`, `components/LoginForm.js` | Flux sécurisé en place. |
| Arborescence complète incluant À propos, Mentions légales, Politique confidentialité | **Non conforme** | Absence de routes dédiées (`app/`) | Routes manquantes dans le projet actuel. |

### 2) Formulaires intelligents

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Affichage progressif + logique conditionnelle | Conforme | `components/GestionSection.js`, `components/CreationSection.js`, `components/AnnonceSection.js` | Les étapes dépendent des réponses. |
| Duplication actionnaires + contrôle nombre de présidents | Conforme | `components/CreationSection.js` | Règle métier implémentée (`selectedPresidentCount`). |
| Validation claire champs obligatoires | Partiel | `required` + validations simples front | Pas de validation métier complète/schéma centralisé. |
| Sauvegarde brouillon automatique | **Non conforme** | N/A | Non implémenté (hors redirection reprise via localStorage). |
| Barre d’avancement par étapes | **Non conforme** | N/A | Pas de progress bar dédiée sur formulaire création. |

### 3) Parcours Création (Étapes 1 à 12)

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Étapes 1→11 conformes au cahier de référence | Conforme | `components/CreationSection.js` | Wording aligné sur étapes 9, 10, 11. |
| Étape 12 confirmation finale + CTA espace client + téléchargement récapitulatif | Conforme | `components/CreationSection.js` | Récap JSON ajouté, CTA espace client après soumission réussie. |
| Génération réelle identifiant/mot de passe + envoi activation | **Partiel / à compléter** | Conversion lead→dossier crée utilisateur `INVITED` en admin (`app/api/admin/leads/[id]/route.js`) | Le Step 12 front affiche un message mais ne crée pas directement d’identifiants ni d’email d’activation au moment de la soumission client. |

### 4) Annonces (gestion + reprise)

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Catalogue annonces dynamique public | Conforme | `app/annonces/page.js` | Source Prisma + publication. |
| Filtres type/prix/ville/texte + pagination | Conforme | `app/annonces/page.js` | Filtres et pagination opérationnels. |
| Fiche annonce détaillée | Conforme | `app/annonces/[slug]/page.js` | Détail + formulaire intérêt. |
| Back-office annonces (ajout/modif/statut) | Conforme | `app/admin/annonces/page.js`, `components/AdminAnnouncementsPage.js`, `app/api/admin/announcements/*` | CRUD fonctionnel MVP (création + patch statut/champs). |
| Passage annonce → parcours reprise | Conforme | `components/AnnouncementInterestForm.js`, `components/CreationSection.js`, `app/api/admin/leads/[id]/route.js` | Métadonnées annonce reprises en conversion dossier. |

### 5) Espace client

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Authentification sécurisée | Conforme | `lib/auth/options.js`, `middleware.js`, `app/api/auth/[...nextauth]/route.js` | Contrôle d’accès OK. |
| Tableau de bord (dossiers, docs, paiements) | Conforme | `components/ClientDashboardPage.js`, `app/espace-client/page.js` | Vue unifiée disponible. |
| Profil client consultable | Conforme | `components/ClientDashboardPage.js` | Affichage profil présent. |
| Dépôt documentaire sécurisé + validation interne complète | **Partiel** | Schéma `Document` présent (`prisma/schema.prisma`) + affichage dashboard | Manque API/UI upload, workflow de validation interne détaillé et stockage fichier. |

### 6) Paiements

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Demande paiement admin | Conforme | `components/AdminPaymentsPage.js`, `app/api/admin/payments/route.js` | Création et suivi des demandes. |
| Checkout Stripe + webhook statuts | Conforme | `app/api/payments/checkout/route.js`, `app/api/payments/webhook/route.js` | Flux payé/échoué géré. |
| Reçu téléchargeable | Conforme | `components/ClientDashboardPage.js`, `components/AdminPaymentsPage.js` | Lien `invoiceUrl` exploité. |
| Liaison paiement ↔ accès document | **Partiel** | N/A de règle d’accès stricte | Le cahier demande un couplage explicite; il manque une règle d’autorisation conditionnelle par statut paiement. |

### 7) Notifications / automatisation

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Notifications automatiques événements métier | Conforme | `lib/notifications.js` + routes leads/paiements/webhook | Déclenchements couvrent événements clés. |
| Marquer notification lue | Conforme | `app/api/notifications/[id]/route.js` | API PATCH avec contrôle ownership. |
| Compteur non lu client/admin | Conforme | `components/SiteHeader.js`, `components/ClientDashboardPage.js`, `app/admin/*.js` | Badge opérationnel. |
| Canal EMAIL avec fallback APP | Conforme | `lib/notifications.js` | Webhook email + fallback APP implémenté. |

### 8) Back-office interne

| Exigence cahier | Statut | Preuves code | Commentaire |
|---|---|---|---|
| Gestion clients/prospects/dossiers (MVP) | Conforme | `app/admin/page.js`, `components/AdminLeadsPage.js`, `app/api/admin/leads/*` | Qualification, conversion, archivage. |
| Affectation conseiller + suivi statuts | Conforme | `app/api/admin/leads/[id]/route.js`, `prisma/schema.prisma` | `advisorId`/statuts présents. |
| Gestion documentaire back-office complète | **Partiel** | Modèle DB présent | Écrans/actions documentaires complets non livrés. |

---

## Synthèse des écarts critiques

1. **Pages obligatoires d’arborescence manquantes** : À propos, Mentions légales, Politique de confidentialité.
2. **Gestion documentaire incomplète** : pas de cycle complet upload/validation/rejet côté API + UI.
3. **Exigences dynamiques avancées formulaires non finalisées** : progress bar, autosave brouillon.
4. **Step 12 métier incomplet** : message de credentials présent, mais génération/notification réelle non alignée bout-en-bout côté soumission client.
5. **Règle “paiement débloque documents” non enforcee** au niveau autorisation applicative.

---

## Recommandations opérationnelles (step by step)

### Step A — Compléter l’arborescence réglementaire (priorité haute)

1. Créer `app/a-propos/page.js`.
2. Créer `app/mentions-legales/page.js`.
3. Créer `app/politique-confidentialite/page.js`.
4. Ajouter liens header/footer vers ces pages.
5. Vérifier SEO minimal (title/description).

### Step B — Finaliser la gestion documentaire (priorité haute)

1. Ajouter API documents (`GET/POST/PATCH`) côté client/admin.
2. Implémenter upload sécurisé (stockage + métadonnées `fileKey`, `mimeType`, `size`).
3. Ajouter workflow statuts (`REQUESTED` → `UPLOADED` → `REVIEWING` → `VALIDATED/REJECTED`).
4. Ajouter actions admin validation/rejet + motif.
5. Brancher notifications document manquant/validé/rejeté.

### Step C — Aligner le Step 12 avec le flux compte réel (priorité haute)

1. Définir le déclencheur officiel de création compte (soumission client vs conversion admin).
2. Si soumission client : créer un endpoint dédié d’onboarding création.
3. Générer identifiant/mot de passe temporaire côté serveur (pas de placeholder texte).
4. Envoyer email d’activation (ou invitation) systématique.
5. Mettre à jour le message Step 12 avec données réelles (sans exposer le mot de passe en clair si politique sécurité stricte).

### Step D — Renforcer formulaires intelligents (priorité moyenne)

1. Ajouter barre d’avancement visuelle dans `CreationSection` (et éventuellement `GestionSection`).
2. Ajouter autosave brouillon (localStorage + restauration explicite).
3. Ajouter validation métier structurée (schéma Zod/Yup côté API + front).
4. Améliorer feedback d’erreurs champ par champ.

### Step E — Paiement ↔ accès documents (priorité moyenne)

1. Définir règle d’accès document (ex: certains documents téléchargeables uniquement si `PAID`).
2. Implémenter garde côté API document download.
3. Afficher état “bloqué par paiement” dans dashboard.
4. Ajouter test E2E spécifique “paiement débloque document”.

### Step F — Recette de conformité finale (priorité moyenne)

1. Créer checklist de recette basée sur sections 5.x et 6.x du cahier.
2. Exécuter tests fonctionnels par parcours : visiteur, client, admin.
3. Vérifier responsive desktop/mobile et accessibilité de base.
4. Mettre à jour `README.md` avec périmètre livré + périmètre restant.

---

## Conclusion

Le projet est **solide sur le noyau MVP dynamique** (auth, leads, admin, annonces, paiements, notifications) et s’aligne déjà sur une grande partie du cahier des charges.

La conformité totale nécessite principalement :
- la **couche documentaire complète**,
- les **pages réglementaires**,
- l’**alignement final du Step 12** avec un onboarding réellement automatisé,
- et quelques **améliorations UX dynamiques** (progress bar + autosave).
