# BBG Company - Next.js

Application Next.js BBG Company en production, orientée acquisition, suivi dossier client et pilotage administratif.

## Démarrage

```bash
npm install
npm run dev
```

## Routes principales

- `/` : site vitrine
- `/espace-client` : tableau de bord client

## Structure

- `app/` : routes Next.js App Router
- `components/` : composants React réutilisables
- `app/globals.css` : styles globaux

## Objectif

Cette base est conçue pour évoluer vers :

- authentification
- back-office
- annonces dynamiques
- espace client connecté
- documents et paiements réels

## Step 6 - Paiements (local)

Variables d'environnement à renseigner dans `.env` :

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Flux E2E local (création paiement -> checkout) :

```bash
# 1) (optionnel) injecter un jeu de données MVP
npm run db:seed:mvp

# 2) démarrer l'application
npm run dev

# 3) lancer le test E2E paiement dans un autre terminal
npm run test:e2e:payments
```

Variables optionnelles du script :

- `E2E_BASE_URL` (défaut `http://localhost:3000`)
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_CLIENT_EMAIL`, `E2E_CLIENT_PASSWORD`
- `E2E_DOSSIER_ID`
- `E2E_PAYMENT_LABEL`, `E2E_PAYMENT_AMOUNT`

## Step 8 - Notifications (MVP)

- API marquage lu : `PATCH /api/notifications/:id` (session requise, notification propriétaire)
- Compteur non lu affiché dans les headers `/espace-client` et `/admin`
- Envoi email optionnel avec fallback automatique vers notification `APP`

Variables d'environnement optionnelles :

- `NOTIFICATION_EMAIL_WEBHOOK_URL`
- `NOTIFICATION_EMAIL_WEBHOOK_SECRET`

Le webhook doit accepter un `POST` JSON :

```json
{
  "to": "user@example.com",
  "subject": "Titre notification",
  "text": "Message notification"
}
```

## Step C - Onboarding compte client

- Le formulaire `Création` (étape 12) enregistre la demande mais ne promet plus d'identifiants immédiats.
- Les accès client sont générés lors de la conversion admin `lead -> dossier` (`PATCH /api/admin/leads/:id` avec `action: "convert"`).
- Si le client n'a pas encore de mot de passe (compte `INVITED`), un mot de passe temporaire est généré côté serveur puis envoyé via notification (EMAIL préféré, fallback APP).
- Première connexion : le statut compte passe automatiquement de `INVITED` à `ACTIVE` (NextAuth credentials flow).

## Step D - Formulaire création renforcé

- Barre de progression visible dans `CreationSection` (`Étape X / 12` + pourcentage).
- Sauvegarde brouillon automatique en local (`localStorage`, clé `bbg_creation_draft_v1`) avec actions : reprise / suppression du brouillon.
- Validation front avant soumission :
  - nom société + forme juridique,
  - au moins un actionnaire nommé,
  - motif TVA requis si franchise TVA = oui,
  - détail particularités requis si particularités = oui,
  - choix immatriculation obligatoire.
- Validation API minimale pour `CREATION` / `REPRISE` dans `POST /api/leads` (rejet `400` si payload insuffisant).

## Step E - Paiement requis pour dépôt de documents

- Règle unifiée dans `lib/payments.js` via `isDossierDocumentUploadAllowed(payments)` :
  - dépôt autorisé uniquement si le dossier possède au moins un paiement `PAID`.
- Garde serveur appliquée sur les routes client documents :
  - `POST /api/client/documents`
  - `PATCH /api/client/documents/:id`
- En cas de dossier non éligible, l'API retourne `403` avec un message métier explicite.
- Le dashboard client aligne l'UX : actions de dépôt désactivées et message d'information affiché tant qu'aucun paiement validé n'est présent.
