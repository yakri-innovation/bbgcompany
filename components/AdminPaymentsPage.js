"use client";

import { useMemo, useState } from "react";
import { paymentStatusLabels } from "@/lib/payments";

const initialForm = {
  dossierId: "",
  label: "",
  amount: "",
  currency: "EUR"
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

function formatAmount(amount, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency
  }).format(amount / 100);
}

function getClientLabel(dossier) {
  const fullName = [dossier.client.firstName, dossier.client.lastName].filter(Boolean).join(" ");
  return `${fullName || "Client"} · ${dossier.client.user.email}`;
}

function getDossierLabel(dossier) {
  return `${dossier.title} · ${getClientLabel(dossier)}`;
}

export default function AdminPaymentsPage({ initialPayments, dossierOptions }) {
  const [payments, setPayments] = useState(initialPayments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    ...initialForm,
    dossierId: dossierOptions[0]?.id || ""
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => statusFilter === "ALL" || payment.status === statusFilter);
  }, [payments, statusFilter]);

  const kpis = useMemo(() => {
    const awaiting = payments.filter((payment) => ["REQUESTED", "PENDING"].includes(payment.status)).length;
    const paid = payments.filter((payment) => payment.status === "PAID").length;
    const blocked = payments.filter((payment) => ["FAILED", "CANCELLED"].includes(payment.status)).length;

    return [
      {
        label: "Total paiements",
        value: payments.length,
        hint: "Tous statuts"
      },
      {
        label: "À traiter",
        value: awaiting,
        hint: "Demandé + en attente"
      },
      {
        label: "Payés",
        value: paid,
        hint: "Règlements confirmés"
      },
      {
        label: "À relancer",
        value: blocked,
        hint: "Échoué + annulé"
      }
    ];
  }, [payments]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreatePayment = async (event) => {
    event.preventDefault();
    setPendingAction("create");
    setMessage("");

    const response = await fetch("/api/admin/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de créer la demande de paiement.");
      return;
    }

    setPayments((current) => [data.payment, ...current]);
    setForm((current) => ({ ...initialForm, dossierId: current.dossierId || dossierOptions[0]?.id || "" }));
    setShowCreateModal(false);
    setMessage("Demande de paiement créée avec succès.");
  };

  const handleStatusChange = async (paymentId, status) => {
    setMessage("");
    setPendingAction(`${paymentId}-${status}`);

    const response = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de modifier ce paiement.");
      return;
    }

    setPayments((current) => current.map((payment) => (payment.id === data.payment.id ? data.payment : payment)));
    setMessage("Statut du paiement mis à jour.");
  };

  const handleCancelPayment = (paymentId) => {
    const confirmed = window.confirm("Confirmer l'annulation de ce paiement ?");

    if (!confirmed) {
      return;
    }

    handleStatusChange(paymentId, "CANCELLED");
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Paiements</h1>
              <p>{filteredPayments.length} paiement(s) affiché(s) sur {payments.length}</p>
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
                {Object.entries(paymentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="metrics-grid payments-kpis" style={{ marginBottom: 14 }}>
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
                  <th>Libellé</th>
                  <th>Dossier</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th>Créé le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>{payment.label}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{payment.provider || "Fournisseur non renseigné"}</div>
                    </td>
                    <td>{payment.dossier.title}</td>
                    <td>{getClientLabel(payment.dossier)}</td>
                    <td>
                      <span className={payment.status === "PAID" ? "status-pill" : "tag"}>{paymentStatusLabels[payment.status] || payment.status}</span>
                    </td>
                    <td>{formatAmount(payment.amount, payment.currency)}</td>
                    <td>
                      {formatDate(payment.createdAt)}
                      {payment.paidAt ? <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Payé le {formatDate(payment.paidAt)}</div> : null}
                    </td>
                    <td>
                      <div className="inline-actions leads-actions-cell">
                        {payment.status !== "REQUESTED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(payment.id, "REQUESTED")}
                            disabled={pendingAction === `${payment.id}-REQUESTED`}
                            title="Passer en demandé"
                            aria-label="Passer en demandé"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {payment.status !== "PAID" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(payment.id, "PAID")}
                            disabled={pendingAction === `${payment.id}-PAID`}
                            title="Marquer payé"
                            aria-label="Marquer payé"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {payment.status !== "CANCELLED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleCancelPayment(payment.id)}
                            disabled={pendingAction === `${payment.id}-CANCELLED`}
                            title="Annuler"
                            aria-label="Annuler"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {payment.invoiceUrl ? (
                          <a className="icon-action-btn" href={payment.invoiceUrl} target="_blank" rel="noreferrer" title="Ouvrir le reçu" aria-label="Ouvrir le reçu">
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zm0 0v6h6M9 13h6M9 17h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucun paiement trouvé pour ce filtre.</div>
            )}
          </div>

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
                onSubmit={handleCreatePayment}
              >
                <h3 style={{ marginBottom: 12 }}>Nouvelle demande de paiement</h3>
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
                  <label>Libellé</label>
                  <input type="text" value={form.label} onChange={(event) => updateForm("label", event.target.value)} placeholder="Ex : Frais de constitution" required />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Montant (EUR)</label>
                  <input type="number" min="1" step="0.01" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder="299" required />
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Devise</label>
                  <input type="text" value={form.currency} onChange={(event) => updateForm("currency", event.target.value.toUpperCase())} maxLength={3} required />
                </div>

                <div className="inline-actions">
                  <button className="btn btn-primary" type="submit" disabled={pendingAction === "create" || dossierOptions.length === 0}>
                    {pendingAction === "create" ? "Création..." : "Créer la demande"}
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
