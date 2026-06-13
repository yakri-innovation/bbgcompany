"use client";

import { useMemo, useState } from "react";
import { documentUploadPaymentGateMessage, isDossierDocumentUploadAllowed, paymentStatusLabels } from "@/lib/payments";
import SiteHeader from "@/components/SiteHeader";
import ClientNav from "@/components/ClientNav";

const dossierStatusLabels = {
  NEW: "Nouveau",
  WAITING_VALIDATION: "En attente",
  IN_PROGRESS: "En cours",
  DOCUMENT_REQUESTED: "Document demandé",
  DOCUMENT_RECEIVED: "Document reçu",
  PAYMENT_REQUESTED: "Paiement demandé",
  PROCESSING: "Traitement",
  COMPLETED: "Finalisé",
  ARCHIVED: "Archivé",
  CANCELLED: "Annulé"
};

const dossierTypeLabels = {
  GESTION_RH: "Gestion RH",
  GESTION_COMPTA: "Gestion comptable",
  CREATION: "Création",
  REPRISE: "Reprise",
  FUSION_ACQUISITION: "Fusion / Acquisition",
  ANNONCE: "Annonce",
  OTHER: "Autre demande"
};

const documentStatusLabels = {
  REQUESTED: "Demandé",
  UPLOADED: "Déposé",
  REVIEWING: "Vérification",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  AVAILABLE: "Disponible"
};

function stepClass(status) {
  if (status === "COMPLETED") {
    return "done";
  }

  if (status === "ACTIVE") {
    return "active";
  }

  return "pending";
}

