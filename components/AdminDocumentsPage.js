"use client";

import { useMemo, useState } from "react";
import { documentStatusLabels } from "@/lib/documents";

const initialForm = {
  dossierId: "",
  title: "",
  type: "OTHER"
};

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getClientLabel(document) {
  const fullName = [document.client.firstName, document.client.lastName].filter(Boolean).join(" ");
  return `${fullName || "Client"} · ${document.client.user.email}`;
}

function getDossierLabel(dossier) {
  const fullName = [dossier.client.firstName, dossier.client.lastName].filter(Boolean).join(" ");
  return `${dossier.title} · ${fullName || "Client"} · ${dossier.client.user.email}`;
}

export default function AdminDocumentsPage({ initialDocuments, dossierOptions }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    documentId: "",
    reason: ""
  });
  const [form, setForm] = useState({
    ...initialForm,
    dossierId: dossierOptions[0]?.id || ""
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => statusFilter === "ALL" || document.status === statusFilter);
  }, [documents, statusFilter]);

  const kpis = useMemo(() => {
    const pendingReview = documents.filter((document) => ["REQUESTED", "UPLOADED", "REVIEWING"].includes(document.status)).length;
    const validated = documents.filter((document) => document.status === "VALIDATED").length;
    const rejected = documents.filter((document) => document.status === "REJECTED").length;

    return [
      {
        label: "Total documents",
        value: documents.length,
        hint: "Tous statuts"
      },
      {
        label: "À vérifier",
        value: pendingReview,
        hint: "Demandés + déposés + vérif"
      },
      {
        label: "Validés",
        value: validated,
        hint: "Dossiers conformes"
      },
      {
        label: "Refusés",
        value: rejected,
        hint: "Nécessitent correction"
      }
    ];
  }, [documents]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateRequest = async (event) => {
    event.preventDefault();
    setMessage("");
    setPendingAction("create-request");

    const response = await fetch("/api/admin/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de créer la demande document.");
      return;
    }

    setDocuments((current) => [data.document, ...current]);
    setForm((current) => ({ ...initialForm, dossierId: current.dossierId || dossierOptions[0]?.id || "" }));
    setShowCreateModal(false);
    setMessage("Demande de document créée.");
  };

  const openRejectModal = (documentId) => {
    setRejectModal({
      isOpen: true,
      documentId,
      reason: ""
    });
  };

  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      documentId: "",
      reason: ""
    });
  };

  const handleReview = async (documentId, status, reasonValue = "") => {
    const rejectionReason = (reasonValue || "").trim();

    if (status === "REJECTED" && !rejectionReason) {
      setMessage("Un motif est obligatoire pour refuser un document.");
      return;
    }

    setMessage("");
    setPendingAction(`${documentId}-${status}`);

    const response = await fetch(`/api/admin/documents/${documentId}`, {
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
      setMessage(data.error || "Impossible de mettre à jour ce document.");
      return;
    }

    if (!data.document) {
      setMessage("Réponse invalide du serveur.");
      return;
    }

    setDocuments((current) => current.map((document) => (document.id === data.document.id ? data.document : document)));

    if (status === "REJECTED") {
      closeRejectModal();
    }

    setMessage(`Document mis à jour : ${documentStatusLabels[status] || status}.`);
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Documents</h1>
              <p>{filteredDocuments.length} document(s) affiché(s) sur {documents.length}</p>
            </div>
            <div className="inline-actions announcements-header-actions">
              <button className="btn btn-outline" type="button" onClick={() => setShowCreateModal(true)}>
                Nouveau
              </button>
              <a className="btn btn-secondary" href="/admin">Retour au tableau de bord</a>
            </div>
          </header>

          <div className="leads-simple-toolbar">
            <div className="inline-actions">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tous les statuts</option>
                {Object.entries(documentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="metrics-grid documents-kpis" style={{ marginBottom: 14 }}>
            {kpis.map((kpi) => (
              <article className="metric-card" key={kpi.label}>
                <span className="tag">{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <p>{kpi.hint}</p>
              </article>
            ))}
          </div>

          {message && <div className="notice" style={{ marginBottom: 14 }}>{message}</div>}

          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Dossier</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Fichier</th>
                  <th>Maj</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <strong>{document.title}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Version {document.version}</div>
                      {document.rejectionReason ? (
                        <div style={{ color: "#b00020", fontSize: "0.78rem" }}>{document.rejectionReason}</div>
                      ) : null}
                    </td>
                    <td>{document.dossier.title}</td>
                    <td>{getClientLabel(document)}</td>
                    <td>
                      <span className={document.status === "VALIDATED" ? "status-pill" : "tag"}>{documentStatusLabels[document.status] || document.status}</span>
                    </td>
                    <td>{document.fileName || "Aucun fichier"}</td>
                    <td>{formatDate(document.updatedAt)}</td>
                    <td>
                      <div className="inline-actions leads-actions-cell">
                        <button
                          className="icon-action-btn"
                          type="button"
                          onClick={() => handleReview(document.id, "REVIEWING")}
                          disabled={pendingAction === `${document.id}-REVIEWING`}
                          title="Passer en vérification"
                          aria-label="Passer en vérification"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                            <path d="M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          className="icon-action-btn"
                          type="button"
                          onClick={() => handleReview(document.id, "VALIDATED")}
                          disabled={pendingAction === `${document.id}-VALIDATED`}
                          title="Valider"
                          aria-label="Valider"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          className="icon-action-btn"
                          type="button"
                          onClick={() => openRejectModal(document.id)}
                          disabled={pendingAction === `${document.id}-REJECTED`}
                          title="Rejeter"
                          aria-label="Rejeter"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                            <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDocuments.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucun document trouvé pour ce filtre.</div>
            )}
          </div>

          {rejectModal.isOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(17, 24, 39, 0.45)",
                display: "grid",
                placeItems: "center",
                zIndex: 1200,
                padding: 16
              }}
            >
              <div className="panel" style={{ width: "min(520px, 100%)", margin: 0 }}>
                <h3 style={{ marginBottom: 12 }}>Motif du rejet</h3>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Expliquez pourquoi le document est rejeté</label>
                  <textarea
                    value={rejectModal.reason}
                    onChange={(event) => setRejectModal((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Ex : document flou, incomplet ou non lisible"
                    rows={4}
                  />
                </div>
                <div className="inline-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={closeRejectModal}
                    disabled={pendingAction === `${rejectModal.documentId}-REJECTED`}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => handleReview(rejectModal.documentId, "REJECTED", rejectModal.reason)}
                    disabled={pendingAction === `${rejectModal.documentId}-REJECTED`}
                  >
                    {pendingAction === `${rejectModal.documentId}-REJECTED` ? "Rejet..." : "Confirmer le rejet"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showCreateModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(17, 24, 39, 0.45)",
                display: "grid",
                placeItems: "center",
                zIndex: 1200,
                padding: 16
              }}
            >
              <form
                className="panel"
                style={{ width: "min(760px, 100%)", maxHeight: "85vh", overflow: "auto", margin: 0 }}
                onSubmit={handleCreateRequest}
              >
                <h3 style={{ marginBottom: 12 }}>Nouvelle demande document</h3>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Dossier client</label>
                  <select value={form.dossierId} onChange={(event) => updateForm("dossierId", event.target.value)} required>
                    {dossierOptions.map((dossier) => (
                      <option key={dossier.id} value={dossier.id}>
                        {getDossierLabel(dossier)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Titre du document</label>
                  <input type="text" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Ex : Pièce d'identité recto/verso" required />
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Type</label>
                  <input type="text" value={form.type} onChange={(event) => updateForm("type", event.target.value)} placeholder="IDENTITY / STATUTES / OTHER" />
                </div>

                <div className="inline-actions">
                  <button className="btn btn-primary" type="submit" disabled={pendingAction === "create-request" || dossierOptions.length === 0}>
                    {pendingAction === "create-request" ? "Création..." : "Créer la demande"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowCreateModal(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
