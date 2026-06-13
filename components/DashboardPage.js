import SiteHeader from "@/components/SiteHeader";

export default function DashboardPage() {
  return (
    <div className="light-page">
      <SiteHeader light />
      <main className="dashboard-shell">
        <div className="container dashboard-grid">
          <section className="dashboard-main">
            <div className="dashboard-banner">
              <div className="dashboard-head">
                <div>
                  <span className="mini-chip">Dossier actif</span>
                  <h1>Bonjour Sarah, votre création avance.</h1>
                  <p>
                    Retrouvez l'avancement de vos démarches, les documents à déposer et les actions à finaliser depuis votre tableau de bord.
                  </p>
                </div>
                <a className="btn btn-secondary" href="#documents">
                  Voir mes documents
                </a>
              </div>
            </div>

            <div className="metrics-grid">
              <article className="metric-card">
                <span className="tag">Alerte</span>
                <strong>3 documents</strong>
                <p>Restent à signer pour finaliser l'immatriculation de CARWASH.</p>
              </article>
              <article className="metric-card">
                <span className="tag">Création</span>
                <strong>Étape 2 / 3</strong>
                <p>Le dossier est en cours de traitement par votre conseiller.</p>
              </article>
              <article className="metric-card">
                <span className="tag">Paiement</span>
                <strong>1 échéance</strong>
                <p>Une échéance partenaire est disponible pour validation.</p>
              </article>
            </div>

            <article className="dashboard-card">
              <div className="dashboard-head">
                <div>
                  <h3>Mes dossiers</h3>
                  <p>Une vue centralisée de tous vos accompagnements en cours.</p>
                </div>
                <span className="status-pill">Suivi en temps réel</span>
              </div>

              {/* Timeline Création */}
              <div className="dossier-timeline">
                <div className="dossier-timeline-header">
                  <div>
                    <strong>Création — CARWASH</strong>
                    <p>Immatriculation de société en cours</p>
                  </div>
                  <span className="status-pill">Actif</span>
                </div>
                <div className="timeline-steps">
                  <div className="timeline-step-item done">
                    <div className="step-dot">1</div>
                    <div className="step-content">
                      <strong>Projet et informations</strong>
                      <p>Choix du projet, nom, forme juridique</p>
                    </div>
                  </div>
                  <div className="timeline-step-item active">
                    <div className="step-dot">2</div>
                    <div className="step-content">
                      <strong>Actionnaires et dirigeants</strong>
                      <p>Informations des associés en cours de traitement</p>
                    </div>
                  </div>
                  <div className="timeline-step-item pending">
                    <div className="step-dot">3</div>
                    <div className="step-content">
                      <strong>Finalisation</strong>
                      <p>Immatriculation et documents définitifs</p>
                    </div>
                  </div>
                </div>
                <div className="dossier-actions">
                  <button className="btn btn-primary">Continuer l'étape 2</button>
                  <button className="btn btn-outline">Voir le détail</button>
                </div>
              </div>

              <div className="table-like" style={{ marginTop: 20 }}>
                <div className="table-row">
                  <div>
                    <strong>Gestion</strong>
                    <p>Pas de démarches en cours</p>
                  </div>
                  <div>
                    <span className="tag">Inactif</span>
                  </div>
                  <div>—</div>
                  <button className="btn btn-outline">Créer une demande</button>
                </div>
                <div className="table-row">
                  <div>
                    <strong>Acquisition / Fusion</strong>
                    <p>Pas d'achat de société en cours</p>
                  </div>
                  <div>
                    <span className="tag">Inactif</span>
                  </div>
                  <div>—</div>
                  <button className="btn btn-outline">Explorer les annonces</button>
                </div>
              </div>
            </article>

            <article className="dashboard-card" id="documents">
              <div className="dashboard-head">
                <div>
                  <h3>Mes documents</h3>
                  <p>Dépôt sécurisé et accès conditionné selon le statut du dossier.</p>
                </div>
                <a className="btn btn-outline" href="#paiements">
                  Voir les paiements
                </a>
              </div>
              <div className="documents-grid">
                <div className="document-card upload-box">
                  <strong>Pièce d'identité</strong>
                  <p>Ajoutez un fichier conforme et certifiez qu'il correspond à l'original.</p>
                  <button className="btn btn-primary">Parcourir</button>
                </div>
                <div className="document-card upload-box">
                  <strong>Justificatif de domicile</strong>
                  <p>Formats recommandés : PDF, JPG, PNG. Validation sous 1 heure ouvrée.</p>
                  <button className="btn btn-primary">Parcourir</button>
                </div>
                <div className="document-card">
                  <strong>Statuts & mandats</strong>
                  <p>Téléchargement disponible après paiement et validation de signature.</p>
                  <button className="btn btn-outline">Envoyer un code</button>
                </div>
              </div>
              <div className="table-like" style={{ marginTop: 20 }}>
                <div className="table-row">
                  <div>
                    <strong>Statuts</strong>
                    <p>Prêts à télécharger après signature</p>
                  </div>
                  <div>
                    <span className="tag">En attente</span>
                  </div>
                  <div>Version 2</div>
                  <button className="btn btn-outline">Télécharger</button>
                </div>
                <div className="table-row">
                  <div>
                    <strong>Liste des souscripteurs</strong>
                    <p>Document généré automatiquement</p>
                  </div>
                  <div>
                    <span className="status-pill">Disponible</span>
                  </div>
                  <div>PDF</div>
                  <button className="btn btn-outline">Télécharger</button>
                </div>
                <div className="table-row">
                  <div>
                    <strong>KBIS</strong>
                    <p>Sera ajouté dès publication officielle</p>
                  </div>
                  <div>
                    <span className="tag">À venir</span>
                  </div>
                  <div>—</div>
                  <button className="btn btn-outline">Être notifié</button>
                </div>
              </div>
            </article>
          </section>

          <aside className="dashboard-side">
            <article className="dashboard-card">
              <h3>Mon conseiller</h3>
              <p>Votre interlocuteur dédié pour le suivi de vos démarches.</p>
              <div className="panel">
                <strong>Benoit DUPONT</strong>
                <p>
                  01.02.03.04.05
                  <br />
                  benoit.dupont@bbg-company.fr
                </p>
                <div className="inline-actions">
                  <a className="btn btn-primary" href="mailto:benoit.dupont@bbg-company.fr">
                    Envoyer un mail
                  </a>
                  <a className="btn btn-outline" href="tel:0102030405">
                    Appeler
                  </a>
                </div>
              </div>
            </article>

            <article className="dashboard-card">
              <h3>Mon profil</h3>
              <div className="table-like">
                <div className="table-row">
                  <div>
                    <strong>Nom</strong>
                    <p>Diallo</p>
                  </div>
                  <div>
                    <strong>Prénom</strong>
                    <p>Sarah</p>
                  </div>
                  <div>
                    <strong>Identifiant</strong>
                    <p>BBG-CLIENT-2048</p>
                  </div>
                  <button className="btn btn-outline">Modifier</button>
                </div>
                <div className="table-row">
                  <div>
                    <strong>Email</strong>
                    <p>sarah@example.com</p>
                  </div>
                  <div>
                    <strong>Téléphone</strong>
                    <p>06 11 22 33 44</p>
                  </div>
                  <div>
                    <strong>Mot de passe</strong>
                    <p>••••••••••</p>
                  </div>
                  <button className="btn btn-outline">Sécuriser</button>
                </div>
              </div>
            </article>

            <article className="dashboard-card" id="paiements">
              <h3>Mes paiements</h3>
              <div className="table-like">
                <div className="table-row">
                  <div>
                    <strong>Accompagnement création</strong>
                    <p>Règlement principal</p>
                  </div>
                  <div>
                    <span className="status-pill">Payé</span>
                  </div>
                  <div>1 200 €</div>
                  <button className="btn btn-outline">Facture</button>
                </div>
                <div className="table-row">
                  <div>
                    <strong>Partenaire domiciliation</strong>
                    <p>Offre 12 mois</p>
                  </div>
                  <div>
                    <span className="tag">En attente</span>
                  </div>
                  <div>99 €/mois</div>
                  <button className="btn btn-primary">Régler</button>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </main>
    </div>
  );
}