function formatAmount(amount, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency
  }).format(amount / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getPendingDocuments(documents) {
  return documents.filter((document) => ["REQUESTED", "REJECTED"].includes(document.status));
}

function getPendingPayments(payments) {
  return payments.filter((payment) => ["REQUESTED", "PENDING"].includes(payment.status));
}

export default function ClientDashboardPage({ dashboard, view = "dashboard" }) {
  const [notifications, setNotifications] = useState(dashboard.notifications || []);
  const [documents, setDocuments] = useState(
    dashboard.dossiers.flatMap((dossier) => dossier.documents.map((document) => ({ ...document, dossierTitle: dossier.title })))
  );
  const [selectedFiles, setSelectedFiles] = useState({});
  const [documentMessage, setDocumentMessage] = useState("");
  const [pendingDocumentId, setPendingDocumentId] = useState("");
  const profile = dashboard.profile;
  const dossiers = dashboard.dossiers;
  const dossierUploadAccess = useMemo(() => {
    const map = {};

    for (const dossier of dossiers) {
      map[dossier.id] = isDossierDocumentUploadAllowed(dossier.payments);
    }

    return map;
  }, [dossiers]);
  const payments = dossiers.flatMap((dossier) => dossier.payments.map((payment) => ({ ...payment, dossierTitle: dossier.title })));
  const activeDossier = dossiers.find((dossier) => !["COMPLETED", "ARCHIVED", "CANCELLED"].includes(dossier.status)) || dossiers[0];
  const pendingDocuments = getPendingDocuments(documents);
  const pendingPayments = getPendingPayments(payments);
  const advisor = activeDossier?.advisor;
  const dashboardKpis = useMemo(
    () => [
      {
        label: "Dossiers",
        value: dossiers.length,
        hint: "Accompagnements en cours"
      },
      {
        label: "Documents",
        value: pendingDocuments.length,
        hint: "À déposer ou corriger"
      },
      {
        label: "Paiements",
        value: pendingPayments.length,
        hint: "Échéances à régler"
      },
      {
        label: "Notifications",
        value: notifications.length,
        hint: "Messages récents"
      }
    ],
    [dossiers.length, pendingDocuments.length, pendingPayments.length, notifications.length]
  );
  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => notification.status !== "READ" && !notification.readAt).length,
    [notifications]
  );

  const handleMarkNotificationRead = async (notificationId) => {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH"
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    if (!data.notification) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) => (notification.id === data.notification.id ? data.notification : notification))
    );
  };

  const handleSelectDocumentFile = (documentId, file) => {
    setSelectedFiles((current) => ({
      ...current,
      [documentId]: file || null
    }));
  };

  const handleDocumentUpload = async (document) => {
    if (!dossierUploadAccess[document.dossierId]) {
      setDocumentMessage(documentUploadPaymentGateMessage);
      return;
    }

    const file = selectedFiles[document.id];

    if (!file) {
      setDocumentMessage("Merci de sélectionner un fichier avant l'envoi.");
      return;
    }

    setDocumentMessage("");
    setPendingDocumentId(document.id);

    const response = await fetch(`/api/client/documents/${document.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size
      })
    });

    const data = await response.json();
    setPendingDocumentId("");

    if (!response.ok) {
      setDocumentMessage(data.error || "Impossible de déposer ce document pour le moment.");
      return;
    }

    if (!data.document) {
      setDocumentMessage("Réponse invalide du serveur.");
      return;
    }

    setDocuments((current) =>
      current.map((item) =>
        item.id === data.document.id ? { ...item, ...data.document, dossierTitle: item.dossierTitle } : item
      )
    );
    setSelectedFiles((current) => ({ ...current, [document.id]: null }));
    setDocumentMessage(`Document "${document.title}" déposé avec succès.`);
  };

  const pageTitles = {
    dashboard: "Tableau de bord",
    dossiers: "Mes dossiers",
    documents: "Mes documents",
    paiements: "Mes paiements",
    notifications: "Mes notifications",
    profil: "Mon profil"
  };

  const isDashboardView = view === "dashboard";

  return (
    <div className="light-page">
      <SiteHeader
        light
        notificationCount={unreadNotificationCount}
        showNotificationCount
        hideSiteNav
        notificationHref="/espace-client/notifications"
      />
      <div className="container" style={{ paddingTop: 28 }}>
        <ClientNav />
      </div>

      {isDashboardView ? (
        <main className="dashboard-shell">
          <div className="container dashboard-grid">
            <section className="dashboard-main">
              <div className="dashboard-banner client-dashboard-banner">
                <div className="dashboard-head">
                  <div>
                    <span className="mini-chip">{activeDossier ? "Dossier actif" : "Espace client"}</span>
                    <h1>Bonjour {profile.firstName}, votre espace BBG Company est prêt.</h1>
                    <p>Retrouvez l'avancement de vos démarches, les documents à déposer et les paiements liés à vos dossiers.</p>
                  </div>
                  <a className="btn btn-secondary" href="/espace-client/documents">
                    Voir mes documents
                  </a>
                </div>
              </div>

              <div className="metrics-grid">
                {dashboardKpis.slice(0, 3).map((kpi) => (
                  <article className="metric-card" key={kpi.label}>
                    <span className="tag">{kpi.label}</span>
                    <strong>{kpi.value}</strong>
                    <p>{kpi.hint}</p>
                  </article>
                ))}
              </div>

              <article className="dashboard-card">
                <div className="dashboard-head">
                  <div>
                    <h3>Mes dossiers</h3>
                    <p>Une vue centralisée de tous vos accompagnements en cours.</p>
                  </div>
                  <span className="status-pill">Données synchronisées</span>
                </div>

                {dossiers.length > 0 ? (
                  dossiers.map((dossier) => (
                    <div className="dossier-timeline" key={dossier.id}>
                      <div className="dossier-timeline-header">
                        <div>
                          <strong>{dossierTypeLabels[dossier.type] || dossier.type} — {dossier.title}</strong>
                          <p>{dossierStatusLabels[dossier.status] || dossier.status}</p>
                        </div>
                        <span className="status-pill">Étape {dossier.currentStep}</span>
                      </div>
                      <div className="timeline-steps">
                        {dossier.steps.map((step) => (
                          <div className={`timeline-step-item ${stepClass(step.status)}`} key={step.id}>
                            <div className="step-dot">{step.order}</div>
                            <div className="step-content">
                              <strong>{step.title}</strong>
                              <p>{step.description || "Étape de suivi du dossier"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="dossier-actions">
                        <a className="btn btn-primary" href="/espace-client/documents">Voir les documents</a>
                        <a className="btn btn-outline" href="/espace-client/paiements">Voir les paiements</a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notice">Aucun dossier n'est encore rattaché à votre compte. Une demande envoyée depuis le site apparaîtra ici après qualification par BBG Company.</div>
                )}
              </article>
            </section>

            <aside className="dashboard-side">
              <article className="dashboard-card">
                <h3>Mon conseiller</h3>
                <p>Votre interlocuteur dédié pour le suivi de vos démarches.</p>
                <div className="panel">
                  <strong>{advisor?.email || "BBG Company"}</strong>
                  <p>{advisor ? "Conseiller assigné à votre dossier" : "Un conseiller sera assigné après qualification."}</p>
                  <div className="inline-actions">
                    <a className="btn btn-primary" href={`mailto:${advisor?.email || "contact@bbg-company.fr"}`}>Envoyer un mail</a>
                    <a className="btn btn-outline" href="/contact">Contacter BBG</a>
                  </div>
                </div>
              </article>

              <article className="dashboard-card">
                <h3>Mon profil</h3>
                <div className="table-like">
                  <div className="table-row">
                    <div>
                      <strong>Nom</strong>
                      <p>{profile.lastName}</p>
                    </div>
                    <div>
                      <strong>Prénom</strong>
                      <p>{profile.firstName}</p>
                    </div>
                    <div>
                      <strong>Identifiant</strong>
                      <p>{profile.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="table-row">
                    <div>
                      <strong>Email</strong>
                      <p>{dashboard.email}</p>
                    </div>
                    <div>
                      <strong>Téléphone</strong>
                      <p>{profile.phone || "Non renseigné"}</p>
                    </div>
                    <div>
                      <strong>Société</strong>
                      <p>{profile.companyName || "Non renseignée"}</p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="dashboard-card">
                <h3>Notifications</h3>
                <div className="table-like">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div className="table-row" key={notification.id}>
                        <div>
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                        </div>
                        <div>{formatDate(notification.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="notice">Aucune notification pour le moment.</div>
                  )}
                </div>
              </article>
            </aside>
          </div>
        </main>
      ) : (
        <main className="dashboard-shell">
          <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
            <section className="leads-simple-shell">
              <header className="leads-simple-header">
                <div>
                  <h1>{pageTitles[view] || "Espace client"}</h1>
                  <p>Vue dédiée de votre espace client.</p>
                </div>
                <div className="inline-actions announcements-header-actions">
                  <a className="btn btn-secondary" href="/espace-client">Retour au tableau de bord</a>
                </div>
              </header>

              <div className="metrics-grid clients-kpis" style={{ marginBottom: 14 }}>
                {dashboardKpis.map((kpi) => (
                  <article className="metric-card" key={kpi.label}>
                    <span className="tag">{kpi.label}</span>
                    <strong>{kpi.value}</strong>
                    <p>{kpi.hint}</p>
                  </article>
                ))}
              </div>

              {view === "dossiers" && (
                <div className="documents-table-wrap">
                  <table className="documents-table">
                    <thead>
                      <tr>
                        <th>Dossier</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Étape</th>
                        <th>Conseiller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossiers.map((dossier) => (
                        <tr key={dossier.id}>
                          <td><strong>{dossier.title}</strong></td>
                          <td>{dossierTypeLabels[dossier.type] || dossier.type}</td>
                          <td><span className="tag">{dossierStatusLabels[dossier.status] || dossier.status}</span></td>
                          <td>Étape {dossier.currentStep}</td>
                          <td>{dossier.advisor?.email || "En cours d'affectation"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {view === "documents" && (
                <>
                  {documentMessage && <div className="notice" style={{ marginBottom: 14 }}>{documentMessage}</div>}
                  {Object.values(dossierUploadAccess).some((isAllowed) => !isAllowed) && (
                    <div className="notice" style={{ marginBottom: 14 }}>{documentUploadPaymentGateMessage}</div>
                  )}
                  <div className="table-like">
                    {documents.map((document) => {
                      const isUploadableStatus = document.status === "REQUESTED" || document.status === "REJECTED";
                      const isPaymentAllowed = dossierUploadAccess[document.dossierId] ?? false;
                      const isUploadBlocked = isUploadableStatus && !isPaymentAllowed;

                      return (
                        <div className="table-row" key={document.id}>
                          <div>
                            <strong>{document.title}</strong>
                            <p>{document.dossierTitle}</p>
                          </div>
                          <div>
                            <span className={document.status === "VALIDATED" || document.status === "AVAILABLE" ? "status-pill" : "tag"}>
                              {documentStatusLabels[document.status] || document.status}
                            </span>
                          </div>
                          <div>Version {document.version}</div>
                          {isUploadableStatus ? (
                            <div className="inline-actions">
                              <input
                                type="file"
                                onChange={(event) => handleSelectDocumentFile(document.id, event.target.files?.[0] || null)}
                                disabled={isUploadBlocked}
                              />
                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={() => handleDocumentUpload(document)}
                                disabled={pendingDocumentId === document.id || isUploadBlocked}
                              >
                                {pendingDocumentId === document.id ? "Envoi..." : isUploadBlocked ? "Paiement requis" : "Déposer"}
                              </button>
                            </div>
                          ) : (
                            <button className="btn btn-outline" disabled>
                              {document.fileName ? `Fichier : ${document.fileName}` : "À fournir"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {view === "paiements" && (
                <div className="table-like">
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <div className="table-row" key={payment.id}>
                        <div>
                          <strong>{payment.label}</strong>
                          <p>{payment.dossierTitle}</p>
                        </div>
                        <div>
                          <span className={payment.status === "PAID" ? "status-pill" : "tag"}>{paymentStatusLabels[payment.status] || payment.status}</span>
                        </div>
                        <div>{formatAmount(payment.amount, payment.currency)}</div>
                        {payment.status === "REQUESTED" || payment.status === "PENDING" ? (
                          <a className="btn btn-primary" href={`/api/payments/checkout?paymentId=${payment.id}`}>
                            Régler
                          </a>
                        ) : payment.status === "PAID" && payment.invoiceUrl ? (
                          <a className="btn btn-outline" href={payment.invoiceUrl} target="_blank" rel="noreferrer">
                            Télécharger le reçu
                          </a>
                        ) : (
                          <button className="btn btn-outline" disabled>
                            {payment.status === "PAID" ? "Reçu indisponible" : "Détail"}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="notice">Aucun paiement n'est demandé pour le moment.</div>
                  )}
                </div>
              )}

              {view === "notifications" && (
                <div className="table-like">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div className="table-row" key={notification.id}>
                        <div>
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                        </div>
                        <div>
                          <span className={notification.status === "READ" ? "status-pill" : "tag"}>{notification.channel}</span>
                        </div>
                        <div>{formatDate(notification.createdAt)}</div>
                        <div className="inline-actions">
                          <span>{notification.status}</span>
                          {notification.status !== "READ" && (
                            <button className="btn btn-outline" type="button" onClick={() => handleMarkNotificationRead(notification.id)}>
                              Marquer lue
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notice">Aucune notification pour le moment.</div>
                  )}
                </div>
              )}

              {view === "profil" && (
                <div className="table-like">
                  <div className="table-row">
                    <div>
                      <strong>Nom</strong>
                      <p>{profile.lastName}</p>
                    </div>
                    <div>
                      <strong>Prénom</strong>
                      <p>{profile.firstName}</p>
                    </div>
                    <div>
                      <strong>Identifiant</strong>
                      <p>{profile.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="table-row">
                    <div>
                      <strong>Email</strong>
                      <p>{dashboard.email}</p>
                    </div>
                    <div>
                      <strong>Téléphone</strong>
                      <p>{profile.phone || "Non renseigné"}</p>
                    </div>
                    <div>
                      <strong>Société</strong>
                      <p>{profile.companyName || "Non renseignée"}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
