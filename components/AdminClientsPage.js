"use client";

import { useMemo, useState } from "react";

const statusLabels = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  INVITED: "Invité"
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function getClientName(client) {
  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
  return fullName || client.email;
}

export default function AdminClientsPage({ initialClients }) {
  const [clients, setClients] = useState(initialClients);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", companyName: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pendingId, setPendingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const stats = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter((client) => client.status === "ACTIVE").length,
      suspended: clients.filter((client) => client.status === "SUSPENDED").length,
      withDossiers: clients.filter((client) => client.dossierCount > 0).length
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = statusFilter === "ALL" || client.status === statusFilter;
      const haystack = `${client.email} ${client.firstName} ${client.lastName} ${client.companyName}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [clients, statusFilter, search]);

  const resetFeedback = () => {
    setMessage("");
    setError("");
    setTempPassword("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    resetFeedback();
    setPendingId("create");

    const response = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setPendingId("");

    if (!response.ok) {
      setError(data.error || "Création impossible.");
      return;
    }

    setClients((current) => [data.client, ...current]);
    setForm({ email: "", firstName: "", lastName: "", phone: "", companyName: "" });
    setMessage(`Compte client créé pour ${getClientName(data.client)}.`);

    if (data.temporaryPassword) {
      setTempPassword(`${data.client.email} · mot de passe temporaire : ${data.temporaryPassword}`);
    }
  };

  const patchClient = async (id, payload, actionId) => {
    resetFeedback();
    setPendingId(actionId);

    const response = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setPendingId("");

    if (!response.ok) {
      setError(data.error || "Modification impossible.");
      return;
    }

    setClients((current) => current.map((client) => (client.id === id ? data.client : client)));
    setMessage(`Compte ${data.client.email} mis à jour.`);

    if (data.temporaryPassword) {
      setTempPassword(`${data.client.email} · nouveau mot de passe temporaire : ${data.temporaryPassword}`);
    }
  };

  const kpis = useMemo(() => {
    return [
      {
        label: "Total clients",
        value: stats.total,
        hint: "Comptes enregistrés"
      },
      {
        label: "Actifs",
        value: stats.active,
        hint: "Accès opérationnels"
      },
      {
        label: "Suspendus",
        value: stats.suspended,
        hint: "Accès désactivés"
      },
      {
        label: "Avec dossiers",
        value: stats.withDossiers,
        hint: "Au moins 1 dossier"
      }
    ];
  }, [stats]);

  const handleToggleStatus = (client) => {
    patchClient(client.id, { status: client.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }, `${client.id}-status`);
  };

  const handleResetPassword = (client) => {
    patchClient(client.id, { resetPassword: true }, `${client.id}-reset`);
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Clients</h1>
              <p>{filteredClients.length} client(s) affiché(s) sur {clients.length}</p>
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
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tous</option>
                <option value="ACTIVE">Actifs</option>
                <option value="SUSPENDED">Suspendus</option>
              </select>
            </div>
          </div>

          <div className="metrics-grid clients-kpis" style={{ marginBottom: 14 }}>
            {kpis.map((kpi) => (
              <article className="metric-card" key={kpi.label}>
                <span className="tag">{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <p>{kpi.hint}</p>
              </article>
            ))}
          </div>

        {(message || error || tempPassword) && (
            <div className={`notice${error ? " notice-error" : ""}`} style={{ marginBottom: 14 }}>
            {error || message}
            {tempPassword && <div style={{ marginTop: 8, fontWeight: 700 }}>{tempPassword}</div>}
          </div>
        )}

          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Dossiers</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{getClientName(client)}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{client.companyName || "Particulier"}</div>
                    </td>
                    <td>
                      <div>{client.email}</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{client.phone || "Téléphone non renseigné"}</div>
                    </td>
                    <td>{client.dossierCount} dossier(s)</td>
                    <td>
                      <span className={client.status === "ACTIVE" ? "status-pill" : "tag"}>{statusLabels[client.status] || client.status}</span>
                    </td>
                    <td>{formatDate(client.createdAt)}</td>
                    <td>
                      <div className="inline-actions leads-actions-cell">
                        <button
                          className="icon-action-btn"
                          type="button"
                          onClick={() => handleToggleStatus(client)}
                          disabled={pendingId === `${client.id}-status`}
                          title={client.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                          aria-label={client.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                            <path d="M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          className="icon-action-btn"
                          type="button"
                          onClick={() => handleResetPassword(client)}
                          disabled={pendingId === `${client.id}-reset`}
                          title="Réinitialiser mot de passe"
                          aria-label="Réinitialiser mot de passe"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                            <path d="M3 12a9 9 0 0115.36-6.36M21 12a9 9 0 01-15.36 6.36M3 3v6h6M21 21v-6h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucun client pour ces critères.</div>
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
                onSubmit={handleCreate}
              >
                <h3 style={{ marginBottom: 12 }}>Nouveau client</h3>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>E-mail</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="client@email.com"
                  />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Prénom</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Nom</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Téléphone (optionnel)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Société (optionnel)</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  />
                </div>
                <div className="inline-actions">
                  <button className="btn btn-primary" type="submit" disabled={pendingId === "create"}>
                    {pendingId === "create" ? "Création..." : "Créer le client"}
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
