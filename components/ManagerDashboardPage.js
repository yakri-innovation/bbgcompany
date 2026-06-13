"use client";

import { useMemo, useState } from "react";
import ManagerNav from "@/components/ManagerNav";
import {
  countManagerPendingDocuments,
  countManagerUnreadNotifications,
  formatManagerDate,
  getManagerClientLabel,
  managerDocumentStatusLabels,
  managerDossierStatusLabels
} from "@/lib/manager-dashboard";

export default function ManagerDashboardPage({ manager, initialDossiers, initialNotifications, view = "dashboard" }) {
  const [dossiers, setDossiers] = useState(initialDossiers);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedDossierId, setSelectedDossierId] = useState(initialDossiers[0]?.id || "");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [messageDraft, setMessageDraft] = useState({});
  const [reviewDraft, setReviewDraft] = useState({});

  const selectedDossier = dossiers.find((dossier) => dossier.id === selectedDossierId) || dossiers[0];
  const pendingDocumentCount = useMemo(() => countManagerPendingDocuments(dossiers), [dossiers]);
  const dossierCount = dossiers.length;
  const unreadNotificationCount = useMemo(() => countManagerUnreadNotifications(notifications), [notifications]);
  const allDocuments = useMemo(
    () => dossiers.flatMap((dossier) => dossier.documents.map((document) => ({ ...document, dossierId: dossier.id, dossierTitle: dossier.title }))),
    [dossiers]
  );
  const kpis = useMemo(
    () => [
      {
        label: "Dossiers",
        value: dossierCount,
        hint: "Dossiers affectés"
      },
      {
        label: "Documents",
        value: pendingDocumentCount,
        hint: "À vérifier ou corriger"
      },
      {
        label: "Notifications",
        value: unreadNotificationCount,
        hint: "Non lues"
      },
      {
        label: "Messages",
        value: notifications.length,
        hint: "Alertes récentes"
      }
    ],
    [dossierCount, pendingDocumentCount, unreadNotificationCount, notifications.length]
  );

  const updateDossierInState = (updatedDossier) => {
    setDossiers((current) => current.map((item) => (item.id === updatedDossier.id ? updatedDossier : item)));
    setSelectedDossierId(updatedDossier.id);
  };

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

  const handleDocumentReview = async (documentId, status) => {
    const rejectionReason = (reviewDraft[documentId] || "").trim();

    if (status === "REJECTED" && !rejectionReason) {
      setMessage("Le motif de rejet est obligatoire.");
      return;
    }

    setMessage("");
    setPendingAction(`${documentId}-${status}`);

    const response = await fetch(`/api/manager/documents/${documentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : undefined
      })
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de mettre à jour le document.");
      return;
    }

    if (!data.dossier) {
      setMessage("Réponse serveur invalide.");
      return;
    }

    updateDossierInState(data.dossier);

    if (status === "REJECTED") {
      setReviewDraft((current) => ({ ...current, [documentId]: "" }));
    }

    setMessage(`Document mis à jour : ${managerDocumentStatusLabels[status] || status}.`);
  };

  const handleSendMessage = async (dossierId) => {
    const content = (messageDraft[dossierId] || "").trim();

    if (!content) {
      setMessage("Le message client ne peut pas être vide.");
      return;
    }

    setMessage("");
    setPendingAction(`${dossierId}-message`);

    const response = await fetch(`/api/manager/dossiers/${dossierId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: content })
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible d'envoyer le message.");
      return;
    }

    setMessageDraft((current) => ({ ...current, [dossierId]: "" }));
    setMessage("Message envoyé au client.");
  };

  const handleValidateDossier = async (dossierId) => {
    setMessage("");
    setPendingAction(`${dossierId}-validate`);

    const response = await fetch(`/api/manager/dossiers/${dossierId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "validate" })
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de valider ce dossier.");
      return;
    }

    if (!data.dossier) {
      setMessage("Réponse serveur invalide.");
      return;
    }

    updateDossierInState(data.dossier);
    setMessage("Dossier validé et notifié au client/admin.");
  };

  const pageTitles = {
    dashboard: "Tableau de bord manager",
    dossiers: "Dossiers affectés",
    documents: "Traitement des documents",
    notifications: "Notifications manager"
  };

  const isDashboardView = view === "dashboard";

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28 }}>
        <ManagerNav />
      </div>

      {isDashboardView ? (
        <div className="container dashboard-grid">
          <section className="dashboard-main">
            <div className="dashboard-banner manager-dashboard-banner">
              <div className="dashboard-head">
                <div>
                  <h1>Bonjour {manager.name}, gérez vos dossiers clients.</h1>
                  <p>Suivez les clients affectés, vérifiez les documents, échangez avec eux et validez les dossiers.</p>
                </div>
                <div className="inline-actions">
                  <a className="btn btn-secondary" href="/manager/documents">
                    Voir les documents
                  </a>
                </div>
              </div>
            </div>

            <div className="metrics-grid">
              {kpis.slice(0, 3).map((kpi) => (
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
                  <h3>Dossiers clients affectés</h3>
                  <p>{dossiers.length} dossier(s) affecté(s).</p>
                </div>
              </div>

              {message && <div className="notice" style={{ marginBottom: 16 }}>{message}</div>}

              <div className="table-like">
                {dossiers.map((dossier) => (
                  <div className="table-row" key={dossier.id}>
                    <div>
                      <strong>{dossier.title}</strong>
                      <p>{getManagerClientLabel(dossier)}</p>
                      <p>Créé le {formatManagerDate(dossier.createdAt)}</p>
                    </div>
                    <div>
                      <span className="status-pill">{managerDossierStatusLabels[dossier.status] || dossier.status}</span>
                      <p>{dossier.documents.length} document(s)</p>
                    </div>
                    <div className="inline-actions">
                      <button className="btn btn-outline" type="button" onClick={() => setSelectedDossierId(dossier.id)}>
                        Ouvrir
                      </button>
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => handleValidateDossier(dossier.id)}
                        disabled={pendingAction === `${dossier.id}-validate`}
                      >
                        Valider dossier
                      </button>
                    </div>
                  </div>
                ))}

                {dossiers.length === 0 && <div className="notice">Aucun dossier ne vous est encore affecté.</div>}
              </div>
            </article>
          </section>

          <aside className="dashboard-side">
            <article className="dashboard-card">
              <h3>Détail dossier</h3>
              {selectedDossier ? (
                <div className="table-like">
                  <div className="table-row">
                    <div>
                      <strong>{selectedDossier.title}</strong>
                      <p>{getManagerClientLabel(selectedDossier)}</p>
                      <p>{managerDossierStatusLabels[selectedDossier.status] || selectedDossier.status}</p>
                    </div>
                  </div>

                  <div className="table-row">
                    <div>
                      <strong>Messagerie client</strong>
                      <textarea
                        placeholder="Envoyer une mise à jour au client..."
                        value={messageDraft[selectedDossier.id] || ""}
                        onChange={(event) =>
                          setMessageDraft((current) => ({
                            ...current,
                            [selectedDossier.id]: event.target.value
                          }))
                        }
                      />
                      <div className="inline-actions" style={{ marginTop: 8 }}>
                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => handleSendMessage(selectedDossier.id)}
                          disabled={pendingAction === `${selectedDossier.id}-message`}
                        >
                          Envoyer au client
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Aucun dossier sélectionné.</p>
              )}
            </article>

            <article className="dashboard-card">
              <h3>Notifications manager</h3>
              <div className="table-like">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div className="table-row" key={notification.id}>
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                      </div>
                      <div>{formatManagerDate(notification.createdAt)}</div>
                    </div>
                  ))
                ) : (
                  <div className="notice">Aucune notification pour le moment.</div>
                )}
              </div>
            </article>
          </aside>
        </div>
      ) : (
        <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
          <section className="leads-simple-shell">
            <header className="leads-simple-header">
              <div>
                <h1>{pageTitles[view] || "Espace manager"}</h1>
                <p>Vue opérationnelle manager.</p>
              </div>
              <div className="inline-actions announcements-header-actions">
                <a className="btn btn-secondary" href="/manager">Retour au tableau de bord</a>
              </div>
            </header>

            <div className="metrics-grid clients-kpis" style={{ marginBottom: 14 }}>
              {kpis.map((kpi) => (
                <article className="metric-card" key={kpi.label}>
                  <span className="tag">{kpi.label}</span>
                  <strong>{kpi.value}</strong>
                  <p>{kpi.hint}</p>
                </article>
              ))}
            </div>

            {message && <div className="notice" style={{ marginBottom: 14 }}>{message}</div>}

            {view === "dossiers" && (
              <div className="documents-table-wrap">
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>Dossier</th>
                      <th>Client</th>
                      <th>Statut</th>
                      <th>Documents</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossiers.map((dossier) => (
                      <tr key={dossier.id}>
                        <td>
                          <strong>{dossier.title}</strong>
                          <div style={{ color: "var(--muted)" }}>{formatManagerDate(dossier.createdAt)}</div>
                        </td>
                        <td>{getManagerClientLabel(dossier)}</td>
                        <td>
                          <span className="tag">{managerDossierStatusLabels[dossier.status] || dossier.status}</span>
                        </td>
                        <td>{dossier.documents.length}</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => handleValidateDossier(dossier.id)}
                            disabled={pendingAction === `${dossier.id}-validate`}
                          >
                            Valider dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === "documents" && (
              <div className="table-like">
                {allDocuments.length > 0 ? (
                  allDocuments.map((document) => (
                    <div className="table-row" key={document.id}>
                      <div>
                        <strong>{document.title}</strong>
                        <p>{document.dossierTitle}</p>
                      </div>
                      <div>
                        <span className={document.status === "VALIDATED" || document.status === "AVAILABLE" ? "status-pill" : "tag"}>
                          {managerDocumentStatusLabels[document.status] || document.status}
                        </span>
                        {document.rejectionReason ? <p>Motif : {document.rejectionReason}</p> : null}
                      </div>
                      <div className="inline-actions">
                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => handleDocumentReview(document.id, "REVIEWING")}
                          disabled={pendingAction === `${document.id}-REVIEWING`}
                        >
                          Vérifier
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => handleDocumentReview(document.id, "VALIDATED")}
                          disabled={pendingAction === `${document.id}-VALIDATED`}
                        >
                          Valider
                        </button>
                        <input
                          type="text"
                          placeholder="Motif de rejet"
                          value={reviewDraft[document.id] || ""}
                          onChange={(event) =>
                            setReviewDraft((current) => ({
                              ...current,
                              [document.id]: event.target.value
                            }))
                          }
                        />
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => handleDocumentReview(document.id, "REJECTED")}
                          disabled={pendingAction === `${document.id}-REJECTED`}
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notice">Aucun document à traiter pour le moment.</div>
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
                      <div>{formatManagerDate(notification.createdAt)}</div>
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
          </section>
        </div>
      )}
    </main>
  );
}
